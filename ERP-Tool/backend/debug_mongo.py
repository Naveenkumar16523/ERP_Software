import os
import certifi
from pymongo import MongoClient

mongodb_url = os.environ.get("MONGODB_URL") or "mongodb+srv://erp_db:Naveen16523%40%23%24@cluster0.wu2gznn.mongodb.net/?appName=Cluster0"

try:
    print("Attempting to connect...")
    client = MongoClient(mongodb_url, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=5000)
    client.admin.command('ping')
    print("SUCCESS: Connected with certifi")
except Exception as e:
    print(f"FAILED with certifi: {e}")

try:
    print("Attempting to connect with invalid certs allowed...")
    client2 = MongoClient(mongodb_url, tlsAllowInvalidCertificates=True, serverSelectionTimeoutMS=5000)
    client2.admin.command('ping')
    print("SUCCESS: Connected with tlsAllowInvalidCertificates=True")
except Exception as e:
    print(f"FAILED with tlsAllowInvalidCertificates: {e}")
