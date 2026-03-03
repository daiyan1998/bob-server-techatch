import { db } from "@/db";
import { OrderStatus, RequestStatus } from "@prisma/client";

export const fetchAnalytics = async () => {
  const [
    pendingRequestsCount,
    processingOrdersCount,
    receivedShipmentsCount,
    monthlyOrdersCount,
    chartData,
  ] = await Promise.all([
    getPendingRequestsCount(),
    getProcessingOrdersCount(),
    getReceivedShipmentsCount(),
    getMonthlyOrdersCount(),
    getCurrentYearMonthlyAnalytics(),
  ]);

  return {
    pendingRequestsCount,
    processingOrdersCount,
    receivedShipmentsCount,
    monthlyOrdersCount,
    chartData,
  };
};

const getPendingRequestsCount = async () => {
  return await db.request.count({
    where: {
      status: RequestStatus.PENDING,
    },
  });
};

const getProcessingOrdersCount = async () => {
  return await db.order.count({
    where: {
      status: OrderStatus.PROCESSING,
    },
  });
};

const getReceivedShipmentsCount = async () => {
  return await db.order.count({
    where: {
      status: OrderStatus.RECEIVED_SHIPMENT,
    },
  });
};

const getMonthlyOrdersCount = async () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return db.order.count({
    where: {
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
  });
};

const getCurrentYearMonthlyAnalytics = async () => {
  const currentYear = new Date().getFullYear();
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const [requestResults, orderResults] = await Promise.all([
    db.request.groupBy({
      by: ["createdAt"],
      where: {
        createdAt: {
          gte: new Date(`${currentYear}-01-01`),
          lte: new Date(`${currentYear}-12-31`),
        },
      },
      _count: {
        _all: true,
      },
    }),
    db.order.groupBy({
      by: ["createdAt"],
      where: {
        createdAt: {
          gte: new Date(`${currentYear}-01-01`),
          lte: new Date(`${currentYear}-12-31`),
        },
      },
      _count: {
        _all: true,
      },
    }),
  ]);

  const monthlyRequests = new Array(12).fill(0);
  const monthlyOrders = new Array(12).fill(0);

  requestResults.forEach((result) => {
    const month = new Date(result.createdAt).getMonth();
    monthlyRequests[month] += result._count._all;
  });

  orderResults.forEach((result) => {
    const month = new Date(result.createdAt).getMonth();
    monthlyOrders[month] += result._count._all;
  });

  return monthNames.map((month, index) => ({
    month,
    productRequests: monthlyRequests[index],
    orders: monthlyOrders[index],
  }));
};
