DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SecurityEventType') THEN
    CREATE TYPE "SecurityEventType" AS ENUM (
      'LOGIN_SUCCESS',
      'LOGIN_FAILURE',
      'LOGIN_LOCKOUT',
      'REFRESH_TOKEN_REUSE_DETECTED',
      'REFRESH_TOKEN_REVOKED',
      'SUSPICIOUS_LOGIN'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "security_events" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "type" "SecurityEventType" NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "security_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "security_events_userId_idx" ON "security_events"("userId");
CREATE INDEX IF NOT EXISTS "security_events_type_idx" ON "security_events"("type");
CREATE INDEX IF NOT EXISTS "security_events_createdAt_idx" ON "security_events"("createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'security_events_userId_fkey'
  ) THEN
    ALTER TABLE "security_events"
      ADD CONSTRAINT "security_events_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
