import os
import json
<<<<<<< HEAD
import google.generativeai as genai
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# --- 1. SETUP & CONFIGURATION ---

# Load the secret API key from our .env file
load_dotenv()

# Configure the Gemini API client
try:
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    model = genai.GenerativeModel('gemini-pro')
except Exception as e:
    print(f"Error configuring Gemini API: {e}")
    # Handle the error appropriately, maybe exit or set a flag
    model = None
=======
import requests
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from google.auth.transport.requests import Request as GoogleRequest
from google.oauth2 import service_account

# --- 1. SETUP & CONFIGURATION ---

# Load environment variables
load_dotenv()

# Configure OAuth2 credentials for Vertex AI
credentials = None
try:
    sa_path = os.path.join(os.path.dirname(__file__), "sigma-night-477219-g4-3a0269dd7cd8.json")
    credentials = service_account.Credentials.from_service_account_file(
        sa_path,
        scopes=['https://www.googleapis.com/auth/cloud-platform']
    )
    print("Successfully loaded service account credentials")
except Exception as e:
    print(f"Error loading service account: {e}")

def get_access_token():
    """Get a fresh OAuth2 access token from service account"""
    if not credentials:
        raise HTTPException(status_code=500, detail="Service account not configured")
    credentials.refresh(GoogleRequest())
    return credentials.token
>>>>>>> dda0d62309d8df709f0def5d059b5ba247a9b259

# Initialize the FastAPI app
app = FastAPI()

# --- 2. CORS MIDDLEWARE ---
# This is CRITICAL. It allows your React frontend (on a different "origin")
# to make requests to this backend.

# List of origins (URLs) that are allowed to talk to your backend
origins = [
    "http://localhost",
    "http://localhost:3000", # Default for create-react-app
    "http://localhost:5173", # Default for Vite (React)
<<<<<<< HEAD
=======
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
>>>>>>> dda0d62309d8df709f0def5d059b5ba247a9b259
    # Add your frontend's actual URL if it's different
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods (GET, POST, etc.)
    allow_headers=["*"], # Allows all headers
)

# --- 3. DATA MODELS (PYDANTIC) ---
# These classes define the *exact* shape of the JSON data
# your backend expects to receive from the frontend.
# If the frontend sends data that doesn't match, FastAPI sends back an error.

class PathRequest(BaseModel):
    interests: list[str]
    skills: list[str]
    summary: str
    # Add any other fields you collect from the user

class QuestionRequest(BaseModel):
    question: str
    course_context: str # e.g., "This question is about COMP 101"

<<<<<<< HEAD
=======
class SkillRequest(BaseModel):
    interests: list[str]
    limit: Optional[int] = 12


def _strip_code_fences(text: str) -> str:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        lines = [line for line in cleaned.splitlines() if not line.strip().startswith("```")]
        cleaned = "\n".join(lines).strip()
    cleaned = cleaned.replace("```json", "").replace("```", "").strip()
    return cleaned

>>>>>>> dda0d62309d8df709f0def5d059b5ba247a9b259
# --- 4. API ENDPOINTS ---

@app.get("/")
def read_root():
    """A simple 'hello world' endpoint to check if the server is running."""
    return {"message": "AI Backend is running!"}


<<<<<<< HEAD
=======
@app.post("/api/generate-skills")
async def generate_skills(request: SkillRequest):
    if not request.interests:
        raise HTTPException(status_code=400, detail="No interests provided")
    if not credentials:
        raise HTTPException(status_code=500, detail="Service account not configured")

    limit = max(3, min(request.limit or 12, 25))
    prompt = f"""You are helping a student brainstorm resume-friendly skills. They described their interests as:
{', '.join(request.interests)}

Return between 5 and {limit} short skill phrases (e.g., "Data Storytelling", "Community Leadership").
Respond with ONLY valid JSON in this exact format:
{{"skills": ["Skill 1", "Skill 2"]}}
Do not add explanations, markdown fences, or extra commentary."""

    try:
        # Get OAuth2 token
        token = get_access_token()
        
        # Call Vertex AI Gemini API
        project_id = "sigma-night-477219-g4"
        location = "us-central1"
        model_id = "gemini-2.5-pro"
        
        url = f"https://{location}-aiplatform.googleapis.com/v1/projects/{project_id}/locations/{location}/publishers/google/models/{model_id}:generateContent"
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "contents": [{
                "role": "user",
                "parts": [{"text": prompt}]
            }],
            "generation_config": {
                "temperature": 0.4,
                "maxOutputTokens": 1024,
            }
        }
        
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        
        if response.status_code != 200:
            print(f"API Error Response: {response.status_code}")
            print(f"Response body: {response.text}")
        
        response.raise_for_status()
        
        data = response.json()
        raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
        cleaned = _strip_code_fences(raw_text)
        parsed = json.loads(cleaned)
        
        if isinstance(parsed, list):
            skills = parsed
        elif isinstance(parsed, dict) and isinstance(parsed.get("skills"), list):
            skills = parsed["skills"]
        else:
            raise ValueError("Unexpected JSON structure from model")

        skills = [skill.strip() for skill in skills if isinstance(skill, str) and skill.strip()]
        if not skills:
            raise ValueError("Model returned no skills")
        return {"skills": skills[:limit]}

    except Exception as err:
        print("Error generating skills:", err)
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate skills: {str(err)}")


>>>>>>> dda0d62309d8df709f0def5d059b5ba247a9b259
# This is your first main endpoint
@app.post("/api/generate-path")
async def generate_path(request: PathRequest):
    """
    Takes user inputs, formats a prompt, calls the Gemini AI,
    and returns the AI's response (hopefully a JSON path).
    """
    
    #
    # TODO: Load your course data from a .json file here
    #
    # try:
    #     with open('courses.json', 'r') as f:
    #         course_data_json = json.load(f)
    #     course_data_str = json.dumps(course_data_json)
    # except FileNotFoundError:
    #     return {"error": "courses.json file not found"}
    # except Exception as e:
    #     return {"error": f"Error loading course data: {str(e)}"}
    #

    # 2. Format the prompt for the AI
    # This is the "prompt engineering" part.
    prompt = f"""
    You are a helpful university course advisor. A student has provided the following information about themselves:
    - Their interests: {", ".join(request.interests)}
    - Their current skills: {", ".join(request.skills)}
    - A summary of their goals: {request.summary}

    Here is a list of all available courses:
    [We will paste the course_data_str here later]

    Based *only* on the student's information, please generate a potential 4-year course path.
    
    IMPORTANT: You MUST respond with ONLY a valid JSON object. Do not include any other text
    before or after the JSON.
    The JSON object must follow this format:
    {{
      "path": [
        {{ "course_code": "COMP101", "title": "Intro to CS", "description": "A beginner course on CS.", "building_location": "Science Hall 104" }},
        {{ "course_code": "MATH110", "title": "Calculus I", "description": "Fundamental calculus.", "building_location": "Math Building 210" }}
      ]
    }}
    """

    print("--- Sending Prompt to AI ---")
    print(prompt)
    print("-----------------------------")

<<<<<<< HEAD
    if not model:
        return {"error": "Gemini API not configured. Check API key."}

    # 3. Call the AI
    try:
        response = model.generate_content(prompt)
        
        # 4. Clean and parse the AI's response
        # The AI might add "```json" or other text we need to strip out.
        ai_response_text = response.text.strip().replace("```json", "").replace("```", "")
=======
    if not credentials:
        return {"error": "Service account not configured"}

    # 3. Call the AI via Vertex AI REST API
    try:
        token = get_access_token()
        project_id = "sigma-night-477219-g4"
        location = "us-central1"
        
        url = f"https://{location}-aiplatform.googleapis.com/v1/projects/{project_id}/locations/{location}/publishers/google/models/gemini-pro:generateContent"
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generation_config": {"temperature": 0.4, "maxOutputTokens": 2048}
        }
        
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        
        # 4. Clean and parse the AI's response
        data = response.json()
        ai_response_text = data["candidates"][0]["content"]["parts"][0]["text"]
        ai_response_text = ai_response_text.strip().replace("```json", "").replace("```", "")
>>>>>>> dda0d62309d8df709f0def5d059b5ba247a9b259
        
        # Turn the AI's text string into a real Python dictionary
        json_data = json.loads(ai_response_text)
        
        # Send the clean JSON data back to the React frontend
        return json_data

    except Exception as e:
        print(f"Error processing AI response: {e}")
<<<<<<< HEAD
        print(f"Raw AI response was: {response.text}")
        return {"error": "Failed to generate or parse AI response."}
=======
        import traceback
        traceback.print_exc()
        return {"error": f"Failed to generate or parse AI response: {str(e)}"}
>>>>>>> dda0d62309d8df709f0def5d059b5ba247a9b259


# This is your second main endpoint
@app.post("/api/ask-question")
async def ask_question(request: QuestionRequest):
    """Handles a follow-up question about a specific course."""
    
    prompt = f"""
    A student is asking a question about a specific course.
    Course Context: {request.course_context}
    Question: {request.question}

    Please provide a helpful and concise answer.
    """
    
<<<<<<< HEAD
    if not model:
        return {"error": "Gemini API not configured. Check API key."}
        
    try:
        response = model.generate_content(prompt)
        return {"answer": response.text}
    except Exception as e:
        return {"error": f"Error calling AI: {str(e)}"}
=======
    if not credentials:
        return {"error": "Service account not configured"}
        
    try:
        token = get_access_token()
        project_id = "sigma-night-477219-g4"
        location = "us-central1"
        
        url = f"https://{location}-aiplatform.googleapis.com/v1/projects/{project_id}/locations/{location}/publishers/google/models/gemini-pro:generateContent"
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generation_config": {"temperature": 0.4, "maxOutputTokens": 1024}
        }
        
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        data = response.json()
        answer_text = data["candidates"][0]["content"]["parts"][0]["text"]
        
        return {"answer": answer_text}
    except Exception as e:
        print(f"Error calling AI: {e}")
        import traceback
        traceback.print_exc()
        return {"error": f"Error calling AI: {str(e)}"}
>>>>>>> dda0d62309d8df709f0def5d059b5ba247a9b259
