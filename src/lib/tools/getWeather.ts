import { tool } from '@openai/agents-realtime';
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

export default getWeather;