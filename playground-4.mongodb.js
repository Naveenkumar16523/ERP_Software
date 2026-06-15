/* global use, db */
// Select the database to use.
const database = 'erp_database';
use(database);

// Array of collection names derived from the provided Mongoose schemas.
// Mongoose pluralizes model names by default.
const collections = [
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
];

// Iterate and explicitly create the collections
for (const coll of collections) {
  try {
    db.createCollection(coll);
    print(`Created collection: ${coll}`);
  } catch (err) {
    // If the collection already exists, ignore the error
    if (err.codeName === "NamespaceExists" || err.message.includes("already exists")) {
      print(`Collection already exists: ${coll}`);
    } else {
      print(`Failed to create collection ${coll}: ${err.message}`);
    }
  }
}

print(`\nSuccessfully initialized all collections in the '${database}' database.`);
