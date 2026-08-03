"use server";

import { sendNotification } from "@/lib/notifications/send-notification";

export async function processEventNotification({ type, invoiceId }) {
  return await sendNotification({
    type,
    invoiceId,
  });
}
