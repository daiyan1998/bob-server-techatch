import { OTP_EXPIRATION_MINUTES } from "@/utils/constants";
import nodemailer from "nodemailer";

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.SMTP_USER || "user@example.com",
//     pass: process.env.SMTP_PASS || "password",
//   },
// });

const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'juliana.bernier@ethereal.email',
        pass: 'YpwwEjA1XgxPcW1hzj'
    }
});

// Email templates for different notification types
const EMAIL_TEMPLATES = {
  OTP: {
    subject: "Your OTP Code",
    text: (otp: string) =>
      `Your OTP is: ${otp}. It will expire in ${OTP_EXPIRATION_MINUTES} minutes.`,
    html: (otp: string) =>
      `<h1>Your OTP Code</h1>
            <p>Your OTP is: <strong>${otp}</strong></p>
            <p>It will expire in ${OTP_EXPIRATION_MINUTES} minutes.</p>`,
  },
  ORDER_CREATED: {
    subject: "Order Confirmation",
    text: (name: string, orderId: string, productName: string, total: string) =>
      `(Books of Bengal) Hi ${name}, 👋\n\nThank you for your order #${orderId} for ${productName}. Your total is ${total}.`,
    html: (name: string, orderId: string, productName: string, total: string) =>
      `<h1>Order Confirmation</h1>
            <p>Hi ${name}, 👋</p>
            <p>Thank you for your order <strong>#${orderId}</strong> for <strong>${productName}</strong>.</p>
            <p>Your total is <strong>${total}</strong>.</p>`,
  },
  ORDER_STATUS: {
    subject: "Order Status Update",
    text: (
      name: string,
      orderId: string,
      productName: string,
      status: string,
    ) => {
      let statusMessage = "";

      switch (status) {
        case "PROCESSING":
          statusMessage = "Your order is now being processed. We'll keep you updated!";
          break;
        case "BOUGHT":
          statusMessage =
            "Your order has been purchased and will be shipped soon.";
          break;
        case "SHIPPED":
          statusMessage = "Your order has been shipped and is on its way.";
          break;
        case "RECEIVED_SHIPMENT":
          statusMessage =
            "Your order has reached our local warehouse and will be handed over to a local courier soon.";
          break;
        case "ON_DELIVERY":
          statusMessage =
            "Your order is out for delivery today. Please be available to receive it.";
          break;
        case "DELIVERED":
          statusMessage =
            "Your order has been delivered. Thank you for shopping with us!";
          break;
        default:
          statusMessage = `Your order status has been updated to: ${status}.`;
      }

      return `(Books of Bengal) Hey ${name}, great news!\n\nYour order #${orderId} ${statusMessage}`;
    },
    html: (
      name: string,
      orderId: string,
      productName: string,
      status: string,
    ) => {
      let statusMessage = "";

      switch (status) {
        case "PROCESSING":
          statusMessage = "Your order is now being processed. We'll keep you updated!";
          break;
        case "BOUGHT":
          statusMessage =
            "Your order has been purchased and will be shipped soon.";
          break;
        case "SHIPPED":
          statusMessage = "Your order has been shipped and is on its way.";
          break;
        case "RECEIVED_SHIPMENT":
          statusMessage =
            "Your order has reached our local warehouse and will be handed over to a local courier soon.";
          break;
        case "ON_DELIVERY":
          statusMessage =
            "Your order is out for delivery today. Please be available to receive it.";
          break;
        case "DELIVERED":
          statusMessage =
            "Your order has been delivered. Thank you for shopping with us!";
          break;
        default:
          statusMessage = `Your order status has been updated to: ${status}.`;
      }

      return `<h1>Order Status Update</h1>
            <p>Hey ${name},</p>
            <p>Great news!</p>
            <p>Your order <strong>#${orderId}</strong> ${statusMessage}</p>`;
    },
  },
  PAYMENT_CONFIRMATION: {
    subject: "Payment Confirmation",
    text: (name: string, orderId: string, amount: string) =>
      `(Books of Bengal) Dear ${name}, thanks for choosing Books of Bengal. Your payment of ${amount} for order #${orderId} has been successfully submitted.`,
    html: (name: string, orderId: string, amount: string) =>
      `<h1>Payment Confirmation</h1>
            <p>Dear ${name},</p>
            <p>Thanks for choosing Books of Bengal.</p>
            <p>Your payment of <strong>${amount}</strong> for order <strong>#${orderId}</strong> has been successfully submitted.</p>`,
  },
  REQUEST_UPDATE: {
    subject: "Request Status Update",
    text: (
      name: string,
      productName: string,
      price: string,
      details: string,
      status: string,
    ) => {
      if (status === "APPROVED") {
        return `(Books of Bengal) Hi ${name}, your request is approved! Price: ${price || "N/A"}. Complete your order now. Need help? Call or text us!`;
      } else {
        return `(Books of Bengal) Hi ${name}, we regret to inform you that your request has been rejected. Reason: ${details}. Please contact support for more information.`;
      }
    },
    html: (
      name: string,
      productName: string,
      price: string,
      details: string,
      status: string,
    ) => {
      if (status === "APPROVED") {
        return `<h1>Request Approved</h1>
                <p>Hi ${name},</p>
                <p>Your request is approved!</p>
                <p>Price: <strong>${price || "N/A"}</strong></p>
                <p>Complete your order now. Need help? Call or text us!</p>`;
      } else {
        return `<h1>Request Rejected</h1>
                <p>Hi ${name},</p>
                <p>We regret to inform you that your request has been rejected.</p>
                <p>Reason: ${details}</p>
                <p>Please contact support for more information.</p>`;
      }
    },
  },
  SUPPORT_TICKET: {
    subject: "Support Ticket Update",
    text: (ticketId: string, status: string) =>
      `(Books of Bengal) Your support ticket #${ticketId} status has been updated to: ${status}.`,
    html: (ticketId: string, status: string) =>
      `<h1>Support Ticket Update</h1>
            <p>Your support ticket <strong>#${ticketId}</strong> status has been updated to: <strong>${status}</strong>.</p>`,
  },
  CUSTOM: {
    subject: "Notification from Books of Bengal",
    text: (message: string) => message,
    html: (message: string) => `<p>${message}</p>`,
  },
};

export type EmailTemplateType = keyof typeof EMAIL_TEMPLATES;

/**
 * Send email using nodemailer
 * @param email Recipient email address
 * @param templateType Type of email template to use
 * @param params Parameters for the template (varies by template type)
 * @param customSubject Optional custom subject (overrides template subject)
 */
export const sendEmail = async (
  email: string,
  templateType: EmailTemplateType,
  params: string[],
  customSubject?: string,
): Promise<void> => {
  try {
    const template = EMAIL_TEMPLATES[templateType];

    const mailOptions = {
      from: process.env.SMTP_FROM || "no-reply@example.com",
      to: email,
      subject: customSubject || template.subject,
      text:
        params.length === 1
          ? template.text(params[0], params[1], params[2], params[3], params[4])
          : params.length === 2
            ? template.text(
              params[0],
              params[1],
              params[2],
              params[3],
              params[4],
            )
            : template.text(
              params[0],
              params[1],
              params[2],
              params[3],
              params[4],
            ),
      html:
        params.length === 1
          ? template.html(params[0], params[1], params[2], params[3], params[4])
          : params.length === 2
            ? template.html(
              params[0],
              params[1],
              params[2],
              params[3],
              params[4],
            )
            : template.html(
              params[0],
              params[1],
              params[2],
              params[3],
              params[4],
            ),
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${email} using template ${templateType}`);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};

// Keep the original function for backward compatibility
const sendOtp = async (email: string, otp: string): Promise<void> => {
  return sendEmail(email, "OTP", [otp]);
};

export default sendOtp;
