-- CreateEnum
CREATE TYPE "NotificationRqeuqestType" AS ENUM ('POSITIVE', 'NEGATIVE');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ORDER', 'REQUEST', 'PAYMENT');

-- CreateTable
CREATE TABLE "notifications_customer" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "notification_type" "NotificationType" NOT NULL,
    "notification_rqeuqest_type" "NotificationRqeuqestType" NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customer_id" TEXT,

    CONSTRAINT "notifications_customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications_admin" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "notification_type" "NotificationType" NOT NULL,
    "notification_rqeuqest_type" "NotificationRqeuqestType" NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_admin_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "notifications_customer" ADD CONSTRAINT "notifications_customer_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
