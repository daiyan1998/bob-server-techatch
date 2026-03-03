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
  console.log("Clearing existing data from Request table...");
  await db.request.deleteMany();
  console.log("Existing data cleared.");

  const numberOfRequests = 20;
  const customers = await db.customer.findMany();

  for (let i = 0; i < numberOfRequests; i++) {
    const customer = faker.helpers.arrayElement(customers);
    const productUrl = faker.internet.url();
    const productName = faker.commerce.productName();
    const description = faker.lorem.sentence();
    const image = faker.image.urlPicsumPhotos();
    const quantity = faker.number.int({ min: 1, max: 10 });
    const status = "PENDING";
    const requestType = faker.helpers.arrayElement(["LINK", "DIRECT"]);
    const createdAt = faker.date.past();
    const updatedAt = faker.date.recent();

    await db.request.create({
      data: {
        customer: { connect: { id: customer.id } },
        productUrl,
        productName,
        description,
        image,
        quantity,
        productCost: null,
        internationalShippingCost: null,
        localShippingCost: null,
        miscellaneousCost: null,
        status,
        adminNotes: null,
        customerNotes: null,
        estimatedDeliveryDate: null,
        createdAt,
        updatedAt,
        requestType,
      },
    });
  }

  console.log(`Seeded ${numberOfRequests} product requests`);
}

async function createOrders() {
  console.log("Clearing existing data from Order table...");
  await db.order.deleteMany();
  console.log("Existing data cleared.");

  // First, check if we have customers
  const customers = await db.customer.findMany();
  if (customers.length === 0) {
    console.log("No customers found. Please run createCustomers() first.");
    return;
  }

  // Get requests that don't already have an order
  let availableRequests = await db.request.findMany({
    where: {
      orderId: null,
      status: "APPROVED", // Only approved requests should become orders
    },
  });

  // If we don't have enough approved requests, update some to be approved
  if (availableRequests.length < 10) {
    console.log(
      "Not enough approved requests. Approving some pending requests...",
    );
    const pendingRequests = await db.request.findMany({
      where: {
        status: "PENDING",
        orderId: null,
      },
      take: 20 - availableRequests.length,
    });

    for (const request of pendingRequests) {
      await db.request.update({
        where: { id: request.id },
        data: {
          status: "APPROVED",
          productCost: faker.number.float({ min: 50, max: 5000 }),
          internationalShippingCost: faker.number.float({ min: 10, max: 500 }),
          miscellaneousCost: faker.number.float({ min: 5, max: 100 }),
        },
      });
    }

    // Refresh the available requests list
    availableRequests = await db.request.findMany({
      where: {
        orderId: null,
        status: "APPROVED",
      },
    });
  }

  // If we still don't have any requests, create some
  if (availableRequests.length === 0) {
    console.log("No available requests found. Creating new requests...");

    for (let i = 0; i < 20; i++) {
      const customer = faker.helpers.arrayElement(customers);
      const productName = faker.commerce.productName();
      const productCost = faker.number.float({ min: 50, max: 5000 });
      const internationalShippingCost = faker.number.float({
        min: 10,
        max: 500,
      });
      const miscellaneousCost = faker.number.float({ min: 5, max: 100 });

      await db.request.create({
        data: {
          customer: { connect: { id: customer.id } },
          productUrl: faker.internet.url(),
          productName,
          description: faker.lorem.sentence(),
          image: faker.image.urlPicsumPhotos(),
          quantity: faker.number.int({ min: 1, max: 10 }),
          productCost,
          internationalShippingCost,
          miscellaneousCost,
          status: "APPROVED",
          requestType: faker.helpers.arrayElement(["LINK", "DIRECT"]),
        },
      });
    }

    // Refresh the available requests list again
    availableRequests = await db.request.findMany({
      where: {
        orderId: null,
        status: "APPROVED",
      },
    });
  }

  console.log(
    `Found ${availableRequests.length} available requests for orders`,
  );

  // Create orders for each available request
  const numberOfOrders = Math.min(20, availableRequests.length);

  for (let i = 0; i < numberOfOrders; i++) {
    const request = availableRequests[i];
    const customer = await db.customer.findUnique({
      where: { id: request.customerId },
    });

    if (!customer) {
      console.log(`No customer found for request ${request.id}. Skipping.`);
      continue;
    }

    const status = faker.helpers.arrayElement([
      "PENDING",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
    ]);

    const street = faker.location.streetAddress();
    const postalCode = faker.location.zipCode();
    const mapLink = `https://maps.google.com/?q=${faker.location.latitude()},${faker.location.longitude()}`;
    const thana = faker.location.city();
    const district = faker.location.state();
    const house = faker.location.buildingNumber();
    const road = faker.location.street();

    // Calculate total cost from request
    const totalCost =
      (request.productCost || 0) +
      (request.internationalShippingCost || 0) +
      (request.miscellaneousCost || 0);

    await db.order.create({
      data: {
        status,
        street,
        postalCode,
        thana,
        district,
        house,
        road,
        mapLink,
        totalCost,
        customer: { connect: { id: customer.id } },
        request: { connect: { id: request.id } },
      },
    });
  }

  console.log(`Seeded ${numberOfOrders} orders.`);
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
  await createCustomers();
  await createProductRequests();
  await createOrders();
  await createPayments();
  await createSupportTickets();

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
