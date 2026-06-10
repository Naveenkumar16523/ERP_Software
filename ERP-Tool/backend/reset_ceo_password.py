"""
Emergency CEO password reset script.
Run this via Render shell or locally with production DATABASE_URL set.
Usage: python reset_ceo_password.py
"""
import os
import sys

# Allow override via env, otherwise use the production TiDB URL
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres.jqzxgtftluqpymkqyiwq:Naveen16523%40%23%24@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres")
NEW_PASSWORD = os.getenv("CEO_PASSWORD", "admin123")

print(f"Connecting to database...")
print(f"Will set CEO password to: {NEW_PASSWORD}")

try:
    from sqlalchemy import create_engine, text
    from sqlalchemy.orm import sessionmaker
    from passlib.context import CryptContext

    connect_args = {}
    if "tidbcloud.com" in DATABASE_URL or "alicloud" in DATABASE_URL:
        connect_args = {"ssl": {}}

    engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)

    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    print("✅ Database connection successful")

    Session = sessionmaker(bind=engine)
    db = Session()
    pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

    # Check existing users
    result = db.execute(text("SELECT COUNT(*) FROM erp_users")).scalar()
    print(f"Total users in DB: {result}")

    # Find CEO
    ceo = db.execute(text("SELECT id, username, passwordHash, isActive, isCEO FROM erp_users WHERE username = 'ceo'")).fetchone()

    if ceo:
        print(f"\n✅ CEO user found:")
        print(f"   ID: {ceo[0]}")
        print(f"   Username: {ceo[1]}")
        print(f"   isActive: {ceo[3]}")
        print(f"   isCEO: {ceo[4]}")

        is_valid = pwd.verify(NEW_PASSWORD, ceo[2])
        print(f"   Password '{NEW_PASSWORD}' currently valid: {is_valid}")

        # Always reset to ensure it matches
        new_hash = pwd.hash(NEW_PASSWORD)
        db.execute(
            text("UPDATE erp_users SET passwordHash=:h, isActive=1, isCEO=1 WHERE username='ceo'"),
            {"h": new_hash}
        )
        db.commit()
        print(f"\n✅ CEO password reset to '{NEW_PASSWORD}' successfully!")
        print(f"   isActive set to: True")
        print(f"   isCEO set to: True")

    else:
        print("\n❌ CEO user NOT found. Creating one...")
        # Get any role
        role = db.execute(text("SELECT id FROM erp_roles WHERE name IN ('superadmin','ceo') LIMIT 1")).fetchone()
        dept = db.execute(text("SELECT id FROM erp_departments LIMIT 1")).fetchone()

        if not role:
            print("❌ No roles found. Please run seed_rbac_complete.py first.")
            sys.exit(1)

        new_hash = pwd.hash(NEW_PASSWORD)
        db.execute(
            text("""
                INSERT INTO erp_users (username, passwordHash, fullName, email, roleId, departmentId, isActive, isCEO)
                VALUES ('ceo', :h, 'CEO', 'ceo@company.com', :r, :d, 1, 1)
            """),
            {"h": new_hash, "r": role[0], "d": dept[0] if dept else None}
        )
        db.commit()
        print(f"✅ CEO user created with password '{NEW_PASSWORD}'")

    db.close()
    print("\n🔐 Login credentials:")
    print(f"   Username: ceo")
    print(f"   Password: {NEW_PASSWORD}")

except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
