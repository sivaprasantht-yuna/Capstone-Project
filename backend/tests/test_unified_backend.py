import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "UP"
    assert "capstone-unified-fastapi-backend" in data["service"]


def test_demo_logins():
    # 1. Admin Demo Login
    res_admin = client.post("/api/v1/auth/login", json={
        "email": "admin@capstonehub.app",
        "password": "Admin@123"
    })
    assert res_admin.status_code == 200, f"Admin login failed: {res_admin.text}"
    admin_data = res_admin.json()
    assert admin_data["role"] == "ADMIN"
    assert "accessToken" in admin_data
    assert "userId" in admin_data

    # 2. Faculty Demo Login
    res_fac = client.post("/api/v1/auth/login", json={
        "email": "sasikala.d@demo.capstonehub.app",
        "password": "Faculty@123"
    })
    assert res_fac.status_code == 200, f"Faculty login failed: {res_fac.text}"
    fac_data = res_fac.json()
    assert fac_data["role"] == "FACULTY"
    assert "accessToken" in fac_data

    # 3. Student Demo Login
    res_stu = client.post("/api/v1/auth/login", json={
        "email": "siva.prasanth@student.demo.capstonehub.app",
        "password": "Student@123"
    })
    assert res_stu.status_code == 200, f"Student login failed: {res_stu.text}"
    stu_data = res_stu.json()
    assert stu_data["role"] == "STUDENT"
    assert "accessToken" in stu_data


def test_public_and_student_flow():
    # 1. Login student
    email = "siva.prasanth@student.demo.capstonehub.app"
    password = "Student@123"

    login_res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["accessToken"]
    user_id = login_res.json()["userId"]

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get Profile
    prof_res = client.get("/api/v1/users/profile", headers=headers)
    assert prof_res.status_code == 200
    assert prof_res.json()["email"] == email

    # 3. Update Profile (GitHub & LinkedIn Links)
    upd_res = client.put("/api/v1/users/profile", headers=headers, json={
        "rollNumber": "7376221CS101",
        "githubLink": "https://github.com/sivaprasantht",
        "linkedinLink": "https://linkedin.com/in/sivaprasanth",
        "bio": "Full-stack Python & React engineer"
    })
    assert upd_res.status_code == 200
    assert upd_res.json()["githubLink"] == "https://github.com/sivaprasantht"

    # 4. View Teammates matching
    teammate_match = client.get("/api/v1/matching/teammates?topN=5", headers=headers)
    assert teammate_match.status_code == 200
    assert isinstance(teammate_match.json(), list)

    # 5. Check My Teams
    my_teams_res = client.get("/api/v1/teams/my", headers=headers)
    assert my_teams_res.status_code == 200
    teams_data = my_teams_res.json()

    # 6. If has team, test team chat, milestones, tasks, and mentor matching
    if teams_data:
        team_id = teams_data[0]["id"]
        
        # Test Mentor Matching recommendations for team
        mentor_match_res = client.get(f"/api/v1/matching/mentors/{team_id}?topN=3", headers=headers)
        assert mentor_match_res.status_code == 200
        assert isinstance(mentor_match_res.json(), list)

        # Test Milestones
        milestones_res = client.get(f"/api/v1/milestones/team/{team_id}", headers=headers)
        assert milestones_res.status_code == 200

        # Test Chat Messages
        msg_send_res = client.post(f"/api/v1/messages/team/{team_id}", headers=headers, json={
            "content": "Hello from unified FastAPI backend!"
        })
        assert msg_send_res.status_code == 200
        assert msg_send_res.json()["content"] == "Hello from unified FastAPI backend!"

        # Test Read Receipt
        read_res = client.post(f"/api/v1/messages/team/{team_id}/read", headers=headers)
        assert read_res.status_code == 200

        # Fetch Messages History
        hist_res = client.get(f"/api/v1/messages/team/{team_id}", headers=headers)
        assert hist_res.status_code == 200
        assert len(hist_res.json()) > 0

        # Test Team Progress
        prog_res = client.get(f"/api/v1/progress/team/{team_id}", headers=headers)
        assert prog_res.status_code == 200
        assert "progressPercentage" in prog_res.json()

    # 7. Notifications
    notifs_res = client.get("/api/v1/notifications", headers=headers)
    assert notifs_res.status_code == 200

    # 8. Idea Repository & Plagiarism Check
    idea_check = client.post("/api/v1/matching/idea-similarity", json={
        "text": "Automated AI-Driven Capstone Project Allocation System with Gale-Shapley Algorithm"
    })
    assert idea_check.status_code == 200
    assert "max_similarity" in idea_check.json()
