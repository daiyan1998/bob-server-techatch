// smsService.ts
import { OTP_EXPIRATION_MINUTES } from "@/utils/constants";
import * as dotenv from "dotenv";

dotenv.config();

// Message templates for different notification types
const MESSAGE_TEMPLATES = {
  OTP: (message: string) =>
    `Your OTP for Bangal of Books is ${message}. This OTP is valid for ${OTP_EXPIRATION_MINUTES} minutes.`,

  ORDER_CREATED: (name: string, orderId: string, productName: string) =>
    `(Books of Bengal) Hi ${name}, 👋\n\nThank you for your order #${orderId} for ${productName}. We'll process it soon.`,

  ORDER_PROCESSING: (name: string, orderId: string, productName: string) =>
    `(Books of Bengal) Hey ${name}, great news! Your order #${orderId} is now being processed. We'll keep you updated!`,

  ORDER_BOUGHT: (name: string, orderId: string, productName: string) =>
    `(Books of Bengal) Hey ${name}, great news! Your order #${orderId} has been purchased and will be shipped soon.`,

  ORDER_SHIPPED: (name: string, orderId: string, productName: string) =>
    `(Books of Bengal) Hey ${name}, great news! Your order #${orderId} has been shipped and is on its way to you.`,

  ORDER_RECEIVED_SHIPMENT: (
    name: string,
    orderId: string,
    productName: string,
  ) =>
    `(Books of Bengal) Hey ${name}, your order #${orderId} has reached our local warehouse and will be handed over to a local courier soon.`,

  ORDER_ON_DELIVERY: (name: string, orderId: string, productName: string) =>
    `(Books of Bengal) Hey ${name}, great news! Your order #${orderId} is out for delivery today. Please be available to receive it.`,

  ORDER_DELIVERED: (name: string, orderId: string, productName: string) =>
    `(Books of Bengal) Hey ${name}, great news! Your order #${orderId} has been delivered. Thank you for shopping with Books of Bengal!`,

  ORDER_CANCELED: (name: string, orderId: string, productName: string) =>
    `(Books of Bengal) Hi ${name}, your order #${orderId} has been canceled. Please contact support if you have any questions.`,

  REQUEST_APPROVED: (
    name: string,
    productName: string,
    price: string,
    details: string,
  ) =>
    `(Books of Bengal) Hi ${name}, your request is approved! Price: ${price}. Complete your order now. Need help? Call or text us!`,

  REQUEST_REJECTED: (name: string, productName: string, reason: string) =>
    `(Books of Bengal) Hi ${name}, we regret to inform you that your request has been rejected. Reason: ${reason}. Please contact support for more information.`,

  PAYMENT_RECEIVED: (name: string, orderId: string, amount: string) =>
    `(Books of Bengal) Dear ${name}, thanks for choosing Books of Bengal. Your payment of ${amount} for order #${orderId} has been successfully submitted.`,

  SUPPORT_RESOLVED: (name: string, ticketId: string, status: string) =>
    `(Books of Bengal) Hi ${name}, your support ticket #${ticketId} has been ${status}. Thank you for your patience.`,

  CUSTOM: (message: string) => message,
};

export type MessageType = keyof typeof MESSAGE_TEMPLATES;

/**
 * Send SMS using Bulk SMS service
 * @param phoneNumber Recipient phone number
 * @param messageType Type of message to send
 * @param messageParams Array of parameters needed for the message template
 * @param customMessage Optional custom message (used only with MessageType.CUSTOM)
 */
export const sendSMS = async (
  phoneNumber: string,
  messageType: MessageType,
  messageParams: string[],
  customMessage?: string,
): Promise<string> => {
  const apiKey = process.env.BULK_SMS_API_KEY;
  const senderId = process.env.BULK_SMS_SENDER_ID;

  if (!apiKey) {
    const error = "BULK_SMS_API_KEY is not defined in environment variables";
    console.error(error);
    throw new Error(error);
  }

  if (!senderId) {
    const error = "BULK_SMS_SENDER_ID is not defined in environment variables";
    console.error(error);
    throw new Error(error);
  }

  // Generate the message based on the message type
  let message: string;
  if (messageType === "CUSTOM" && customMessage) {
    message = MESSAGE_TEMPLATES.CUSTOM(customMessage);
  } else if (messageType === "OTP") {
    // For OTP, we directly use the OTP code without the name
    message = MESSAGE_TEMPLATES.OTP(messageParams[0]);
  } else if (
    messageType === "ORDER_CREATED" ||
    messageType === "ORDER_PROCESSING" ||
    messageType === "ORDER_BOUGHT" ||
    messageType === "ORDER_SHIPPED" ||
    messageType === "ORDER_RECEIVED_SHIPMENT" ||
    messageType === "ORDER_ON_DELIVERY" ||
    messageType === "ORDER_DELIVERED" ||
    messageType === "ORDER_CANCELED"
  ) {
    message = MESSAGE_TEMPLATES[messageType](
      messageParams[0], // name
      messageParams[1], // orderId
      messageParams[2], // productName
    );
  } else if (messageType === "REQUEST_APPROVED") {
    message = MESSAGE_TEMPLATES.REQUEST_APPROVED(
      messageParams[0], // name
      messageParams[1], // productName
      messageParams[2], // price
      messageParams[3], // details
    );
  } else if (messageType === "REQUEST_REJECTED") {
    message = MESSAGE_TEMPLATES.REQUEST_REJECTED(
      messageParams[0], // name
      messageParams[1], // productName
      messageParams[2], // reason
    );
  } else if (messageType === "PAYMENT_RECEIVED") {
    message = MESSAGE_TEMPLATES.PAYMENT_RECEIVED(
      messageParams[0], // name
      messageParams[1], // orderId
      messageParams[2], // amount
    );
  } else if (messageType === "SUPPORT_RESOLVED") {
    message = MESSAGE_TEMPLATES.SUPPORT_RESOLVED(
      messageParams[0], // name
      messageParams[1], // ticketId
      messageParams[2], // status
    );
  } else {
    // Fallback for any other message type
    message = `Notification from Bangal of Books: ${messageParams.join(" ")}`;
  }

  const apiUrl = "http://bulksmsbd.net/api/smsapi";
  const params = new URLSearchParams({
    api_key: apiKey,
    number: phoneNumber,
    senderid: senderId,
    message: message,
  });

  try {
    const response = await fetch(`${apiUrl}?${params.toString()}`, {
      method: "POST",
    });

    if (!response.ok) {
      const errorMsg = `HTTP error! Status: ${response.status}`;
      throw new Error(errorMsg);
    }

    const data = await response.text();
    return data;
  } catch (error: any) {
    const errorMsg = "Error sending SMS: " + error.message;
    throw new Error(errorMsg);
  }
};

// Keep the original function for backward compatibility
export const sendOtp = async (
  phoneNumbers: string,
  message: string,
): Promise<string> => {
  return sendSMS(phoneNumbers, "OTP", [message]);
};
