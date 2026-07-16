import os
import subprocess
import time
import sys

# 1. Start the FastAPI Matching Service on port 8000
print("Installing FastAPI dependencies...")
subprocess.run([sys.executable, "-m", "pip", "install", "-r", "matching-service/requirements.txt"])

print("Starting FastAPI Matching Service on localhost:8000...")
fastapi_process = subprocess.Popen(
    [sys.executable, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000"],
    cwd="matching-service"
)

# Give FastAPI 3 seconds to start up
time.sleep(3)

# 2. Start Spring Boot on port 7860 (Hugging Face exposes this port)
print("Starting Spring Boot application on port 7860...")
java_process = subprocess.Popen(["java", "-jar", "app.jar", "--server.port=7860"])

# Wait for both processes
fastapi_process.wait()
java_process.wait()
