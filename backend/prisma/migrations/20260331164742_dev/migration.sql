-- CreateEnum
CREATE TYPE "DispatchMode" AS ENUM ('AUTO', 'MANUAL');

-- CreateTable
CREATE TABLE "PlatformSettings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL DEFAULT 'DEFAULT',
    "dispatchMode" "DispatchMode" NOT NULL DEFAULT 'AUTO',
    "supportEmail" TEXT NOT NULL,
    "paymentMethods" "PaymentMethod"[],
    "vendorCommissionRate" DECIMAL(5,2) NOT NULL DEFAULT 15.00,
    "riderCommissionRate" DECIMAL(5,2) NOT NULL DEFAULT 2.50,
    "serviceFeeRate" DECIMAL(5,2) NOT NULL DEFAULT 5.00,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 7.50,
    "payoutDelayDays" INTEGER NOT NULL DEFAULT 2,
    "minimumPayoutAmount" DECIMAL(10,2) NOT NULL DEFAULT 5000.00,
    "platformSubscriptionEnabled" BOOLEAN NOT NULL DEFAULT true,
    "defaultTrialDays" INTEGER NOT NULL DEFAULT 14,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformSubscriptionPlan" (
    "id" TEXT NOT NULL,
    "platformSettingsId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "audienceLabel" TEXT NOT NULL,
    "monthlyPrice" DECIMAL(10,2) NOT NULL,
    "yearlyPrice" DECIMAL(10,2),
    "orderCommissionRate" DECIMAL(5,2) NOT NULL,
    "deliveryCommissionRate" DECIMAL(5,2) NOT NULL,
    "benefitsSummary" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlatformSettings_key_key" ON "PlatformSettings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformSubscriptionPlan_code_key" ON "PlatformSubscriptionPlan"("code");

-- CreateIndex
CREATE INDEX "PlatformSubscriptionPlan_platformSettingsId_sortOrder_idx" ON "PlatformSubscriptionPlan"("platformSettingsId", "sortOrder");

-- AddForeignKey
ALTER TABLE "PlatformSubscriptionPlan" ADD CONSTRAINT "PlatformSubscriptionPlan_platformSettingsId_fkey" FOREIGN KEY ("platformSettingsId") REFERENCES "PlatformSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
