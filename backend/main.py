from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from fastapi.responses import StreamingResponse
import shutil
import os
import json
import csv
import io
from pydantic import BaseModel
from typing import List

from database import SessionLocal, engine
import models
import config
from services.pdf_parser import extract_text_from_pdf
from services import nlp_engine
from services.scorer import calculate_lca_score, calculate_uiux_score

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="GFI Resume Screener API")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Database Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "API is running."}

@app.post("/analyze-resume")
async def analyze_resume(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    # Check for duplicates
    existing_candidate = db.query(models.Candidate).filter(models.Candidate.filename == file.filename).first()
    if existing_candidate:
        raise HTTPException(status_code=400, detail="This resume has already been processed.")

    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    extraction = extract_text_from_pdf(file_path)
    if extraction["status"] == "error":
        os.remove(file_path) 
        raise HTTPException(status_code=400, detail=extraction["message"])

    raw_text = extraction["text"]
    all_skills = list(set(config.JD1_LCA["required_skills"] + config.JD2_UIUX["required_skills"]))
    
    candidate_data = {
        "raw_text": raw_text,
        "skills": nlp_engine.extract_skills(raw_text, all_skills),
        "experience_years": nlp_engine.extract_experience(raw_text),
        "education": nlp_engine.extract_education(raw_text),
        "has_projects": nlp_engine.extract_projects(raw_text)
    }

    scorer_data = {
        "skills": candidate_data["skills"],
        "experience_years": candidate_data["experience_years"],
        "education": candidate_data["education"],
        "projects": candidate_data["has_projects"],
        "raw_text": candidate_data["raw_text"]
    }
    
    # Calculate Scores using the Dual-Engine
    lca_score_data = calculate_lca_score(scorer_data)
    uiux_score_data = calculate_uiux_score(scorer_data)

    # Determine Classification based on Thresholds
    lca_pass = lca_score_data["total_score"] >= 65
    uiux_pass = uiux_score_data["total_score"] >= 65

    if lca_pass and uiux_pass:
        classification = "Both Roles"
    elif lca_pass:
        classification = "Strong Match for LCA"
    elif uiux_pass:
        classification = "Strong Match for UI/UX"
    elif lca_score_data["total_score"] >= 50 or uiux_score_data["total_score"] >= 50:
        classification = "Hold / Further Review"
    else:
        classification = "Not Recommended"

    # SAVE TO DATABASE
    new_candidate = models.Candidate(
        filename=file.filename,
        raw_text=raw_text,
        extracted_skills=json.dumps(candidate_data["skills"]),
        education=candidate_data["education"],
        experience_years=candidate_data["experience_years"],
        lca_score=lca_score_data["total_score"],
        uiux_score=uiux_score_data["total_score"],
        classification=classification,
        hr_status="Pending Review",
        hr_notes=""
    )
    db.add(new_candidate)
    db.commit()
    db.refresh(new_candidate)

    return {
        "id": new_candidate.id,
        "filename": file.filename,
        "classification": classification,
        "lca_evaluation": lca_score_data,
        "uiux_evaluation": uiux_score_data
    }

@app.get("/candidates")
def get_all_candidates(db: Session = Depends(get_db)):
    candidates = db.query(models.Candidate).all()
    result = []
    for c in candidates:
        result.append({
            "id": c.id,
            "filename": c.filename,
            "skills": json.loads(c.extracted_skills) if c.extracted_skills else [],
            "education": c.education,
            "experience_years": c.experience_years,
            "lca_score": c.lca_score,
            "uiux_score": c.uiux_score,
            "classification": c.classification,
            "hr_status": c.hr_status
        })
    return result

@app.get("/candidates/{candidate_id}")
def get_candidate_details(candidate_id: int, db: Session = Depends(get_db)):
    candidate = db.query(models.Candidate).filter(models.Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    return {
        "id": candidate.id,
        "filename": candidate.filename,
        "skills": json.loads(candidate.extracted_skills) if candidate.extracted_skills else [],
        "education": candidate.education,
        "experience_years": candidate.experience_years,
        "lca_score": candidate.lca_score,
        "uiux_score": candidate.uiux_score,
        "classification": candidate.classification,
        "hr_status": candidate.hr_status,
        "hr_notes": candidate.hr_notes,
        "raw_text_preview": candidate.raw_text[:1000] if candidate.raw_text else ""
    }

# --- HR REVIEW UPDATE ENDPOINT ---
class HRReviewUpdate(BaseModel):
    hr_status: str
    hr_notes: str

@app.put("/candidates/{candidate_id}/review")
def update_hr_review(candidate_id: int, review: HRReviewUpdate, db: Session = Depends(get_db)):
    candidate = db.query(models.Candidate).filter(models.Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    candidate.hr_status = review.hr_status
    candidate.hr_notes = review.hr_notes
    db.commit()
    db.refresh(candidate)
    
    return {"message": "Review saved successfully"}

# --- JOB DESCRIPTION ENDPOINTS ---

class JobCreate(BaseModel):
    title: str
    category: str
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
    jobs = db.query(models.Job).all()
    
    # Seed default jobs if none exist
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
        db.add_all(default_jobs)
        db.commit()
        jobs = db.query(models.Job).all()

    result = []
    for job in jobs:
        result.append({
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
            "preferred_skills": job.preferred_skills
        })
    return result

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
        preferred_skills=job.preferred_skills
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return {"message": "Job created successfully", "id": new_job.id}

@app.delete("/jobs/{job_id}")
def delete_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    db.delete(job)
    db.commit()
    return {"message": "Job deleted successfully"}

# --- REPORTS & EXPORT ENDPOINTS ---
@app.get("/reports/export/csv")
def export_candidates_csv(db: Session = Depends(get_db)):
    candidates = db.query(models.Candidate).all()
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow(["ID", "Filename", "Education", "Experience (Years)", "LCA Score", "UI/UX Score", "Classification", "HR Status", "HR Notes", "Extracted Skills"])
    
    for c in candidates:
        skills = json.loads(c.extracted_skills) if c.extracted_skills else []
        writer.writerow([c.id, c.filename, c.education, c.experience_years, c.lca_score, c.uiux_score, c.classification, c.hr_status, c.hr_notes, ", ".join(skills)])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=candidate_report.csv"}
    )