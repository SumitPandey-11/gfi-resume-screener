from sqlalchemy import Column, Integer, String, Float, Text
from database import Base

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    raw_text = Column(Text)
    
    # Extracted Data
    extracted_skills = Column(Text) # Stored as a JSON string
    education = Column(Text)
    experience_years = Column(Float, default=0.0)
    
    # Scoring & Classification
    lca_score = Column(Float, default=0.0)
    uiux_score = Column(Float, default=0.0)
    classification = Column(String) # e.g., "Strong match for LCA"

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, unique=True, index=True)
    description = Column(Text)
    required_skills = Column(Text) # Stored as a JSON string