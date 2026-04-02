-- AlterTable
ALTER TABLE "PlatformSettings" ADD COLUMN     "rideBaseFare" DECIMAL(10,2) NOT NULL DEFAULT 5.00,
ADD COLUMN     "rideDistanceRatePerKm" DECIMAL(10,2) NOT NULL DEFAULT 2.00,
ADD COLUMN     "rideTimeRatePerMinute" DECIMAL(10,2) NOT NULL DEFAULT 0.50;
