-- CreateTable
CREATE TABLE "OrderSettlement" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "grossAmount" DECIMAL(10,2) NOT NULL,
    "vendorGrossSales" DECIMAL(10,2) NOT NULL,
    "vendorCommissionRate" DECIMAL(5,2) NOT NULL,
    "vendorCommissionAmount" DECIMAL(10,2) NOT NULL,
    "vendorPayoutAmount" DECIMAL(10,2) NOT NULL,
    "riderGrossDelivery" DECIMAL(10,2) NOT NULL,
    "deliveryPlatformFeeRate" DECIMAL(5,2) NOT NULL,
    "deliveryPlatformFeeAmount" DECIMAL(10,2) NOT NULL,
    "riderPayoutAmount" DECIMAL(10,2) NOT NULL,
    "serviceFeeRate" DECIMAL(5,2) NOT NULL,
    "serviceFeeAmount" DECIMAL(10,2) NOT NULL,
    "taxRate" DECIMAL(5,2) NOT NULL,
    "taxAmount" DECIMAL(10,2) NOT NULL,
    "netPlatformRevenue" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrderSettlement_orderId_key" ON "OrderSettlement"("orderId");

-- AddForeignKey
ALTER TABLE "OrderSettlement" ADD CONSTRAINT "OrderSettlement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
