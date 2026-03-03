import { NATIONALITY } from "@prisma/client";
import { sendSMS, MessageType } from "@/configs/sms/bulk-sms";
import {
  sendWhatsAppMessage,
  WhatsAppTemplateType,
} from "@/configs/sms/ai-sensy-sms";
import { sendEmail, EmailTemplateType } from "@/configs/email/node_mailer";
import { findCustomerById } from "./customers.service";

/**
 * Unified notification service that handles sending notifications via SMS, WhatsApp, or Email
 * based on customer preferences and nationality
 */
export const sendNotification = async (
  customerId: string,
  notificationType:
    | "OTP"
    | "ORDER_UPDATE"
    | "PAYMENT"
    | "REQUEST_UPDATE"
    | "SUPPORT",
  params: {
    smsMessageType?: MessageType;
    whatsappTemplateType?: WhatsAppTemplateType;
    emailTemplateType?: EmailTemplateType;
    messageData: string[];
    customMessage?: string;
  },
): Promise<boolean> => {
  try {
    // Get customer details
    const customer = await findCustomerById(customerId);

    if (!customer) {
      console.error(
        `Cannot send notification: Customer with ID ${customerId} not found`,
      );
      return false;
    }

    const { firstName, lastName, email, phone, nationality } = customer;
    const fullName = `${firstName} ${lastName}`;

    // Track if any notification method succeeded
    let notificationSent = false;

    // Send SMS for Bangladesh customers
    if (
      nationality === NATIONALITY.BANGLADESH &&
      phone &&
      params.smsMessageType
    ) {
      try {
        // For SMS, always include the customer name as the first parameter
        const smsParams = [fullName, ...params.messageData];
        await sendSMS(
          phone,
          params.smsMessageType,
          smsParams,
          params.customMessage,
        );
        notificationSent = true;
        console.log(`SMS sent to ${phone} (${fullName})`);
      } catch (error) {
        console.error(`Failed to send SMS to ${phone}:`, error);
      }
    }

    // Send WhatsApp for non-Bangladesh customers
    if (
      nationality !== NATIONALITY.BANGLADESH &&
      phone &&
      params.whatsappTemplateType
    ) {
      try {
        await sendWhatsAppMessage(
          phone,
          params.whatsappTemplateType,
          fullName,
          ...params.messageData,
        );
        notificationSent = true;
        console.log(`WhatsApp message sent to ${phone} (${fullName})`);
      } catch (error) {
        console.error(`Failed to send WhatsApp message to ${phone}:`, error);
      }
    }

    // Send email if available (as a backup or additional channel)
    if (email && params.emailTemplateType) {
      try {
        // For email, always include the customer name as the first parameter
        const emailParams = [fullName, ...params.messageData];
        await sendEmail(email, params.emailTemplateType, emailParams);
        notificationSent = true;
        console.log(`Email sent to ${email} (${fullName})`);
      } catch (error) {
        console.error(`Failed to send email to ${email}:`, error);
      }
    }

    return notificationSent;
  } catch (error) {
    console.error("Error in sendNotification:", error);
    return false;
  }
};

/**
 * Send OTP notification
 * Only sends SMS or WhatsApp based on nationality, no email
 */
export const sendOtpNotification = async (
  customerId: string,
  otpCode: string,
): Promise<boolean> => {
  try {
    // Get customer details
    const customer = await findCustomerById(customerId);

    if (!customer) {
      console.error(
        `Cannot send OTP: Customer with ID ${customerId} not found`,
      );
      return false;
    }

    const { firstName, lastName, phone, nationality } = customer;
    const fullName = `${firstName} ${lastName}`;

    // Track if notification was sent
    let notificationSent = false;

    // Send SMS for Bangladesh customers
    if (nationality === NATIONALITY.BANGLADESH && phone) {
      try {
        await sendSMS(phone, "OTP", [otpCode]);
        notificationSent = true;
        console.log(`OTP SMS sent to ${phone} (${fullName})`);
      } catch (error) {
        console.error(`Failed to send OTP SMS to ${phone}:`, error);
      }
    }

    // Send WhatsApp for non-Bangladesh customers
    // if (nationality !== NATIONALITY.BANGLADESH && phone) {
    //   try {
    //     await sendWhatsAppMessage(phone, "OTP", fullName, otpCode);
    //     notificationSent = true;
    //     console.log(`OTP WhatsApp message sent to ${phone} (${fullName})`);
    //   } catch (error) {
    //     console.error(
    //       `Failed to send OTP WhatsApp message to ${phone}:`,
    //       error,
    //     );
    //   }
    // }

    return notificationSent;
  } catch (error) {
    console.error("Error in sendOtpNotification:", error);
    return false;
  }
};

/*
 * Send OTP notification
 * Only sends email
 */
export const sendEmailOtpNotification = async (
  customerId: string,
  otpCode: string,
): Promise<boolean> => {
  try {
    // Get customer details
    const customer = await findCustomerById(customerId);

    if (!customer) {
      console.error(
        `Cannot send OTP: Customer with ID ${customerId} not found`,
      );
      return false;
    }

    const { firstName, lastName, email } = customer;
    const fullName = `${firstName} ${lastName}`;

    // Track if notification was sent
    let notificationSent = false;

    // Send email if available
    if (email) {
      try {
        await sendEmail(email, "OTP", [otpCode], 'OTP');
        notificationSent = true;
        console.log(`OTP email sent to ${email} (${fullName})`);
      } catch (error) {
        console.error(`Failed to send OTP email to ${email}:`, error);
      }
    }

    return notificationSent;
  } catch (error) {
    console.error("Error in sendEmailOtpNotification:", error);
    return false;
  }
};

/**
 * Send order status update notification
 */
export const sendOrderStatusNotification = async (
  customerId: string,
  name: string,
  productName: string,
  orderId: string,
  status: string,
): Promise<boolean> => {
  return sendNotification(customerId, "ORDER_UPDATE", {
    smsMessageType:
      status === "CANCELED"
        ? "ORDER_CANCELED"
        : status === "SHIPPED"
          ? "ORDER_SHIPPED"
          : status === "DELIVERED"
            ? "ORDER_DELIVERED"
            : status === "BOUGHT"
              ? "ORDER_BOUGHT"
              : status === "RECEIVED_SHIPMENT"
                ? "ORDER_RECEIVED_SHIPMENT"
                : status === "ON_DELIVERY"
                  ? "ORDER_ON_DELIVERY"
                  : "ORDER_PROCESSING",
    whatsappTemplateType: "ORDER_UPDATE",
    emailTemplateType: "ORDER_STATUS",
    messageData: [orderId, productName, status],
  });
};

/**
 * Send payment confirmation notification
 */
export const sendPaymentNotification = async (
  customerId: string,
  orderId: string,
  amount: string,
): Promise<boolean> => {
  return sendNotification(customerId, "PAYMENT", {
    smsMessageType: "PAYMENT_RECEIVED",
    whatsappTemplateType: "PAYMENT_CONFIRMATION",
    emailTemplateType: "PAYMENT_CONFIRMATION",
    messageData: [orderId, amount],
  });
};

/**
 * Send request status update notification
 */
export const sendRequestStatusNotification = async (
  customerId: string,
  status: string,
  productName: string,
  price: string,
  details: string,
): Promise<boolean> => {
  return sendNotification(customerId, "REQUEST_UPDATE", {
    smsMessageType:
      status === "APPROVED" ? "REQUEST_APPROVED" : "REQUEST_REJECTED",
    whatsappTemplateType: "REQUEST_UPDATE",
    emailTemplateType: "REQUEST_UPDATE",
    messageData: [productName, price, details, status],
  });
};

/**
 * Send support ticket update notification
 */
export const sendSupportTicketNotification = async (
  customerId: string,
  ticketId: string,
  status: string,
): Promise<boolean> => {
  return sendNotification(customerId, "SUPPORT", {
    smsMessageType: "SUPPORT_RESOLVED",
    whatsappTemplateType: "SUPPORT_UPDATE",
    emailTemplateType: "SUPPORT_TICKET",
    messageData: [ticketId, status],
  });
};

