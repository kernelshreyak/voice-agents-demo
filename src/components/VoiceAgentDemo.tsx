'use client';

import React from 'react';
import { RealtimeAgent, RealtimeSession } from '@openai/agents-realtime';
import { MdCall, MdCallEnd } from 'react-icons/md';
import {
  createAgent,
  createSession,
  fetchClientSecret,
  cleanupAgent,
  cleanupSession,
} from '../lib/voiceAgent';

export default function VoiceAgentDemo() {
  const agent = React.useRef<RealtimeAgent | null>(null);
  const session = React.useRef<RealtimeSession | null>(null);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [sessionActive, setSessionActive] = React.useState(false);

  const startVoiceAgent = async () => {
    setLoading(true);
    setError(null);
    try {
      agent.current = createAgent();
      session.current = createSession(agent.current);
      const clientSecret = await fetchClientSecret();
      await session.current.connect({
        apiKey: clientSecret,
      });
      setSessionActive(true);
    } catch (err: any) {
      setError(err.message || 'Failed to start voice agent');
    } finally {
      setLoading(false);
    }
  };

  const stopVoiceAgent = async () => {
    setLoading(true);
    setError(null);
    try {
      await cleanupSession(session.current);
      await cleanupAgent(agent.current);
      session.current = null;
      agent.current = null;
      setSessionActive(false);
    } catch (err: any) {
      setError(err.message || 'Failed to stop voice agent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <h1 className="text-5xl font-extrabold text-center mb-8 tracking-tight">
        Voice Agent Demo
      </h1>
      <button
        onClick={sessionActive ? stopVoiceAgent : startVoiceAgent}
        className={`flex items-center gap-3 px-6 py-3 text-white text-lg font-semibold rounded-full shadow transition-colors focus:outline-none focus:ring-2 disabled:opacity-60
          ${sessionActive
            ? 'bg-green-600 hover:bg-green-700 focus:ring-green-400'
            : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-400'
          }`}
        aria-label={sessionActive ? "Stop Voice Agent" : "Start Voice Agent"}
        disabled={loading}
      >
        {sessionActive
          ? <MdCallEnd className="h-6 w-6" />
          : <MdCall className="h-6 w-6" />
        }
        {loading
          ? (sessionActive ? 'Stopping...' : 'Starting...')
          : (sessionActive ? 'Stop Voice Agent' : 'Start Voice Agent')
        }
      </button>
      {error && (
        <div className="text-red-600 mt-4 text-sm">{error}</div>
      )}
    </div>
  );
}