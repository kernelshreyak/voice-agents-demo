'use client';

import React from 'react';
import { MdMic } from 'react-icons/md';

export default function VoiceAgentChainedDemo() {
  const [loading, setLoading] = React.useState(false);
  const [processing, setProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [recording, setRecording] = React.useState(false);
  const [timer, setTimer] = React.useState(0);
  const [transcript, setTranscript] = React.useState<string>('');
  const [gptResponse, setGptResponse] = React.useState<string>('');
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const mediaStreamRef = React.useRef<MediaStream | null>(null);

  // Helper: Play audio buffer
  const playAudioBuffer = (audioBuffer: ArrayBuffer) => {
    console.log('[ChainedDemo] Playing audio buffer...');
    const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.play().then(() => {
        console.log('[ChainedDemo] Audio playback started.');
      }).catch((err) => {
        console.log('[ChainedDemo] Audio playback error:', err);
      });
    }
  };

  // Helper: Record audio for a fixed duration and return a Blob
  const recordAudioChunk = async (stream: MediaStream, durationMs = 3000): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        resolve(blob);
      };
      mediaRecorder.onerror = (e) => {
        reject(e.error);
      };
      mediaRecorder.start();
      setTimeout(() => {
        mediaRecorder.stop();
      }, durationMs);
    });
  };

  // Start audio capture, send to backend, play response
  const handleSpeak = async () => {
    setLoading(true);
    setError(null);
    setTranscript('');
    setGptResponse('');
    setRecording(true);
    setTimer(3);
    let timerInterval: NodeJS.Timeout | null = null;
    try {
      console.log('[ChainedDemo] Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      console.log('[ChainedDemo] Microphone access granted.');

      // Timer countdown
      timerInterval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            if (timerInterval) clearInterval(timerInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Record a 3-second audio chunk, send to backend, play response
      console.log('[ChainedDemo] Recording audio chunk...');
      const audioBlob = await recordAudioChunk(stream, 3000);
      setTimer(0);
      setRecording(false);
      if (timerInterval) clearInterval(timerInterval);
      console.log('[ChainedDemo] Audio chunk recorded, sending to backend...');
      setProcessing(true);

      // Stop the stream after recording
      stream.getTracks().forEach((track: any) => track.stop());
      mediaStreamRef.current = null;

      const res = await fetch('/api/voice-agent-chained', {
        method: 'POST',
        headers: {
          'Content-Type': audioBlob.type,
        },
        body: audioBlob,
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Backend error');
        console.log('[ChainedDemo] Backend error:', err.error || res.statusText);
        return;
      }

      // New: Get transcript and GPT-4.1 response
      const { transcript, gptResponseText } = await res.json();
      setTranscript(transcript);
      setGptResponse(gptResponseText);

      // Now request TTS for the GPT-4.1 response
      if (gptResponseText) {
        const ttsRes = await fetch('/api/voice-agent-tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: gptResponseText }),
        });
        if (!ttsRes.ok) {
          const err = await ttsRes.json();
          setError(err.error || 'TTS backend error');
          console.log('[ChainedDemo] TTS backend error:', err.error || ttsRes.statusText);
          return;
        }
        const audioBuffer = await ttsRes.arrayBuffer();
        playAudioBuffer(audioBuffer);
        setProcessing(false);
      }

    } catch (err: any) {
      setError(err.message || 'Failed to process speech');
      setRecording(false);
      setProcessing(false);
      setTimer(0);
      if (timerInterval) clearInterval(timerInterval);
      console.log('[ChainedDemo] Error in speak flow:', err);
    } finally {
      setLoading(false);
    }
  };

  // No stopVoiceAgent needed; session is per utterance now

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <h1 className="text-5xl font-extrabold text-center mb-8 tracking-tight">
        Voice Agent Chained Demo
      </h1>
      <button
        onClick={handleSpeak}
        className={`flex items-center gap-3 px-6 py-3 text-white text-lg font-semibold rounded-full shadow transition-colors focus:outline-none focus:ring-2 disabled:opacity-60
          ${recording || loading || processing
            ? 'bg-gray-400'
            : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-400'
          }`}
        aria-label="Speak"
        disabled={recording || loading || processing}
      >
        <MdMic className="h-6 w-6" />
        {recording ? `Recording... (${timer})` : 'Speak'}
      </button>
      {recording && (
        <div className="mt-2 text-blue-700 text-md font-semibold">
          Recording for {timer} second{timer !== 1 ? 's' : ''}...
        </div>
      )}
      {processing && (
        <div className="mt-2 text-purple-700 text-md font-semibold flex items-center gap-2">
          <svg className="animate-spin h-5 w-5 text-purple-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
          </svg>
          Processing audio...
        </div>
      )}
      <audio ref={audioRef} autoPlay hidden />
      {transcript && (
        <div className="mt-4 text-gray-700 text-lg max-w-xl text-center">
          <b>Your message:</b> {transcript}
        </div>
      )}
      {gptResponse && (
        <div className="mt-2 text-green-700 text-lg max-w-xl text-center">
          <b>Assistant (GPT-4.1):</b> {gptResponse}
        </div>
      )}
      {error && (
        <div className="text-red-600 mt-4 text-sm">{error}</div>
      )}
    </div>
  );
}