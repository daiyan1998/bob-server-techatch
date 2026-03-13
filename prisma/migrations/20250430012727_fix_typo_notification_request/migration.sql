/*
  Warnings:

  - You are about to drop the column `notification_rqeuqest_type` on the `notifications_admin` table. All the data in the column will be lost.
  - You are about to drop the column `notification_rqeuqest_type` on the `notifications_customer` table. All the data in the column will be lost.
  - Added the required column `notification_request_type` to the `notifications_admin` table without a default value. This is not possible if the table is not empty.
  - Added the required column `notification_request_type` to the `notifications_customer` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "NotificationRequestType" AS ENUM ('POSITIVE', 'NEGATIVE');

-- AlterTable
ALTER TABLE "notifications_admin" DROP COLUMN "notification_rqeuqest_type",
ADD COLUMN     "notification_request_type" "NotificationRequestType" NOT NULL;

-- AlterTable
ALTER TABLE "notifications_customer" DROP COLUMN "notification_rqeuqest_type",
ADD COLUMN     "notification_request_type" "NotificationRequestType" NOT NULL;

-- DropEnum
DROP TYPE "NotificationRqeuqestType";
