import { renderEmailLayout } from "./email-layout";
import {
  renderGreeting,
  renderParagraph,
  renderStatusBanner,
  renderInvoiceSummary,
  renderAlertBox,
  renderButton,
  renderSignature,
} from "./email-components";

import { NOTIFICATION_TYPES } from "./notification-types";
import { formatDateDifference } from "@/lib/notifications/date-utils";

const CONFIG = {
  [NOTIFICATION_TYPES.BILL_SUBMITTED]: {
    title: "Invoice Submitted",
    color: "#2563EB",
    background: "#DBEAFE",
    banner: "Invoice Submitted Successfully",
  },

  [NOTIFICATION_TYPES.DUE_REMINDER]: {
    title: "Payment Reminder",
    color: "#F59E0B",
    background: "#FEF3C7",
    banner: "Payment Due Soon",
  },

  [NOTIFICATION_TYPES.INVOICE_DUE]: {
    title: "Invoice Due Today",
    color: "#EA580C",
    background: "#FED7AA",
    banner: "Payment Due Today",
  },

  [NOTIFICATION_TYPES.OVERDUE_REMINDER]: {
    title: "Overdue Reminder",
    color: "#DC2626",
    background: "#FEE2E2",
    banner: "Payment Overdue",
  },

  [NOTIFICATION_TYPES.PAYMENT_RECEIVED]: {
    title: "Payment Received",
    color: "#16A34A",
    background: "#DCFCE7",
    banner: "Payment Received",
  },

  [NOTIFICATION_TYPES.PAYMENT_CLEARED]: {
    title: "Invoice Paid",
    color: "#15803D",
    background: "#DCFCE7",
    banner: "Invoice Fully Paid",
  },

  [NOTIFICATION_TYPES.SERVICE_SUSPENSION_NOTICE]: {
    title: "Service Suspension",
    color: "#B91C1C",
    background: "#FEE2E2",
    banner: "Service Suspended",
  },

  [NOTIFICATION_TYPES.SERVICE_SUSPENSION_ALERT]: {
    title: "Immediate Attention Required",
    color: "#991B1B",
    background: "#FECACA",
    banner: "Immediate Action Required",
  },
};

export function renderEmail({ type, body, variables, actionUrl }) {
  const config = CONFIG[type];

  const content = `
    ${renderGreeting(variables.clientName)}

    ${renderStatusBanner({
      title: config.banner,
      color: config.color,
      background: config.background,
    })}

    ${renderParagraph(body)}

    ${renderInvoiceSummary({
      invoiceNumber: variables.invoiceNumber,
      invoiceDate: variables.invoiceDate,
      dueDate: variables.dueDate,
      invoiceAmount: variables.invoiceAmount,
      paidAmount: variables.paidAmount,
      outstandingAmount: variables.outstandingAmount,
    })}

    ${
      variables.overdueDays > 0
        ? renderAlertBox(
            `This invoice is overdue by ${formatDateDifference(
              variables.dueDate,
            )}.`,
          )
        : ""
    }



    ${renderSignature({
      senderCompany: variables.senderCompany,
      senderEmail: variables.senderEmail,
      senderPhone: variables.senderPhone,
      senderLogo: variables.senderLogo,
    })}
  `;

  return renderEmailLayout({
    title: config.title,
    bannerColor: config.color,

    companyName: variables.senderCompany,

    content,

    senderCompany: variables.senderCompany,
    senderEmail: variables.senderEmail,
    senderPhone: variables.senderPhone,
    logoUrl: variables.senderLogo,
  });
}
