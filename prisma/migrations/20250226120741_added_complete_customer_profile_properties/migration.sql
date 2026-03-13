/*
  Warnings:

  - You are about to drop the column `customerId` on the `otps` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[customer_id]` on the table `otps` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `nationality` to the `customers` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "NATIONALITY" AS ENUM ('BANGLADESH', 'INDIA');

-- DropForeignKey
ALTER TABLE "otps" DROP CONSTRAINT "otps_customerId_fkey";

-- DropIndex
DROP INDEX "otps_customerId_key";

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "nationality" "NATIONALITY" NOT NULL;

-- AlterTable
ALTER TABLE "otps" DROP COLUMN "customerId",
ADD COLUMN     "customer_id" TEXT;

-- CreateTable
CREATE TABLE "customer_addresses" (
    "id" TEXT NOT NULL,
    "street" TEXT,
    "postal_code" TEXT,
    "map_link" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "customer_id" TEXT NOT NULL,

    CONSTRAINT "customer_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customer_addresses_customer_id_key" ON "customer_addresses"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "otps_customer_id_key" ON "otps"("customer_id");

-- AddForeignKey
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otps" ADD CONSTRAINT "otps_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
