"""
Database seeder to guarantee all demo accounts and standard users are active,
have valid bcrypt password hashes, and have full profile records.
"""
import sys
sys.path.insert(0, ".")
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models, security

def seed_demo_accounts():
    db: Session = SessionLocal()
    try:
        # 1. Standard Demo Accounts
        accounts = [
            {
                "email": "admin@capstonehub.app",
                "name": "System Administrator",
                "role": "ADMIN",
                "password": "Admin@123",
                "department": "Administration",
                "designation": "Head of Academic Affairs"
            },
            {
                "email": "sasikala.d@demo.capstonehub.app",
                "name": "Dr. Sasikala D",
                "role": "FACULTY",
                "password": "Faculty@123",
                "department": "Computer Science and Engineering (CSE)",
                "designation": "Professor & Head",
                "bio": "Specialized in Artificial Intelligence, Machine Learning, and Cloud Computing.",
                "max_teams": 5
            },
            {
                "email": "siva.prasanth@student.demo.capstonehub.app",
                "name": "Siva Prasanth",
                "role": "STUDENT",
                "password": "Student@123",
                "department": "Computer Science and Engineering (CSE)",
                "roll_number": "7376221CS101",
                "year_of_study": 3,
                "bio": "Full-Stack Developer passionate about AI, distributed systems, and modern web apps.",
                "github": "https://github.com/sivaprasantht",
                "linkedin": "https://linkedin.com/in/sivaprasanth"
            },
            {
                "email": "admin@capstone.edu",
                "name": "System Admin",
                "role": "ADMIN",
                "password": "Admin@123",
                "department": "Administration"
            },
            {
                "email": "siva@gmail.com",
                "name": "Siva",
                "role": "STUDENT",
                "password": "Password@123",
                "department": "Computer Science and Engineering (CSE)",
                "roll_number": "7376221CS102",
                "year_of_study": 3,
                "bio": "Student developer",
                "github": "https://github.com/sivaprasantht",
                "linkedin": "https://linkedin.com/in/sivaprasanth"
            }
        ]

        for acc in accounts:
            user = db.query(models.User).filter(models.User.email == acc["email"]).first()
            pw_hash = security.get_password_hash(acc["password"])

            if not user:
                print(f"Creating user {acc['email']}...")
                user = models.User(
                    tenant_id="INST-001",
                    name=acc["name"],
                    email=acc["email"],
                    password_hash=pw_hash,
                    role=acc["role"],
                    department=acc["department"],
                    is_verified=True,
                    is_active=True
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            else:
                print(f"Updating password & status for {acc['email']}...")
                user.password_hash = pw_hash
                user.name = acc["name"]
                user.is_active = True
                user.is_verified = True
                user.role = acc["role"]
                user.department = acc["department"]
                db.commit()

            # Ensure profile exists
            if user.role == "STUDENT":
                sp = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == user.id).first()
                if not sp:
                    sp = models.StudentProfile(
                        user_id=user.id,
                        tenant_id="INST-001",
                        roll_number=acc.get("roll_number", "7376221CS000"),
                        year_of_study=acc.get("year_of_study", 3),
                        bio=acc.get("bio", ""),
                        github_link=acc.get("github"),
                        linkedin_link=acc.get("linkedin"),
                        is_looking_for_team=True,
                        total_points=120
                    )
                    db.add(sp)
                else:
                    if acc.get("github"):
                        sp.github_link = acc.get("github")
                    if acc.get("linkedin"):
                        sp.linkedin_link = acc.get("linkedin")
                    if acc.get("bio"):
                        sp.bio = acc.get("bio")
                db.commit()

            elif user.role == "FACULTY":
                fp = db.query(models.FacultyProfile).filter(models.FacultyProfile.user_id == user.id).first()
                if not fp:
                    fp = models.FacultyProfile(
                        user_id=user.id,
                        designation=acc.get("designation", "Associate Professor"),
                        max_team_capacity=acc.get("max_teams", 5),
                        current_team_count=0,
                        availability_status="AVAILABLE",
                        bio=acc.get("bio", "Faculty Mentor"),
                        mentor_rating=4.9,
                        total_ratings=12
                    )
                    db.add(fp)
                db.commit()

        # 2. Update all other faculty and student users so that Password@123 works on all of them
        all_users = db.query(models.User).all()
        default_pw_hash = security.get_password_hash("Password@123")
        count = 0
        for u in all_users:
            if u.email not in [a["email"] for a in accounts]:
                # If password hash is the old spring boot dummy hash or invalid, set it to Password@123
                if u.password_hash.startswith("$2a$12$kS1u2Hh3kJ4R5"):
                    u.password_hash = default_pw_hash
                    u.is_active = True
                    u.is_verified = True
                    count += 1

        db.commit()
        print(f"Updated {count} additional demo users to use Password@123.")
        print("Demo seeding completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding demo accounts: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_demo_accounts()
