ALTER TABLE "help_requests"
ADD COLUMN "isUrgent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "urgentExpiresAt" TIMESTAMP(3);

CREATE INDEX "help_requests_isUrgent_urgentExpiresAt_idx" ON "help_requests"("isUrgent", "urgentExpiresAt");
