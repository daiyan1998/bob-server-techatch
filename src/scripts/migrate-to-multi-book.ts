/**
 * Data Migration Script: Migrate existing single-book requests/orders
 * to the new multi-book model (RequestItem + OrderItem).
 *
 * Usage: npx tsx src/scripts/migrate-to-multi-book.ts
 */

import { db } from "@/db";

async function migrate() {
  console.log("Starting multi-book data migration...\n");

  const requests = await db.request.findMany({
    include: {
      orders: true,
    },
  });

  console.log(`Found ${requests.length} existing requests to migrate.\n`);

  let requestItemsCreated = 0;
  let orderItemsCreated = 0;

  for (const request of requests) {
    await db.$transaction(async (tx) => {
      // Step 1: Create a RequestItem from the Request's book fields
      const requestItem = await tx.requestItem.create({
        data: {
          requestId: request.id,
          productUrl: request.productUrl,
          productName: request.productName,
          description: request.description,
          image: request.image,
          quantity: request.quantity,
          productCost: request.productCost,
          internationalShippingCost: request.internationalShippingCost,
          localShippingCost: request.localShippingCost,
          miscellaneousCost: request.miscellaneousCost,
          totalCost: request.totalCost,
          status: request.status,
          adminNotes: request.adminNotes,
          customerNotes: request.customerNotes,
          estimatedDeliveryDate: request.estimatedDeliveryDate,
        },
      });

      requestItemsCreated++;

      // Step 2: For each order linked to this request, create an OrderItem
      for (const order of request.orders) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            requestItemId: requestItem.id,
            quantity: request.quantity,
            price: request.totalCost || 0,
          },
        });
        orderItemsCreated++;
      }
    });
  }

  console.log(`Migration complete!`);
  console.log(`  RequestItems created: ${requestItemsCreated}`);
  console.log(`  OrderItems created:   ${orderItemsCreated}`);
}

migrate()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (error) => {
    console.error("Migration failed:", error);
    await db.$disconnect();
    process.exit(1);
  });
