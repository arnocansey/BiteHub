-- CreateTable
CREATE TABLE "ForecastSnapshot" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "forecastDate" TIMESTAMP(3) NOT NULL,
    "windowLabel" TEXT NOT NULL,
    "expectedOrders" INTEGER NOT NULL,
    "expectedPrepLoad" INTEGER NOT NULL,
    "recommendedStaff" INTEGER NOT NULL,
    "confidencePercent" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForecastSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiderIncentive" (
    "id" TEXT NOT NULL,
    "riderProfileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "bonusAmount" DECIMAL(10,2) NOT NULL,
    "zoneLabel" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiderIncentive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QualityScore" (
    "id" TEXT NOT NULL,
    "vendorProfileId" TEXT,
    "riderProfileId" TEXT,
    "restaurantId" TEXT,
    "scoreType" TEXT NOT NULL,
    "scoreValue" DOUBLE PRECISION NOT NULL,
    "trend" TEXT,
    "notes" TEXT,
    "measuredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QualityScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketHeatmap" (
    "id" TEXT NOT NULL,
    "zoneLabel" TEXT NOT NULL,
    "demandLevel" INTEGER NOT NULL,
    "supplyLevel" INTEGER NOT NULL,
    "averageEtaMinutes" INTEGER NOT NULL,
    "activeOrders" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketHeatmap_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ForecastSnapshot_restaurantId_forecastDate_idx" ON "ForecastSnapshot"("restaurantId", "forecastDate");

-- CreateIndex
CREATE INDEX "RiderIncentive_riderProfileId_startsAt_idx" ON "RiderIncentive"("riderProfileId", "startsAt");

-- CreateIndex
CREATE INDEX "QualityScore_scoreType_measuredAt_idx" ON "QualityScore"("scoreType", "measuredAt");

-- CreateIndex
CREATE UNIQUE INDEX "MarketHeatmap_zoneLabel_key" ON "MarketHeatmap"("zoneLabel");

-- AddForeignKey
ALTER TABLE "ForecastSnapshot" ADD CONSTRAINT "ForecastSnapshot_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiderIncentive" ADD CONSTRAINT "RiderIncentive_riderProfileId_fkey" FOREIGN KEY ("riderProfileId") REFERENCES "RiderProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityScore" ADD CONSTRAINT "QualityScore_vendorProfileId_fkey" FOREIGN KEY ("vendorProfileId") REFERENCES "VendorProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityScore" ADD CONSTRAINT "QualityScore_riderProfileId_fkey" FOREIGN KEY ("riderProfileId") REFERENCES "RiderProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityScore" ADD CONSTRAINT "QualityScore_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
