# AI Assistant App — MVP

A mobile AI assistant app: double-tap the home screen logo to open a
streaming chat with Claude or GPT-4o. Built as a modular monolith so it's
straightforward to scale into a larger product later.

## Structure

```
ai-assistant-app/
├── backend/     NestJS API (auth, chat, AI provider abstraction, Prisma)
└── mobile/      Expo React Native app (TypeScript)
```

## What's implemented

- Home screen with a breathing logo animation; double-tap (within 300ms)
  triggers haptic feedback + a ripple, then navigates to the assistant.
- Assistant screen: chat bubbles, typing indicator, streaming "AI is
  typing" effect, error state with retry, mic button stubbed for voice.
- Backend: JWT auth (register/login), session + message persistence via
  Prisma/PostgreSQL, and an `AIProvider` interface with both an Anthropic
  and an OpenAI implementation — swap via one env var, no call-site changes.
- Streaming: backend exposes Server-Sent Events; the mobile client
  consumes them with `fetch` + `ReadableStream`, exactly per the MVP plan.
- Rate limiting via NestJS Throttler.

## Running the backend

```bash
cd backend
npm install
cp .env.example .env        # fill in DATABASE_URL and an API key
npx prisma migrate dev --name init
npm run start:dev
```

The API listens on `http://localhost:3000/api`. You'll need a Postgres
database (a free one on Neon or Supabase works well for local dev) and
either an `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` — set `AI_PROVIDER`
to match.

## Running the mobile app

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with Expo Go, or press `i` / `a` for a simulator. If
you're on a physical device, update `API_BASE_URL` in
`src/services/api.ts` to your machine's LAN IP (not `localhost`).

There's no register/login screen wired into the UI yet — for a quick
end-to-end test, call `POST /api/auth/register` from curl/Postman, then
hardcode the returned token via `setAuthToken()` in `App.tsx` while you
build out a real auth screen.

## Suggested next steps toward a fuller product

1. Add a login/signup screen and store the JWT securely (`expo-secure-store`).
2. Wire up `expo-av` / `react-native-voice` for real voice input.
3. Add a session list / history drawer using the already-built
   `GET /chat/sessions` endpoint.
4. Add Redis-backed rate limiting and caching for repeat prompts.
5. Push notifications module (already scaffolded as a placeholder in
   the product spec) for proactive assistant nudges.
6. CI: lint + typecheck on push, EAS Build for app store binaries.

## Notes on this environment

This was generated in a sandboxed container without network access, so
none of the code has been `npm install`ed or run here — there's no
Postgres, mobile simulator, or package registry available in this
session. Everything above is written to compile and run correctly
against the stated dependency versions, but please run `npm install`
and smoke-test both halves locally before treating this as final.
