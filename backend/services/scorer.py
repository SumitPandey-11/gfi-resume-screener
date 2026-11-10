# backend/services/scorer.py

def calculate_lca_score(candidate_data: dict) -> dict:
    """Calculates LCA score based on the 100-point weighted model."""
    
    skills = set([s.lower() for s in candidate_data.get("skills", [])])
    text = candidate_data.get("raw_text", "").lower()
    exp_years = candidate_data.get("experience_years", 0)

    # 1. Core LCA & Sustainability Skills (30 points)
    core_skills = ["lca", "life cycle assessment", "environmental impact assessment", "sustainability reporting"]
    core_matches = [s for s in core_skills if s in skills or s in text]
    core_score = (len(core_matches) / len(core_skills)) * 30 if core_matches else 0

    # 2. Tools (SimaPro/openLCA) (20 points)
    tool_matches = [t for t in ["simapro", "openlca"] if t in skills or t in text]
    tool_score = 20 if tool_matches else 0

    # 3. Experience (20 points) - Maxes out at 4 years
    if exp_years >= 4:
        exp_score = 20
    else:
        exp_score = (exp_years / 4) * 20

    # 4. EPD, ISO, Auditing (15 points)
    std_matches = [s for s in ["epd", "iso 14040", "iso 14044", "environmental auditing"] if s in skills or s in text]
    std_score = (len(std_matches) / 4) * 15 if std_matches else 0

    # 5. Carbon & GHG (10 points)
    carbon_matches = [c for c in ["carbon footprinting", "ghg protocol"] if c in skills or c in text]
    carbon_score = (len(carbon_matches) / 2) * 10 if carbon_matches else 0

    # 6. Education/Projects (5 points)
    edu_score = 5 if candidate_data.get("education") and candidate_data.get("has_projects") else 2.5

    total_score = core_score + tool_score + exp_score + std_score + carbon_score + edu_score
    
    return {
        "total_score": round(total_score, 1),
        "matched_skills": list(set(core_matches + tool_matches + std_matches + carbon_matches)),
        "missing_skills": [s for s in core_skills + ["simapro"] + std_matches if s not in skills and s not in text][:5],
        "breakdown": {
            "Core Skills": round(core_score, 1),
            "Tools": round(tool_score, 1),
            "Experience": round(exp_score, 1),
            "EPD/ISO/Audit": round(std_score, 1),
            "Carbon/GHG": round(carbon_score, 1),
            "Education/Projects": round(edu_score, 1)
        }
    }

def calculate_uiux_score(candidate_data: dict) -> dict:
    """Calculates UI/UX score based on the 100-point weighted model."""
    
    skills = set([s.lower() for s in candidate_data.get("skills", [])])
    text = candidate_data.get("raw_text", "").lower()

    # 1. Figma & Framer (20 points)
    figma_matches = [t for t in ["figma", "framer"] if t in skills or t in text]
    figma_score = (len(figma_matches) / 2) * 20 if figma_matches else 0

    # 2. Wireframing & Prototyping (20 points)
    wire_matches = [t for t in ["wireframing", "prototyping"] if t in skills or t in text]
    wire_score = (len(wire_matches) / 2) * 20 if wire_matches else 0

    # 3. User Research & Usability (20 points)
    research_matches = [t for t in ["user research", "usability testing"] if t in skills or t in text]
    research_score = (len(research_matches) / 2) * 20 if research_matches else 0

    # 4. Responsive & Interaction Design (15 points)
    design_matches = [t for t in ["responsive design", "interaction design", "user flows"] if t in skills or t in text]
    design_score = (len(design_matches) / 3) * 15 if design_matches else 0

    # 5. Design Projects/Portfolio (15 points)
    # We check if 'portfolio' or 'project' is mentioned
    portfolio_score = 15 if "portfolio" in text or candidate_data.get("has_projects") else 0

    # 6. Education (10 points)
    edu_score = 10 if candidate_data.get("education") else 0

    total_score = figma_score + wire_score + research_score + design_score + portfolio_score + edu_score
    
    return {
        "total_score": round(total_score, 1),
        "matched_skills": list(set(figma_matches + wire_matches + research_matches + design_matches)),
        "missing_skills": [s for s in ["figma", "user research", "prototyping", "wireframing"] if s not in skills and s not in text][:5],
        "breakdown": {
            "Figma/Framer": round(figma_score, 1),
            "Wire/Prototype": round(wire_score, 1),
            "Research/Testing": round(research_score, 1),
            "Design/Flows": round(design_score, 1),
            "Portfolio": round(portfolio_score, 1),
            "Education": round(edu_score, 1)
        }
    }