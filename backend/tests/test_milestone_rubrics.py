import urllib.request
import json

# 1. Student Login
login_req = urllib.request.Request(
    'http://127.0.0.1:8000/api/v1/auth/login', 
    data=json.dumps({'email': 'siva.prasanth@student.demo.capstonehub.app', 'password': 'Student@123'}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)
with urllib.request.urlopen(login_req) as resp:
    s_token = json.loads(resp.read().decode('utf-8'))['accessToken']

# 2. Submit milestone with multipart form
boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
lines = [
    f'--{boundary}',
    'Content-Disposition: form-data; name="remarks"',
    '',
    'Completed system architecture and design specifications with complete UML diagrams.',
    f'--{boundary}',
    'Content-Disposition: form-data; name="githubUrl"',
    '',
    'https://github.com/sivaprasantht-yuna/Capstone-Project/pull/12',
    f'--{boundary}',
    'Content-Disposition: form-data; name="file"; filename="milestone_deliverable_report.pdf"',
    'Content-Type: application/pdf',
    '',
    '%PDF-1.4 Mock Deliverable File Content',
    f'--{boundary}--',
    ''
]
body = '\r\n'.join(lines).encode('utf-8')

sub_req = urllib.request.Request(
    'http://127.0.0.1:8000/api/v1/milestones/1/submit',
    data=body,
    headers={
        'Authorization': f'Bearer {s_token}',
        'Content-Type': f'multipart/form-data; boundary={boundary}'
    }
)
with urllib.request.urlopen(sub_req) as resp:
    sub_res = json.loads(resp.read().decode('utf-8'))
    print('Milestone Submission Result:', sub_res)

# 3. Faculty Login
f_login = urllib.request.Request(
    'http://127.0.0.1:8000/api/v1/auth/login', 
    data=json.dumps({'email': 'sasikala.d@demo.capstonehub.app', 'password': 'Faculty@123'}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)
with urllib.request.urlopen(f_login) as resp:
    f_token = json.loads(resp.read().decode('utf-8'))['accessToken']

# 4. Faculty Rubric Evaluation
eval_req = urllib.request.Request(
    'http://127.0.0.1:8000/api/v1/milestones/1/evaluate',
    data=json.dumps({
        'marks': 92,
        'pointsReward': 92,
        'feedback': 'Exemplary architectural design and clear component separation.',
        'feedbackData': {'literatureReview': 18, 'architectureImplementation': 38, 'vivaDefense': 36, 'totalScore': 92},
        'status': 'APPROVED'
    }).encode('utf-8'),
    headers={
        'Authorization': f'Bearer {f_token}',
        'Content-Type': 'application/json'
    }
)
with urllib.request.urlopen(eval_req) as resp:
    eval_res = json.loads(resp.read().decode('utf-8'))
    print('Faculty Rubric Evaluation Result:', eval_res)
