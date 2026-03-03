import { IndPayment } from "@/validations/payment";
import crypto from "crypto";
const { validateWebhookSignature } = require('razorpay/dist/utils/razorpay-utils')
const Razorpay = require("razorpay");

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID, // Your Razorpay Key ID
  key_secret: process.env.RAZORPAY_KEY_SECRET, // Your Razorpay Key Secret
});

export const generateReceiptId = (orderId: string) =>
  crypto.createHash("sha256").update(orderId).digest("hex").slice(0, 40);

export const decodeReceipt = (receipt: string, orderId: string): boolean => {
  const hashed = crypto
    .createHash("sha256")
    .update(orderId)
    .digest("hex")
    .slice(0, 40);
  return hashed === receipt;
};

export const validateSignature = (
  webhookSignature: string,
  data: IndPayment,
) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!;

  return validateWebhookSignature(JSON.stringify(data), webhookSignature, webhookSecret);
};
