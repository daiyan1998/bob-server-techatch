import { getGlobalIdToken } from "./../utils/global-data";

const authHeaders = async () => {
  let info = await getGlobalIdToken();

  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    authorization: info,
    "x-app-key": process.env.BKASH_APP_KEY,
  };
};

export default authHeaders;
