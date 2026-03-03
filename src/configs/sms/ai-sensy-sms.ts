import * as dotenv from "dotenv";

dotenv.config();

// Message templates for different notification types
const MESSAGE_TEMPLATES = {
  OTP: {
    templateParams: (otpCode: string) => [otpCode],
    buttons: (otpCode: string) => [
      {
        type: "button",
        sub_type: "url",
        index: "0",
        parameters: [
          {
            type: "text",
            text: otpCode,
          },
        ],
      },
    ],
  },
  ORDER_UPDATE: {
    templateParams: (
      name: string,
      orderId: string,
      productName: string,
      status: string,
    ) => {
      // Format the status for better readability in WhatsApp
      let formattedStatus = status;
      let statusMessage = "";

      if (status === "PROCESSING") {
        formattedStatus = "Processing";
        statusMessage = "is now being processed. We'll keep you updated!";
      } else if (status === "BOUGHT") {
        formattedStatus = "Purchased";
        statusMessage = "has been purchased and will be shipped soon.";
      } else if (status === "SHIPPED") {
        formattedStatus = "Shipped";
        statusMessage = "has been shipped and is on its way to you.";
      } else if (status === "RECEIVED_SHIPMENT") {
        formattedStatus = "At Warehouse";
        statusMessage = "has reached our local warehouse and will be handed over to a local courier soon.";
      } else if (status === "ON_DELIVERY") {
        formattedStatus = "Out for Delivery";
        statusMessage = "is out for delivery today. Please be available to receive it.";
      } else if (status === "DELIVERED") {
        formattedStatus = "Delivered";
        statusMessage = "has been delivered. Thank you for shopping with Books of Bengal!";
      }

      return [name, orderId, formattedStatus, statusMessage];
    },
    buttons: () => [],
  },
  PAYMENT_CONFIRMATION: {
    templateParams: (name: string, orderId: string, amount: string) => [
      name,
      "Books of Bengal",
      amount,
    ],
    buttons: () => [],
  },
  REQUEST_UPDATE: {
    templateParams: (
      name: string,
      productName: string,
      price: string,
      details: string,
    ) => {
      return [name, price || "N/A", details || ""];
    },
    buttons: () => [],
  },
  SUPPORT_UPDATE: {
    templateParams: (name: string, ticketId: string, status: string) => [
      name,
      ticketId,
      status,
    ],
    buttons: () => [],
  },
};

export type WhatsAppTemplateType = keyof typeof MESSAGE_TEMPLATES;

const CAMPAIGN_NAMES = {
  OTP: process.env.AISENSY_OTP_CAMPAIGN_NAME,
  ORDER_UPDATE: process.env.AISENSY_ORDER_CAMPAIGN_NAME,
  PAYMENT_CONFIRMATION: process.env.AISENSY_PAYMENT_CAMPAIGN_NAME,
  REQUEST_UPDATE: process.env.AISENSY_REQUEST_CAMPAIGN_NAME,
  SUPPORT_UPDATE: process.env.AISENSY_SUPPORT_CAMPAIGN_NAME,
};

/**
 * Send WhatsApp message using AiSensy
 * @param phoneNumber Recipient phone number
 * @param templateType Type of template to use
 * @param name Recipient's name
 * @param params Parameters for the template (varies by template type)
 */
export const sendWhatsAppMessage = async (
  phoneNumber: string,
  templateType: WhatsAppTemplateType,
  name: string,
  ...params: string[]
): Promise<string> => {
  const apiKey = process.env.AISENSY_API_KEY;
  const campaignName =
    CAMPAIGN_NAMES[templateType] || process.env.AISENSY_CAMPAIGN_NAME;

  if (!apiKey || !campaignName) {
    throw new Error(
      "AiSensy API credentials are not defined in environment variables",
    );
  }

  const apiUrl = "https://backend.aisensy.com/campaign/t1/api/v2";

  const template = MESSAGE_TEMPLATES[templateType];
  const templateParams = template.templateParams(
    params[0],
    params[1],
    params[2],
    params[3],
  );
  const buttons = template.buttons(params[0]);

  const payload = {
    apiKey: apiKey,
    campaignName: campaignName,
    destination: phoneNumber,
    userName: name,
    source: "organic",
    templateParams: templateParams,
    buttons: buttons,
  };

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `HTTP error! Status: ${response.status}, Message: ${errorText}`,
      );
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.text();
    return data;
  } catch (error: any) {
    throw new Error("Error sending WhatsApp message: " + error.message);
  }
};

// Keep the original function for backward compatibility
export const sendWhatsAppOtp = async (
  phoneNumber: string,
  otpCode: string,
  name: string,
): Promise<string> => {
  return sendWhatsAppMessage(phoneNumber, "OTP", name, otpCode);
};
