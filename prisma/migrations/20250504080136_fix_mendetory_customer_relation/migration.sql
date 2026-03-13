/*
  Warnings:

  - Made the column `customer_id` on table `notifications_customer` required. This step will fail if there are existing NULL values in that column.
  - Made the column `customer_id` on table `orders` required. This step will fail if there are existing NULL values in that column.
  - Made the column `request_id` on table `orders` required. This step will fail if there are existing NULL values in that column.
  - Made the column `customer_id` on table `otps` required. This step will fail if there are existing NULL values in that column.
  - Made the column `customer_id` on table `requests` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "notifications_customer" DROP CONSTRAINT "notifications_customer_customer_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_customer_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_request_id_fkey";

-- DropForeignKey
ALTER TABLE "otps" DROP CONSTRAINT "otps_customer_id_fkey";

-- DropForeignKey
ALTER TABLE "requests" DROP CONSTRAINT "requests_customer_id_fkey";

-- AlterTable
ALTER TABLE "notifications_customer" ALTER COLUMN "customer_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "orders" ALTER COLUMN "customer_id" SET NOT NULL,
ALTER COLUMN "request_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "otps" ALTER COLUMN "customer_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "requests" ALTER COLUMN "customer_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "otps" ADD CONSTRAINT "otps_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications_customer" ADD CONSTRAINT "notifications_customer_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
