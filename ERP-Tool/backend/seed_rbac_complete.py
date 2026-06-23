"""
seed_rbac_complete.py — MySQL/Aiven version (replaces old MongoDB script)
Runs on every Render deploy. Safe to re-run (idempotent).
Uses raw SQL text() so it has zero dependency on ORM model imports.
"""
import os
import sys

from dotenv import load_dotenv
load_dotenv()

MYSQL_URL = os.getenv("MYSQL_URL") or os.getenv("DB_URL", "")
if not MYSQL_URL:
    print("ERROR: Neither MYSQL_URL nor DB_URL environment variable is set. Aborting seed.", flush=True)
    sys.exit(1)

# Normalise driver prefix
if MYSQL_URL.startswith("mysql://"):
    MYSQL_URL = MYSQL_URL.replace("mysql://", "mysql+pymysql://", 1)

from sqlalchemy import create_engine, text
from passlib.context import CryptContext

engine = create_engine(
    MYSQL_URL,
    connect_args={"ssl": {"ca": None}},
    pool_pre_ping=True,
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

MODULES = [
    "dashboard", "finance", "human_resources", "inventory", "manufacturing",
    "procurement", "crm_pipeline", "payroll", "fixed_assets", "projects",
    "supply_chain", "ecommerce", "analytics_hub", "banking", "healthcare",
    "education", "sustainability", "marketing", "security", "migration_hub",
    "rpa_automation",
]

DEPARTMENTS = [
    {"name": "Finance",           "code": "FIN"},
    {"name": "Human Resources",   "code": "HR"},
    {"name": "Operations",        "code": "OPS"},
    {"name": "Sales & Marketing", "code": "SLS"},
    {"name": "IT",                "code": "IT"},
    {"name": "Sustainability",    "code": "SUS"},
]

# Roles and which modules they can access
ROLES_CONFIG = [
    {"name": "finance_staff",        "dept": "FIN", "desc": "Finance Department Staff",
     "modules": ["dashboard", "finance", "banking", "analytics_hub"]},
    {"name": "hr_staff",             "dept": "HR",  "desc": "Human Resources Department Staff",
     "modules": ["dashboard", "human_resources", "payroll", "healthcare", "education"]},
    {"name": "operations_staff",     "dept": "OPS", "desc": "Operations Department Staff",
     "modules": ["dashboard", "inventory", "manufacturing", "supply_chain", "procurement", "fixed_assets", "projects"]},
    {"name": "sales_staff",          "dept": "SLS", "desc": "Sales & Marketing Department Staff",
     "modules": ["dashboard", "crm_pipeline", "ecommerce", "marketing", "analytics_hub"]},
    {"name": "it_staff",             "dept": "IT",  "desc": "IT Department Staff",
     "modules": ["dashboard", "security", "migration_hub", "rpa_automation", "analytics_hub"]},
    {"name": "sustainability_staff", "dept": "SUS", "desc": "Sustainability Department Staff",
     "modules": ["dashboard", "sustainability", "analytics_hub"]},
    {"name": "superadmin",           "dept": "FIN", "desc": "CEO / Superadmin with full access",
     "modules": MODULES, "is_ceo": True},
]


def run_seed():
    print("Starting MySQL RBAC seed...", flush=True)

    with engine.begin() as conn:

        # ── 1. Create tables (idempotent) ──────────────────────────────
        print("Creating tables if they do not exist...", flush=True)

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS erp_departments (
                id          VARCHAR(36)  PRIMARY KEY,
                name        VARCHAR(100) NOT NULL,
                code        VARCHAR(20)  UNIQUE NOT NULL,
                createdAt   DATETIME     DEFAULT CURRENT_TIMESTAMP
            )
        """))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS erp_roles (
                id           VARCHAR(36)  PRIMARY KEY,
                name         VARCHAR(100) UNIQUE NOT NULL,
                description  TEXT,
                departmentId VARCHAR(36),
                createdAt    DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (departmentId) REFERENCES erp_departments(id)
            )
        """))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS erp_users (
                id           VARCHAR(36)  PRIMARY KEY,
                username     VARCHAR(100) UNIQUE NOT NULL,
                email        VARCHAR(255) UNIQUE NOT NULL,
                passwordHash TEXT         NOT NULL,
                fullName     VARCHAR(255),
                roleId       VARCHAR(36),
                departmentId VARCHAR(36),
                isActive     BOOLEAN      DEFAULT TRUE,
                isCEO        BOOLEAN      DEFAULT FALSE,
                createdAt    DATETIME     DEFAULT CURRENT_TIMESTAMP,
                updatedAt    DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (roleId)       REFERENCES erp_roles(id),
                FOREIGN KEY (departmentId) REFERENCES erp_departments(id)
            )
        """))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS module_access (
                id        VARCHAR(36)  PRIMARY KEY,
                roleId    VARCHAR(36)  NOT NULL,
                moduleKey VARCHAR(100) NOT NULL,
                canRead   BOOLEAN      DEFAULT TRUE,
                canWrite  BOOLEAN      DEFAULT TRUE,
                canExport BOOLEAN      DEFAULT TRUE,
                FOREIGN KEY (roleId) REFERENCES erp_roles(id)
            )
        """))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS refresh_tokens (
                id        VARCHAR(36)  PRIMARY KEY,
                userId    VARCHAR(36)  NOT NULL,
                token     TEXT         NOT NULL,
                expiresAt DATETIME     NOT NULL,
                createdAt DATETIME     DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (userId) REFERENCES erp_users(id)
            )
        """))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS access_requests (
                id           VARCHAR(36)  PRIMARY KEY,
                fullName     VARCHAR(255) NOT NULL,
                email        VARCHAR(255) NOT NULL,
                department   VARCHAR(100),
                reason       TEXT,
                status       VARCHAR(50)  DEFAULT 'pending',
                reviewedBy   VARCHAR(36),
                reviewedAt   DATETIME,
                denialReason TEXT,
                createdAt    DATETIME     DEFAULT CURRENT_TIMESTAMP
            )
        """))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS audit_logs (
                id        VARCHAR(36) PRIMARY KEY,
                userId    VARCHAR(36),
                action    VARCHAR(100),
                resource  VARCHAR(100),
                details   TEXT,
                ipAddress VARCHAR(100),
                userAgent TEXT,
                createdAt DATETIME    DEFAULT CURRENT_TIMESTAMP
            )
        """))

        print("All core tables ready.", flush=True)

        # ── 2. Seed Departments ────────────────────────────────────────
        import uuid
        dept_id_map = {}

        for dept in DEPARTMENTS:
            row = conn.execute(
                text("SELECT id FROM erp_departments WHERE code = :code"),
                {"code": dept["code"]}
            ).fetchone()

            if row:
                dept_id_map[dept["code"]] = row[0]
                print(f"  Department exists: {dept['name']}", flush=True)
            else:
                new_id = str(uuid.uuid4())
                conn.execute(
                    text("INSERT INTO erp_departments (id, name, code) VALUES (:id, :name, :code)"),
                    {"id": new_id, "name": dept["name"], "code": dept["code"]}
                )
                dept_id_map[dept["code"]] = new_id
                print(f"  Created department: {dept['name']}", flush=True)

        # ── 3. Seed Roles + Module Access ──────────────────────────────
        role_id_map = {}

        for role_cfg in ROLES_CONFIG:
            dept_id = dept_id_map.get(role_cfg["dept"])
            if not dept_id:
                print(f"  WARNING: Department {role_cfg['dept']} not found, skipping {role_cfg['name']}", flush=True)
                continue

            row = conn.execute(
                text("SELECT id FROM erp_roles WHERE name = :name"),
                {"name": role_cfg["name"]}
            ).fetchone()

            if row:
                role_id = row[0]
                print(f"  Role exists: {role_cfg['name']}", flush=True)
            else:
                role_id = str(uuid.uuid4())
                conn.execute(
                    text("INSERT INTO erp_roles (id, name, description, departmentId) VALUES (:id, :name, :desc, :dept)"),
                    {"id": role_id, "name": role_cfg["name"], "desc": role_cfg["desc"], "dept": dept_id}
                )
                print(f"  Created role: {role_cfg['name']}", flush=True)

            role_id_map[role_cfg["name"]] = role_id

            # Clear and re-insert module access (idempotent)
            conn.execute(text("DELETE FROM module_access WHERE roleId = :rid"), {"rid": role_id})

            allowed = set(role_cfg["modules"])
            for mod in MODULES:
                can = mod in allowed
                conn.execute(
                    text("INSERT INTO module_access (id, roleId, moduleKey, canRead, canWrite, canExport) "
                         "VALUES (:id, :rid, :mod, :r, :w, :e)"),
                    {"id": str(uuid.uuid4()), "rid": role_id, "mod": mod, "r": can, "w": can, "e": can}
                )

            print(f"    Set {len(allowed)} module permissions for: {role_cfg['name']}", flush=True)

        # ── 4. Seed CEO User ───────────────────────────────────────────
        superadmin_role_id = role_id_map.get("superadmin")
        fin_dept_id        = dept_id_map.get("FIN")

        if not superadmin_role_id:
            print("  WARNING: superadmin role not found, skipping CEO user creation.", flush=True)
        else:
            existing = conn.execute(
                text("SELECT id FROM erp_users WHERE username = 'ceo'")
            ).fetchone()

            hashed_pw = pwd_context.hash("admin123")

            if existing:
                conn.execute(
                    text("""UPDATE erp_users
                               SET passwordHash = :pw,
                                   isActive     = TRUE,
                                   isCEO        = TRUE,
                                   roleId       = :rid,
                                   departmentId = :did
                             WHERE username = 'ceo'"""),
                    {"pw": hashed_pw, "rid": superadmin_role_id, "did": fin_dept_id}
                )
                print("  Updated CEO user (ceo / admin123)", flush=True)
            else:
                conn.execute(
                    text("""INSERT INTO erp_users
                                (id, username, email, passwordHash, fullName, roleId, departmentId, isActive, isCEO)
                            VALUES
                                (:id, 'ceo', 'ceo@company.com', :pw, 'Chief Executive Officer',
                                 :rid, :did, TRUE, TRUE)"""),
                    {"id": str(uuid.uuid4()), "pw": hashed_pw,
                     "rid": superadmin_role_id, "did": fin_dept_id}
                )
                print("  Created CEO user (ceo / admin123)", flush=True)

    print("\nRBAC seed completed successfully!", flush=True)
    print("CEO login -> username: ceo | password: admin123", flush=True)


if __name__ == "__main__":
    try:
        run_seed()
    except Exception as e:
        print(f"ERROR: Seed failed: {e}", flush=True)
        import traceback
        traceback.print_exc()
        sys.exit(1)
