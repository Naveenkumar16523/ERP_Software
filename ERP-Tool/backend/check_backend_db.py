"""
Check which database the backend is using and ensure CEO user exists
"""
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.models.models import ERPUser, ERPRole, Base
from passlib.context import CryptContext

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

DATABASE_URL = os.getenv("DATABASE_URL")

# Use SQLite as fallback if DATABASE_URL is not set
if not DATABASE_URL:
    print("DATABASE_URL not set. Using SQLite as fallback database.")
    DATABASE_URL = "sqlite:///./erp.db"

connect_args = {}
if DATABASE_URL and "tidbcloud.com" in DATABASE_URL:
    connect_args = {"ssl": {}}

try:
    engine = create_engine(
        DATABASE_URL,
        echo=False,
        connect_args=connect_args,
        pool_pre_ping=True,
        pool_recycle=3600
    )
    # Test connection
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    print(f"✅ Connected to database: {DATABASE_URL}")
except Exception as e:
    print(f"❌ Failed to connect to {DATABASE_URL}. Falling back to SQLite.")
    DATABASE_URL = "sqlite:///./erp.db"
    engine = create_engine(
        DATABASE_URL,
        echo=False,
        connect_args={"check_same_thread": False},
        pool_pre_ping=True,
        pool_recycle=3600
    )

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)
print("Database tables created/verified")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

try:
    # Check for CEO user
    ceo_user = db.query(ERPUser).filter(ERPUser.username == "ceo").first()
    
    if ceo_user:
        print("✅ CEO user found!")
        print(f"  Username: {ceo_user.username}")
        print(f"  isCEO: {ceo_user.isCEO}")
        print(f"  isActive: {ceo_user.isActive}")
        
        # Test password
        is_valid = pwd_context.verify("admin123", ceo_user.passwordHash)
        print(f"  Password valid: {is_valid}")
    else:
        print("❌ CEO user NOT found! Creating CEO user...")
        
        # Get or create CEO role
        ceo_role = db.query(ERPRole).filter(ERPRole.name == "CEO").first()
        if not ceo_role:
            ceo_role = ERPRole(
                name="CEO",
                description="CEO / Superadmin with full access"
            )
            db.add(ceo_role)
            db.flush()
            print("Created CEO role")
        
        # Create CEO user
        ceo_user = ERPUser(
            username="ceo",
            passwordHash=pwd_context.hash("admin123"),
            fullName="Chief Executive Officer",
            email="ceo@company.com",
            roleId=ceo_role.id,
            departmentId=ceo_role.id,  # Temporary, will update if department exists
            isActive=True,
            isCEO=True
        )
        db.add(ceo_user)
        db.commit()
        print("✅ CEO user created successfully!")
        print("  Username: ceo")
        print("  Password: admin123")
    
except Exception as e:
    print(f"Error: {e}")
    db.rollback()
finally:
    db.close()
