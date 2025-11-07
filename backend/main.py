import os
import json
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
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
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
    context: dict  # AI COMMENT: Contains goal, interests, skills from student

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

# --- 4. API ENDPOINTS ---

@app.get("/")
def read_root():
    """A simple 'hello world' endpoint to check if the server is running."""
    return {"message": "AI Backend is running!"}


@app.post("/api/generate-skills")
async def generate_skills(request: SkillRequest):
    if not request.interests:
        raise HTTPException(status_code=400, detail="No interests provided")
    if not credentials:
        raise HTTPException(status_code=500, detail="Service account not configured")

    limit = max(3, min(request.limit or 12, 25))
    prompt = f"""Generate {limit} professional skills based on these interests: {', '.join(request.interests)}

Output ONLY a JSON object with this EXACT structure (no markdown, no explanation):
{{"skills": ["skill1", "skill2", "skill3"]}}

Example valid output:
{{"skills": ["Web Development", "UI/UX Design", "JavaScript"]}}"""

    try:
        # Get OAuth2 token
        token = get_access_token()
        
        # Call Vertex AI Gemini API
        project_id = "sigma-night-477219-g4"
        location = "us-central1"
        model_id = "gemini-2.5-flash-lite"
        
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
                "maxOutputTokens": 2048,
                "candidateCount": 1,
            }
        }
        
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        
        if response.status_code != 200:
            print(f"API Error Response: {response.status_code}")
            print(f"Response body: {response.text}")
        
        response.raise_for_status()
        
        data = response.json()
        candidate = data["candidates"][0]
        
        # Check if response was truncated
        finish_reason = candidate.get("finishReason", "UNKNOWN")
        if finish_reason == "MAX_TOKENS":
            print("WARNING: Response was truncated due to max tokens!")
        
        raw_text = candidate["content"]["parts"][0]["text"]
        
        print("=== RAW AI RESPONSE ===")
        print(f"Finish Reason: {finish_reason}")
        print(raw_text)
        print("======================")
        
        # Check if AI refused the request due to safety concerns
        refusal_keywords = ["cannot fulfill", "cannot generate", "cannot create", "violates", "safety principles", "inappropriate", "harmful content", "hate speech"]
        if any(keyword in raw_text.lower() for keyword in refusal_keywords):
            print("AI refused request due to safety/content policy")
            return {
                "skills": ["Problem Solving", "Critical Thinking", "Communication", "Teamwork", "Adaptability", "Time Management", "Leadership", "Organization"][:limit],
                "warning": "⚠️ Unable to generate skills - please choose appropriate interests that don't contain offensive or harmful content."
            }
        
        cleaned = _strip_code_fences(raw_text)
        
        print("=== CLEANED TEXT ===")
        print(cleaned)
        print("===================")
        
        try:
            parsed = json.loads(cleaned)
        except json.JSONDecodeError as json_err:
            print(f"JSON parsing failed: {json_err}")
            print("Attempting to fix truncated JSON...")
            
            # Try to fix truncated JSON by finding the skills array
            import re
            skills_match = re.search(r'"skills"\s*:\s*\[(.*?)(?:\]|$)', cleaned, re.DOTALL)
            if skills_match:
                skills_str = skills_match.group(1)
                # Extract complete quoted strings
                skill_items = re.findall(r'"([^"]+)"', skills_str)
                if skill_items:
                    print(f"Extracted {len(skill_items)} skills from truncated JSON")
                    return {"skills": skill_items[:limit]}
            
            print("Attempting to extract skills from plain text...")
            # Fallback: try to extract skills from plain text
            lines = raw_text.strip().split('\n')
            skills = []
            for line in lines:
                line = line.strip().strip('-').strip('*').strip('•').strip().strip('"').strip(',')
                if line and len(line) > 2 and len(line) < 100 and not line.startswith('{') and not line.startswith('['):
                    skills.append(line)
            if skills:
                print(f"Extracted {len(skills)} skills from plain text")
                return {"skills": skills[:limit]}
            # If still no skills, return some defaults based on interests
            print("Falling back to default skills")
            return {"skills": ["Problem Solving", "Critical Thinking", "Communication", "Teamwork", "Adaptability"][:limit]}
        
        if isinstance(parsed, list):
            skills = parsed
        elif isinstance(parsed, dict) and isinstance(parsed.get("skills"), list):
            skills = parsed["skills"]
        else:
            print(f"Unexpected JSON structure: {type(parsed)}")
            # Try to find any list in the response
            if isinstance(parsed, dict):
                for value in parsed.values():
                    if isinstance(value, list):
                        skills = value
                        break
                else:
                    raise ValueError("No list found in JSON response")
            else:
                raise ValueError("Unexpected JSON structure from model")

        skills = [skill.strip() for skill in skills if isinstance(skill, str) and skill.strip()]
        if not skills:
            print("Model returned empty skills list")
            return {"skills": ["Problem Solving", "Critical Thinking", "Communication"][:limit]}
        return {"skills": skills[:limit]}

    except HTTPException:
        raise
    except Exception as err:
        print("Error generating skills:", err)
        import traceback
        traceback.print_exc()
        # Return fallback skills instead of failing completely
        return {"skills": ["Problem Solving", "Critical Thinking", "Communication", "Teamwork", "Adaptability"][:limit]}


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
        
        # Turn the AI's text string into a real Python dictionary
        json_data = json.loads(ai_response_text)
        
        # Send the clean JSON data back to the React frontend
        return json_data

    except Exception as e:
        print(f"Error processing AI response: {e}")
        import traceback
        traceback.print_exc()
        return {"error": f"Failed to generate or parse AI response: {str(e)}"}


# Simple chatbot endpoint - answers questions about career path
@app.post("/api/ask-question")
async def ask_question(request: QuestionRequest):
    """Simple chatbot that answers career-related questions using student's context."""
    
    BOT_NAME = "Nathan Chong"

    # AI COMMENT: Build a simple prompt with student's info and their question
    goal = request.context.get('goal', 'Not provided')
    interests = request.context.get('interests', [])
    skills = request.context.get('skills', [])

    prompt = f"""You are a helpful career advisor chatbot named {BOT_NAME} for University of Hawaii students.

Student's Career Goal: {goal}
Student's Interests: {', '.join(interests) if interests else 'None yet'}
Student's Skills: {', '.join(skills) if skills else 'None yet'}

Student's Question: {request.question}

Give a brief, helpful answer in 2-3 sentences max. Be direct and concise."""
    
    if not credentials:
        return {"error": "Service account not configured"}
        
    try:
        # AI COMMENT: Get token and call Gemini 2.5 Flash (since Pro is too much tokens)
        token = get_access_token()
        project_id = "sigma-night-477219-g4"
        location = "us-central1"
        model_id = "gemini-2.5-flash"  
        
        url = f"https://{location}-aiplatform.googleapis.com/v1/projects/{project_id}/locations/{location}/publishers/google/models/{model_id}:generateContent"
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generation_config": {"temperature": 0.7, "maxOutputTokens": 1000}
        }
        
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        data = response.json()
        answer_text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
        
        return {"answer": answer_text}
        
    except Exception as e:
        print(f"Error calling AI: {e}")
        return {"answer": "Sorry, I couldn't process your question right now. Please try again!"}
