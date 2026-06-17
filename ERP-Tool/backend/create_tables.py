import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.utils.db import engine, Base
# Import models to ensure they are registered with Base.metadata
from app.models import models

print("Creating all tables in the database...")
Base.metadata.create_all(bind=engine)
print("Done!")
