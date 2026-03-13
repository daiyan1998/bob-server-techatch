/*
  Warnings:

  - A unique constraint covering the columns `[trans_id]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[payment_id]` on the table `payments` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "RefundReason" AS ENUM ('DAMAGED_PRODUCT', 'WRONG_PRODUCT', 'DELAYED_DELIVERY', 'CHANGED_MIND', 'OTHER');

-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'REFUNDED';

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'FAILED';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "is_refunded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "refunded_amount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "payment_id" TEXT;

-- CreateTable
CREATE TABLE "refund_requests" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "reason" "RefundReason" NOT NULL,
    "description" TEXT,
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "attachments" TEXT[],
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "processed_at" TIMESTAMP(3),
    "processed_by" TEXT,
    "refund_method" TEXT,
    "transaction_id" TEXT,

    CONSTRAINT "refund_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "refund_requests_order_id_key" ON "refund_requests"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_trans_id_key" ON "payments"("trans_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_payment_id_key" ON "payments"("payment_id");

-- AddForeignKey
ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
