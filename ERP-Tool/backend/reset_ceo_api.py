#!/usr/bin/env python3
"""
Script to reset CEO password using the backend API
"""
import requests
import json

def reset_ceo_via_api():
    """Reset CEO password using the backend's reset-ceo endpoint"""
    url = "http://localhost:8000/api/v1/auth/reset-ceo"
    params = {"secret": "clarix-reset-2024"}
    
    try:
        print("Calling reset-ceo endpoint...")
        response = requests.post(url, params=params, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print("\n✓ CEO password reset successfully!")
            print("Login with:")
            print("  Username: ceo")
            print("  Password: admin123")
        else:
            print(f"\n✗ Reset failed: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("✗ Cannot connect to backend server")
        print("  Make sure the backend server is running on http://localhost:8000")
    except Exception as e:
        print(f"✗ Error: {e}")

if __name__ == "__main__":
    reset_ceo_via_api()
