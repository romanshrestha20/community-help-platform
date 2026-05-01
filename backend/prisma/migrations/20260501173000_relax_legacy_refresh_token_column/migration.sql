-- Legacy compatibility: older refresh_tokens tables may still contain a
-- required "token" column from pre-rotation schema. The current Prisma model
-- does not write that column, so keep it optional.

ALTER TABLE "refresh_tokens"
ALTER COLUMN "token" DROP NOT NULL;
