# Community Help Platform

A platform connecting people who need help with everyday tasks to volunteers and paid helpers in their community.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Authentication**: JWT (access + refresh tokens)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **Testing**: Jest + Supertest

## Directory Structure

```
community-help-platform/
└── backend/
    ├── prisma/
    │   └── schema.prisma        # Database schema
    ├── src/
    │   ├── controllers/
    │   │   ├── auth.controller.js
    │   │   └── user.controller.js
    │   ├── middleware/
    │   │   └── auth.middleware.js
    │   ├── routes/
    │   │   ├── auth.routes.js
    │   │   └── user.routes.js
    │   ├── utils/
    │   │   └── prisma.js        # Prisma client singleton
    │   └── app.js               # Express app setup
    ├── tests/
    │   ├── auth.test.js
    │   └── user.test.js
    ├── .env.example
    ├── jest.config.js
    ├── server.js
    └── package.json
```

## Prerequisites

- Node.js v18+
- PostgreSQL database

## Setup

### 1. Clone and install dependencies

```bash
cd backend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your database URL and JWT secrets
```

### 3. Run database migrations

```bash
npm run prisma:migrate
```

### 4. Start the server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

### 5. Run tests

```bash
npm test
```

## API Endpoints

### Auth (`/api/v1/auth`)

| Method | Endpoint    | Auth Required | Description              |
|--------|-------------|---------------|--------------------------|
| POST   | /register   | No            | Register a new user      |
| POST   | /login      | No            | Login with credentials   |
| POST   | /refresh    | No            | Refresh access token     |
| POST   | /logout     | Yes           | Logout and revoke token  |

### Users (`/api/v1/users`)

| Method | Endpoint    | Auth Required | Description              |
|--------|-------------|---------------|--------------------------|
| GET    | /profile    | Yes           | Get current user profile |
| PUT    | /profile    | Yes           | Update current user profile |
| PUT    | /password   | Yes           | Change password          |
| GET    | /:id        | Yes           | Get public user profile  |

## Data Models

- **User**: Authentication and role management (REQUESTER, HELPER, BOTH)
- **Profile**: User profile details (name, bio, skills, location)
- **RefreshToken**: Secure token storage with revocation support
- **HelpRequest**: Community help requests with categories and status
- **Bid**: Helper bids on help requests
- **Rating**: User ratings after completed requests