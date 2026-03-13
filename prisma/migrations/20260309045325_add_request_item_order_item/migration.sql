/*
  Warnings:

  - You are about to drop the column `orderId` on the `requests` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "orders_request_id_key";

-- AlterTable
ALTER TABLE "requests" DROP COLUMN "orderId";

-- CreateTable
CREATE TABLE "request_items" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "product_url" TEXT,
    "product_name" TEXT,
    "description" TEXT,
    "image" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "product_cost" DOUBLE PRECISION,
    "international_shipping_cost" DOUBLE PRECISION,
    "local_shipping_cost" DOUBLE PRECISION,
    "miscellaneous_cost" DOUBLE PRECISION,
    "total_cost" DOUBLE PRECISION,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "admin_notes" TEXT,
    "customer_notes" TEXT,
    "estimated_delivery_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "request_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "request_item_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "request_items" ADD CONSTRAINT "request_items_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_request_item_id_fkey" FOREIGN KEY ("request_item_id") REFERENCES "request_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
