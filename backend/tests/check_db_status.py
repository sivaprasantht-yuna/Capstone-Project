import sys
sys.path.insert(0, ".")
from sqlalchemy import text
from database import engine

with engine.connect() as conn:
    tables = [
        "users", "student_profiles", "faculty_profiles", "skills", "user_skills",
        "projects", "teams", "team_members", "milestones", "mentorships",
        "messages", "notifications", "student_tasks", "project_evidence", "certificates"
    ]
    print("=" * 60)
    print("CURRENT DATABASE ROW COUNTS (CLEAN STATE):")
    print("=" * 60)
    for t in tables:
        count = conn.execute(text(f"SELECT COUNT(*) FROM {t}")).scalar()
        print(f"  {t:25s} : {count} rows")
    print("=" * 60)
