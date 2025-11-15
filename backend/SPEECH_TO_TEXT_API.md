# Speech-to-Text API Integration

## Endpoint: `/api/speech-to-text`

### What it does
Converts audio (speech) to text using Google Cloud Speech-to-Text API.

### Authentication
Uses the existing service account (`vertex-express@sigma-night-477219-g4.iam.gserviceaccount.com`) with Speech-to-Text API access.

### Request Format

**POST** `http://localhost:8000/api/speech-to-text`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "audio_base64": "<base64-encoded audio data>",
  "encoding": "LINEAR16",
  "sample_rate": 16000
}
```

**Parameters:**
- `audio_base64` (required): Base64-encoded audio data
- `encoding` (optional): Audio encoding format. Default: "LINEAR16"
  - Supported: LINEAR16, FLAC, MULAW, AMR, AMR_WB, OGG_OPUS, SPEEX_WITH_HEADER_BYTE, WEBM_OPUS
- `sample_rate` (optional): Sample rate in Hz. Default: 16000

### Response Format

**Success (200):**
```json
{
  "transcript": "Hello, this is a test.",
  "confidence": 0.98,
  "all_results": [
    {
      "transcript": "Hello, this is a test.",
      "confidence": 0.98
    }
  ]
}
```

**Error (4xx/5xx):**
```json
{
  "detail": "Error message"
}
```

### Frontend Example (JavaScript)

#### Using MediaRecorder to capture audio:

```javascript
async function recordAndTranscribe() {
  // Get microphone permission
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  
  // Create recorder
  const mediaRecorder = new MediaRecorder(stream);
  const audioChunks = [];

  mediaRecorder.ondataavailable = (event) => {
    audioChunks.push(event.data);
  };

  // Start recording
  mediaRecorder.start();
  
  // Record for 3 seconds
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Stop recording
  mediaRecorder.stop();
  
  await new Promise(resolve => {
    mediaRecorder.onstop = resolve;
  });

  // Convert to base64
  const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
  const reader = new FileReader();
  
  const base64Audio = await new Promise((resolve) => {
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.readAsDataURL(audioBlob);
  });

  // Send to backend
  const response = await fetch('http://localhost:8000/api/speech-to-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audio_base64: base64Audio,
      encoding: 'WEBM_OPUS',  // MediaRecorder typically outputs WebM
      sample_rate: 48000      // Common WebM sample rate
    })
  });

  const result = await response.json();
  console.log('Transcript:', result.transcript);
  console.log('Confidence:', result.confidence);
  
  return result.transcript;
}
```

#### Using an audio file:

```javascript
async function transcribeFile(audioFile) {
  // Convert file to base64
  const reader = new FileReader();
  
  const base64Audio = await new Promise((resolve) => {
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.readAsDataURL(audioFile);
  });

  // Send to backend
  const response = await fetch('http://localhost:8000/api/speech-to-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audio_base64: base64Audio,
      encoding: 'LINEAR16',  // Adjust based on your file format
      sample_rate: 16000
    })
  });

  const result = await response.json();
  return result.transcript;
}
```

### Testing with curl (PowerShell)

```powershell
# First, encode an audio file to base64
$audioPath = "path/to/your/audio.wav"
$audioBytes = [System.IO.File]::ReadAllBytes($audioPath)
$audioBase64 = [System.Convert]::ToBase64String($audioBytes)

# Send request
$body = @{
    audio_base64 = $audioBase64
    encoding = "LINEAR16"
    sample_rate = 16000
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/speech-to-text" -Method Post -ContentType "application/json" -Body $body
```

### Audio Format Tips

1. **Browser MediaRecorder**: Usually outputs WebM with Opus codec
   - Use `encoding: "WEBM_OPUS"`
   - Sample rate: typically 48000 Hz

2. **WAV files**: Common uncompressed format
   - Use `encoding: "LINEAR16"`
   - Sample rate: 16000, 44100, or 48000 Hz

3. **FLAC files**: Lossless compression
   - Use `encoding: "FLAC"`
   - Sample rate: matches the file

4. **For best accuracy**:
   - Use 16 kHz sample rate for speech
   - Mono audio is usually sufficient
   - Minimize background noise

### Error Codes

- `400`: Invalid audio data or encoding
- `403`: Service account doesn't have Speech-to-Text access (should be fixed now)
- `500`: Internal server error
- `502`: Speech-to-Text API error

### Notes

- The API supports up to ~1 minute of audio for synchronous recognition
- For longer audio, use the streaming or async recognition endpoints (not implemented yet)
- Empty audio or silence will return an empty transcript with 0 confidence
