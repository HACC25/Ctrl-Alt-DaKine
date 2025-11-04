import os
import json
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

# --- 4. API ENDPOINTS ---

@app.get("/")
def read_root():
    """A simple 'hello world' endpoint to check if the server is running."""
    return {"message": "AI Backend is running!"}


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

    if not model:
        return {"error": "Gemini API not configured. Check API key."}

    # 3. Call the AI
    try:
        response = model.generate_content(prompt)
        
        # 4. Clean and parse the AI's response
        # The AI might add "```json" or other text we need to strip out.
        ai_response_text = response.text.strip().replace("```json", "").replace("```", "")
        
        # Turn the AI's text string into a real Python dictionary
        json_data = json.loads(ai_response_text)
        
        # Send the clean JSON data back to the React frontend
        return json_data

    except Exception as e:
        print(f"Error processing AI response: {e}")
        print(f"Raw AI response was: {response.text}")
        return {"error": "Failed to generate or parse AI response."}


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
    
    if not model:
        return {"error": "Gemini API not configured. Check API key."}
        
    try:
        response = model.generate_content(prompt)
        return {"answer": response.text}
    except Exception as e:
        return {"error": f"Error calling AI: {str(e)}"}