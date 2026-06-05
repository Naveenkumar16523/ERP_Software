"""
Test if backend server is running and accessible
"""
import urllib.request
import json

def test_backend():
    url = "http://localhost:5000/api/v1/health/simple"
    
    try:
        with urllib.request.urlopen(url, timeout=5) as response:
            data = json.loads(response.read().decode())
            print(f"✅ Backend server is running!")
            print(f"Response: {data}")
            return True
    except urllib.error.URLError as e:
        print(f"❌ Backend server is NOT running or not accessible")
        print(f"Error: {e}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    test_backend()
