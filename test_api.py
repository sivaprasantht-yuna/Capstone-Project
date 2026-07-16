import urllib.request
import urllib.error
import json

url = "https://capstonehub-backend.onrender.com/api/v1/auth/register"
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
