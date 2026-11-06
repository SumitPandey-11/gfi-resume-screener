from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware # <--- NEW IMPORT
import shutil
import os
from services.pdf_parser import extract_text_from_pdf
from services import nlp_engine
from services.scorer import calculate_score
import config

app = FastAPI(title="GFI Resume Screener API")

# --- NEW CORS CONFIGURATION ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, change "*" to your actual frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ------------------------------

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/")
def read_root():
    return {"message": "API is running."}

@app.post("/analyze-resume")
async def analyze_resume(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # 1. Extract Text
    extraction = extract_text_from_pdf(file_path)
    if extraction["status"] == "error":
        os.remove(file_path) 
        raise HTTPException(status_code=400, detail=extraction["message"])

    raw_text = extraction["text"]

    # 2. Extract Candidate Data
    all_skills = list(set(config.JD1_LCA["required_skills"] + config.JD2_UIUX["required_skills"]))
    
    candidate_data = {
        "raw_text": raw_text,
        "skills": nlp_engine.extract_skills(raw_text, all_skills),
        "experience_years": nlp_engine.extract_experience(raw_text),
        "education": nlp_engine.extract_education(raw_text),
        "has_projects": nlp_engine.extract_projects(raw_text)
    }

    # Map for scorer
    scorer_data = {
        "skills": candidate_data["skills"],
        "experience_years": candidate_data["experience_years"],
        "education": candidate_data["education"],
        "projects": candidate_data["has_projects"],
        "raw_text": candidate_data["raw_text"]
    }
    
    # 3. Calculate Scores against both JDs
    lca_score_data = calculate_score(scorer_data, config.JD1_LCA)
    uiux_score_data = calculate_score(scorer_data, config.JD2_UIUX)

    # 4. Determine Classification
    classification = "Uncertain"
    if lca_score_data["total_score"] >= 60 and uiux_score_data["total_score"] >= 60:
        classification = "Suitable for Both"
    elif lca_score_data["total_score"] >= 60:
        classification = "Strong Match for LCA"
    elif uiux_score_data["total_score"] >= 60:
        classification = "Strong Match for UI/UX"
    elif lca_score_data["total_score"] < 30 and uiux_score_data["total_score"] < 30:
        classification = "Not Suitable"

    return {
        "filename": file.filename,
        "candidate_profile": candidate_data,
        "lca_evaluation": lca_score_data,
        "uiux_evaluation": uiux_score_data,
        "classification": classification
    }