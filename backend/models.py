from sqlalchemy import Column, Integer, String, Float, Text
from database import Base

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    raw_text = Column(Text)
    
    extracted_skills = Column(Text) 
    education = Column(Text)
    experience_years = Column(Float, default=0.0)
    
    lca_score = Column(Float, default=0.0)
    uiux_score = Column(Float, default=0.0)
    classification = Column(String) 
    
    hr_status = Column(String, default="Pending Review")
    hr_notes = Column(Text, default="")

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    category = Column(String) 
    experience_level = Column(String) 
    location = Column(String)
    work_type = Column(String) # e.g., Remote, Onsite
    compensation = Column(String) # e.g., ₹10,000 - ₹15,000/month
    
    description = Column(Text) # Role Overview
    responsibilities = Column(Text) 
    required_skills = Column(Text) # Stored as comma-separated or JSON
    preferred_skills = Column(Text)