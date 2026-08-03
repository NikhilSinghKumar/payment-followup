import { getInvoiceNotificationData } from "./notification-data";
import { processNotification } from "./notification-services";
import {
  NOTIFICATION_TYPES,
  TEMPLATE_TYPES,
} from "@/lib/notifications/notification-types";

export async function processInvoiceEvents(invoiceId) {
  const data = await getInvoiceNotificationData(invoiceId);

  if (!data) return;

  await processNotification(
    NOTIFICATION_TYPES.BILL_SUBMITTED,
    TEMPLATE_TYPES.BILL_SUBMITTED,
    data,
  );
}
