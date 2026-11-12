import csv
import io
import json
import logging
import os
import tempfile
from contextlib import asynccontextmanager
from typing import Any

from fastapi import (
    FastAPI,
    UploadFile,
    File,
    HTTPException,
    Depends,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import SessionLocal, engine
import models
import config
from services.pdf_parser import extract_text_from_pdf
from services import nlp_engine
from services.scorer import calculate_lca_score, calculate_uiux_score

# --------------------------------------------------
# CONFIGURATION
# --------------------------------------------------

logger = logging.getLogger(__name__)

MAX_PDF_SIZE = 10 * 1024 * 1024  # 10 MB

# Safely parse allowed origins. Defaults to localhost for local dev.
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in (
        os.getenv("ALLOWED_ORIGINS")
        or os.getenv("FRONTEND_URL")
        or "http://localhost:5173,http://localhost:5174,https://gfi-resume-screener.vercel.app"
    ).split(",")
    if origin.strip()
]

app = FastAPI(
    title="GFI Resume Screener API",
    version="1.0.0",
)

# --------------------------------------------------
# CORS
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Temporary: allow all for deployment debugging
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# DATABASE DEPENDENCY
# --------------------------------------------------

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --------------------------------------------------
# STARTUP EVENT
# --------------------------------------------------

@app.on_event("startup")
def startup():
    # This creates the tables in PostgreSQL if they don't exist yet.
    models.Base.metadata.create_all(bind=engine)

# --------------------------------------------------
# HEALTH CHECK (CRITICAL FOR RENDER)
# --------------------------------------------------

@app.get("/")
def read_root():
    return {
        "message": "GFI Resume Screener API is running.",
    }

@app.get("/health")
def health_check():
    # Render pings this endpoint to ensure the app is alive.
    # It must NEVER connect to the database.
    return {"status": "healthy"}

# --------------------------------------------------
# HELPERS
# --------------------------------------------------

def get_candidate_skills(candidate):
    if not candidate.extracted_skills:
        return []
    try:
        skills = json.loads(candidate.extracted_skills)
        return skills if isinstance(skills, list) else []
    except (json.JSONDecodeError, TypeError):
        return []

def sanitize_filename(filename: str | None) -> str:
    if not filename:
        raise HTTPException(status_code=400, detail="A filename is required.")
    safe_name = filename.replace("\\", "/").split("/")[-1].strip()
    if not safe_name or safe_name in {".", ".."}:
        raise HTTPException(status_code=400, detail="Invalid filename.")
    if not safe_name.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    return safe_name[:255]

def csv_safe(value: Any) -> Any:
    if isinstance(value, str) and value.startswith(("=", "+", "-", "@", "\t", "\r")):
        return "'" + value
    return value

# --------------------------------------------------
# RESUME ANALYSIS
# --------------------------------------------------

@app.post("/analyze-resume")
async def analyze_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    filename = sanitize_filename(file.filename)
    temporary_path = None

    try:
        # Check for duplicates
        existing_candidate = db.query(models.Candidate).filter(models.Candidate.filename == filename).first()
        if existing_candidate:
            raise HTTPException(status_code=400, detail="This resume filename has already been processed.")

        # Save to temporary file
        with tempfile.NamedTemporaryFile(mode="wb", suffix=".pdf", delete=False) as temporary_file:
            temporary_path = temporary_file.name
            total_size = 0
            first_chunk = True

            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                total_size += len(chunk)
                if total_size > MAX_PDF_SIZE:
                    raise HTTPException(status_code=413, detail="PDF exceeds the 10 MB upload limit.")
                if first_chunk:
                    if not chunk.startswith(b"%PDF-"):
                        raise HTTPException(status_code=400, detail="The uploaded file is not a valid PDF.")
                    first_chunk = False
                temporary_file.write(chunk)

        if total_size == 0:
            raise HTTPException(status_code=400, detail="The uploaded PDF is empty.")

        # Extract PDF text
        extraction = extract_text_from_pdf(temporary_path)
        if extraction.get("status") == "error":
            raise HTTPException(status_code=400, detail=extraction.get("message", "Could not extract text from this PDF."))

        raw_text = extraction.get("text", "")
        if not raw_text or not raw_text.strip():
            raise HTTPException(status_code=400, detail="No readable text was found in the PDF.")

        # Extract skills
        all_skills = list(dict.fromkeys(config.JD1_LCA["required_skills"] + config.JD2_UIUX["required_skills"]))
        
        candidate_data = {
            "raw_text": raw_text,
            "skills": nlp_engine.extract_skills(raw_text, all_skills),
            "experience_years": nlp_engine.extract_experience(raw_text),
            "education": nlp_engine.extract_education(raw_text),
            "has_projects": nlp_engine.extract_projects(raw_text),
        }

        scorer_data = {
            "skills": candidate_data["skills"],
            "experience_years": candidate_data["experience_years"],
            "education": candidate_data["education"],
            "projects": candidate_data["has_projects"],
            "raw_text": candidate_data["raw_text"],
        }

        # Calculate scores
        lca_score_data = calculate_lca_score(scorer_data)
        uiux_score_data = calculate_uiux_score(scorer_data)

        lca_score = float(lca_score_data["total_score"])
        uiux_score = float(uiux_score_data["total_score"])

        # Classification
        lca_pass = lca_score >= 65
        uiux_pass = uiux_score >= 65

        if lca_pass and uiux_pass:
            classification = "Both Roles"
        elif lca_pass:
            classification = "Strong Match for LCA"
        elif uiux_pass:
            classification = "Strong Match for UI/UX"
        elif lca_score >= 50 or uiux_score >= 50:
            classification = "Hold / Further Review"
        else:
            classification = "Not Recommended"

        # Save candidate
        new_candidate = models.Candidate(
            filename=filename,
            raw_text=raw_text,
            extracted_skills=json.dumps(candidate_data["skills"], ensure_ascii=False),
            education=candidate_data["education"],
            experience_years=candidate_data["experience_years"],
            lca_score=lca_score,
            uiux_score=uiux_score,
            classification=classification,
            hr_status="Pending Review",
            hr_notes="",
        )

        db.add(new_candidate)
        db.commit()
        db.refresh(new_candidate)

        return {
            "id": new_candidate.id,
            "filename": filename,
            "classification": classification,
            "lca_evaluation": lca_score_data,
            "uiux_evaluation": uiux_score_data,
        }

    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        logger.exception("Resume analysis failed")
        raise HTTPException(status_code=500, detail="Resume analysis failed. Please check the server logs.")
    finally:
        await file.close()
        if temporary_path and os.path.exists(temporary_path):
            try:
                os.remove(temporary_path)
            except OSError:
                pass

# --------------------------------------------------
# CANDIDATE ENDPOINTS
# --------------------------------------------------

@app.get("/candidates")
def get_all_candidates(db: Session = Depends(get_db)):
    candidates = db.query(models.Candidate).order_by(models.Candidate.id.desc()).all()
    return [
        {
            "id": c.id,
            "filename": c.filename,
            "skills": get_candidate_skills(c),
            "education": c.education,
            "experience_years": c.experience_years,
            "lca_score": c.lca_score,
            "uiux_score": c.uiux_score,
            "classification": c.classification,
            "hr_status": c.hr_status,
        }
        for c in candidates
    ]

@app.get("/candidates/{candidate_id}")
def get_candidate_details(candidate_id: int, db: Session = Depends(get_db)):
    candidate = db.query(models.Candidate).filter(models.Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found.")
        
    return {
        "id": candidate.id,
        "filename": candidate.filename,
        "skills": get_candidate_skills(candidate),
        "education": candidate.education,
        "experience_years": candidate.experience_years,
        "lca_score": candidate.lca_score,
        "uiux_score": candidate.uiux_score,
        "classification": candidate.classification,
        "hr_status": candidate.hr_status,
        "hr_notes": candidate.hr_notes,
        "raw_text_preview": candidate.raw_text[:1000] if candidate.raw_text else "",
    }

# --------------------------------------------------
# HR REVIEW
# --------------------------------------------------

class HRReviewUpdate(BaseModel):
    hr_status: str = Field(min_length=1, max_length=100)
    hr_notes: str = Field(default="", max_length=10000)

@app.put("/candidates/{candidate_id}/review")
def update_hr_review(candidate_id: int, review: HRReviewUpdate, db: Session = Depends(get_db)):
    candidate = db.query(models.Candidate).filter(models.Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found.")
    try:
        candidate.hr_status = review.hr_status
        candidate.hr_notes = review.hr_notes
        db.commit()
        db.refresh(candidate)
        return {"message": "Review saved successfully.", "id": candidate.id, "hr_status": candidate.hr_status}
    except Exception:
        db.rollback()
        logger.exception("HR review update failed")
        raise HTTPException(status_code=500, detail="Could not save HR review.")

# --------------------------------------------------
# JOB DESCRIPTION ENDPOINTS
# --------------------------------------------------

class JobCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    category: str = Field(min_length=1, max_length=100)
    description: str
    experience_level: str
    required_skills: str
    responsibilities: str
    location: str = "Not specified"
    work_type: str = "Not specified"
    compensation: str = "Not specified"
    preferred_skills: str = "None"

@app.get("/jobs")
def get_jobs(db: Session = Depends(get_db)):
    jobs = db.query(models.Job).order_by(models.Job.id.asc()).all()
    if not jobs:
        default_jobs = [
            models.Job(
                title="JD1 – Life-Cycle Assessment (LCA) Consultant",
                category="LCA",
                experience_level="2–3 Years",
                location="Chennai (On-site)",
                work_type="Onsite / Relocate Required",
                compensation="Industry Standard",
                description="Support sustainability goals by building Life Cycle Inventory (LCI) datasets, running LCA studies, and comparing results against industry peers.",
                responsibilities="Data collection and compilation of LCI data.\nData validation and quality control.\nLCA modelling using collected LCI data.\nDocument assumptions for traceability and audit readiness.\nGather operational data (plant assembly, energy use, logistics).\nPublic benchmarking using databases and research papers.\nMeet project deadlines and deliver high-quality work.",
                required_skills="LCA, SimaPro, GaBi, ISO 14040, ISO 14044, LCI, EPD, Environmental Auditing",
                preferred_skills="Business finance knowledge, proactive learning attitude"
            ),
            models.Job(
                title="JD2 – UI/UX Design Internship",
                category="UI/UX",
                experience_level="0–1 Year (Fresher)",
                location="Remote",
                work_type="Fully Remote",
                compensation="₹10,000 – ₹15,000 / month",
                description="A creative and detail-oriented UX/UI Design Intern will help shape the user experience and visual design of digital products, including the website and job board. This is the first member of the design team.",
                responsibilities="Design engaging user interfaces for the website and job board.\nEnsure seamless experiences across devices.\nConduct user research to understand user psychology.\nCollaborate with cross-functional teams.\nCreate high-fidelity prototypes using Figma.\nParticipate in design critiques.\nMaintain a consistent design language.",
                required_skills="Figma, Prototyping, User Research, UI/UX Principles, Human-Centred Design, User Psychology, Attention to Detail",
                preferred_skills="Portfolio of design projects, experience with sustainability platforms"
            )
        ]
        try:
            db.add_all(default_jobs)
            db.commit()
            jobs = db.query(models.Job).order_by(models.Job.id.asc()).all()
        except Exception:
            db.rollback()
            logger.exception("Default job seeding failed")
            raise HTTPException(status_code=500, detail="Could not load job descriptions.")

    return [
        {
            "id": job.id,
            "title": job.title,
            "category": job.category,
            "experience_level": job.experience_level,
            "location": job.location,
            "work_type": job.work_type,
            "compensation": job.compensation,
            "description": job.description,
            "responsibilities": job.responsibilities,
            "required_skills": job.required_skills,
            "preferred_skills": job.preferred_skills,
        }
        for job in jobs
    ]

@app.post("/jobs")
def create_job(job: JobCreate, db: Session = Depends(get_db)):
    new_job = models.Job(
        title=job.title,
        category=job.category,
        description=job.description,
        experience_level=job.experience_level,
        required_skills=job.required_skills,
        responsibilities=job.responsibilities,
        location=job.location,
        work_type=job.work_type,
        compensation=job.compensation,
        preferred_skills=job.preferred_skills,
    )
    try:
        db.add(new_job)
        db.commit()
        db.refresh(new_job)
        return {"message": "Job created successfully.", "id": new_job.id}
    except Exception:
        db.rollback()
        logger.exception("Job creation failed")
        raise HTTPException(status_code=500, detail="Could not create job.")

@app.delete("/jobs/{job_id}")
def delete_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    try:
        db.delete(job)
        db.commit()
        return {"message": "Job deleted successfully."}
    except Exception:
        db.rollback()
        logger.exception("Job deletion failed")
        raise HTTPException(status_code=500, detail="Could not delete job.")

# --------------------------------------------------
# CSV REPORT EXPORT
# --------------------------------------------------

@app.get("/reports/export/csv")
def export_candidates_csv(db: Session = Depends(get_db)):
    candidates = db.query(models.Candidate).order_by(models.Candidate.id.asc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Filename", "Education", "Experience (Years)", 
        "LCA Score", "UI/UX Score", "Classification", 
        "HR Status", "HR Notes", "Extracted Skills"
    ])
    for c in candidates:
        skills = get_candidate_skills(c)
        writer.writerow([
            c.id, csv_safe(c.filename or ""), csv_safe(c.education or ""),
            c.experience_years, c.lca_score, c.uiux_score,
            csv_safe(c.classification or ""), csv_safe(c.hr_status or ""),
            csv_safe(c.hr_notes or ""), csv_safe(", ".join(skills))
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=candidate_report.csv"}
    )