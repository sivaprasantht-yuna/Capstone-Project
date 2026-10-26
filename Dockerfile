# ==========================================
# Python FastAPI Backend (Optimized for Low RAM)
# ==========================================
FROM python:3.11-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1
ENV MALLOC_ARENA_MAX=2

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

EXPOSE 8000

# Single worker fits comfortably within 512MB RAM free tier limits without OOM
CMD sh -c "uvicorn main:app --host 0.0.0.0 --port \${PORT:-8000} --workers 1"
