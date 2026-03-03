import { setGlobalIdToken } from "./global-data";
import https from 'https';
import crypto from 'crypto';

export const getToken = async () => {
  const url = `${process.env.BKASH_BASE_URL}/tokenized/checkout/token/grant`;

  const options = {
    method: "POST",
    headers: {
      Accept: "application/json",
      username: process.env.BKASH_USERNAME!,
      password: process.env.BKASH_PASSWORD!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      app_key: process.env.BKASH_APP_KEY,
      app_secret: process.env.BKASH_APP_SECRET,
    }),
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    setGlobalIdToken(data?.id_token);

    console.log("bKash Token Response:", data);
    return data.id_token;
  } catch (error) {
    console.error("Error fetching bKash token:", error);
  }
};


const getCertificateFromUrl = (certUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    https.get(certUrl, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download certificate. Status code: ${res.statusCode}`));
        return;
      }

      let cert = '';
      res.on('data', (chunk) => (cert += chunk));
      res.on('end', () => resolve(cert));
    }).on('error', reject);
  });
};


export const verifyBkashSignature = async (
  rawBody: string,
  signature: string,
  signingCertUrl: string
): Promise<boolean> => {
  try {
    const publicCert = await getCertificateFromUrl(signingCertUrl);

    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(rawBody);
    verifier.end();

    return verifier.verify(publicCert, signature, 'base64');
  } catch (err) {
    console.error('Error verifying bKash signature:', err);
    return false;
  }
};



