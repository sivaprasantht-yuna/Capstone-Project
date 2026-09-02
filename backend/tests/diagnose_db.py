"""Quick diagnostic: check actual DB schema + password verification."""
import sys
sys.path.insert(0, ".")

from sqlalchemy import create_engine, text, inspect
from config import settings

engine = create_engine(settings.DB_URL, echo=False)

with engine.connect() as conn:
    # 1. List actual columns in users table
    insp = inspect(engine)
    print("=" * 60)
    print("ACTUAL COLUMNS IN 'users' TABLE:")
    print("=" * 60)
    for col in insp.get_columns("users"):
        print(f"  {col['name']:25s}  {str(col['type']):20s}  nullable={col.get('nullable')}")

    print()
    print("=" * 60)
    print("ACTUAL COLUMNS IN 'student_profiles' TABLE:")
    print("=" * 60)
    for col in insp.get_columns("student_profiles"):
        print(f"  {col['name']:25s}  {str(col['type']):20s}  nullable={col.get('nullable')}")

    print()
    print("=" * 60)
    print("ACTUAL COLUMNS IN 'teams' TABLE:")
    print("=" * 60)
    for col in insp.get_columns("teams"):
        print(f"  {col['name']:25s}  {str(col['type']):20s}  nullable={col.get('nullable')}")

    print()
    print("=" * 60)
    print("ACTUAL COLUMNS IN 'team_members' TABLE:")
    print("=" * 60)
    for col in insp.get_columns("team_members"):
        print(f"  {col['name']:25s}  {str(col['type']):20s}  nullable={col.get('nullable')}")

    print()
    print("=" * 60)
    print("ACTUAL COLUMNS IN 'messages' TABLE:")
    print("=" * 60)
    for col in insp.get_columns("messages"):
        print(f"  {col['name']:25s}  {str(col['type']):20s}  nullable={col.get('nullable')}")

    print()
    print("=" * 60)
    print("ACTUAL COLUMNS IN 'notifications' TABLE:")
    print("=" * 60)
    for col in insp.get_columns("notifications"):
        print(f"  {col['name']:25s}  {str(col['type']):20s}  nullable={col.get('nullable')}")

    print()
    print("=" * 60)
    print("ACTUAL COLUMNS IN 'milestones' TABLE:")
    print("=" * 60)
    for col in insp.get_columns("milestones"):
        print(f"  {col['name']:25s}  {str(col['type']):20s}  nullable={col.get('nullable')}")

    print()
    print("=" * 60)
    print("ACTUAL COLUMNS IN 'mentorships' TABLE:")
    print("=" * 60)
    for col in insp.get_columns("mentorships"):
        print(f"  {col['name']:25s}  {str(col['type']):20s}  nullable={col.get('nullable')}")

    print()
    print("=" * 60)
    print("ACTUAL COLUMNS IN 'projects' TABLE:")
    print("=" * 60)
    for col in insp.get_columns("projects"):
        print(f"  {col['name']:25s}  {str(col['type']):20s}  nullable={col.get('nullable')}")

    # 2. Check a sample user
    print()
    print("=" * 60)
    print("SAMPLE USERS (first 5):")
    print("=" * 60)
    result = conn.execute(text("SELECT id, name, email, role, password_hash, is_active FROM users LIMIT 5"))
    for row in result:
        pw_preview = row[4][:30] + "..." if row[4] else "NULL"
        print(f"  id={row[0]}  name={row[1]!r:25s}  email={row[2]!r:35s}  role={row[3]!r:10s}  active={row[5]}  pw={pw_preview}")

    # 3. Try bcrypt verify on the first user
    print()
    print("=" * 60)
    print("BCRYPT VERIFICATION TEST:")
    print("=" * 60)
    result = conn.execute(text("SELECT id, email, password_hash FROM users WHERE is_active = true LIMIT 1"))
    row = result.first()
    if row:
        import bcrypt
        test_passwords = ["password", "Password@123", "admin123", "demo", "test123"]
        for tp in test_passwords:
            try:
                ok = bcrypt.checkpw(tp.encode('utf-8'), row[2].encode('utf-8'))
                print(f"  user={row[1]} pw={tp!r:20s} -> {'MATCH!' if ok else 'no match'}")
            except Exception as e:
                print(f"  user={row[1]} pw={tp!r:20s} -> ERROR: {e}")

    # 4. Check all table names
    print()
    print("=" * 60)
    print("ALL TABLES IN DATABASE:")
    print("=" * 60)
    for t in sorted(insp.get_table_names()):
        print(f"  {t}")
