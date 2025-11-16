import os
import json
import re
import requests
from typing import Optional, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from google.auth.transport.requests import Request as GoogleRequest
from google.oauth2 import service_account

from campus_selector import generate_map_insights, recommend_majors_via_ai
from chat_to_voice_attachment import transcribe_audio, SpeechToTextError

# --- 1. SETUP & CONFIGURATION ---

load_dotenv()

# Safety settings for Gemini API
PERMISSIVE_SAFETY = [
    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
]

STANDARD_SAFETY = [
    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_ONLY_HIGH"},
    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_ONLY_HIGH"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_ONLY_HIGH"},
    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_ONLY_HIGH"},
]

# Configure OAuth2 credentials for Vertex AI
credentials = None
try:
    sa_path = os.path.join(os.path.dirname(__file__), "sigma-night-477219-g4-3a0269dd7cd8.json")
    credentials = service_account.Credentials.from_service_account_file(
        sa_path,
        scopes=['https://www.googleapis.com/auth/cloud-platform']
    )
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
    conversation_history: Optional[list] = []  # AI COMMENT: Previous chat messages

class SkillRequest(BaseModel):
    interests: list[str]
    limit: Optional[int] = 12


class MajorSuggestionRequest(BaseModel):
    why_uh: str
    interests: list[str]
    skills: list[str]
    top_n: int = 3


class MapInsightsRequest(BaseModel):
    why_uh: str
    interests: list[str]
    skills: list[str]
    top_n: int = 3


class ReactionRequest(BaseModel):
    campusName: Optional[str] = None
    majorName: Optional[str] = None
    skills: Optional[list[str]] = []
    answers: dict[str, Any] = {}
    latestSection: Optional[str] = None
    latestAnswer: Optional[str] = None
    nextSection: Optional[str] = None
    nextSectionLabel: Optional[str] = None


class AudioTranscriptionRequest(BaseModel):
    audio_base64: str
    encoding: Optional[str] = "LINEAR16"
    sample_rate: Optional[int] = 16000


def _strip_code_fences(text: str) -> str:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        lines = [line for line in cleaned.splitlines() if not line.strip().startswith("```")]
        cleaned = "\n".join(lines).strip()
    cleaned = cleaned.replace("```json", "").replace("```", "").strip()
    return cleaned


NATHAN_REACTION_FALLBACK = "Great job so far — Nathan is cheering you on!"

SECTION_NICKNAMES = {
    "whyuh": "Why UH intro",
    "experiencesandinterests": "interests",
    "skills": "skills",
    "map": "map insights",
    "uh-splash": "UH highlights",
}


def _extract_first_sentence(text: str) -> str:
    cleaned = re.sub(r"\s+", " ", text.replace('\n', ' ')).strip()
    match = re.match(r"^(.*?[.!?])(\s|$)", cleaned)
    return match.group(1).strip() if match else cleaned


def _normalize_quotes(text: str) -> str:
    return (
        text.replace("\u2019", "'")
        .replace("\u2018", "'")
        .replace("\u201c", '"')
        .replace("\u201d", '"')
    )


def _summarize_answer(answer: Optional[str], limit: int = 80) -> str:
    if not answer:
        return ""
    text = re.sub(r"\s+", " ", str(answer)).strip()
    if len(text) <= limit:
        return text
    return text[:limit].rstrip() + "…"


def _contextual_fallback(section: Optional[str], answer: Optional[str], next_label: Optional[str]) -> str:
    label = SECTION_NICKNAMES.get(section or "", section or "that section")
    snippet = _summarize_answer(answer)
    base = f"Appreciate your {label} note"
    if snippet:
        base += f": {snippet}"
    if next_label:
        base += f" — jump into the {next_label} section next."
    else:
        base += " — keep the momentum going!"
    return base


# --- 4. API ENDPOINTS ---

@app.get("/")
def read_root():
    """A simple 'hello world' endpoint to check if the server is running."""
    return {"message": "AI Backend is running!"}

# Generate skills
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
                "temperature": 0.5,
                "maxOutputTokens": 8192,
                "candidateCount": 1,
                "topP": 0.95,
                "topK": 40,
            },
            "safetySettings": STANDARD_SAFETY,
        }
        
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        candidate = data["candidates"][0]
        raw_text = candidate["content"]["parts"][0]["text"]
        
        # Check if AI refused the request due to safety concerns
        refusal_keywords = ["cannot fulfill", "cannot generate", "cannot create", "violates", "safety principles", "inappropriate", "harmful content", "hate speech"]
        if any(keyword in raw_text.lower() for keyword in refusal_keywords):
            return {
                "skills": ["Problem Solving", "Critical Thinking", "Communication", "Teamwork", "Adaptability", "Time Management", "Leadership", "Organization"][:limit],
                "warning": "⚠️ Unable to generate skills - please choose appropriate interests that don't contain offensive or harmful content."
            }
        
        cleaned = _strip_code_fences(raw_text)
        
        # Try to parse the AI response as JSON
        try:
            parsed = json.loads(cleaned)
        except json.JSONDecodeError:
            # If parsing fails, return default skills
            return {"skills": ["Problem Solving", "Critical Thinking", "Communication", "Teamwork", "Adaptability"][:limit]}
        
        # Extract skills from the parsed JSON
        if isinstance(parsed, list):
            skills = parsed  # AI returned a plain list
        elif isinstance(parsed, dict) and "skills" in parsed:
            skills = parsed["skills"]  # AI returned {"skills": [...]}
        else:
            return {"skills": ["Problem Solving", "Critical Thinking", "Communication"][:limit]}

        # Clean up the skills and return
        skills = [skill.strip() for skill in skills if isinstance(skill, str) and skill.strip()]
        if not skills:
            return {"skills": ["Problem Solving", "Critical Thinking", "Communication"][:limit]}
        return {"skills": skills[:limit]}

    except HTTPException:
        raise
    except Exception as err:
        print(f"Skills generation error: {err}")
        return {"skills": ["Problem Solving", "Critical Thinking", "Communication", "Teamwork", "Adaptability"][:limit]}


@app.post("/api/recommend-majors")
async def recommend_majors(request: MajorSuggestionRequest):
    """Use Vertex AI to suggest majors based on why-uh answer, interests, and skills."""

    token_fetcher = get_access_token if credentials else None
    return recommend_majors_via_ai(
        why_uh=request.why_uh,
        interests=request.interests,
        skills=request.skills,
        top_n=request.top_n,
        token_fetcher=token_fetcher,
    )


@app.post("/api/map-insights")
async def map_insights(request: MapInsightsRequest):
    """Generate majors and campus matches for the map panel."""

    token_fetcher = get_access_token if credentials else None
    return generate_map_insights(
        why_uh=request.why_uh,
        interests=request.interests,
        skills=request.skills,
        top_n=request.top_n,
        token_fetcher=token_fetcher,
    )


# This is your first main endpoint
@app.post("/api/generate-path")
async def generate_path(request: PathRequest):
    """Generate a recommended path by calling Gemini with the student info."""
    
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
    prompt_lines = [
        "You are a helpful university course advisor. A student has provided the following information about themselves:",
        f"- Their interests: {', '.join(request.interests)}",
        f"- Their current skills: {', '.join(request.skills)}",
        f"- A summary of their goals: {request.summary}",
        "",
        "Here is a list of all available courses:",
        "[We will paste the course_data_str here later]",
        "",
        "Based *only* on the student information, please generate a potential 4-year course path.",
        "",
        "IMPORTANT: You MUST respond with ONLY a valid JSON object. Do not include any other text",
        "before or after the JSON.",
        "The JSON object must follow this format:",
        "{",
        "  \"path\": [",
        "    { \"course_code\": \"COMP101\", \"title\": \"Intro to CS\", \"description\": \"A beginner course on CS.\", \"building_location\": \"Science Hall 104\" },",
        "    { \"course_code\": \"MATH110\", \"title\": \"Calculus I\", \"description\": \"Fundamental calculus.\", \"building_location\": \"Math Building 210\" }",
        "  ]",
        "}",
    ]
    prompt = "\n".join(prompt_lines)

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
            "generation_config": {
                "temperature": 0.5,
                "maxOutputTokens": 8192,
                "topP": 0.95,
                "topK": 40,
            },
            "safetySettings": STANDARD_SAFETY,
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


# Nathan-specific reaction endpoint
@app.post("/api/nathan-reaction")
async def nathan_reaction(request: ReactionRequest):
    if not credentials:
        raise HTTPException(status_code=500, detail="Service account not configured")

    latest_section = request.latestSection or "latest response"
    latest_answer = request.latestAnswer or "a recent submission"
    answers_snapshot = json.dumps(request.answers or {}, ensure_ascii=False)
    if len(answers_snapshot) > 600:
        answers_snapshot = f"{answers_snapshot[:600]}..."

    next_section = request.nextSectionLabel or request.nextSection
    guidance = (
        f" Close with a quick nudge toward the {next_section} section."
        if next_section else ""
    )

    fallback_reaction = _contextual_fallback(request.latestSection, request.latestAnswer, next_section)

    prompt_parts = [
        "You are Nathan Chong, a friendly University of Hawaii guide.",
        f"The student just updated the {latest_section} section with: {latest_answer}",
        f"Other responses so far: {answers_snapshot}",
        "Respond with ONE crisp sentence between 12 and 20 words (no emojis).",
        "Cite up to two concrete ideas from the latest answer (summarize lists instead of copying them) and keep it encouraging, specific, and conversational.",
    ]
    if guidance:
        prompt_parts.append(guidance.strip())
    prompt = " ".join(prompt_parts)

    try:
        token = get_access_token()
        project_id = "sigma-night-477219-g4"
        location = "us-central1"
        model_id = "gemini-2.5-flash"
        url = f"https://{location}-aiplatform.googleapis.com/v1/projects/{project_id}/locations/{location}/publishers/google/models/{model_id}:generateContent"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }
        payload = {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generation_config": {
                "temperature": 0.8,
                "maxOutputTokens": 8192,
                "topP": 0.95,
                "topK": 40,
            },
            "safetySettings": PERMISSIVE_SAFETY,
        }
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        candidate = data.get("candidates", [{}])[0]
        finish_reason = candidate.get("finishReason", "UNKNOWN")
        raw_text = candidate.get("content", {}).get("parts", [{}])[0].get("text", "").strip()
        
        # Temporary debug to find the issue
        print(f"DEBUG Nathan - finish_reason: {finish_reason}, text_length: {len(raw_text)}, text: '{raw_text}'")
        
        if finish_reason in ["SAFETY", "RECITATION", "OTHER"] or not raw_text or len(raw_text) < 5:
            return {"reaction": fallback_reaction or NATHAN_REACTION_FALLBACK}
        
        return {"reaction": _normalize_quotes(raw_text.strip())}
    except Exception as err:
        print(f"Nathan reaction error: {err}")
        return {"reaction": fallback_reaction or NATHAN_REACTION_FALLBACK}


# Simple chatbot endpoint - answers questions about career path
@app.post("/api/ask-question")
async def ask_question(request: QuestionRequest):
    """Simple chatbot that answers career-related questions using student context."""
    
    BOT_NAME = "Nathan Chong"

    # Get student info
    goal = request.context.get('goal', 'Not provided')
    interests = request.context.get('interests', [])
    skills = request.context.get('skills', [])

    # Build conversation history text (if there are previous messages)
    history_text = ""
    if request.conversation_history:
        for msg in request.conversation_history[:-1]:  # Don't include current question
            who = "Student" if msg['role'] == 'user' else BOT_NAME
            history_text += f"{who}: {msg['text']}\n"

    # Build the prompt with student info and conversation history
    prompt_lines = [
        f"You are a helpful career advisor chatbot named {BOT_NAME} for University of Hawaii students.",
        "",
        f"Student on why they want to go to the UH system: {goal}",
        f"Student Interests: {', '.join(interests) if interests else 'None yet'}",
        f"Student Skills: {', '.join(skills) if skills else 'None yet'}",
        "",
        "Previous conversation:",
        history_text if history_text else "(This is the first message)",
        "",
        f"Student Question: {request.question}",
        "",
        "Give a brief, helpful answer in 2-3 sentences max. Be direct and concise.",
    ]
    prompt = "\n".join(prompt_lines)
    
    if not credentials:
        return {"error": "Service account not configured"}
        
    try:
        # Get token and call Gemini
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
            "generation_config": {
                "temperature": 0.8,
                "maxOutputTokens": 8192,
                "topP": 0.95,
                "topK": 40,
            },
            "safetySettings": STANDARD_SAFETY,
        }
        
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        data = response.json()
        answer_text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
        
        return {"answer": answer_text}
        
    except Exception as e:
        print(f"Error calling AI: {e}")
        return {"answer": "Sorry, I couldn't process your question right now. Please try again!"}


# endpoint for major:
@app.post("/api/speech-to-text")
async def speech_to_text(request: AudioTranscriptionRequest):
    """Convert audio (speech) to text using Google Speech-to-Text.

    Request JSON: { "audio_base64": "<base64 audio>", "encoding": "LINEAR16", "sample_rate": 16000 }
    Response: { "transcript": "...", "confidence": 0.95 }
    """
    audio_base64 = request.audio_base64
    if not audio_base64:
        raise HTTPException(status_code=400, detail="Missing 'audio_base64' field")

    if not credentials:
        raise HTTPException(status_code=500, detail="Service account not configured")

    try:
        # Decode base64 audio
        import base64
        audio_bytes = base64.b64decode(audio_base64)
        
        token = get_access_token()
        
        # Import config class
        from chat_to_voice_attachment import SpeechToTextConfig
        config = SpeechToTextConfig(
            encoding=request.encoding,
            sample_rate_hertz=request.sample_rate
        )
        
        result = transcribe_audio(token, audio_bytes, config=config)

        return {
            "transcript": result.get("transcript"),
            "confidence": result.get("confidence"),
            "all_results": result.get("all_results", [])
        }
    except SpeechToTextError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        print(f"Error transcribing audio: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error while transcribing audio")
