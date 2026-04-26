-- DropIndex
DROP INDEX "reviews_userId_title_comment_key";

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "totalReviews" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "helpRequestId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "reviews_helpRequestId_idx" ON "reviews"("helpRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_userId_helpRequestId_key" ON "reviews"("userId", "helpRequestId");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_helpRequestId_fkey" FOREIGN KEY ("helpRequestId") REFERENCES "help_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
