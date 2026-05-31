# Community Help Platform

A full-stack marketplace app that connects people who need help with nearby helpers.

This repository includes:

- `backend`: Node.js/Express + Prisma API with auth, requests, bidding, chat, notifications, and admin workflows.
- `mobile-app`: Expo React Native app (Expo Router) for iOS/Android/Web.

## Tech Stack

### Backend

- Runtime: Node.js (ESM)
- Web/API: Express 5 + CORS + Helmet
- DB: PostgreSQL + Prisma
- Realtime: Socket.IO
- Auth/security: JWT access + refresh sessions, bcrypt
- Validation: Zod
- Email: SendGrid + Nodemailer + React Email templates
- SMS verification: Twilio Programmable SMS or Twilio Verify (or dev log mode)
- Media: Cloudinary uploads
- Cache/controls: Redis (rate-limits + security monitoring; optional in development, required in production)

### Mobile (Frontend)

- Framework: Expo (React Native) + Expo Router
- UI: Tamagui
- State: Zustand
- Networking: Axios
- Forms: react-hook-form
- Realtime: Socket.IO client
- Device features: expo-notifications, expo-location, image picker/manipulation
- Maps: react-native-maps + Google Maps API key support

## Implemented Features (High-Level)

This list is intentionally source-anchored to the current backend route/controller surface.

### Backend API

- Auth & security: email/password, refresh sessions, Google sign-in, email + phone verification, password reset/change, rate limiting + security monitoring (Redis-backed when available)
- Help requests: CRUD, status transitions, nearby discovery filters, request images (Cloudinary)
- Marketplace bids: place/update/delete bids, accept/reject, per-request bid listings
- Conversations & messaging: conversation membership, message send/list/read; realtime messaging via Socket.IO
- Notifications: in-app notifications + unread counts; push token registration for mobile push
- Categories & skills catalog
- Favorites (saved requests)
- Reviews and ratings
- Qualifications: skills + certifications with admin review endpoints

### Mobile App

- Expo Router navigation (auth flow + tab layout)
- Request discovery (list + map) with location permissions
- Messaging UI backed by REST + Socket.IO
- Notifications screen + Expo push notifications
- Profile, settings, and saved requests

## Repository Structure

```text
community-help-platform/
├── backend/
│   ├── prisma/
│   ├── src/
│   └── TESTING.md
├── mobile-app/
│   ├── app/
│   ├── src/
│   └── app.config.ts
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL
- Redis (optional in development; required in production)
- Expo CLI-compatible environment for mobile development

### 1) Backend Setup

```bash
cd backend
npm install
```

Create `.env` in `backend/` (minimum required):

- `DATABASE_URL` (PostgreSQL connection string)
- `JWT_SECRET`, `REFRESH_SECRET` (required in production; dev fallbacks exist in code)

Common backend config knobs:

- `PORT` (default `5001`)
- `HOST` (default `0.0.0.0`)
- `CORS_ALLOWED_ORIGINS` (comma-separated list)
- `STRICT_REDIS_STARTUP` (`true` to fail startup when Redis is unavailable)

Common optional variables (depending on which features you want enabled):

- `REDIS_URL` (required in production; optional in development)
- `GOOGLE_WEB_CLIENT_ID` or `GOOGLE_CLIENT_ID_WEB` / `GOOGLE_CLIENT_ID_IOS` / `GOOGLE_CLIENT_ID_ANDROID`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `SENDGRID_API_KEY` (or SMTP vars if using Nodemailer)
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` (+ SMS mode vars; see below)

Run Prisma and start the API:

```bash
npm run prisma:generate
npm run prisma:migrate:deploy
npm run dev
```

API defaults to `http://localhost:5001`.

Optional (destructive) seed reset:

```bash
npx prisma migrate reset
```

Other useful backend scripts:

```bash
npm run build
npm start
npm run test
npm run test:run
npm run prisma:migrate:deploy
npm run prisma:migrate:deploy:retry
```

### 2) Mobile App Setup

```bash
cd mobile-app
npm install
```

Create `.env` in `mobile-app/` (common variables):

- `EXPO_PUBLIC_API_BASE_URL` (your backend base URL)
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS`, `EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID`, `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_WEB_REDIRECT_URI`
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` (optional but required for Google Maps)

Note: when running on a physical device, `localhost` in `EXPO_PUBLIC_API_BASE_URL` points to the device itself, not your laptop.

Start the app:

```bash
npm run start
```

Run on device/emulator:

```bash
npm run android
npm run ios
npm run web
```

## Phone Verification Modes

Backend supports three SMS delivery strategies:

- `SMS_DELIVERY_MODE=log`: logs OTPs to the server console (useful for local dev).
- `SMS_DELIVERY_MODE=twilio`: app generates OTP, Twilio Programmable SMS sends it.
- `SMS_DELIVERY_MODE=twilio-verify`: Twilio Verify handles OTP generation and validation.

Recommended production mode:

```bash
SMS_DELIVERY_MODE=twilio-verify
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_VERIFY_SERVICE_SID=VA...
PHONE_VERIFICATION_RESEND_COOLDOWN_SECONDS=60
```

Alternative app-generated OTP mode:

```bash
SMS_DELIVERY_MODE=twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+15551234567
PHONE_VERIFICATION_RESEND_COOLDOWN_SECONDS=60
```

## Testing

- Backend tests: see `backend/TESTING.md` and run `npm test` from `backend/`.
- Mobile app: no automated test suite is set up in this repo yet.

## Deployment Notes

- Run Prisma migrations during deploy (`npm run prisma:migrate:deploy`).
- Ensure Redis is available for rate-limit/security-monitoring related flows.
- Set production credentials for Twilio, Cloudinary, email provider, and push notifications.
- Use secure JWT/secret values and HTTPS in production environments.

## Mobile UI / Design Docs

Project-specific mobile implementation notes live in `mobile-app/readme/`:

- Theme/tabs: [THEME_AND_TABS_GUIDE.md](mobile-app/readme/THEME_AND_TABS_GUIDE.md)
- Custom tab bar: [CUSTOM_TAB_BAR_GUIDE.md](mobile-app/readme/CUSTOM_TAB_BAR_GUIDE.md)
- Components: [COMPONENTS_GUIDE.md](mobile-app/readme/COMPONENTS_GUIDE.md)
- Spacing system: [SPACING_SYSTEM_GUIDE.md](mobile-app/readme/SPACING_SYSTEM_GUIDE.md)
- Checklist: [IMPLEMENTATION_CHECKLIST.md](mobile-app/readme/IMPLEMENTATION_CHECKLIST.md)
