# MongoDB Atlas Authentication Debugging Guide
**Purpose:** Systematic debugging of MongoDB connection issues without exposing credentials

## Confirmed Facts
- **Database user:** erp_db
- **Authentication Method:** SCRAM
- **MongoDB Role:** atlasAdmin@admin
- **Resources:** All Resources
- **Cluster name:** cluster0 (cluster0.wu2gznn.mongodb.net)

---

## Step 1: CONNECTION STRING FORMAT

### Correct Format:
```
mongodb+srv://erp_db:<password>@cluster0.wu2gznn.mongodb.net/<dbname>?retryWrites=true&w=majority&appName=<appname>
```

### Your Task:
Paste your connection string with password replaced by `REDACTED`, like this:
```
mongodb+srv://erp_db:REDACTED@cluster0.wu2gznn.mongodb.net/erp_database?retryWrites=true&w=majority&appName=Cluster0
```

### What to Check:
- ✅ Protocol: `mongodb+srv://` (not `mongodb://`)
- ✅ Username: `erp_db` (matches your confirmed user)
- ✅ Host: `cluster0.wu2gznn.mongodb.net` (matches your cluster)
- ✅ Database name: Should be present (e.g., `erp_database`)
- ✅ Parameters: `retryWrites=true&w=majority` (recommended)
- ✅ App name: Optional but recommended (e.g., `appName=Cluster0`)

### Success Indicator:
Your REDACTED string matches the format above exactly (except for password).

### Failure Indicator:
- Missing `+srv` in protocol
- Wrong cluster name
- Missing database name
- Missing required parameters

---

## Step 2: PASSWORD ENCODING

### Special Characters That Need Encoding:
If your password contains any of these, they MUST be URL-encoded:
- `@` → `%40`
- `:` → `%3A`
- `/` → `%2F`
- `?` → `%3F`
- `#` → `%23`
- `[` → `%5B`
- `]` → `%5D`
- `%` → `%25`

### Safe Password Encoding Script:
Create a file `encode_password.py`:

```python
import urllib.parse
import getpass

# Run this locally - never share the output
password = getpass.getpass("Enter your MongoDB password (input hidden): ")
encoded = urllib.parse.quote_plus(password)
print(f"Encoded password: {encoded}")
```

### How to Run:
```bash
cd backend
python encode_password.py
```

### What to Do:
1. Run the script locally
2. Enter your password when prompted (input is hidden)
3. Copy the encoded password output
4. Replace `<password>` in your connection string with the encoded version

### Success Indicator:
Script runs without error and produces an encoded password string.

### Failure Indicator:
Script crashes or produces unexpected output.

---

## Step 3: IP WHITELIST CHECK

### How to Check in Atlas:
1. Log in to MongoDB Atlas: https://cloud.mongodb.com/
2. Go to **Network Access** → **IP Access List**
3. Check if your IP is listed, or if `0.0.0.0/0` (allow all) is present

### For Render Deployment:
- **Render uses dynamic outbound IPs** (not static)
- **Current recommendation:** Use `0.0.0.0/0` for now (less secure but functional)
- **Future improvement:** Add Render's static IP add-on or use Atlas PrivateLink

### How to Add IP Whitelist:
1. In **Network Access** → **IP Access List**
2. Click **Add IP Address**
3. Choose **Allow Access from Anywhere** (`0.0.0.0/0`)
4. Click **Confirm**

### Success Indicator:
- `0.0.0.0/0` appears in IP Access List
- Or your specific IP is listed

### Failure Indicator:
- No IP whitelist entries
- Your IP is not listed and `0.0.0.0/0` is not present

---

## Step 4: PASSWORD RESET (Clean Root-Cause Test)

### How to Reset Password in Atlas:
1. Go to **Database Access** in Atlas
2. Find user `erp_db`
3. Click **...** menu → **Edit Password**
4. Click **Autogenerate Secure Password** button
5. Copy the generated password immediately
6. Click **Save**

### Why This Helps:
- Eliminates password typos
- Ensures password meets Atlas requirements
- Provides a known-good starting point

### Success Indicator:
- Password reset completes without error
- You have a new, securely generated password

### Failure Indicator:
- Reset fails with error message
- Unable to copy the generated password

---

## Step 5: LOCAL TEST SCRIPT

### Create Test Script:
Create `test_mongodb_connection.py` in your backend directory:

```python
import os
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ConfigurationError, AuthenticationFailure

def test_mongodb_connection():
    # Read connection string from environment variable only
    connection_string = os.environ.get('MONGODB_URL')
    
    if not connection_string:
        print("❌ ERROR: MONGODB_URL environment variable not set")
        print("Set it with: export MONGODB_URL='your_connection_string'")
        return False
    
    print(f"Testing connection to MongoDB...")
    print(f"Connection string: {connection_string[:30]}... (truncated for security)")
    
    try:
        # Create MongoDB client
        client = MongoClient(connection_string, serverSelectionTimeoutMS=5000)
        
        # Test connection with ping command
        result = client.admin.command('ping')
        print("✅ SUCCESS: MongoDB connection established")
        print(f"   Ping response: {result}")
        
        # Get server info for additional verification
        server_info = client.server_info()
        print(f"   Server version: {server_info.get('version', 'unknown')}")
        
        # List databases
        databases = client.list_database_names()
        print(f"   Available databases: {databases}")
        
        return True
        
    except AuthenticationFailure as e:
        print(f"❌ AUTHENTICATION FAILED: {e.details}")
        print("   Check: Username, password, and authentication method")
        return False
        
    except ConnectionFailure as e:
        print(f"❌ CONNECTION FAILED: {e}")
        print("   Check: Network connectivity, IP whitelist, cluster name")
        return False
        
    except ConfigurationError as e:
        print(f"❌ CONFIGURATION ERROR: {e}")
        print("   Check: Connection string format, parameters")
        return False
        
    except Exception as e:
        print(f"❌ UNEXPECTED ERROR: {type(e).__name__}: {e}")
        return False
        
    finally:
        # Close connection
        if 'client' in locals():
            client.close()

if __name__ == "__main__":
    success = test_mongodb_connection()
    exit(0 if success else 1)
```

### How to Run:
```bash
# Set environment variable (Windows PowerShell)
$env:MONGODB_URL="mongodb+srv://erp_db:YOUR_PASSWORD@cluster0.wu2gznn.mongodb.net/erp_database?retryWrites=true&w=majority"

# Run test script
python test_mongodb_connection.py
```

### Success Indicator:
```
✅ SUCCESS: MongoDB connection established
   Ping response: {'ok': 1.0}
   Server version: 6.0.x
   Available databases: ['admin', 'local', 'erp_database']
```

### Failure Indicators:
- `❌ AUTHENTICATION FAILED`: Wrong username/password
- `❌ CONNECTION FAILED`: Network/IP whitelist issue
- `❌ CONFIGURATION ERROR`: Connection string format issue

---

## Step 6: ENVIRONMENT VARIABLE SETUP

### Local Development (.env file):
Your `backend/.env` file (already gitignored ✅):
```env
MONGODB_URL=mongodb+srv://erp_db:YOUR_ENCODED_PASSWORD@cluster0.wu2gznn.mongodb.net/erp_database?retryWrites=true&w=majority
```

### Production (Render):
**DO NOT** put credentials in `render.yaml` (it's in .gitignore now ✅)

Instead, use Render's Environment Variables:
1. Go to Render Dashboard → erp-backend service
2. Go to **Environment** tab
3. Add `MONGODB_URL` as environment variable
4. Paste your connection string (with encoded password)

### FastAPI Environment Variable Reading:
Your app should read it via `os.environ` or `pydantic-settings`:

**Option 1: Using os.environ (current approach):**
```python
import os

MONGODB_URL = os.environ.get('MONGODB_URL')
```

**Option 2: Using pydantic-settings (recommended):**
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    mongodb_url: str
    
    class Config:
        env_file = ".env"

settings = Settings()
MONGODB_URL = settings.mongodb_url
```

### Success Indicator:
- Local: App reads from `.env` file
- Production: App reads from Render environment variables
- No hardcoded credentials in code

### Failure Indicator:
- Credentials hardcoded in source code
- `.env` file not gitignored
- Render environment variables not set

---

## Debugging Flow

Follow these steps in order:

1. **Step 1:** Verify connection string format (provide REDACTED version)
2. **Step 2:** Encode your password using the Python script
3. **Step 3:** Check IP whitelist in Atlas
4. **Step 4:** Reset password in Atlas (if needed)
5. **Step 5:** Run local test script with updated credentials
6. **Step 6:** Confirm environment variable setup

**Stop at each step** and verify success before proceeding to the next.

---

## Expected Outcomes

### If All Steps Pass:
- Local test script connects successfully
- Your FastAPI app can connect to MongoDB
- Production deployment will work with Render environment variables

### If Steps Fail:
- Each step provides specific error messages
- You'll know exactly which component is failing
- Can focus troubleshooting on that specific area

---

## Security Notes

- ✅ Never paste actual passwords in chat
- ✅ Use `.env` files for local development (gitignored)
- ✅ Use Render environment variables for production
- ✅ Reset passwords if they might have been compromised
- ✅ Use IP whitelisting (even if permissive for now)
- ✅ Consider Atlas PrivateLink for production security
