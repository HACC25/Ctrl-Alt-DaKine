import sys
import requests

sys.path.insert(0, r"C:/Users/kitty/OneDrive/Pictures/Screenshots/New folder/New folder (2)/Ctrl-Alt-DaKine/backend")

print("Testing backend endpoints...\n")

base_url = "http://localhost:8000"

# Test 1: Root endpoint
print("1. Testing root endpoint (/)...")
try:
    response = requests.get(f"{base_url}/", timeout=5)
    if response.status_code == 200:
        print(f"   ✓ Root endpoint works: {response.json()}")
    else:
        print(f"   ✗ Root endpoint failed: {response.status_code}")
except Exception as e:
    print(f"   ✗ Error: {e}")

# Test 2: Generate skills endpoint (existing)
print("\n2. Testing /api/generate-skills (existing endpoint)...")
try:
    response = requests.post(
        f"{base_url}/api/generate-skills",
        json={"interests": ["programming", "design"], "limit": 3},
        timeout=30
    )
    if response.status_code == 200:
        result = response.json()
        print(f"   ✓ Generate skills works. Got {len(result.get('skills', []))} skills")
    else:
        print(f"   ✗ Generate skills failed: {response.status_code} - {response.text}")
except Exception as e:
    print(f"   ✗ Error: {e}")

# Test 3: New Speech-to-Text endpoint
print("\n3. Testing /api/speech-to-text (new endpoint)...")
try:
    # Test with minimal base64 (will fail but should not crash)
    response = requests.post(
        f"{base_url}/api/speech-to-text",
        json={"audio_base64": "UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="},
        timeout=30
    )
    if response.status_code in [200, 400, 502]:  # 400/502 expected for bad audio
        print(f"   ✓ Speech-to-text endpoint responds (status {response.status_code})")
        if response.status_code == 200:
            print(f"   Result: {response.json()}")
    else:
        print(f"   ✗ Unexpected status: {response.status_code} - {response.text}")
except Exception as e:
    print(f"   ✗ Error: {e}")

print("\n4. Testing /api/ask-question (existing endpoint)...")
try:
    response = requests.post(
        f"{base_url}/api/ask-question",
        json={
            "question": "What majors are available?",
            "context": {"goal": "Computer Science", "interests": ["coding"], "skills": ["python"]},
            "conversation_history": []
        },
        timeout=30
    )
    if response.status_code == 200:
        result = response.json()
        print(f"   ✓ Ask question works. Answer: {result.get('answer', '')[:50]}...")
    else:
        print(f"   ✗ Ask question failed: {response.status_code}")
except Exception as e:
    print(f"   ✗ Error: {e}")

print("\n" + "="*60)
print("Summary: All critical endpoints tested.")
print("="*60)
