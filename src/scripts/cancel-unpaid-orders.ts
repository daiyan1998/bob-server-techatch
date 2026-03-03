// This is a script to cancel unpaid orders after 24 hours
// You can set this up as a cron job

import {
  PrismaClient,
  OrderStatus,
  PaymentStatus,
  NotificationType,
  NotificationRequestType,
  Prisma,
} from "@prisma/client";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize Prisma client
const prisma = new PrismaClient();

async function cancelUnpaidOrders(): Promise<void> {
  console.log("Starting to check for unpaid orders...");

  try {
    // Get the date 24 hours ago
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    // Find orders that are still pending and were created more than 24 hours ago
    const unpaidOrders = await prisma.order.findMany({
      where: {
        status: OrderStatus.PENDING,
        createdAt: {
          lt: twentyFourHoursAgo,
        },
        payments: {
          status: PaymentStatus.PENDING,
        },
      },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        request: {
          select: {
            productName: true,
          },
        },
      },
    });

    console.log(`Found ${unpaidOrders.length} unpaid orders to cancel`);

    // Process each order
    for (const order of unpaidOrders) {
      console.log(`Canceling order ${order.id}`);

      // Update the order status to CANCELED
      await prisma.$transaction(async (tx) => {
        // Update order status
        const updated = await tx.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.CANCELED,
          },
        });

        // Update payment status to FAILED
        await tx.payment.updateMany({
          where: {
            orderId: order.id,
            status: PaymentStatus.PENDING,
          },
          data: {
            status: PaymentStatus.FAILED,
          },
        });

        // Create status log entry
        await tx.orderStatusLog.create({
          data: {
            orderId: order.id,
            oldStatus: order.status,
            newStatus: OrderStatus.CANCELED,
            updatedBy: "SYSTEM", // Indicate this was done by the system
          },
        });

        // Create notification for customer
        await tx.notificationCustomer.create({
          data: {
            title: `Order automatically canceled due to payment timeout`,
            description: `Your order #${order.id} has been canceled because payment was not received within 24 hours.`,
            relevantId: order.id,
            customerId: order.customerId,
            notificationType: NotificationType.ORDER,
            notificationRequestType: NotificationRequestType.NEGATIVE,
          },
        });

        return updated;
      });

      console.log(`Successfully canceled order ${order.id}`);
    }

    console.log("Completed canceling unpaid orders");
  } catch (error) {
    console.error("Error canceling unpaid orders:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the function
cancelUnpaidOrders()
  .then(() => {
    console.log("Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
