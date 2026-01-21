# API Routes

This directory contains API routes for the Next.js application.

## SDU AI Proxy

The `sdu-proxy.ts` file implements a secure proxy for SDU AI API calls that:
- Protects your SDU AI API key from being exposed to the frontend
- Provides a consistent interface with other OpenAI-compatible AI providers
- Handles both streaming and non-streaming responses
- Configurable through environment variables

### Setup Instructions

1. Add your SDU AI configuration to your `.env.local` file:
   ```
   SDU_API_KEY=your_actual_sdu_api_key_here
   SDU_API_URL=https://api.sdu.ai/v1
   SDU_MODEL=gpt-4
   ```

2. The proxy will automatically handle all SDU AI requests through `/api/sdu-proxy`

### Implementation Details

The proxy works by:
- Accepting requests from the frontend with messages and stream parameters
- Using environment variables for API key, base URL, and model name
- Forwarding requests to SDU AI's `/v1/chat/completions` endpoint
- Protecting your API key and configuration by keeping them server-side only
- Transparently forwarding responses (both streaming and non-streaming) back to the client

This approach mirrors the pattern used by `callOpenAICompatible` function for consistency.

### Security Notes

- The API key and configuration are stored in environment variables and never exposed to clients
- All requests are forwarded securely to SDU AI's API endpoint
- The proxy maintains compatibility with the existing AI provider interface
- Model names and API endpoints are hidden from frontend code