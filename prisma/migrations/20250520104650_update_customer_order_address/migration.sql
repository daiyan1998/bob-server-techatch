/*
  Warnings:

  - Added the required column `district` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `house` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "district" TEXT NOT NULL,
ADD COLUMN     "house" TEXT NOT NULL,
ADD COLUMN     "road" TEXT,
ADD COLUMN     "thana" TEXT,
ALTER COLUMN "street" DROP NOT NULL;
