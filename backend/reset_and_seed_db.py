"""
Clean Database Reset and Comprehensive Seeder
==============================================
1. Safely drops all existing tables and sequences.
2. Recreates clean schema from SQLAlchemy models with exact constraints.
3. Seeds standard demo accounts, skills catalog, faculty mentors, student peers,
   projects, teams, milestones, tasks, and chat history.
"""

import sys
sys.path.insert(0, ".")

from datetime import datetime, timedelta, timezone
from sqlalchemy import text
from database import engine, SessionLocal, Base
import models, security

def reset_and_seed_db():
    print("=" * 60)
    print("[1/3] DROPPING ALL TABLES & SEQUENCES SAFELY...")
    print("=" * 60)

    with engine.connect() as conn:
        # Disable constraints and drop all public tables
        conn.execute(text("DROP SCHEMA public CASCADE;"))
        conn.execute(text("CREATE SCHEMA public;"))
        conn.execute(text("GRANT ALL ON SCHEMA public TO postgres;"))
        conn.execute(text("GRANT ALL ON SCHEMA public TO public;"))
        conn.commit()
    print("-> Schema dropped and recreated successfully.")

    print("\n" + "=" * 60)
    print("[2/3] CREATING FRESH DATABASE TABLES FROM ORM MODELS...")
    print("=" * 60)
    Base.metadata.create_all(bind=engine)
    print("-> All tables created successfully:")
    for t in Base.metadata.tables.keys():
        print(f"   * {t}")

    print("\n" + "=" * 60)
    print("[3/3] SEEDING HIGH-QUALITY PRODUCTION-READY DATA...")
    print("=" * 60)
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)

        # ─── 0. INSTITUTIONAL TENANTS (Model B) ──────────────────────────────
        tenants_data = [
            ("INST-BIT", "Bannari Amman Institute of Technology", "bitsathy.ac.in", True),
            ("INST-PSG", "PSG College of Technology", "psgtech.ac.in", False),
            ("INST-KEC", "Kongu Engineering College", "kongu.ac.in,kongu.edu", False),
            ("INST-KCT", "Kumaraguru College of Technology", "kct.ac.in", False),
            ("INST-CIT", "Coimbatore Institute of Technology", "cit.edu.in", False),
            ("INST-TCE", "Thiagarajar College of Engineering", "tce.edu", False),
            ("INST-AMRITA", "Amrita Vishwa Vidyapeetham (Coimbatore)", "cb.amrita.edu,amrita.edu", False),
            ("INST-SREC", "Sri Ramakrishna Engineering College", "srec.ac.in", False),
            ("INST-001", "Default Institution (Demo)", "gmail.com,outlook.com,yahoo.com,capstonehub.app,capstone.edu", True),
        ]
        for tid, tname, tdomains, tshowcase in tenants_data:
            t_obj = models.Tenant(
                id=tid,
                name=tname,
                email_domains=tdomains,
                allow_public_showcase=tshowcase,
                is_active=True
            )
            db.add(t_obj)
        db.commit()
        print(f"  • Inserted {len(tenants_data)} institutional tenants (BIT, PSG, KEC, KCT, CIT, TCE, AMRITA, SREC, Demo).")

        # ─── 1. SKILLS CATALOG ────────────────────────────────────────────────
        skills_data = [
            ("Python", "Programming"), ("JavaScript", "Programming"), ("TypeScript", "Programming"),
            ("Java", "Programming"), ("C++", "Programming"), ("Go", "Programming"),
            ("React", "Frontend"), ("Next.js", "Frontend"), ("Vue.js", "Frontend"), ("TailwindCSS", "Frontend"),
            ("FastAPI", "Backend"), ("Node.js", "Backend"), ("Spring Boot", "Backend"), ("Django", "Backend"),
            ("PostgreSQL", "Database"), ("MongoDB", "Database"), ("Redis", "Database"),
            ("Machine Learning", "AI/ML"), ("Deep Learning", "AI/ML"), ("NLP", "AI/ML"), ("Computer Vision", "AI/ML"),
            ("PyTorch", "AI/ML"), ("TensorFlow", "AI/ML"), ("Scikit-Learn", "AI/ML"),
            ("Docker", "DevOps"), ("Kubernetes", "DevOps"), ("AWS", "Cloud"), ("CI/CD", "DevOps"),
            ("Cybersecurity", "Security"), ("Cryptography", "Security"), ("IoT", "Hardware"), ("Embedded Systems", "Hardware")
        ]
        skill_objs = {}
        for name, cat in skills_data:
            s = models.Skill(skill_name=name, category=cat)
            db.add(s)
            skill_objs[name] = s
        db.commit()
        for k, v in skill_objs.items():
            db.refresh(v)
        print(f"  • Inserted {len(skill_objs)} standard skills.")

        # ─── 2. ADMIN USERS ───────────────────────────────────────────────────
        admin_pass = security.get_password_hash("Admin@123")
        admin_user = models.User(
            tenant_id="INST-001",
            name="System Administrator",
            email="admin@capstonehub.app",
            password_hash=admin_pass,
            role="ADMIN",
            department="Administration",
            is_verified=True,
            is_active=True
        )
        admin_user_2 = models.User(
            tenant_id="INST-001",
            name="Academic Dean",
            email="admin@capstone.edu",
            password_hash=admin_pass,
            role="ADMIN",
            department="Academic Affairs",
            is_verified=True,
            is_active=True
        )
        db.add_all([admin_user, admin_user_2])
        db.commit()
        print("  • Created Admin users (admin@capstonehub.app, admin@capstone.edu).")

        # ─── 3. FACULTY MENTORS ───────────────────────────────────────────────
        fac_pass = security.get_password_hash("Faculty@123")
        faculty_specs = [
            ("Dr. Sasikala D", "sasikala.d@demo.capstonehub.app", "Computer Science and Engineering (CSE)", "Professor & Head", "Artificial Intelligence, Deep Learning, Cloud Computing", 5, 4.9, 18),
            ("Dr. Arun Kumar R", "arun.kumar@capstone.edu", "Computer Science and Engineering (CSE)", "Associate Professor", "Distributed Systems, High Performance Computing, Microservices", 4, 4.8, 14),
            ("Dr. Priya Nair", "priya.nair@capstone.edu", "Artificial Intelligence and Data Science (AI&DS)", "Associate Professor", "Natural Language Processing, LLMs, Computer Vision", 5, 4.9, 20),
            ("Dr. Sundara Murthy S", "sundaramurthy.s@demo.capstonehub.app", "Information Technology (IT)", "Professor", "Cybersecurity, Zero-Trust Architecture, Blockchain", 4, 4.7, 11),
            ("Dr. Bharathi A", "bharathi.a@demo.capstonehub.app", "Electronics and Communication (ECE)", "Associate Professor", "IoT, Edge AI, Embedded Systems, Robotics", 5, 4.8, 15)
        ]
        faculty_objs = []
        for name, email, dept, desig, bio, cap, rating, tot_ratings in faculty_specs:
            f_user = models.User(
                tenant_id="INST-001",
                name=name,
                email=email,
                password_hash=fac_pass,
                role="FACULTY",
                department=dept,
                is_verified=True,
                is_active=True
            )
            db.add(f_user)
            db.commit()
            db.refresh(f_user)

            f_prof = models.FacultyProfile(
                user_id=f_user.id,
                designation=desig,
                max_team_capacity=cap,
                current_team_count=0,
                availability_status="AVAILABLE",
                office_location="Academic Block 2, Room 304",
                bio=bio,
                mentor_rating=rating,
                total_ratings=tot_ratings
            )
            db.add(f_prof)
            faculty_objs.append(f_user)
        db.commit()
        print(f"  • Created {len(faculty_objs)} Faculty Mentors.")

        # ─── 4. STUDENT PEERS ─────────────────────────────────────────────────
        stu_pass = security.get_password_hash("Student@123")
        pwd_pass = security.get_password_hash("Password@123")

        students_data = [
            ("Siva Prasanth", "siva.prasanth@student.demo.capstonehub.app", stu_pass, "Computer Science and Engineering (CSE)", "7376221CS101", 3,
             "Full-Stack Developer passionate about AI, distributed systems, and modern web apps.",
             "https://github.com/sivaprasantht", "https://linkedin.com/in/sivaprasanth",
             ["Python", "FastAPI", "React", "TypeScript", "PostgreSQL", "Machine Learning"]),

            ("Siva", "siva@gmail.com", pwd_pass, "Computer Science and Engineering (CSE)", "7376221CS102", 3,
             "Student developer interested in backend architectures and machine learning.",
             "https://github.com/sivaprasantht", "https://linkedin.com/in/sivaprasanth",
             ["Python", "FastAPI", "React", "Docker"]),

            ("Arjun Selvam", "arjun.selvam@student.demo.capstonehub.app", pwd_pass, "Computer Science and Engineering (CSE)", "7376221CS103", 3,
             "Backend developer specializing in microservices, Docker, and PostgreSQL.",
             "https://github.com/arjunselvam", "https://linkedin.com/in/arjunselvam",
             ["Python", "Node.js", "PostgreSQL", "Docker", "AWS"]),

            ("Meena Lakshmi", "meena.lakshmi@student.demo.capstonehub.app", pwd_pass, "Artificial Intelligence and Data Science (AI&DS)", "7376221AD104", 3,
             "AI/ML specialist with focus on computer vision and neural networks.",
             "https://github.com/meenalakshmi", "https://linkedin.com/in/meenalakshmi",
             ["Python", "PyTorch", "Computer Vision", "Machine Learning", "Deep Learning"]),

            ("Rohith Kumar", "rohith.kumar@student.demo.capstonehub.app", pwd_pass, "Information Technology (IT)", "7376221IT105", 3,
             "UI/UX enthusiast and frontend engineer with React and TailwindCSS skills.",
             "https://github.com/rohithkumar", "https://linkedin.com/in/rohithkumar",
             ["React", "TypeScript", "TailwindCSS", "Next.js", "JavaScript"]),

            ("Sneha Rajan", "sneha.rajan@student.demo.capstonehub.app", pwd_pass, "Electronics and Communication (ECE)", "7376221EC106", 3,
             "Embedded systems and IoT developer working on Edge AI hardware.",
             "https://github.com/sneharajan", "https://linkedin.com/in/sneharajan",
             ["C++", "Python", "IoT", "Embedded Systems"])
        ]

        student_objs = []
        for name, email, pw, dept, roll, yr, bio, gh, li, skills in students_data:
            s_user = models.User(
                tenant_id="INST-001",
                name=name,
                email=email,
                password_hash=pw,
                role="STUDENT",
                department=dept,
                is_verified=True,
                is_active=True
            )
            db.add(s_user)
            db.commit()
            db.refresh(s_user)

            s_prof = models.StudentProfile(
                user_id=s_user.id,
                tenant_id="INST-001",
                roll_number=roll,
                year_of_study=yr,
                bio=bio,
                github_link=gh,
                linkedin_link=li,
                is_looking_for_team=True,
                total_points=120
            )
            db.add(s_prof)

            # Assign skills
            for sk_name in skills:
                if sk_name in skill_objs:
                    usk = models.UserSkill(
                        user_id=s_user.id,
                        skill_id=skill_objs[sk_name].id,
                        tenant_id="INST-001",
                        proficiency_level=4
                    )
                    db.add(usk)
            db.commit()
            student_objs.append(s_user)
        print(f"  • Created {len(student_objs)} Student Accounts with profiles & skills.")

        # ─── 5. PROJECTS & TEAMS ──────────────────────────────────────────────
        # Project 1: AI Capstone Collaboration System
        proj1 = models.Project(
            tenant_id="INST-001",
            title="CapstoneHub — AI-Driven Project & Teammate Allocation Platform",
            description="Automated matching and team formation system utilizing Gale-Shapley matching, TF-IDF NLP semantic matching, and real-time WebSocket team workspaces.",
            domain="Artificial Intelligence & Full-Stack Systems",
            tech_stack="Python, FastAPI, React, TypeScript, PostgreSQL, Docker",
            posted_by_id=student_objs[0].id,
            status="APPROVED",
            upvote_count=24,
            similarity_score=0.12
        )
        db.add(proj1)
        db.commit()
        db.refresh(proj1)

        # Team 1: NeuroSync (Led by Siva Prasanth, Members: Meena Lakshmi, Rohith Kumar)
        team1 = models.Team(
            tenant_id="INST-001",
            team_name="NeuroSync",
            project_id=proj1.id,
            status="ACTIVE",
            total_score=185,
            is_at_risk=False,
            last_activity_at=now
        )
        db.add(team1)
        db.commit()
        db.refresh(team1)

        # Team 1 Members
        db.add_all([
            models.TeamMember(
                tenant_id="INST-001",
                team_id=team1.id,
                user_id=student_objs[0].id, # Siva Prasanth (Leader)
                role_in_team="LEADER",
                invite_status="ACCEPTED",
                membership_status="ACTIVE"
            ),
            models.TeamMember(
                tenant_id="INST-001",
                team_id=team1.id,
                user_id=student_objs[3].id, # Meena Lakshmi (ML Engineer)
                role_in_team="AI/ML Engineer",
                invite_status="ACCEPTED",
                membership_status="ACTIVE"
            ),
            models.TeamMember(
                tenant_id="INST-001",
                team_id=team1.id,
                user_id=student_objs[4].id, # Rohith Kumar (Frontend)
                role_in_team="Frontend Developer",
                invite_status="ACCEPTED",
                membership_status="ACTIVE"
            )
        ])
        db.commit()

        # Team 1 Mentorship with Dr. Sasikala D
        mentorship1 = models.Mentorship(
            tenant_id="INST-001",
            team_id=team1.id,
            faculty_id=faculty_objs[0].id,
            status="APPROVED",
            match_score=0.96,
            matching_skills="FastAPI, React, AI/ML, PostgreSQL"
        )
        db.add(mentorship1)

        # Update faculty current team count
        f_prof_sasi = db.query(models.FacultyProfile).filter(models.FacultyProfile.user_id == faculty_objs[0].id).first()
        if f_prof_sasi:
            f_prof_sasi.current_team_count += 1

        # Team 1 Milestones
        m1 = models.Milestone(
            tenant_id="INST-001",
            team_id=team1.id,
            title="Milestone 1: Problem Definition & SRS Document",
            description="Complete system requirement specification, architecture diagrams, and algorithm workflow.",
            due_date=now - timedelta(days=20),
            status="APPROVED",
            points_reward=95,
            sequence_order=1,
            submitted_at=now - timedelta(days=22)
        )
        m2 = models.Milestone(
            tenant_id="INST-001",
            team_id=team1.id,
            title="Milestone 2: Database Design & Core API Development",
            description="Normalized database schema, JWT auth, and Gale-Shapley matching engine implementation.",
            due_date=now - timedelta(days=5),
            status="APPROVED",
            points_reward=90,
            sequence_order=2,
            submitted_at=now - timedelta(days=6)
        )
        m3 = models.Milestone(
            tenant_id="INST-001",
            team_id=team1.id,
            title="Milestone 3: UI Dashboard, Real-time Chat & WebSockets",
            description="Interactive React portal, live messaging, read receipts, and milestone submission portal.",
            due_date=now + timedelta(days=15),
            status="IN_PROGRESS",
            points_reward=None,
            sequence_order=3
        )
        m4 = models.Milestone(
            tenant_id="INST-001",
            team_id=team1.id,
            title="Milestone 4: Final Testing, Performance Benchmarks & Demo",
            description="Load testing, security audit, report generation, and final jury evaluation.",
            due_date=now + timedelta(days=35),
            status="PENDING",
            points_reward=None,
            sequence_order=4
        )
        db.add_all([m1, m2, m3, m4])
        db.commit()

        # Team 1 Tasks
        t1 = models.StudentTask(
            tenant_id="INST-001",
            team_id=team1.id,
            assigned_to_id=student_objs[0].id,
            assigned_by_id=student_objs[0].id,
            title="Migrate Spring Boot backend to Unified FastAPI",
            description="Consolidate all microservices and REST endpoints into single high-performance Python FastAPI service.",
            point_value=25,
            status="COMPLETED",
            completion_note="Migration completed with 100% test coverage.",
            completed_at=now - timedelta(days=1)
        )
        t2 = models.StudentTask(
            tenant_id="INST-001",
            team_id=team1.id,
            assigned_to_id=student_objs[3].id,
            assigned_by_id=student_objs[0].id,
            title="Implement Gale-Shapley and TF-IDF Similarity Engine",
            description="Build cosine vector similarity and Gale-Shapley stable allocation matching.",
            point_value=20,
            status="COMPLETED",
            completion_note="Algorithm verified with benchmark datasets.",
            completed_at=now - timedelta(days=2)
        )
        t3 = models.StudentTask(
            tenant_id="INST-001",
            team_id=team1.id,
            assigned_to_id=student_objs[4].id,
            assigned_by_id=student_objs[0].id,
            title="Build WhatsApp-style Read Receipts & Real-time Chat UI",
            description="Double blue ticks, delivery statuses, and native WebSocket protocol.",
            point_value=20,
            status="IN_PROGRESS"
        )
        db.add_all([t1, t2, t3])
        db.commit()

        # Team 1 Chat Messages
        msg1 = models.Message(
            tenant_id="INST-001",
            team_id=team1.id,
            sender_id=student_objs[0].id,
            content="Welcome to the team workspace everyone! Let's build something extraordinary.",
            type="TEXT",
            is_read=True,
            timestamp=now - timedelta(days=3)
        )
        msg2 = models.Message(
            tenant_id="INST-001",
            team_id=team1.id,
            sender_id=student_objs[3].id,
            content="Excited to work on the AI matching and plagiarism detection modules!",
            type="TEXT",
            is_read=True,
            timestamp=now - timedelta(days=2)
        )
        msg3 = models.Message(
            tenant_id="INST-001",
            team_id=team1.id,
            sender_id=student_objs[4].id,
            content="I have updated the frontend components and glassmorphism styling.",
            type="TEXT",
            is_read=False,
            timestamp=now - timedelta(hours=2)
        )
        db.add_all([msg1, msg2, msg3])

        # Project 2 & Team 2 (Open Team looking for members)
        proj2 = models.Project(
            tenant_id="INST-001",
            title="Autonomous Vision-Guided Drone for Precision Agriculture",
            description="Edge computing computer vision system for real-time crop disease detection and soil moisture mapping.",
            domain="Computer Vision & Robotics",
            tech_stack="Python, PyTorch, OpenCV, ROS2, C++",
            posted_by_id=student_objs[5].id,
            status="APPROVED",
            upvote_count=18,
            similarity_score=0.08
        )
        db.add(proj2)
        db.commit()
        db.refresh(proj2)

        team2 = models.Team(
            tenant_id="INST-001",
            team_name="AgriVision",
            project_id=proj2.id,
            status="FORMING",
            total_score=0,
            is_at_risk=False,
            last_activity_at=now
        )
        db.add(team2)
        db.commit()
        db.refresh(team2)

        db.add(models.TeamMember(
            tenant_id="INST-001",
            team_id=team2.id,
            user_id=student_objs[5].id, # Sneha Rajan
            role_in_team="LEADER",
            invite_status="ACCEPTED",
            membership_status="ACTIVE"
        ))

        # Initial Notifications
        db.add_all([
            models.Notification(
                tenant_id="INST-001",
                user_id=student_objs[0].id,
                message="Your team 'NeuroSync' has been approved by Dr. Sasikala D.",
                notification_type="TEAM_APPROVED",
                is_read=False,
                created_at=now - timedelta(hours=5)
            ),
            models.Notification(
                tenant_id="INST-001",
                user_id=student_objs[0].id,
                message="Milestone 2 has been graded: 90/100 points awarded!",
                notification_type="MILESTONE_GRADED",
                is_read=False,
                created_at=now - timedelta(hours=1)
            )
        ])
        db.commit()

        print("  * Created sample Projects, Active Teams, Milestones, Tasks, and Messages.")
        print("\n" + "=" * 60)
        print("DATABASE SUCCESSFULLY RESET AND SEEDED WITH CLEAN DATA!")
        print("=" * 60)

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Error during seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    reset_and_seed_db()
