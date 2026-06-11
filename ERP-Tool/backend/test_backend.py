#!/usr/bin/env python3
"""
Script to test if backend server is responding
"""
import requests

def test_backend():
    """Test if backend server is responding"""
    try:
        print("Testing backend server...")
        response = requests.get("http://localhost:8000/api/v1/auth/registration-status", timeout=5)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    test_backend()
