from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from openai import OpenAI
import os

router = APIRouter(prefix="/api/v1/sanitizer", tags=["Document Sanitizer"])

# NVIDIA NIM API key — set as NVIDIA_API_KEY in Vercel environment variables
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY")

# NVIDIA NIM uses an OpenAI-compatible endpoint
client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=NVIDIA_API_KEY,
)


class TextPayload(BaseModel):
    """Raw text extracted from a PDF by the Java backend (Apache PDFBox)."""
    raw_text: str


@router.post("/process-text")
async def process_project_text(payload: TextPayload):
    """
    Accept pre-extracted plain text (a few KB) instead of a raw PDF binary.
    Java strips the PDF locally with PDFBox and sends only this lean payload,
    avoiding Vercel's function size limits entirely.
    """
    if not payload.raw_text.strip():
        raise HTTPException(
            status_code=400,
            detail="Received empty text. The PDF may contain only scanned images."
        )

    try:
        # Build the strict extraction prompt
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
            # Limit to 7 000 chars to stay within free-tier token caps
            {"role": "user", "content": f"Here is the project documentation:\n\n{payload.raw_text[:7000]}"},
        ]

        response = client.chat.completions.create(
            model="meta/llama-3.1-8b-instruct",
            messages=messages,
            max_tokens=1200,
            temperature=0.1,
        )

        cleaned_markdown = response.choices[0].message.content
        return {"cleaned_document": cleaned_markdown}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal AI Processing Error: {str(e)}")
