-- Prevent concurrent requests from creating multiple bids by the same helper.
CREATE UNIQUE INDEX "bids_helperId_helpRequestId_key"
ON "bids"("helperId", "helpRequestId");
