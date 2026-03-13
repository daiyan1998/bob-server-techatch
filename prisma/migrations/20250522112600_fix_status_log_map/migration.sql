/*
  Warnings:

  - You are about to drop the column `newStatus` on the `order_status_logs` table. All the data in the column will be lost.
  - You are about to drop the column `oldStatus` on the `order_status_logs` table. All the data in the column will be lost.
  - Added the required column `new_status` to the `order_status_logs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "order_status_logs" DROP COLUMN "newStatus",
DROP COLUMN "oldStatus",
ADD COLUMN     "new_status" "OrderStatus" NOT NULL,
ADD COLUMN     "old_status" "OrderStatus";
