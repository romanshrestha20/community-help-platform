ALTER TABLE "favorites" ADD COLUMN "requestId" TEXT;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "favorites" WHERE "requestId" IS NULL) THEN
    RAISE EXCEPTION 'favorites.requestId requires backfill before this migration can complete';
  END IF;
END $$;

DROP INDEX IF EXISTS "favorites_userId_key";

ALTER TABLE "favorites" ALTER COLUMN "requestId" SET NOT NULL;

CREATE INDEX "favorites_userId_createdAt_idx" ON "favorites"("userId", "createdAt");
CREATE INDEX "favorites_requestId_idx" ON "favorites"("requestId");
CREATE UNIQUE INDEX "favorites_userId_requestId_key" ON "favorites"("userId", "requestId");

ALTER TABLE "favorites"
ADD CONSTRAINT "favorites_requestId_fkey"
FOREIGN KEY ("requestId") REFERENCES "help_requests"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
