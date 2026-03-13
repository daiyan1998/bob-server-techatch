/*
  Warnings:

  - You are about to drop the column `createdAt` on the `otps` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `otps` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `otps` table. All the data in the column will be lost.
  - You are about to drop the column `phone_number` on the `otps` table. All the data in the column will be lost.
  - The `created_at` column on the `otps` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[customerId]` on the table `otps` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `expires_at` to the `otps` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "otps_email_key";

-- DropIndex
DROP INDEX "otps_phone_number_key";

-- AlterTable
ALTER TABLE "otps" DROP COLUMN "createdAt",
DROP COLUMN "email",
DROP COLUMN "expiresAt",
DROP COLUMN "phone_number",
ADD COLUMN     "customerId" TEXT,
ADD COLUMN     "expires_at" TIMESTAMP(3) NOT NULL,
DROP COLUMN "created_at",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "otps_customerId_key" ON "otps"("customerId");

-- AddForeignKey
ALTER TABLE "otps" ADD CONSTRAINT "otps_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
