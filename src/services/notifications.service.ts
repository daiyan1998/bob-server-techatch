import { db } from "@/db";
import { NotificationRequestType, NotificationType } from "@prisma/client";

export const createCustomerNotification = async (
  title: string,
  description: string,
  relevantId: string,
  customerId: string,
  notificationType: NotificationType,
  notificationRequestType: NotificationRequestType,
) => {
  try {
    const notification = await db.notificationCustomer.create({
      data: {
        customerId: customerId,
        title,
        description,
        relevantId,
        notificationType,
        notificationRequestType,
      },
    });

    return notification;
  } catch (error) {
    console.error("Error creating product request:", error);
    throw new Error("Error creating product request.");
  }
};

export const createAdminNotification = async (
  title: string,
  description: string,
  relevantId: string,
  notificationType: NotificationType,
  notificationRequestType: NotificationRequestType,
) => {
  try {
    const notification = await db.notificationAdmin.create({
      data: {
        title,
        description,
        relevantId,
        notificationType,
        notificationRequestType,
      },
    });

    return notification;
  } catch (error) {
    console.error("Error creating product request:", error);
    throw new Error("Error creating product request.");
  }
};

export const updateCustomerNotification = async (id: number) => {
  try {
    const notification = await db.notificationCustomer.update({
      where: { id },
      data: {
        isRead: true,
      },
    });

    return notification;
  } catch (error) {
    console.error("Error creating product request:", error);
    throw new Error("Error creating product request.");
  }
};

export const updateAdminNotification = async (id: number) => {
  try {
    const notification = await db.notificationAdmin.update({
      where: { id },
      data: {
        isRead: true,
      },
    });

    return notification;
  } catch (error) {
    console.error("Error creating product request:", error);
    throw new Error("Error creating product request.");
  }
};

export const fetchAdminNotification = async (
  page: number = 1,
  pageSize: number = 10,
) => {
  try {
    const totalCount = await db.notificationAdmin.count();

    const unreadCount = await db.notificationAdmin.count({
      where: { isRead: false },
    });

    const notifications = await db.notificationAdmin.findMany({
      take: pageSize,
      skip: (page - 1) * pageSize,
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      page,
      pageSize,
      totalCount,
      unreadCount,
      totalPages: Math.ceil(totalCount / pageSize),
      notifications,
    };
  } catch (error) {
    console.error("Error fetching admin notifications:", error);
    throw new Error("Error fetching admin notifications.");
  }
};

export const fetchCustomerNotification = async (
  customerId: string,
  page: number = 1,
  pageSize: number = 10,
) => {
  try {
    const totalCount = await db.notificationCustomer.count({
      where: { customerId },
    });

    const unreadCount = await db.notificationCustomer.count({
      where: { isRead: false, customerId },
    });

    const notifications = await db.notificationCustomer.findMany({
      where: { customerId },
      take: pageSize,
      skip: (page - 1) * pageSize,
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      page,
      pageSize,
      totalCount,
      unreadCount,
      totalPages: Math.ceil(totalCount / pageSize),
      notifications,
    };
  } catch (error) {
    console.error("Error fetching customer notifications:", error);
    throw new Error("Error fetching customer notifications.");
  }
};
