"""TEST CODE: Simple script to check connectivity to the backend AI endpoints.
Run only after the FastAPI server is started on http://127.0.0.1:8000.
Prints whatever the AI (or fallback) returns. Keep it minimal.
"""

from __future__ import annotations
import json
import requests

BASE = "http://127.0.0.1:8000"


def show(title: str, data):
    print(f"\n=== {title} ===")
    print(json.dumps(data, indent=2, ensure_ascii=False))


def test_recommend_majors():
    payload = {
        "why_uh": "I want to be near family and work on sustainable tech.",
        "interests": ["renewable energy", "software", "community service"],
        "skills": ["public speaking", "problem solving", "basic Python"],
        "top_n": 3,
    }
    r = requests.post(f"{BASE}/api/recommend-majors", json=payload, timeout=30)
    r.raise_for_status()
    show("Majors (AI output)", r.json())


def test_generate_skills():
    payload = {"interests": ["software", "green tech"], "limit": 8}
    r = requests.post(f"{BASE}/api/generate-skills", json=payload, timeout=30)
    r.raise_for_status()
    show("Skills (AI output)", r.json())


def test_generate_path():
    payload = {
        "interests": ["software engineering", "sustainability"],
        "skills": ["python", "teamwork", "presentations"],
        "summary": "I want a 4-year plan near family that leads to green tech jobs.",
    }
    r = requests.post(f"{BASE}/api/generate-path", json=payload, timeout=45)
    r.raise_for_status()
    show("4-Year Path (AI output)", r.json())


if __name__ == "__main__":
    # TEST CODE: Execute connectivity checks. Not for production use.
    try:
        test_recommend_majors()
    except Exception as e:
        print(f"recommend-majors failed: {e}")
    try:
        test_generate_skills()
    except Exception as e:
        print(f"generate-skills failed: {e}")
    try:
        test_generate_path()
    except Exception as e:
        print(f"generate-path failed: {e}")
