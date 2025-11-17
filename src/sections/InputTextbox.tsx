// @ts-nocheck

import { type FormEvent, useEffect, useRef, useState } from 'react';
import './InputTextbox.css';

interface InputTextboxProps {
  question: string;
  onSubmit: (value: string) => void;
  enableSpeechToText?: boolean;
}

const DEFAULT_BACKEND_URL = 'http://localhost:8000';

export default function InputTextbox({ question, onSubmit, enableSpeechToText = false }: InputTextboxProps) {
  const [value, setValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const stopTimerRef = useRef<number | null>(null);
  const backendUrl = (import.meta.env?.VITE_BACKEND_URL as string | undefined) ?? DEFAULT_BACKEND_URL;

  useEffect(() => {
    return () => {
      if (stopTimerRef.current) {
        window.clearTimeout(stopTimerRef.current);
      }
      mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
      mediaRecorderRef.current = null;
    };
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!value.trim()) {
      return;
    }

    onSubmit(value);
    setValue('');
  };

  const blobToBase64 = (blob: Blob) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        if (typeof result === 'string') {
          const base64 = result.split(',')[1];
          resolve(base64);
          return;
        }
        reject(new Error('Unable to encode audio'));
      };
      reader.onerror = () => reject(reader.error ?? new Error('Failed to read audio blob'));
      reader.readAsDataURL(blob);
    });
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    setSpeechError('');
    try {
      const audio_base64 = await blobToBase64(audioBlob);
      const response = await fetch(`${backendUrl}/api/speech-to-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio_base64,
          encoding: 'WEBM_OPUS',
          sample_rate: 48000,
        }),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload.detail ?? 'Speech-to-text request failed');
      }

      const result = await response.json();
      if (result?.transcript) {
        setValue((prev) => {
          if (!prev.trim()) {
            return result.transcript;
          }
          return `${prev.trim()} ${result.transcript}`.trim();
        });
      }
    } catch (error) {
      console.error('Speech-to-text error', error);
      setSpeechError(error instanceof Error ? error.message : 'Unable to transcribe audio');
    } finally {
      setIsTranscribing(false);
    }
  };

  const stopRecording = () => {
    if (stopTimerRef.current) {
      window.clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
  };

  const handleSpeechClick = async () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setSpeechError('Microphone access is not supported in this browser.');
      return;
    }

    try {
      setSpeechError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        setIsRecording(false);
        stream.getTracks().forEach((track) => track.stop());
        if (audioChunksRef.current.length === 0) {
          setSpeechError('No audio captured. Please try again.');
          return;
        }
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType });
        await transcribeAudio(audioBlob);
      };

      recorder.start();
      setIsRecording(true);
      stopTimerRef.current = window.setTimeout(() => {
        stopRecording();
      }, 6000);
    } catch (error) {
      console.error('Microphone error', error);
      setSpeechError(error instanceof Error ? error.message : 'Unable to access microphone');
      setIsRecording(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-section">
      <h2 className="section-title">{question}</h2>
      <p className="section-subtitle">Describe your degree goals and where you want to stay.</p>
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="I like UH because..."
        className="input-textbox-input"
        rows={3}
      />
      <div className="input-textbox-actions">
        {enableSpeechToText && (
          <button
            type="button"
            className={`speech-button ${isRecording ? 'speech-button--recording' : ''}`}
            onClick={handleSpeechClick}
            disabled={isTranscribing}
            aria-label={
              isRecording
                ? 'Stop recording'
                : isTranscribing
                  ? 'Transcribing your answer'
                  : 'Speak your answer'
            }
            aria-pressed={isRecording}
          >
            <svg
              className="speech-button__icon"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              role="presentation"
              aria-hidden="true"
            >
              <path
                d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Zm5 9a1 1 0 1 1 2 0 7 7 0 0 1-6 6.93V21h2a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2h2v-2.07A7 7 0 0 1 5 12a1 1 0 1 1 2 0 5 5 0 0 0 10 0Z"
                fill="currentColor"
              />
            </svg>
            <span className="sr-only">
              {isRecording ? 'Stop recording' : isTranscribing ? 'Transcribing your answer' : 'Speak your answer'}
            </span>
          </button>
        )}
        <button type="submit" disabled={!value.trim()} className="submit-button">
          Submit
        </button>
      </div>
      {enableSpeechToText && (
        <p className="speech-status" role="status">
          {speechError
            ? speechError
            : isRecording
              ? 'Listening… tap stop when you are done.'
              : isTranscribing
                ? 'Translating your speech…'
                : 'Use the mic to dictate your response.'}
        </p>
      )}
    </form>
  );
}
