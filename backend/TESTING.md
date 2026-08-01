# Backend Testing Guide

This document describes the current backend test suite and how it is organized.

## Test Stack

- Runner: Vitest
- Environment: Node
- Assertion style: Vitest `expect`
- HTTP/controller mocking: local request/response helpers in `src/controllers/__tests__/test-utils.ts`

## How To Run

From the `backend` folder:

```bash
npm test
```

Run the full suite once:

```bash
npm run test:run
```

Run integration tests against disposable PostgreSQL and Redis containers:

```bash
npm run test:integration
```

The integration runner starts the containers, applies migrations, runs the
integration suite, and removes the containers and volumes afterward.

Run a single test file:

```bash
npm run test:run -- src/controllers/__tests__/auth.controller.test.ts
```

## Test Layout

All current automated backend tests live under `src/controllers/__tests__/`.

### Shared Test Utilities

- [test-utils.ts](src/controllers/__tests__/test-utils.ts)
  - Builds mock `Request`, `Response`, and `NextFunction` objects.
  - Keeps controller tests small and consistent.

### auth.controller.test.ts

Covers the auth controller request/response contract.

Scenarios:

- Rejects register requests with missing fields.
- Creates a new user and issues access and refresh tokens.
- Rejects login with an invalid password.
- Rejects expired refresh sessions.
- Updates a password and invalidates stored refresh tokens.

### bid.controller.test.ts

Covers the bid controller flow.

Scenarios:

- Rejects bids with invalid amounts.
- Creates bids for an open request.
- Accepts a bid and updates request state.
- Prevents deletion of non-pending bids.

### request.controller.test.ts

Covers help request creation, querying, and status changes.

Scenarios:

- Rejects unauthenticated create requests.
- Creates a help request successfully.
- Surfaces service errors from the list endpoint.
- Returns formatted request data with pagination metadata.
- Prevents deleting another user’s request.
- Rejects invalid status transitions.

### user.controller.test.ts

Covers user profile and account endpoints.

Scenarios:

- Rejects unauthenticated profile reads.
- Returns the current profile payload.
- Updates profile fields using the current profile lookup/update flow.
- Deletes the authenticated user account.

### google.controller.test.ts

Covers backend Google sign-in behavior.

Scenarios:

- Rejects missing Google ID tokens when dev OAuth is disabled.
- Uses the development fallback when `ALLOW_DEV_OAUTH=true`.
- Verifies a Google ID token and returns the Google sign-in payload.

## Mocking Strategy

The tests rely on hoisted Vitest mocks for Prisma, bcrypt, JWT helpers, and Google auth services.

This keeps the controller tests deterministic and focused on behavior rather than infrastructure.

Common patterns:

- `prisma` is mocked per test file.
- `bcrypt` is mocked where password flows are involved.
- `accessToken`, `signRefreshToken`, and `verifyRefreshToken` are mocked for auth flows.
- `AuthService` is mocked in the Google controller tests.

## Coverage Notes

- The current suite is focused on controller-level behavior.
- Mobile-app unit tests run separately from `mobile-app/` with `npm run test:run`.
- The test suite is intentionally lightweight and avoids hitting the real database or external Google APIs.

## Maintenance Notes

When adding a new controller endpoint:

1. Add or update the relevant test file under `src/controllers/__tests__/`.
2. Extend the local Prisma mock with only the methods the controller uses.
3. Keep the request/response helpers in `test-utils.ts` if the test only needs controller-level coverage.
4. Prefer asserting on behavior and response shape rather than full Prisma payloads unless the exact payload is the contract.

## Current Test Files

- [auth.controller.test.ts](src/controllers/__tests__/auth.controller.test.ts)
- [bid.controller.test.ts](src/controllers/__tests__/bid.controller.test.ts)
- [google.controller.test.ts](src/controllers/__tests__/google.controller.test.ts)
- [request.controller.test.ts](src/controllers/__tests__/request.controller.test.ts)
- [test-utils.ts](src/controllers/__tests__/test-utils.ts)
- [user.controller.test.ts](src/controllers/__tests__/user.controller.test.ts)
