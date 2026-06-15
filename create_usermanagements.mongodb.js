/* global use, db */
// MongoDB Playground
// Select the database to use.
const database = 'erp_database';
use(database);

// Create the 'usermanagements' collection with JSON schema validation
db.createCollection("usermanagements", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["full_name", "email", "department", "role"],
      properties: {
        full_name: {
          bsonType: "string",
          description: "must be a string and is required"
        },
        email: {
          bsonType: "string",
          description: "must be a string and is required"
        },
        department: {
          bsonType: "string",
          enum: [
            "Finance",
            "Human Resources",
            "Operations",
            "Sales & Marketing",
            "IT / System",
            "Sustainability"
          ],
          description: "must be a string from the enum values and is required"
        },
        role: {
          bsonType: "string",
          enum: [
            "finance_staff",
            "hr_staff",
            "operations_staff",
            "sales_staff",
            "it_staff",
            "sustainability_staff"
          ],
          description: "must be a string from the enum values and is required"
        },
        status: {
          bsonType: "string",
          enum: ["Active", "Inactive", "Suspended"],
          description: "must be one of 'Active', 'Inactive', 'Suspended'"
        },
        created_at: {
          bsonType: "date",
          description: "must be a date"
        },
        updated_at: {
          bsonType: "date",
          description: "must be a date"
        }
      }
    }
  }
});

// Create a unique index on the 'email' field
db.usermanagements.createIndex({ email: 1 }, { unique: true });

print("Successfully created 'usermanagements' collection with schema validation and unique index on email.");
