#!/usr/bin/env python3
"""
Script to check what DATABASE_URL is being loaded
"""
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

print(f"DATABASE_URL from .env: {DATABASE_URL}")
