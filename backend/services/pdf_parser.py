import fitz  # This is PyMuPDF
import pdfplumber
import os

def extract_text_from_pdf(file_path: str) -> dict:
    """
    Extracts text from a PDF file. 
    Tries PyMuPDF first (fast), falls back to pdfplumber (better for complex layouts).
    """
    extracted_text = ""
    status = "success"
    error_message = ""

    if not os.path.exists(file_path):
        return {"text": "", "status": "error", "message": "File not found"}

    # Try PyMuPDF (fitz) first
    try:
        doc = fitz.open(file_path)
        
        # Check if password protected
        if doc.needs_pass:
            return {"text": "", "status": "error", "message": "PDF is password protected"}
            
        for page in doc:
            extracted_text += page.get_text()
            
        doc.close()
        
    except Exception as e:
        # If PyMuPDF fails, try pdfplumber as a fallback
        try:
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        extracted_text += text + "\n"
        except Exception as fallback_e:
            status = "error"
            error_message = f"Failed to read PDF. Error: {str(fallback_e)}"

    # Clean up the text slightly (remove excessive blank lines)
    if extracted_text.strip():
        lines = [line.strip() for line in extracted_text.split('\n') if line.strip()]
        extracted_text = "\n".join(lines)
    else:
        if status == "success":
            status = "warning"
            error_message = "PDF was readable, but no text was found. It might be an image-based scan."

    return {
        "text": extracted_text,
        "status": status,
        "message": error_message
    }

# Quick test block (this will only run if we run this file directly)
if __name__ == "__main__":
    # You can test this later by putting a test PDF in the backend folder
    print("PDF Parser module loaded successfully.")