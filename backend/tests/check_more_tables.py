import sys
sys.path.insert(0, ".")
from sqlalchemy import create_engine, inspect
from config import settings

engine = create_engine(settings.DB_URL)
insp = inspect(engine)

tables = ["student_tasks", "project_evidence", "certificates", "events", "evaluations", "student_contributions"]
for t in tables:
    print(f"=== {t.upper()} TABLE ===")
    if t in insp.get_table_names():
        for col in insp.get_columns(t):
            print(f"  {col['name']:25s}  {str(col['type']):20s}  nullable={col.get('nullable')}")
    else:
        print("  TABLE NOT FOUND")
    print()
