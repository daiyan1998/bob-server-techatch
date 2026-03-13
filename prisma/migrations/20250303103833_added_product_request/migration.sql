-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELED');

-- CreateEnum
CREATE TYPE "RequestType" AS ENUM ('LINK', 'DIRECT');

-- CreateTable
CREATE TABLE "requests" (
    "id" SERIAL NOT NULL,
    "customer_id" TEXT,
    "productUrl" TEXT,
    "productName" TEXT,
    "description" TEXT,
    "image" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "productCost" DOUBLE PRECISION,
    "shipmentCost" DOUBLE PRECISION,
    "miscellaneousCost" DOUBLE PRECISION,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "customerNotes" TEXT,
    "estimated_delivery_date" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "requestType" "RequestType" NOT NULL,

    CONSTRAINT "requests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
