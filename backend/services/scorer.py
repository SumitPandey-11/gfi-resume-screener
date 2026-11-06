def calculate_score(candidate_data: dict, job_data: dict, weights: dict = None) -> dict:
    """
    Calculates a match score based on configurable weights.
    Default weights: Skills 35%, Experience 25%, Education 15%, Projects 15%, Keywords 10%
    """
    if weights is None:
        weights = {
            "skills": 0.35,
            "experience": 0.25,
            "education": 0.15,
            "projects": 0.15,
            "keywords": 0.10
        }

    # 1. SKILLS SCORE
    # Compare required skills vs candidate skills
    required_skills = set(job_data.get("required_skills", []))
    candidate_skills = set(candidate_data.get("skills", []))
    
    if len(required_skills) > 0:
        matched_skills = required_skills.intersection(candidate_skills)
        skills_score = len(matched_skills) / len(required_skills)
    else:
        matched_skills = []
        skills_score = 0.0

    # 2. EXPERIENCE SCORE (Basic logic: 1.0 if they meet the requirement, partial if they are close)
    required_years = job_data.get("required_experience_years", 0)
    candidate_years = candidate_data.get("experience_years", 0)
    
    if required_years == 0:
        experience_score = 1.0
    elif candidate_years >= required_years:
        experience_score = 1.0
    else:
        experience_score = candidate_years / required_years # E.g., 1 year out of 2 = 0.5

    # 3. EDUCATION SCORE (Basic check: Does the text mention a relevant degree?)
    # For now, we give a score if they have any education extracted
    education_score = 1.0 if candidate_data.get("education") else 0.0

    # 4. PROJECTS SCORE (Basic check: Do they have projects extracted?)
    projects_score = 1.0 if candidate_data.get("projects") else 0.0

    # 5. KEYWORDS SCORE (Matches generic keywords from the JD)
    job_keywords = set(job_data.get("keywords", []))
    resume_text = candidate_data.get("raw_text", "").lower()
    
    if len(job_keywords) > 0:
        keyword_matches = [kw for kw in job_keywords if kw in resume_text]
        keywords_score = len(keyword_matches) / len(job_keywords)
    else:
        keywords_score = 0.0

    # Calculate Final Weighted Score
    final_score = (
        (skills_score * weights["skills"]) +
        (experience_score * weights["experience"]) +
        (education_score * weights["education"]) +
        (projects_score * weights["projects"]) +
        (keywords_score * weights["keywords"])
    )

    # Convert to percentage (e.g., 0.85 -> 85%)
    final_percentage = round(final_score * 100, 2)

    return {
        "total_score": final_percentage,
        "breakdown": {
            "skills": round(skills_score * 100, 2),
            "experience": round(experience_score * 100, 2),
            "education": round(education_score * 100, 2),
            "projects": round(projects_score * 100, 2),
            "keywords": round(keywords_score * 100, 2)
        },
        "matched_skills": list(matched_skills),
        "missing_skills": list(required_skills - candidate_skills)
    }