import io
import gc
from typing import Union
from pypdf import PdfReader

def extract_text_in_memory(file_bytes: bytes, filename: str = "") -> str:
    """
    Extracts text strictly in-memory (RAM) without ever writing to disk or buckets.
    Buffers are explicitly cleared and garbage-collected after extraction.
    """
    if not file_bytes:
        return ""
    
    # Check if PDF by magic header or filename
    is_pdf = file_bytes.startswith(b"%PDF") or filename.lower().endswith(".pdf")
    
    extracted_text = ""
    
    if is_pdf:
        # Wrap strictly in memory BytesIO stream
        stream = io.BytesIO(file_bytes)
        try:
            reader = PdfReader(stream)
            pages_text = []
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    pages_text.append(text)
            extracted_text = "\n\n".join(pages_text)
        finally:
            stream.close()
            del stream
            gc.collect()
    else:
        # Plain text / Markdown
        try:
            extracted_text = file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            extracted_text = file_bytes.decode("latin-1", errors="ignore")

    # Clean text
    return extracted_text.strip()
