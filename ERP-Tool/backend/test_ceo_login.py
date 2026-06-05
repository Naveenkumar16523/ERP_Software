"""
Test CEO login endpoint directly
"""
import requests
import json

# Test CEO login
url = "http://localhost:5000/api/v1/auth/admin/login"
credentials = {
    "username": "ceo",
    "password": "admin123"
}

print(f"Testing CEO login at: {url}")
print(f"Credentials: {credentials}")
print()

try:
    response = requests.post(url, json=credentials)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")
    
    if response.status_code == 200:
        print("\n✅ CEO login successful!")
        data = response.json()
        print(f"Token: {data.get('access_token', 'N/A')[:50]}...")
        print(f"User: {data.get('user', {})}")
    else:
        print(f"\n❌ CEO login failed with status {response.status_code}")
        
except requests.exceptions.ConnectionError:
    print("❌ Cannot connect to backend server at localhost:5000")
    print("Make sure the backend server is running!")
except Exception as e:
    print(f"❌ Error: {e}")
