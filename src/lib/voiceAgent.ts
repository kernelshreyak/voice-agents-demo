import { RealtimeAgent, RealtimeSession,tool } from '@openai/agents-realtime';
import getWeather from './tools/getWeather';
import webSearch from './tools/webSearch';
// Create a new agent instance
export function createAgent(language="english") {
  return new RealtimeAgent({
    name: 'John the Agent',
    instructions: `You are a helpful assistant. Always use language as ${language}`,
    tools: [getWeather, webSearch],
  });
}

// Create a new session for the agent
export function createSession(agent: RealtimeAgent) {
  return new RealtimeSession(agent, {
    model: 'gpt-4o-realtime-preview-2025-06-03',
  });
}

// Fetch client secret from Next.js API
export async function fetchClientSecret(model = 'gpt-4o-realtime-preview-2025-06-03') {
  const res = await fetch('/api/create-realtime-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model }),
  });
  const data = await res.json();
  if (!res.ok || !data.clientSecret) {
    throw new Error(data.error || 'Failed to get client secret');
  }
  return data.clientSecret;
}

// Cleanup agent if possible
export async function cleanupAgent(agent: RealtimeAgent | null) {
  if (!agent) return;
  if (typeof (agent as any).end === 'function') {
    await (agent as any).end();
  } else if (typeof (agent as any).close === 'function') {
    await (agent as any).close();
  }
}

// Cleanup session if possible
export async function cleanupSession(session: RealtimeSession | null) {
  if (!session) return;
  if (typeof (session as any).end === 'function') {
    await (session as any).end();
  } else if (typeof (session as any).close === 'function') {
    await (session as any).close();
  }
}