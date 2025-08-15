## Voice Agents Demo with OpenAI Voice agents SDK

Based on https://openai.github.io/openai-agents-js/guides/voice-agents/quickstart/ and https://openai.github.io/openai-agents-js/guides/voice-agents/build/#tools but enhanced with following features:
- Full production-ready Next.js app written in TypeScript
- Automatic ephermal token generation for security using Next.js server route with the voice agent running client-side on the browser
- Realtime logs showing agent activity
- Tools usage for weather and web search
- The agent can answer questions from documents (pre-loaded) with two-way realtime voice (TODO)
- The agent can connect to DB to retrieve information as per query with two-way realtime voice (TODO)