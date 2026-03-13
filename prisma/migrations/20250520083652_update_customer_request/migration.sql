/*
  Warnings:

  - The primary key for the `requests` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `shipment_cost` on the `requests` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_request_id_fkey";

-- AlterTable
ALTER TABLE "orders" ALTER COLUMN "request_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "requests" DROP CONSTRAINT "requests_pkey",
DROP COLUMN "shipment_cost",
ADD COLUMN     "international_shipping_cost" DOUBLE PRECISION,
ADD COLUMN     "local_shipping_cost" DOUBLE PRECISION,
ADD COLUMN     "total_cost" DOUBLE PRECISION,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "requests_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "requests_id_seq";

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
