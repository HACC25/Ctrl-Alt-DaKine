import os
import base64
import requests
import json
from PIL import Image
import io

def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def image_generation_function(
    person_image_path: str,
    campus_background_path: str,
    output_image_path: str,
    access_token: str,
    project_id: str = "sigma-night-477219-g4",
    location: str = "us-central1"
) -> None:
    """
    Uses Vertex AI (Gemini) to generate a realistic image of the person at the campus.
    Takes the person's photo and the campus background as inputs.
    """
    
    print(f"Starting image generation. Project: {project_id}, Location: {location}")
    
    # Encode images to base64
    try:
        person_b64 = encode_image(person_image_path)
        campus_b64 = encode_image(campus_background_path)
    except Exception as e:
        raise Exception(f"Failed to read input images: {e}")

    # Vertex AI Endpoint
    # Using gemini-3-pro-image-preview as requested
    model_id = "gemini-2.5-flash-image"
    
    # Handle global vs regional endpoints correctly
    if location == "global":
        api_endpoint = "aiplatform.googleapis.com"
    else:
        api_endpoint = f"{location}-aiplatform.googleapis.com"
        
    url = f"https://{api_endpoint}/v1/projects/{project_id}/locations/{location}/publishers/google/models/{model_id}:generateContent"

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }

    # Simplified prompt for speed and clarity
    prompt = (
        "Generate a high-quality, photorealistic image. "
        "Task: Composite the person from the first image into the environment of the second image. "
        "The person should be standing naturally in the campus scene shown in the second image. "
        "Match the lighting, shadows, and color tone of the person to the background. "
        "Output ONLY the generated image."
    )

    payload = {
        "contents": [{
            "role": "user",
            "parts": [
                {"text": prompt},
                {
                    "inline_data": {
                        "mime_type": "image/jpeg",
                        "data": person_b64
                    }
                },
                {
                    "inline_data": {
                        "mime_type": "image/jpeg",
                        "data": campus_b64
                    }
                }
            ]
        }],
        "generation_config": {
            "temperature": 0.4,
            # Reduced token count for speed - we only need an image
            "maxOutputTokens": 1024, 
            "top_p": 0.95,
            "top_k": 32,
        }
    }

    print(f"Sending request to {url}")
    response = requests.post(url, headers=headers, json=payload)
    
    if not response.ok:
        print(f"API Error: {response.status_code} - {response.text}")
        raise Exception(f"Vertex AI API Error {response.status_code}: {response.text}")

    try:
        result = response.json()
        
        # Check for safety blocking or refusal
        candidates = result.get("candidates", [])
        if not candidates:
            # Check prompt feedback
            feedback = result.get("promptFeedback", {})
            if feedback:
                raise Exception(f"Prompt blocked: {json.dumps(feedback)}")
            raise Exception(f"No candidates returned. Full response: {json.dumps(result)}")
            
        candidate = candidates[0]
        finish_reason = candidate.get("finishReason")
        
        if finish_reason != "STOP":
            print(f"Warning: Finish reason is {finish_reason}")
            safety_ratings = candidate.get("safetyRatings", [])
            print(f"Safety Ratings: {json.dumps(safety_ratings)}")
            
            if finish_reason in ["SAFETY", "BLOCKLIST", "PROHIBITED_CONTENT"]:
                raise Exception(f"Generation blocked due to safety: {finish_reason}. Ratings: {json.dumps(safety_ratings)}")

        parts = candidate.get("content", {}).get("parts", [])
        image_data = None
        text_output = []
        
        for part in parts:
            # Check for inline_data (snake_case) or inlineData (camelCase)
            if "inline_data" in part:
                image_data = part["inline_data"]["data"]
            elif "inlineData" in part:
                image_data = part["inlineData"]["data"]
            
            if "text" in part:
                text_output.append(part["text"])
        
        if image_data:
            img_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(img_bytes))
            image.save(output_image_path)
            print(f"Success! Image saved to {output_image_path}")
        else:
            error_msg = "No image data found in response."
            if text_output:
                error_msg += f" Model returned text instead: {' '.join(text_output)}"
            print(error_msg)
            print(f"Full Response: {json.dumps(result)}")
            raise Exception(error_msg)
            
    except Exception as e:
        print(f"Error processing response: {e}")
        raise
