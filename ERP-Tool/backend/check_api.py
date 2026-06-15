import urllib.request
import json

def check(url, method="GET"):
    req = urllib.request.Request(url, method=method)
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            data = response.read().decode('utf-8')
            print(f"[{method}] {url} -> {response.status}")
            print(data)
    except Exception as e:
        print(f"[{method}] {url} -> ERROR: {e}")

check("http://127.0.0.1:8000/api/health")
check("http://127.0.0.1:8000/api/v1/auth/reset-ceo?secret=clarix-reset-2024", method="POST")
