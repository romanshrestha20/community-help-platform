# Community Help Platform

A full-stack marketplace app that connects people who need help with nearby helpers.

This repository includes:
- `backend`: Node.js/Express + Prisma API with auth, requests, bidding, chat, notifications, and admin workflows.
- `mobile-app`: Expo React Native app (Expo Router) for iOS/Android/Web.

## Tech Stack

- Backend: Node.js, Express, TypeScript, Prisma, PostgreSQL, Redis, Socket.IO
- Mobile: Expo, React Native, Expo Router, Zustand, Axios, Socket.IO client
- Integrations: Google Sign-In, Twilio/Twilio Verify, Expo Push Notifications, Cloudinary
- Testing: Vitest + route/controller/service/unit coverage

## Implemented Features

### Authentication and Security
- Email/password register and login
- Google sign-in
- Refresh token rotation + token versioning
- Logout current session / all sessions
- Session listing
- Forgot/reset password
- Add/change password
- Security events logging
- Auth rate limiting + password policy service

### Verification
- Email verification with token/link flow
- Phone verification via Twilio SMS or Twilio Verify
- Resend cooldown and phone/user rate limits

### User Profiles
- Profile fetch, update, and delete
- Avatar upload and delete
- Onboarding completion flow
- Profile stats (rating/review totals)

### Skills and Qualifications
- Public skills catalog
- User skill replacement/update
- Certification upload/delete
- Admin certification review: approve/reject

### Role-Based Access
- `USER` and `ADMIN` roles
- Admin-protected endpoints

### Help Requests
- Create/read/update/delete requests
- Status transitions and lifecycle updates
- Category, budget, urgency, and expiry support
- Optional request images + add/remove image endpoints

### Location and Discovery
- Request location storage
- Nearby requests endpoint
- Configurable service/search radius
- Mobile map/list browsing experiences

### Bidding Marketplace
- Place/update/delete bids
- Requester accept/reject bids
- My bids view
- Bid detail and per-request bid listings

### Conversations and Messaging
- One conversation per request (create/ensure flow)
- Inbox and conversation detail views
- Message list/send/delete
- Mark conversation as read

### Notifications
- In-app notifications list
- Unread count
- Mark read/unread/read-all
- Delete notifications

### Notification Preferences
- Per-user toggles for:
  - messages
  - bids
  - request updates
  - saved requests
  - nearby alerts
- Nearby filters: radius/category/urgent-only

### Push Notifications
- Device token register/unregister
- Expo Push integration

### Favorites and Saved Requests
- Add/remove/check favorite
- List favorites
- List favorite request IDs

### Reviews
- Create/read/update/delete reviews
- One review per request per reviewer constraint
- User review listing
- Review summary components in mobile UI

### Media Handling
- Cloudinary image upload utilities for:
  - avatars
  - request images
  - certification proofs

### Real-Time Foundations
- Socket server/client setup
- Conversation-oriented realtime hooks/components

### Mobile App
- Expo Router auth flow
- Tab navigation: Home, Messages, Notifications, Profile
- Request list/detail/create/map screens
- Favorites screens
- Security and notification settings
- Theme mode support

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
- Redis
- Expo CLI-compatible environment for mobile development

### 1) Backend Setup

```bash
cd backend
npm install
```

Create `.env` in `backend/` with required values for your environment (database, JWT, Redis, Twilio, Google auth, Cloudinary, email, etc.).

Run Prisma and start the API:

```bash
npm run prisma:generate
npm run dev
```

Other useful backend scripts:

```bash
npm run build
npm start
npm run test
npm run test:run
npm run prisma:migrate:deploy
```

### 2) Mobile App Setup

```bash
cd mobile-app
npm install
```

Create `.env` in `mobile-app/` and point it to your backend base URL and mobile integrations (Expo/Google, etc.).

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

Backend supports two SMS delivery strategies:

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

Verification endpoints used by mobile app:

- `POST /api/auth/send-phone-code`
- `POST /api/auth/verify-phone-code`

## Testing

Backend tests are organized across routes, controllers, services, and utility validation.

```bash
cd backend
npm run test
```

See `backend/TESTING.md` for additional testing notes.

## Deployment Notes

- Run Prisma migrations during deploy (`npm run prisma:migrate:deploy`).
- Ensure Redis is available for session/rate-limit related flows.
- Set production credentials for Twilio, Cloudinary, email provider, and push notifications.
- Use secure JWT/secret values and HTTPS in production environments.

## Status

Core marketplace workflows are implemented end-to-end across backend and mobile app, including authentication, discovery, bidding, chat, notifications, reviews, and admin moderation flows.
