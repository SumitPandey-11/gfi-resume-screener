import re

def clean_text(text: str) -> str:
    """Lowercase and remove extra whitespaces."""
    text = text.lower()
    text = re.sub(r'\s+', ' ', text)
    return text

def extract_skills(text: str, skill_list: list) -> list:
    """Finds exact matches for skills using regex boundaries."""
    found_skills = []
    cleaned_text = clean_text(text)
    
    for skill in skill_list:
        # Using \b ensures "ui" doesn't match inside "build", but matches "ui/ux" or "ui design"
        pattern = r'(?<![a-z0-9])' + re.escape(skill.lower()) + r'(?![a-z0-9])'
        if re.search(pattern, cleaned_text):
            found_skills.append(skill)
            
    return list(set(found_skills))

def extract_experience(text: str) -> float:
    """Finds the highest number of years mentioned in the resume."""
    cleaned_text = clean_text(text)
    matches = re.findall(r'(\d+(?:\.\d+)?)\s*(?:\+)?\s*(?:years?|yrs?)', cleaned_text)
    
    if matches:
        return max([float(m) for m in matches])
    return 0.0

def extract_education(text: str) -> str:
    """Looks for degree keywords."""
    cleaned_text = clean_text(text)
    degrees = ["b.tech", "b.e", "bsc", "b.sc", "bca", "mca", "mba", "bachelor", "master", "phd", "diploma", "graduate"]
    
    for degree in degrees:
        if degree in cleaned_text:
            return degree.upper()
    return "Not explicitly found"

def extract_projects(text: str) -> bool:
    """Checks if the word 'project' exists, indicating practical work."""
    cleaned_text = clean_text(text)
    return "project" in cleaned_text