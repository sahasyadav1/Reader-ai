# AI Assistant App — Build & Deploy Guide

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

## Running the mobile app locally

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

## Building APK for Android

### Option 1: Using EAS Build (Recommended)

EAS Build is the easiest way to generate signed APKs without local Android setup.

#### Prerequisites
- Install EAS CLI: `npm install -g eas-cli`
- Create free account at [expo.dev](https://expo.dev)
- Login: `eas login`

#### Build Commands

```bash
cd mobile

# Build APK for testing/internal distribution
eas build --platform android --build-type apk

# Build AAB (App Bundle) for Google Play Store
eas build --platform android --build-type app-bundle

# Using the configured profile from eas.json
eas build --platform android --profile android-apk
```

The APK will be built in the cloud and you'll get a download link.

### Option 2: Local Build (Advanced)

Requires Android SDK, Java, and full local setup.

```bash
cd mobile
npm install
npm run build:android  # if configured in package.json
```

### Option 3: GitHub Actions Automation

Create `.github/workflows/build-apk.yml`:

```yaml
name: Build APK

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: |
          cd mobile
          npm install
          npm install -g eas-cli
      - run: |
          cd mobile
          eas build --platform android --build-type apk --non-interactive
        env:
          EAS_TOKEN: ${{ secrets.EAS_TOKEN }}
```

Then add `EAS_TOKEN` to GitHub Secrets from https://expo.dev/settings/tokens

## Suggested next steps toward a fuller product

1. Add a login/signup screen and store the JWT securely (`expo-secure-store`).
2. Wire up `expo-av` / `react-native-voice` for real voice input.
3. Add a session list / history drawer using the already-built
   `GET /chat/sessions` endpoint.
4. Add Redis-backed rate limiting and caching for repeat prompts.
5. Push notifications module (already scaffolded as a placeholder in
   the product spec) for proactive assistant nudges.
6. CI: lint + typecheck on push, EAS Build for app store binaries.

## Configuration Files

- `eas.json` - EAS Build configuration with APK build profile
- `mobile/app.json` - Expo app configuration
- `mobile/package.json` - Dependencies and scripts

## Troubleshooting

**Build fails with "EAS_TOKEN not found":**
- Generate token at https://expo.dev/settings/tokens
- Add to environment or GitHub secrets

**APK size too large:**
- Enable minification in build profile
- Remove unused dependencies

**Signing issues:**
- EAS handles signing automatically for first builds
- For subsequent builds, signing credentials are cached

## Resources

- [Expo Build Docs](https://docs.expo.dev/build/introduction/)
- [EAS Build Configuration](https://docs.expo.dev/build-reference/eas-json/)
- [Android App Distribution](https://docs.expo.dev/build/internal-distribution/)
