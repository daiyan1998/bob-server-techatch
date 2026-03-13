import { db } from "@/db";
import { faker } from "@faker-js/faker";
import { NATIONALITY, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

async function createPanelUser() {
  console.log("Clearing existing data from User table...");
  await db.user.deleteMany();
  console.log("Existing data cleared.");

  const user = {
    firstName: "John",
    lastName: "Doe",
    email: "admin@base.com",
    phone: "01521401200",
    password: await bcrypt.hash("password", 10),
    role: Role.ADMIN,
  };

  await db.user.create({
    data: user,
  });

  console.log(`Created user: ${user.firstName} ${user.lastName}`);
  console.log("Seeding finished.");
}

async function createCustomers() {
  const numberOfCustomers = 20;

  for (let i = 0; i < numberOfCustomers; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email();
    const phone = faker.phone.number();
    const password = faker.internet.password();
    const nationality = faker.helpers.arrayElement(["BANGLADESH", "INDIA"]);
    const image = faker.image.avatar();
    const bio = faker.lorem.sentence();
    const isVerified = faker.datatype.boolean();
    const createdAt = faker.date.past();
    const updatedAt = faker.date.recent();

    await db.customer.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        password,
        nationality,
        image,
        bio,
        isVerified,
        createdAt,
        updatedAt,
      },
    });
  }

  console.log(`Seeded ${numberOfCustomers} customers.`);
}

async function createProductRequests() {
  console.log("Clearing existing data from Request and RequestItem tables...");
  await db.requestItem.deleteMany();
  await db.request.deleteMany();
  console.log("Existing data cleared.");

  const numberOfRequests = 20;
  const customers = await db.customer.findMany();

  for (let i = 0; i < numberOfRequests; i++) {
    const customer = faker.helpers.arrayElement(customers);
    const requestType = faker.helpers.arrayElement(["LINK", "DIRECT"]) as
      | "LINK"
      | "DIRECT";
    const status = "PENDING" as const;
    const createdAt = faker.date.past();
    const updatedAt = faker.date.recent();

    // Each request gets 1-3 items
    const numItems = faker.number.int({ min: 1, max: 3 });
    const items = [];

    for (let j = 0; j < numItems; j++) {
      items.push({
        productUrl: faker.internet.url(),
        productName: faker.commerce.productName(),
        description: faker.lorem.sentence(),
        image: faker.image.urlPicsumPhotos(),
        quantity: faker.number.int({ min: 1, max: 10 }),
        status,
      });
    }

    await db.request.create({
      data: {
        customer: { connect: { id: customer.id } },
        status,
        requestType,
        createdAt,
        updatedAt,
        items: {
          create: items,
        },
      },
    });
  }

  console.log(`Seeded ${numberOfRequests} product requests with items.`);
}

async function createOrders() {
  console.log("Clearing existing data from Order table...");
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  console.log("Existing data cleared.");

  // First, check if we have customers
  const customers = await db.customer.findMany();
  if (customers.length === 0) {
    console.log("No customers found. Please run createCustomers() first.");
    return;
  }

  // Get requests that have approved items
  let availableRequests = await db.request.findMany({
    where: {
      status: "PENDING",
    },
    include: { items: true },
  });

  // Approve some requests and their items with costs
  if (availableRequests.length > 0) {
    console.log("Approving some requests and their items...");

    const toApprove = availableRequests.slice(
      0,
      Math.min(15, availableRequests.length),
    );

    for (const request of toApprove) {
      // Approve each item with costs
      for (const item of request.items) {
        const productCost = faker.number.float({ min: 50, max: 5000 });
        const internationalShippingCost = faker.number.float({
          min: 10,
          max: 500,
        });
        const localShippingCost = faker.number.float({ min: 5, max: 200 });
        const miscellaneousCost = faker.number.float({ min: 5, max: 100 });
        const totalCost =
          productCost +
          internationalShippingCost +
          localShippingCost +
          miscellaneousCost;

        await db.requestItem.update({
          where: { id: item.id },
          data: {
            status: "APPROVED",
            productCost,
            internationalShippingCost,
            localShippingCost,
            miscellaneousCost,
            totalCost,
          },
        });
      }

      // Update request status
      await db.request.update({
        where: { id: request.id },
        data: { status: "APPROVED" },
      });
    }
  }

  // Refresh approved requests with items
  const approvedRequests = await db.request.findMany({
    where: { status: "APPROVED" },
    include: {
      items: {
        where: { status: "APPROVED" },
      },
    },
  });

  console.log(`Found ${approvedRequests.length} approved requests for orders.`);

  const numberOfOrders = Math.min(10, approvedRequests.length);

  for (let i = 0; i < numberOfOrders; i++) {
    const request = approvedRequests[i];
    const customer = await db.customer.findUnique({
      where: { id: request.customerId },
    });

    if (!customer || request.items.length === 0) continue;

    const status = faker.helpers.arrayElement([
      "PENDING",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
    ]) as "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED";

    const totalCost = request.items.reduce(
      (sum, item) => sum + (item.totalCost || 0),
      0,
    );

    await db.order.create({
      data: {
        status,
        street: faker.location.streetAddress(),
        postalCode: faker.location.zipCode(),
        thana: faker.location.city(),
        district: faker.location.state(),
        house: faker.location.buildingNumber(),
        road: faker.location.street(),
        mapLink: `https://maps.google.com/?q=${faker.location.latitude()},${faker.location.longitude()}`,
        totalCost,
        customer: { connect: { id: customer.id } },
        request: { connect: { id: request.id } },
        items: {
          create: request.items.map((item) => ({
            requestItemId: item.id,
            quantity: item.quantity,
            price: item.totalCost || 0,
          })),
        },
      },
    });
  }

  console.log(`Seeded ${numberOfOrders} orders with items.`);
}

async function createPayments() {
  console.log("Clearing existing data from Payment table...");
  await db.payment.deleteMany();
  console.log("Existing data cleared.");

  const orders = await db.order.findMany({
    where: {
      payments: null,
    },
    include: {
      customer: true,
    },
  });

  if (orders.length === 0) {
    console.log("No orders available to create payments for.");
    return;
  }

  const numberOfPayments = Math.min(20, orders.length);

  for (let i = 0; i < numberOfPayments; i++) {
    const order = orders[i];
    const status = faker.helpers.arrayElement(["PENDING", "PAID"]);
    const vendor = faker.helpers.arrayElement(["RAZORPAY", "BKASH"]);
    const amount = order.totalCost;
    const currency = "BDT";
    const razorPayId = status === "PAID" ? faker.string.uuid() : null;
    const transId = status === "PAID" ? `TXN${faker.string.numeric(10)}` : null;

    await db.payment.create({
      data: {
        amount,
        currency,
        razorPayId,
        status,
        transId,
        vendor,
        order: { connect: { id: order.id } },
        customer: { connect: { id: order.customer?.id } },
      },
    });
  }

  console.log(`Seeded ${numberOfPayments} payments.`);
}

async function createSupportTickets() {
  console.log("Clearing existing data from SupportTicket table...");
  await db.supportTicket.deleteMany();
  console.log("Existing data cleared.");

  const numberOfTickets = 20;
  const customers = await db.customer.findMany();

  if (customers.length === 0) {
    console.log("No customers available to create support tickets for.");
    return;
  }

  for (let i = 0; i < numberOfTickets; i++) {
    const customer = faker.helpers.arrayElement(customers);
    const title = faker.lorem.words(5);
    const description = faker.lorem.paragraph();
    const attachment = faker.datatype.boolean()
      ? faker.image.urlLoremFlickr()
      : null;
    const status = faker.helpers.arrayElement(["PENDING", "RESOLVED"]);

    await db.supportTicket.create({
      data: {
        title,
        description,
        attachment,
        status,
        customer: { connect: { id: customer.id } },
      },
    });
  }

  console.log(`Seeded ${numberOfTickets} support tickets.`);
}

async function main() {
  await createPanelUser();
  // await createCustomers();
  // await createProductRequests();
  // await createOrders();
  // await createPayments();
  // await createSupportTickets();
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
