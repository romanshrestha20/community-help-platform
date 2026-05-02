# community-help-platform

A full-stack community platform that connects people who need help with volunteers and skilled helpers nearby — featuring a **React Native / Expo mobile app** and a **Node.js / Express REST + WebSocket backend**.

---

## Table of Contents

- [Key Features](#key-features)
- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started (Local Development)](#getting-started-local-development)
- [Configuration](#configuration)
- [Running the Project](#running-the-project)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Linting / Formatting](#linting--formatting)
- [Deployment](#deployment)
- [Security](#security)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Key Features

- **Help Requests** — Users post requests for help (errands, repairs, companionship, etc.) with optional images, categories, location, budget, and urgency flags.
- **Bidding System** — Helpers can bid on open requests; requesters can accept or reject bids.
- **Real-time Messaging** — Conversation threads per request powered by Socket.IO.
- **Push Notifications** — Expo push notifications for new bids, messages, and request updates.
- **Multi-factor Verification** — Email verification (Nodemailer) and phone verification (Twilio SMS or Twilio Verify).
- **Google OAuth** — One-tap sign-in with Google on both iOS and Android.
- **Favourites & Reviews** — Save requests and leave rated reviews after a job is complete.
- **Skills & Certifications** — Helpers can list skills and upload proof-of-certification documents.
- **Nearby Requests Map** — Location-based discovery with Google Maps and configurable search radius.
- **Admin Panel** — Internal endpoints for certification review and platform moderation.

---

## Architecture Overview

```mermaid
graph TD
    MobileApp["Mobile App (Expo / React Native)"]
    API["REST API (Express 5)"]
    WS["WebSocket Server (Socket.IO)"]
    DB[("PostgreSQL (Prisma ORM)")]
    Cache[("Redis (rate limiting / sessions)")]
    Media["Cloudinary (image storage)"]
    Email["Email provider (Nodemailer / log)"]
    SMS["SMS provider (Twilio / log)"]
    Push["Expo Push Notifications"]

    MobileApp -->|HTTP/JSON| API
    MobileApp -->|ws://| WS
    API --> DB
    API --> Cache
    API --> Media
    API --> Email
    API --> SMS
    API --> Push
    WS --> DB
```

- The **mobile app** communicates with the backend over REST for data and over WebSocket for real-time events (new messages, notifications).
- **Prisma** manages all PostgreSQL migrations and typed queries.
- **Redis** powers per-user / per-IP rate limiting and session invalidation checks. Redis is optional in development (degraded mode).
- **Cloudinary** stores user avatars, request images, message attachments, and certification documents.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| Mobile app | React Native `0.81`, Expo `~54`, Expo Router `~6` |
| UI components | Tamagui `~2.0-rc`, `@expo/vector-icons`, Lucide |
| State management | Zustand `^5` |
| HTTP client | Axios `^1` |
| Backend language | TypeScript `^5.9` / Node.js `≥ 20` |
| Backend framework | Express `^5` |
| ORM | Prisma `^7` |
| Database | PostgreSQL `14+` |
| Real-time | Socket.IO `^4` |
| Cache / rate-limit | Redis `^5` (node `redis` client) |
| Auth | JWT (`jsonwebtoken`) + bcrypt, Google OAuth 2.0 |
| Media storage | Cloudinary `^2` |
| Email | Nodemailer `^8` (or `log` mode in dev) |
| SMS / Phone OTP | Twilio Programmable SMS or Twilio Verify |
| Push notifications | Expo Push Notifications (`expo-notifications`) |
| Validation | Zod `^4` |
| Testing | Vitest `^4` |
| Build | TypeScript compiler (`tsc`) |

---

## Prerequisites

| Tool | Minimum version | Notes |
| :--- | :--- | :--- |
| Node.js | 20 LTS | Required by both backend and mobile toolchain |
| npm | 10 | Included with Node.js 20 |
| PostgreSQL | 14 | Local instance or cloud (e.g., Supabase, Neon, Render) |
| Redis | 7 | Optional in development; required in production |
| Expo CLI | Latest (`npm i -g expo-cli`) | For running the mobile app |
| EAS CLI | Latest (`npm i -g eas-cli`) | For building/deploying mobile app |
| Android Studio / Xcode | Latest stable | For running on device/simulator |

---

## Getting Started (Local Development)

### 1. Clone the repository

```bash
git clone https://github.com/romanshrestha20/community-help-platform.git
cd community-help-platform
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Copy and fill in environment variables:

```bash
cp .env.example .env
# Edit .env with your database URL, JWT secrets, etc.
```

Run database migrations and seed data:

```bash
npx prisma migrate dev     # applies all migrations, generates the Prisma client
npx prisma db seed         # seeds categories, skills, etc.
```

Start the development server:

```bash
npm run dev
```

The API will be available at `http://localhost:5001`.

### 3. Set up the mobile app

Open a new terminal:

```bash
cd mobile-app
npm install
```

Copy and fill in environment variables:

```bash
cp .env.example .env
# At minimum, set EXPO_PUBLIC_API_BASE_URL
```

Start the Expo dev server:

```bash
npm start          # opens Expo Go / dev-client QR
npm run android    # launch on Android emulator
npm run ios        # launch on iOS simulator
```

**Verification:** Open the app and you should see the onboarding/entry screen.

---

## Configuration

### Backend (`backend/.env`)

| Variable | Purpose | Example | Required | Default |
| :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/chp` | **Yes** | — |
| `JWT_SECRET` | Sign access tokens | `a_very_long_random_string` | **Yes (prod)** | `dev_jwt_secret` |
| `REFRESH_SECRET` | Sign refresh tokens | `another_long_random_string` | **Yes (prod)** | `dev_refresh_secret` |
| `PORT` | HTTP port | `5001` | No | `5001` |
| `HOST` | Bind address | `0.0.0.0` | No | `0.0.0.0` |
| `NODE_ENV` | Environment name | `production` | No | — |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` | **Yes (prod)** | — |
| `STRICT_REDIS_STARTUP` | Exit on Redis failure at startup | `true` | No | `false` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated allowed origins | `https://myapp.com` | No | Dev localhost list |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud | `my_cloud` | **Yes** | — |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `123456789` | **Yes** | — |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `abc123` | **Yes** | — |
| `EMAIL_DELIVERY_MODE` | `log` (dev) or `nodemailer` | `nodemailer` | No | `log` |
| `EMAIL_HOST` | SMTP host | `smtp.mailgun.org` | If `nodemailer` | — |
| `EMAIL_PORT` | SMTP port | `587` | If `nodemailer` | — |
| `EMAIL_USER` | SMTP username | `postmaster@example.com` | If `nodemailer` | — |
| `EMAIL_PASS` | SMTP password / API key | `secret` | If `nodemailer` | — |
| `EMAIL_FROM` | Sender address | `no-reply@example.com` | If `nodemailer` | `EMAIL_USER` |
| `SMS_DELIVERY_MODE` | `log`, `twilio`, or `twilio-verify` | `twilio-verify` | No | `log` |
| `TWILIO_ACCOUNT_SID` | Twilio account SID | `ACxxxxxxxx` | If Twilio | — |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | `xxxxxxxx` | If Twilio | — |
| `TWILIO_PHONE_NUMBER` | Twilio sending number | `+15551234567` | If `twilio` mode | — |
| `TWILIO_VERIFY_SERVICE_SID` | Twilio Verify service SID | `VAxxxxxxxx` | If `twilio-verify` | — |
| `PHONE_VERIFICATION_RESEND_COOLDOWN_SECONDS` | Resend cooldown | `60` | No | `60` |
| `GOOGLE_WEB_CLIENT_ID` | Google OAuth web client ID | `xxx.apps.googleusercontent.com` | For Google sign-in | — |
| `GOOGLE_CLIENT_ID_IOS` | Google OAuth iOS client ID | `xxx.apps.googleusercontent.com` | For Google sign-in | — |
| `GOOGLE_CLIENT_ID_ANDROID` | Google OAuth Android client ID | `xxx.apps.googleusercontent.com` | For Google sign-in | — |
| `MOBILE_DEEP_LINK_BASE_URL` | Deep link base for email links | `communityhelp://` | No | `communityhelp://` |
| `PUBLIC_APP_URL` | Web app base URL (fallback) | `https://myapp.com` | No | — |
| `ALLOW_DEV_OAUTH` | Allow fake OAuth tokens in dev | `true` | No | `false` |
| `PASSWORD_RESET_TOKEN_TTL_MINUTES` | Token expiry | `30` | No | `30` |
| `EMAIL_VERIFICATION_TOKEN_TTL_HOURS` | Email token expiry | `24` | No | `24` |
| `PHONE_VERIFICATION_CODE_TTL_MINUTES` | Phone OTP expiry | `10` | No | `10` |

**Full `backend/.env.example`** → see [`backend/.env.example`](./backend/.env.example).

### Mobile App (`mobile-app/.env`)

| Variable | Purpose | Example | Required |
| :--- | :--- | :--- | :--- |
| `EXPO_PUBLIC_API_BASE_URL` | Backend REST API base URL | `https://community-help-platform.onrender.com/api` | No (auto-detected in dev) |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps SDK key | `AIzaSy...` | For map features |

**Full `mobile-app/.env.example`** → see [`mobile-app/.env.example`](./mobile-app/.env.example).

---

## Running the Project

### Backend — development

```bash
cd backend
npm run dev          # tsx watch — reloads on file changes
```

### Backend — production build

```bash
cd backend
npm run build        # tsc → ./dist
npm start            # node dist/src/server.js
```

### Backend — Render.com start (runs migrations then starts)

```bash
npm run start:render
```

### Mobile app — development

```bash
cd mobile-app
npm start            # Expo dev server
npm run android      # Android emulator/device
npm run ios          # iOS simulator/device
npm run web          # web browser (limited features)
```

### Mobile app — EAS Build

```bash
eas build --platform android --profile development
eas build --platform ios     --profile development
```

---

## API Documentation

**Base URL (local):** `http://localhost:5001/api`  
**Base URL (production):** `https://community-help-platform.onrender.com/api`

### Authentication

Most write endpoints and some read endpoints require a valid JWT access token:

```
Authorization: Bearer <accessToken>
```

Access tokens expire in **1 hour**. Use `POST /api/auth/refresh` with a valid refresh token to get a new pair.

### Key Endpoint Groups

| Prefix | Description |
| :--- | :--- |
| `/api/auth` | Registration, login, Google OAuth, password reset, email/phone verification, token refresh, session management |
| `/api/requests` | Create, list, search nearby, update, and delete help requests; image upload/delete |
| `/api/bids` | Place, update, respond to (accept/reject), and delete bids |
| `/api/conversations` | List conversations, get/send messages, mark as read |
| `/api/notifications` | List, mark read, delete; push token registration; preferences |
| `/api/reviews` | Create, read, update, delete reviews |
| `/api/users/:userId/reviews` | Get all reviews for a user |
| `/api/categories` | List request categories |
| `/api/skills` | List available skills |
| `/api/favorites` | Save/unsave help requests |
| `/api/admin` | Admin-only: certification review, moderation |

### Example Requests

**Register**

```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"StrongPass1!","fullName":"Jane Doe"}'
```

**Login**

```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"StrongPass1!"}'
```

**List open help requests**

```bash
curl http://localhost:5001/api/requests?status=OPEN&page=1&limit=20
```

**Create a help request** (authenticated)

```bash
curl -X POST http://localhost:5001/api/requests \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Help moving furniture",
    "description": "Need help moving a sofa this Saturday.",
    "categoryId": "<uuid>",
    "budget": 50,
    "isPaid": true,
    "isUrgent": false
  }'
```

**Refresh access token**

```bash
curl -X POST http://localhost:5001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refreshToken>"}'
```

### Error Format

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [{ "field": "email", "message": "Invalid email" }]
}
```

### Phone Verification

See the [Phone Verification](#phone-verification) section below.

---

## Phone Verification

The backend supports two SMS delivery modes:

**`twilio-verify`** (recommended for production — Twilio manages OTP generation and validation):

```
SMS_DELIVERY_MODE=twilio-verify
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_VERIFY_SERVICE_SID=VA...
PHONE_VERIFICATION_RESEND_COOLDOWN_SECONDS=60
```

**`twilio`** (app generates OTP, sends via Twilio SMS):

```
SMS_DELIVERY_MODE=twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+15551234567
PHONE_VERIFICATION_RESEND_COOLDOWN_SECONDS=60
```

**`log`** (development — prints OTP to server console, no SMS sent):

```
SMS_DELIVERY_MODE=log
```

Mobile app endpoints:

- `POST /api/auth/send-phone-code` — send OTP to user's saved phone number
- `POST /api/auth/verify-phone-code` — verify the OTP

Notes:

- Phone numbers are normalized (E.164 format) on the backend before storage.
- `twilio-verify` has a per-user/per-phone resend cooldown plus Twilio's own rate limits.
- Verification requires an authenticated user with a phone number already saved on their profile.

---

## Project Structure

```text
community-help-platform/
├── backend/                        # Node.js / Express API
│   ├── prisma/
│   │   ├── schema.prisma           # Database schema
│   │   ├── seed.ts                 # Seed script (categories, skills)
│   │   └── migrations/             # Auto-generated SQL migrations
│   ├── scripts/
│   │   ├── render-start.mjs        # Render.com: migrate → start
│   │   └── prisma-migrate-deploy-retry.mjs
│   ├── src/
│   │   ├── app.ts                  # Express app setup, CORS, routes
│   │   ├── server.ts               # HTTP + Socket.IO bootstrap
│   │   ├── config/
│   │   │   └── cloudinary.ts       # Cloudinary SDK configuration
│   │   ├── controllers/            # Route handlers (request/response)
│   │   │   └── __tests__/          # Controller unit tests (Vitest)
│   │   ├── lib/
│   │   │   ├── prisma.ts           # Prisma client singleton
│   │   │   ├── redis.ts            # Redis client + assertRedisReady
│   │   │   └── socket.ts           # Socket.IO server init
│   │   ├── middlewares/            # auth, authorization, error, upload
│   │   ├── routes/                 # Express routers (one per resource)
│   │   ├── services/               # Business logic (auth, email, sms, push…)
│   │   ├── sockets/                # Socket.IO event handlers
│   │   ├── templates/              # Email HTML/text templates
│   │   ├── types/                  # Shared TypeScript types
│   │   └── utils/                  # JWT, token, validation, appError…
│   ├── .env.example                # Environment variable template
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   └── TESTING.md                  # Backend test guide
│
└── mobile-app/                     # React Native / Expo app
    ├── app/                        # Expo Router file-based routes
    │   ├── (auth)/                 # Auth screens (login, register, verify…)
    │   ├── (tabs)/                 # Main tab screens
    │   ├── location/               # Location setup screens
    │   └── index.tsx               # Entry / onboarding screen
    ├── src/
    │   ├── api/
    │   │   └── api-client.ts       # Axios instance with JWT + refresh logic
    │   ├── components/             # Shared UI components
    │   ├── config/                 # App constants
    │   ├── design-system/          # Design tokens, theme
    │   ├── features/               # Feature modules (auth, bid, request…)
    │   ├── hooks/                  # Custom React hooks
    │   ├── lib/                    # Socket client, utilities
    │   ├── types/                  # TypeScript types
    │   └── utils/                  # Token storage, toast, etc.
    ├── assets/                     # Images, fonts, icons
    ├── .env.example                # Mobile environment variable template
    ├── app.config.ts               # Expo app config
    ├── eas.json                    # EAS Build profiles
    ├── tamagui.config.ts           # Tamagui UI config
    └── package.json
```

---

## Testing

### Backend tests (Vitest)

```bash
cd backend

# Run tests in watch mode
npm test

# Run once (CI mode)
npm run test:run

# Run a single test file
npm run test:run -- src/controllers/__tests__/auth.controller.test.ts
```

Tests live in `backend/src/controllers/__tests__/`. See [`backend/TESTING.md`](./backend/TESTING.md) for full details on the test layout, mocking strategy, and contribution guidelines.

There are currently **no automated tests** for the mobile app.

---

## Linting / Formatting

### Backend

The backend uses TypeScript for type checking. Run the compiler in `noEmit` mode to check types:

```bash
cd backend
npx tsc --noEmit
```

### Mobile app

```bash
cd mobile-app
npm run lint    # expo lint (ESLint with expo config)
```

---

## Deployment

The backend is deployed to **Render.com** (see `scripts/render-start.mjs`). The mobile app is distributed via **EAS** (Expo Application Services).

### Backend — Render.com

1. Set all required environment variables in the Render dashboard (see [Configuration](#configuration)).
2. Set the **Start Command** to: `npm run start:render`
   - This runs `prisma migrate deploy` with automatic retry, then starts `node dist/src/server.js`.
3. Set the **Build Command** to: `npm install && npm run prisma:generate && npm run build`

**Required env vars for production:**
`DATABASE_URL`, `JWT_SECRET`, `REFRESH_SECRET`, `REDIS_URL`, `CLOUDINARY_*`, and any email/SMS vars you enable.

### Mobile app — EAS

```bash
# Build development APK/IPA
eas build --platform android --profile development
eas build --platform ios     --profile development

# Build production
eas build --platform all --profile production

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

Set `EXPO_PUBLIC_API_BASE_URL` to your production backend URL in your EAS secrets or `app.config.ts`.

---

## Security

- **Secrets** — Never commit `.env` files. Use `.env.example` as a template.
- **JWT** — Access tokens expire in 1 hour; refresh tokens expire in 7 days and are rotated on each use. Token-reuse detection triggers immediate family revocation.
- **Password policy** — Enforced by `password-policy.service.ts` (minimum complexity rules).
- **Rate limiting** — Per-user and per-IP rate limits on auth endpoints, powered by Redis.
- **CORS** — Strict allow-list in production via `CORS_ALLOWED_ORIGINS`.
- **Helmet** — HTTP security headers applied to every response.
- **Upload validation** — Multer restricts file types and sizes on image/document endpoints.
- **Reporting vulnerabilities** — Open a private GitHub security advisory or contact the repository owner directly.

---

## Troubleshooting

1. **Database Connection Refused** — Ensure PostgreSQL is running and `DATABASE_URL` in `backend/.env` is correct.
2. **Missing Env Vars** — Verify `backend/.env` exists and contains all keys from `backend/.env.example`.
3. **Port Already in Use** — Change the `PORT` variable in `backend/.env` (default `5001`).
4. **Dependency Conflicts** — Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`.
5. **Prisma Client Not Generated** — Run `npx prisma generate` inside `backend/`.
6. **Migration Failure** — Ensure the database user has `CREATE` / `ALTER` permissions. Run `npx prisma migrate dev --name init` to reset dev state.
7. **Build Fails** — Verify Node.js version is `≥ 20` (`node -v`) and TypeScript config is correct (`npx tsc --noEmit`).
8. **Redis Connection Warning at Startup** — In development this is non-fatal; the server continues in degraded mode. In production set `REDIS_URL` and `STRICT_REDIS_STARTUP=true`.
9. **Mobile app can't reach backend on device** — `localhost` does not resolve from a physical device. Set `EXPO_PUBLIC_API_BASE_URL` to your machine's local IP (e.g., `http://192.168.1.x:5001/api`) or use the Expo dev client host detection.
10. **Google Sign-In not working** — Set at least one of `GOOGLE_WEB_CLIENT_ID`, `GOOGLE_CLIENT_ID_IOS`, or `GOOGLE_CLIENT_ID_ANDROID` in `backend/.env`.

---

## Contributing

1. **Branching** — Use `feature/feature-name` for new features or `fix/issue-name` for bug fixes.
2. **Commits** — Follow [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `chore:`, `docs:`, etc.
3. **PRs** — Open a pull request against `main`. Ensure `npm run test:run` passes in `backend/` and include a description of your changes.
4. **Code review** — Address all reviewer comments before merging. Keep PRs focused and small where possible.

---

## License

Distributed under the **ISC License**. See [`LICENSE`](./LICENSE) if present, or the `"license": "ISC"` field in `backend/package.json`.
