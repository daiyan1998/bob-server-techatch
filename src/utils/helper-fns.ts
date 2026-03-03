import { endOfDay, isValid, parseISO, startOfDay } from "date-fns";
import { SysEntities } from "./constants";

export const generateId = (resource: SysEntities) => {
  const prefixes: Record<SysEntities, string> = {
    [SysEntities.ORDER]: "ORD",
    [SysEntities.PRODUCT_REQUEST]: "REQ",
    [SysEntities.PAYMENT]: "PAY",
    [SysEntities.SUPPORT_TICKET]: "SUP",
  };

  return prefixes[resource] + Date.now();
};

export const parseDateRange = (dateString?: string) => {
  if (!dateString) return null;
  const [fromStr, toStr] = dateString.split(",");
  if (!fromStr) return null;

  try {
    const from = parseISO(fromStr);
    const to = toStr ? parseISO(toStr) : from;

    if (!isValid(from) || !isValid(to)) {
      return null;
    }

    return {
      from: startOfDay(from),
      to: endOfDay(to),
    };
  } catch {
    return null;
  }
};
