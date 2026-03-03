const SSLCommerzPayment = require("sslcommerz-lts");
import dotenv from "dotenv";

dotenv.config();

// Function to initialize the SSLCommerzPayment
const getSSLCommerzInstance = () => {
  return new SSLCommerzPayment(
    process.env.SSL_STORE_ID!,
    process.env.SSL_STORE_PASSWORD!,
    process.env.SSL_IS_LIVE === "true",
  );
};

// Function to initiate the payment
export const initiateSslPayment = async (data: any) => {
  const sslcz = getSSLCommerzInstance();
  const apiResponse = await sslcz.init(data);
  const { status, GatewayPageURL, sessionkey, ...rest } = apiResponse;
  const response = {
    status,
    sessionkey,
    GatewayPageURL,
    currency: "taka",
  };
  return response;
};

export const validatePayment = async (val_id: string) => {
  const sslcz = getSSLCommerzInstance();
  try {
    const result = await sslcz.validate({ val_id });
    return result; // This will contain validation result
  } catch (error) {
    throw new Error("Payment validation failed");
  }
};
