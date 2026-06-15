import certifi
from pymongo import MongoClient
import os

uri = os.getenv("MONGODB_URL", "mongodb+srv://erp_db:Naveen16523%40%23%24@cluster0.wu2gznn.mongodb.net/?appName=Cluster0")
db_name = os.getenv("MONGODB_DB_NAME", "erp_database")

client = MongoClient(uri, tlsCAFile=certifi.where(), tlsAllowInvalidCertificates=True)
db = client[db_name]

# Creating usermanagements collection with schema validation based on the provided Mongoose schema
schema = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["full_name", "email", "department", "role"],
        "properties": {
            "full_name": {
                "bsonType": "string",
                "description": "must be a string and is required"
            },
            "email": {
                "bsonType": "string",
                "description": "must be a string and is required"
            },
            "department": {
                "bsonType": "string",
                "enum": [
                    "Finance", "Human Resources", "Operations", 
                    "Sales & Marketing", "IT / System", "Sustainability"
                ],
                "description": "must be one of the specified departments and is required"
            },
            "role": {
                "bsonType": "string",
                "enum": [
                    "finance_staff", "hr_staff", "operations_staff", 
                    "sales_staff", "it_staff", "sustainability_staff"
                ],
                "description": "must be one of the specified roles and is required"
            },
            "status": {
                "bsonType": "string",
                "enum": ["Active", "Inactive", "Suspended"],
                "description": "must be one of the status values"
            },
            "created_at": {
                "bsonType": ["date", "string"],
                "description": "creation date"
            },
            "updated_at": {
                "bsonType": ["date", "string"],
                "description": "update date"
            }
        }
    }
}

try:
    db.create_collection("usermanagements", validator=schema)
    print("Created collection: usermanagements with schema validation")
    
    # Create unique index on email
    db.usermanagements.create_index("email", unique=True)
    print("Created unique index on email")
except Exception as e:
    print(f"Failed to create collection or it already exists: {e}")
