import sys; sys.path.insert(0,'.')
from sqlalchemy import create_engine, inspect
from config import settings
engine = create_engine(settings.DB_URL)
insp = inspect(engine)
print('=== USERS TABLE ===')
for col in insp.get_columns('users'):
    print(f"  {col['name']:25s}  {str(col['type']):20s}")
print()
print('=== STUDENT_PROFILES TABLE ===')
for col in insp.get_columns('student_profiles'):
    print(f"  {col['name']:25s}  {str(col['type']):20s}")
print()
print('=== TEAMS TABLE ===')
for col in insp.get_columns('teams'):
    print(f"  {col['name']:25s}  {str(col['type']):20s}")
print()
print('=== SKILLS TABLE ===')
for col in insp.get_columns('skills'):
    print(f"  {col['name']:25s}  {str(col['type']):20s}")
print()
print('=== USER_SKILLS TABLE ===')
for col in insp.get_columns('user_skills'):
    print(f"  {col['name']:25s}  {str(col['type']):20s}")
