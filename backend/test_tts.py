import sys
sys.path.insert(0, r"C:/Users/kitty/OneDrive/Pictures/Screenshots/New folder/New folder (2)/Ctrl-Alt-DaKine/backend")

from chat_to_voice_attachment import transcribe_audio, SpeechToTextConfig
from google.oauth2 import service_account
from google.auth.transport.requests import Request as GoogleRequest
import base64

# Load credentials
sa_path = r"C:/Users/kitty/OneDrive/Pictures/Screenshots/New folder/New folder (2)/Ctrl-Alt-DaKine/backend/sigma-night-477219-g4-3a0269dd7cd8.json"
credentials = service_account.Credentials.from_service_account_file(
    sa_path,
    scopes=['https://www.googleapis.com/auth/cloud-platform']
)

# Refresh token
credentials.refresh(GoogleRequest())
token = credentials.token

print("Got token, calling Speech-to-Text API...")

# Create a simple test audio (this is just for demonstration - in real use, you'd have actual audio)
# For now, let's test with a simple audio file if you have one, or we'll create a minimal test
test_audio_base64 = "UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="  # Empty WAV file for testing

try:
    audio_bytes = base64.b64decode(test_audio_base64)
    result = transcribe_audio(token, audio_bytes)
    print(f"Success! Transcript: {result.get('transcript')}")
    print(f"Confidence: {result.get('confidence')}")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
    print("\nNote: To properly test, you need actual audio data. The test above uses a minimal WAV file.")
