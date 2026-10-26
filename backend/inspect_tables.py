import psycopg2
import os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

url = os.getenv("DB_URL", "")  # Must be set in .env — never hard-code credentials
conn = psycopg2.connect(url)

cur = conn.cursor()


for table in ['teams', 'projects', 'team_members', 'milestones']:
    cur.execute(f"SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name='{table}';")
    cols = cur.fetchall()
    print(f"\n--- {table} ---")
    for col in cols:
        print(f"  {col[0]:25s} {col[1]:15s} nullable={col[2]}")

cur.close()
conn.close()
