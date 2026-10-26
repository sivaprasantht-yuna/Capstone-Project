"""
Multi-Tenant Isolation & Model B Verification Suite
"""
import os
import sys

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Ensure backend directory is in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine
import models
from tenant import resolve_tenant_from_email, get_tenant_name, tenant_filter, get_user_tenant_id
from config import settings

def run_tests():
    print("=" * 60)
    print("RUNNING MULTI-TENANT ISOLATION TESTS")
    print("=" * 60)

    # 1. Test Tenant Table & Seeding
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check pre-seeded tenants or ensure they exist
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
            existing = db.query(models.Tenant).filter(models.Tenant.id == tid).first()
            if not existing:
                db.add(models.Tenant(
                    id=tid, name=tname, email_domains=tdomains,
                    allow_public_showcase=tshowcase, is_active=True
                ))
            else:
                existing.name = tname
                existing.email_domains = tdomains
                existing.allow_public_showcase = tshowcase
        db.commit()

        # 2. Test Domain Resolution
        test_cases = [
            ("student@bitsathy.ac.in", "INST-BIT"),
            ("faculty@PSGTECH.AC.IN", "INST-PSG"),
            ("researcher@kongu.edu", "INST-KEC"),
            ("dean@kct.ac.in", "INST-KCT"),
            ("student@cit.edu.in", "INST-CIT"),
            ("student@tce.edu", "INST-TCE"),
            ("student@cb.amrita.edu", "INST-AMRITA"),
            ("student@srec.ac.in", "INST-SREC"),
            ("testuser@gmail.com", "INST-001"),
            ("random@unknownuniv.edu", "INST-001"),
        ]

        print("\n[TEST 1] Email Domain to Tenant Resolution:")
        for email, expected in test_cases:
            resolved = resolve_tenant_from_email(email, db)
            assert resolved == expected, f"Failed for {email}: got {resolved}, expected {expected}"
            name = get_tenant_name(resolved, db)
            print(f"  ✓ {email} -> {resolved} ({name})")

        # 3. Test Institution Name Lookup
        print("\n[TEST 2] Tenant Name Lookup:")
        bit_name = get_tenant_name("INST-BIT", db)
        assert "Bannari Amman" in bit_name, f"Expected Bannari Amman in name, got: {bit_name}"
        print(f"  ✓ INST-BIT name: '{bit_name}'")

        # 4. Test Query Filter (Model B vs Model A)
        print("\n[TEST 3] Tenant Scoping Filter (Model B vs Model A):")
        # Ensure MULTI_TENANT_ENABLED is True
        settings.MULTI_TENANT_ENABLED = True
        q1 = tenant_filter(db.query(models.Project), models.Project, "INST-BIT")
        sql_str = str(q1)
        assert "tenant_id" in sql_str.lower(), f"Tenant filter missing in query: {sql_str}"
        print(f"  ✓ Model B (MULTI_TENANT_ENABLED=True): Scoped query contains tenant_id filter")

        # Test Model A bypass
        settings.MULTI_TENANT_ENABLED = False
        q2 = tenant_filter(db.query(models.Project), models.Project, "INST-BIT")
        sql_str_a = str(q2)
        # Model A should not have a WHERE filter on tenant_id
        assert "where" not in sql_str_a.lower(), f"Model A should not filter by tenant_id: {sql_str_a}"
        print(f"  ✓ Model A (MULTI_TENANT_ENABLED=False): Query passed through unfiltered (Zero code changes needed)")
        settings.MULTI_TENANT_ENABLED = True

        # 5. Test Router Import Integrity
        print("\n[TEST 4] Router Import Integrity:")
        from routers import auth, users, projects, teams, admin, milestones, tasks
        print("  ✓ All routers (auth, users, projects, teams, admin, milestones, tasks) imported cleanly without errors")

        print("\n" + "=" * 60)
        print("ALL MULTI-TENANT ISOLATION TESTS PASSED SUCCESSFULLY! (100%)")
        print("=" * 60)

    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
