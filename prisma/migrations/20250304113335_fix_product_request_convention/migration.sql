/*
  Warnings:

  - You are about to drop the column `adminNotes` on the `requests` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `requests` table. All the data in the column will be lost.
  - You are about to drop the column `customerNotes` on the `requests` table. All the data in the column will be lost.
  - You are about to drop the column `miscellaneousCost` on the `requests` table. All the data in the column will be lost.
  - You are about to drop the column `productCost` on the `requests` table. All the data in the column will be lost.
  - You are about to drop the column `productName` on the `requests` table. All the data in the column will be lost.
  - You are about to drop the column `productUrl` on the `requests` table. All the data in the column will be lost.
  - You are about to drop the column `requestType` on the `requests` table. All the data in the column will be lost.
  - You are about to drop the column `shipmentCost` on the `requests` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `requests` table. All the data in the column will be lost.
  - Added the required column `request_type` to the `requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `requests` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "requests" DROP COLUMN "adminNotes",
DROP COLUMN "createdAt",
DROP COLUMN "customerNotes",
DROP COLUMN "miscellaneousCost",
DROP COLUMN "productCost",
DROP COLUMN "productName",
DROP COLUMN "productUrl",
DROP COLUMN "requestType",
DROP COLUMN "shipmentCost",
DROP COLUMN "updatedAt",
ADD COLUMN     "admin_notes" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "customer_notes" TEXT,
ADD COLUMN     "miscellaneous_cost" DOUBLE PRECISION,
ADD COLUMN     "product_cost" DOUBLE PRECISION,
ADD COLUMN     "product_name" TEXT,
ADD COLUMN     "product_url" TEXT,
ADD COLUMN     "request_type" "RequestType" NOT NULL,
ADD COLUMN     "shipment_cost" DOUBLE PRECISION,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;
