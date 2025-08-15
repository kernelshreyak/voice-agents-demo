import { RealtimeAgent, RealtimeSession,tool } from '@openai/agents-realtime';
import { z } from 'zod';

const getWeather = tool({
  name: 'get_weather',
  description: 'Return the weather for a city.',
  parameters: z.object({ city: z.string() }),
  async execute({ city }) {
    console.log(`Fetching weather for ${city}`);
    try {
      const res = await fetch(
        typeof window === "undefined"
          ? `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/weather`
          : "/api/weather",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ city }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        return data.error || `Failed to fetch weather for ${city}.`;
      }
      return data.message || `The weather in ${city} is ${data.description} with a temperature of ${data.temp}°C.`;
    } catch (err) {
      return `Error fetching weather for ${city}: ${err}`;
    }
  },
});

// Create a new agent instance
export function createAgent(language="english") {
  return new RealtimeAgent({
    name: 'John the Agent',
    instructions: `You are a helpful assistant. Always use language as ${language}`,
    tools: [getWeather],
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