import certifi
from pymongo import MongoClient
import os

uri = os.getenv("MONGODB_URL", "mongodb+srv://erp_db:Naveen16523%40%23%24@cluster0.wu2gznn.mongodb.net/?appName=Cluster0")
db_name = os.getenv("MONGODB_DB_NAME", "erp_database")

client = MongoClient(uri, tlsCAFile=certifi.where(), tlsAllowInvalidCertificates=True)
db = client[db_name]

collections = [
    "chartofaccounts", "journalentries", "invoices", "budgetplanners", 
    "expensetrackers", "approvals", "taxcompliances", "statements",
    "employeedirectories", "leavemanagements", "recruitments", "performances",
    "onboardings", "attendances", "products", "batchtrackings", "warehouses",
    "stockmovements", "barcodescanners", "productionbatches", "manufacturingworkorders",
    "billofmaterials", "machines", "downtimelogs", "productionreports",
    "suppliers", "purchaseorders", "rfqs", "vendorevaluations", "contracts",
    "customers", "leadpipelines", "salesforecasts", "opportunities", "activities",
    "salarystructures", "payslips", "timetrackings", "fixedassets", "projects",
    "projecttasks", "carriers", "routes", "shipments", "supplychainworkorders",
    "ecommerceproducts", "ecommercecarts", "ecommerceorders", "ecommercepayments",
    "analyticsreports", "bankaccounts", "banktransactions", "loans",
    "campaigns", "marketingleads", "marketinganalytics", "socialmediaposts",
    "securityalerts", "accesslogs", "useractivities", "compliances",
    "migrationhubs", "rpaautomations"
]

for coll in collections:
    try:
        db.create_collection(coll)
        print(f"Created collection: {coll}")
    except Exception as e:
        print(f"Collection {coll} already exists or failed: {e}")

print(f"Successfully initialized all collections in the '{db_name}' database.")
