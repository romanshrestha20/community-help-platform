-- Align legacy refresh_tokens table with the current session model.
-- Safe for environments that still have the old columns:
--   id, userId, token, createdAt, expiresAt

ALTER TABLE "refresh_tokens"
ADD COLUMN IF NOT EXISTS "tokenHash" TEXT,
ADD COLUMN IF NOT EXISTS "jti" TEXT,
ADD COLUMN IF NOT EXISTS "familyId" TEXT,
ADD COLUMN IF NOT EXISTS "createdByIp" TEXT,
ADD COLUMN IF NOT EXISTS "lastUsedIp" TEXT,
ADD COLUMN IF NOT EXISTS "userAgent" TEXT,
ADD COLUMN IF NOT EXISTS "revokedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "revokedReason" TEXT,
ADD COLUMN IF NOT EXISTS "lastUsedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "replacedByTokenId" TEXT;

-- Backfill required fields for existing rows.
UPDATE "refresh_tokens"
SET
  "tokenHash" = COALESCE("tokenHash", "token"),
  "jti" = COALESCE("jti", "id"),
  "familyId" = COALESCE("familyId", "id"),
  "lastUsedAt" = COALESCE("lastUsedAt", "createdAt")
WHERE
  "tokenHash" IS NULL
  OR "jti" IS NULL
  OR "familyId" IS NULL
  OR "lastUsedAt" IS NULL;

ALTER TABLE "refresh_tokens"
ALTER COLUMN "tokenHash" SET NOT NULL,
ALTER COLUMN "jti" SET NOT NULL,
ALTER COLUMN "familyId" SET NOT NULL;

-- Remove old unique token index if it exists.
DROP INDEX IF EXISTS "refresh_tokens_token_key";

-- Add indexes required by the current model.
CREATE UNIQUE INDEX IF NOT EXISTS "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");
CREATE UNIQUE INDEX IF NOT EXISTS "refresh_tokens_jti_key" ON "refresh_tokens"("jti");
CREATE UNIQUE INDEX IF NOT EXISTS "refresh_tokens_replacedByTokenId_key" ON "refresh_tokens"("replacedByTokenId");
CREATE INDEX IF NOT EXISTS "refresh_tokens_jti_idx" ON "refresh_tokens"("jti");
CREATE INDEX IF NOT EXISTS "refresh_tokens_familyId_idx" ON "refresh_tokens"("familyId");
CREATE INDEX IF NOT EXISTS "refresh_tokens_revokedAt_idx" ON "refresh_tokens"("revokedAt");
