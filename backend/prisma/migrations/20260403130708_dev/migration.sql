/*
  Warnings:

  - Added the required column `updatedAt` to the `PromoCode` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PayoutRequest" ADD COLUMN     "payoutMethod" TEXT,
ADD COLUMN     "payoutReference" TEXT;

-- AlterTable
ALTER TABLE "PromoCode" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "maxUsageCount" INTEGER,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
