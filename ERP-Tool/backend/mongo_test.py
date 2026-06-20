import os
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ConfigurationError

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
        
    except ConnectionFailure as e:
        print(f"❌ CONNECTION FAILED: {e}")
        print("   Check: Network connectivity, IP whitelist, cluster name")
        return False
        
    except ConfigurationError as e:
        print(f"❌ CONFIGURATION ERROR: {e}")
        print("   Check: Connection string format, parameters")
        return False
        
    except Exception as e:
        error_msg = str(e).lower()
        if 'authentication' in error_msg or 'auth' in error_msg:
            print(f"❌ AUTHENTICATION FAILED: {e}")
            print("   Check: Username, password, and authentication method")
        elif 'connection' in error_msg or 'network' in error_msg:
            print(f"❌ CONNECTION FAILED: {e}")
            print("   Check: Network connectivity, IP whitelist, cluster name")
        elif 'configuration' in error_msg or 'dns' in error_msg:
            print(f"❌ CONFIGURATION ERROR: {e}")
            print("   Check: Connection string format, parameters")
        else:
            print(f"❌ UNEXPECTED ERROR: {type(e).__name__}: {e}")
        return False
        
    finally:
        # Close connection
        if 'client' in locals():
            client.close()

if __name__ == "__main__":
    success = test_mongodb_connection()
    exit(0 if success else 1)
