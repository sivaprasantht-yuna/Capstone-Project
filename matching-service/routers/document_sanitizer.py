from fastapi import APIRouter, UploadFile, File, HTTPException
from huggingface_hub import InferenceClient
import fitz  # This is PyMuPDF
import os

router = APIRouter(prefix="/api/v1/sanitizer", tags=["Document Sanitizer"])

# Fetch token from environment variables
HF_TOKEN = os.getenv("HF_TOKEN")
# Using the highly optimized instruction-tuned Llama 3 model
client = InferenceClient(model="meta-llama/Meta-Llama-3-8B-Instruct", token=HF_TOKEN)

@router.post("/process-pdf")
async def process_project_pdf(file: UploadFile = File(...)):
    # 1. Ensure it's a PDF
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a PDF.")
    
    try:
        # 2. Extract Text instantly using PyMuPDF (Takes less than 5MB RAM)
        pdf_bytes = await file.read()
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        raw_text = "".join([page.get_text() for page in doc])
        
        if not raw_text.strip():
            raise HTTPException(status_code=400, detail="The PDF appears to be empty or contains only scanned images.")

        # 3. Create the strict extraction prompt
        system_prompt = (
            "You are an academic document compiler. Your job is to extract exactly two sections from the project text:\n"
            "1. PROJECT OVERVIEW: A high-level absolute summary of what the project does.\n"
            "2. PROBLEM STATEMENT: The real-world problem this project solves.\n\n"
            "CRITICAL RULES:\n"
            "- Completely strip away all source code, technical programming syntax, specific library setups, "
            "framework architectures, database schemas, deployment steps, and individual developer tech stacks.\n"
            "- Focus 100% on the core domain concept.\n"
            "- Output your response strictly in Markdown format using '## Project Overview' and '## Problem Statement'. "
            "Do not add any conversational text before or after your answer."
        )

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Here is the project documentation:\n\n{raw_text[:7000]}"} # Limits tokens to fit free tier caps
        ]

        # 4. Request the free Hugging Face API server to handle the AI logic
        response = client.chat_completion(
            messages=messages,
            max_tokens=1200,
            temperature=0.1
        )
        
        cleaned_markdown = response.choices[0].message.content
        return {"cleaned_document": cleaned_markdown}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal AI Processing Error: {str(e)}")
