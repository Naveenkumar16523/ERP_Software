"""
Test login endpoint directly to debug 422 error
"""
import urllib.request
import urllib.parse
import json

def test_login():
    url = "http://localhost:5000/api/v1/auth/login"
    
    # Test with CEO credentials
    data = {
        "username": "ceo",
        "password": "admin123"
    }
    
    try:
        # Create POST request
        req = urllib.request.Request(
            url,
            data=json.dumps(data).encode('utf-8'),
            headers={
                'Content-Type': 'application/json'
            },
            method='POST'
        )
        
        with urllib.request.urlopen(req, timeout=5) as response:
            response_data = json.loads(response.read().decode())
            print(f"✅ Login successful!")
            print(f"Status: {response.status}")
            print(f"Response: {json.dumps(response_data, indent=2)}")
            return True
            
    except urllib.error.HTTPError as e:
        print(f"❌ HTTP Error: {e.code}")
        try:
            error_data = json.loads(e.read().decode())
            print(f"Error Details: {json.dumps(error_data, indent=2)}")
        except:
            print(f"Error Message: {e.reason}")
        return False
    except urllib.error.URLError as e:
        print(f"❌ Connection Error: {e.reason}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    test_login()
