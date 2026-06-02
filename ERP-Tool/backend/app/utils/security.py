import os
from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError
import pyotp
from dotenv import load_dotenv

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_REFRESH_SECRET = os.getenv("JWT_REFRESH_SECRET")

if not JWT_SECRET or len(JWT_SECRET) < 32:
    raise ValueError("[FATAL] JWT_SECRET environment variable is missing or under 32 characters.")

if not JWT_REFRESH_SECRET or len(JWT_REFRESH_SECRET) < 32:
    raise ValueError("[FATAL] JWT_REFRESH_SECRET environment variable is missing or under 32 characters.")

# Monkey patch for bcrypt 4.1.0+ compatibility with passlib
import bcrypt
if not hasattr(bcrypt, "__about__"):
    class BcryptAbout:
        __version__ = getattr(bcrypt, "__version__", "4.0.0")
    bcrypt.__about__ = BcryptAbout()

from passlib.context import CryptContext

# Configure bcrypt password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

compare_password = verify_password

def generate_access_token(payload: dict) -> str:
    to_encode = payload.copy()
    expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm="HS256")

def generate_refresh_token(payload: dict) -> str:
    to_encode = payload.copy()
    expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_REFRESH_SECRET, algorithm="HS256")

def verify_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except JWTError:
        return None

def verify_refresh_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, JWT_REFRESH_SECRET, algorithms=["HS256"])
        return payload
    except JWTError:
        return None

def generate_totp_secret() -> str:
    return pyotp.random_base32()

def verify_totp_token(secret: str, token: str) -> bool:
    totp = pyotp.TOTP(secret)
    return totp.verify(token, valid_window=1)
