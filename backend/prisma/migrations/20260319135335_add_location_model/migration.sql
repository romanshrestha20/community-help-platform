/*
  Warnings:

  - You are about to drop the column `latitude` on the `HelpRequest` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `HelpRequest` table. All the data in the column will be lost.
  - You are about to drop the column `radius` on the `HelpRequest` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `Profile` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[locationId]` on the table `HelpRequest` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[addressId]` on the table `Profile` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "HelpRequest_latitude_longitude_idx";

-- AlterTable
ALTER TABLE "HelpRequest" DROP COLUMN "latitude",
DROP COLUMN "longitude",
DROP COLUMN "radius",
ADD COLUMN     "locationId" TEXT,
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "address",
ADD COLUMN     "addressId" TEXT;

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "radius" INTEGER NOT NULL DEFAULT 800,
    "street" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HelpRequest_locationId_key" ON "HelpRequest"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_addressId_key" ON "Profile"("addressId");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpRequest" ADD CONSTRAINT "HelpRequest_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
