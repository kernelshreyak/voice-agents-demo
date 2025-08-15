import { tool } from '@openai/agents-realtime';
import { z } from 'zod';

const webSearch = tool({
  name: 'web_search',
  description: 'Perform a web search using Tavily and return the top result.',
  parameters: z.object({ query: z.string() }),
  async execute({ query }) {
    console.log(`Performing web search for: ${query}`);
    try {
      const res = await fetch(
        typeof window === "undefined"
          ? `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/websearch`
          : "/api/websearch",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        return data.error || "Failed to fetch web search result.";
      }
      return data.result || "No result found.";
    } catch (err) {
      return `Error performing web search: ${err}`;
    }
  },
});

export default webSearch;