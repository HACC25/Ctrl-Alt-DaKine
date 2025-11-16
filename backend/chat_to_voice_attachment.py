import base64
import logging
from dataclasses import dataclass
from typing import Optional

import requests


# Re-use the same Vertex / Google REST style as the Gemini call in `main.py`.
# This module converts audio (speech) to text using Google Speech-to-Text API.

LOGGER = logging.getLogger(__name__)


@dataclass(frozen=True)
class SpeechToTextConfig:
    """Configuration for the Speech-to-Text request."""

    language_code: str = "en-US"
    encoding: str = "LINEAR16"  # FLAC, LINEAR16, MULAW, etc.
    sample_rate_hertz: int = 16000
    enable_automatic_punctuation: bool = True


class SpeechToTextError(Exception):
    pass


def transcribe_audio(token: str, audio_content: bytes, *, config: Optional[SpeechToTextConfig] = None) -> dict:
    """Call Google Speech-to-Text API and return the transcription.

    Args:
        token: A fresh OAuth2 token (e.g. from `get_access_token()` in `main.py`).
        audio_content: The raw audio bytes to transcribe.
        config: Optional override for speech recognition settings.

    Returns:
        A dict containing the transcript and confidence scores.
    """

    cfg = config or SpeechToTextConfig()

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    # Convert audio bytes to base64 for the API
    audio_base64 = base64.b64encode(audio_content).decode('utf-8')

    url = "https://speech.googleapis.com/v1/speech:recognize"
    payload = {
        "config": {
            "encoding": cfg.encoding,
            "sampleRateHertz": cfg.sample_rate_hertz,
            "languageCode": cfg.language_code,
            "enableAutomaticPunctuation": cfg.enable_automatic_punctuation,
        },
        "audio": {
            "content": audio_base64
        }
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
    except Exception as exc:
        LOGGER.exception("Failed to transcribe audio")
        raise SpeechToTextError("Unable to transcribe speech") from exc

    data = response.json()

    results = data.get("results", [])
    if not results:
        LOGGER.warning("Speech-to-Text returned no results")
        return {
            "transcript": "",
            "confidence": 0.0,
            "all_results": []
        }

    # Get the top result
    top_result = results[0]
    top_alternative = top_result.get("alternatives", [{}])[0]
    
    transcript = top_alternative.get("transcript", "")
    confidence = top_alternative.get("confidence", 0.0)

    # Collect all alternatives for reference
    all_results = []
    for result in results:
        for alt in result.get("alternatives", []):
            all_results.append({
                "transcript": alt.get("transcript", ""),
                "confidence": alt.get("confidence", 0.0)
            })

    return {
        "transcript": transcript,
        "confidence": confidence,
        "all_results": all_results
    }
