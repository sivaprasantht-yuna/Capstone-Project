import psycopg2
import os
from dotenv import load_dotenv
from urllib.parse import urlparse
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

url = os.getenv("DB_URL", "")  # Must be set in .env — never hard-code credentials


print("=" * 60)
print(" VERIFYING SUPABASE POOLER CONNECTION")
print("=" * 60)

try:
    conn = psycopg2.connect(url, connect_timeout=10)
    cur = conn.cursor()
    
    cur.execute("SELECT version(), current_database(), current_user;")
    ver, dbname, user = cur.fetchone()
    print(f"[OK] Connected to Supabase!")
    print(f"     Database: {dbname}")
    print(f"     User:     {user}")
    print(f"     Version:  {ver}\n")
    
    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;")
    tables = [row[0] for row in cur.fetchall()]
    print(f"[OK] Found {len(tables)} public tables:")
    print("    ", ", ".join(tables))
    
    cur.execute("SELECT id, name, email, role, is_active FROM users WHERE email LIKE '%siva%';")
    users = cur.fetchall()
    print(f"\n[OK] Matching users ({len(users)} found):")
    for u in users:
        print(f"     ID: {u[0]} | Name: {u[1]} | Email: {u[2]} | Role: {u[3]} | Active: {u[4]}")
        
    cur.close()
    conn.close()
    print("\n" + "=" * 60)
    print(" SUCCESS: Supabase connection is 100% WORKING!")
    print("=" * 60)
except Exception as e:
    print(f"[ERROR] Failed to connect: {e}")
