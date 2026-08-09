import os
import urllib.request
import urllib.error
import json

# Override via BACKEND_URL env var (e.g. export BACKEND_URL=https://your-hf-space.hf.space/api/v1)
BASE_URL = os.environ.get("BACKEND_URL", "http://localhost:8081/api/v1")
url = f"{BASE_URL}/auth/register"

data = json.dumps({
    "name": "test",
    "email": "test@test.com",
    "password": "password",
    "role": "student",
    "department": "CSE",
    "yearOfStudy": "Year 3"
}).encode("utf-8")

req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")

try:
    with urllib.request.urlopen(req) as response:
        print("STATUS:", response.status)
        print("BODY:", response.read().decode("utf-8"))
except urllib.error.HTTPError as e:
    print("HTTP ERROR:", e.code)
    print("HEADERS:", e.headers)
    print("BODY:", e.read().decode("utf-8"))
except Exception as e:
    print("ERROR:", str(e))
