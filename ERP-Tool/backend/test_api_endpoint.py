#!/usr/bin/env python3
"""
Script to test the finance API endpoint directly
"""
import requests
import json

# Test the create account endpoint
def test_create_account():
    url = "http://localhost:8000/finance/accounts"
    
    # Test payload
    payload = {
        "code": "TEST-002",
        "name": "Test Account API",
        "type": "Asset",
        "balance": 5000.0
    }
    
    # You'll need to provide a valid JWT token
    # For now, let's just try without auth to see if the endpoint is reachable
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        print(f"Testing POST to {url}")
        print(f"Payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(url, json=payload, headers=headers, timeout=5)
        
        print(f"\nStatus Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 201:
            print("✓ Account created successfully")
        elif response.status_code == 401:
            print("✗ Authentication required - backend is running but needs auth")
        elif response.status_code == 404:
            print("✗ Endpoint not found - backend may not be running")
        else:
            print(f"✗ Unexpected status code: {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("✗ Cannot connect to backend - backend may not be running")
        print("   Make sure to start the backend server first")
    except Exception as e:
        print(f"✗ Error: {e}")

if __name__ == "__main__":
    test_create_account()
