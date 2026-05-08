ALTER TABLE "refresh_tokens"
ADD COLUMN IF NOT EXISTS "deviceName" TEXT,
ADD COLUMN IF NOT EXISTS "deviceType" TEXT,
ADD COLUMN IF NOT EXISTS "platform" TEXT,
ADD COLUMN IF NOT EXISTS "browser" TEXT,
ADD COLUMN IF NOT EXISTS "locationLabel" TEXT,
ADD COLUMN IF NOT EXISTS "appVersion" TEXT,
ADD COLUMN IF NOT EXISTS "loginMethod" TEXT;

CREATE INDEX IF NOT EXISTS "refresh_tokens_userId_revokedAt_expiresAt_idx"
ON "refresh_tokens"("userId", "revokedAt", "expiresAt");
