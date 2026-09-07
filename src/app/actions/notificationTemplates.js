"use server";

import { db } from "@/db";
import { notificationTemplates, companies } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/auth";
import { DEFAULT_NOTIFICATION_TEMPLATES } from "@/lib/notifications/seed-notification-templates";
import { renderEmail } from "@/lib/notifications/email-renderer";
import { replaceTemplateVariables } from "@/lib/notifications/notification-utils";
import { revalidatePath } from "next/cache";
import {
  AVAILABLE_VARIABLES,
  TEMPLATE_DESCRIPTIONS,
} from "@/lib/notifications/template-constants";

const MOCK_DATA = {
  clientName: "Acme Freight Solutions Pvt Ltd",
  companyName: "Acme Freight",
  invoiceNumber: "INV-2026-0842",
  invoiceDate: "01-Sep-2026",
  dueDate: "15-Sep-2026",
  invoiceAmount: "45,250.00",
  paidAmount: "0.00",
  outstandingAmount: "45,250.00",
  amount: "45,250.00",
  count: "2",
  overdueDays: "12",
  paymentAmount: "45,250.00",
  paymentDate: "06-Sep-2026",
  paymentMethod: "Bank Transfer / RTGS (UTR: HDFC892184918)",
  referenceNumber: "UTR-HDFC892184918",
  senderCompany: "PAFEX Logistics",
  senderEmail: "accounts@pafex.in",
  senderPhone: "+91 9289901837",
  senderLogo: "/pafex_logo.png",
  totalAccountOutstanding: 125000,
  settledInvoices: [
    {
      invoiceNumber: "INV-2026-0840",
      invoiceDate: "15-Aug-2026",
      invoiceAmount: 22000,
      settledAmount: 22000,
      remainingBalance: 0,
    },
    {
      invoiceNumber: "INV-2026-0841",
      invoiceDate: "20-Aug-2026",
      invoiceAmount: 23250,
      settledAmount: 23250,
      remainingBalance: 0,
    },
  ],
  invoices: [
    {
      invoiceNumber: "INV-2026-0842",
      invoiceDate: "01-Aug-2026",
      dueDate: "15-Aug-2026",
      invoiceAmount: 45250,
      paidAmount: 0,
      outstandingAmount: 45250,
      agingStatus: "12d Overdue",
      agingColor: "#DC2626",
      creditDays: 14,
    },
  ],
  company: {
    companyName: "PAFEX Logistics India Pvt Ltd",
    bankName: "HDFC Bank",
    bankAccountNumber: "50200012345678",
    bankIfscCode: "HDFC0000123",
    bankBranch: "Fort, Mumbai",
    email: "accounts@pafex.in",
    phone: "+91 9289901837",
  },
};

/**
 * Fetch all notification templates for current company merged with defaults
 */
export async function getNotificationTemplates() {
  try {
    const user = await getCurrentUser();
    if (!user?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    const companyId = user.companyId;

    // Fetch company info
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    // Fetch company-customized templates
    const companyTemplates = await db
      .select()
      .from(notificationTemplates)
      .where(
        and(
          eq(notificationTemplates.companyId, companyId),
          eq(notificationTemplates.isActive, true),
        ),
      );

    const companyMap = new Map();
    for (const t of companyTemplates) {
      companyMap.set(t.type, t);
    }

    // Merge with DEFAULT_NOTIFICATION_TEMPLATES
    const merged = DEFAULT_NOTIFICATION_TEMPLATES.map((def) => {
      const custom = companyMap.get(def.type);
      return {
        type: def.type,
        name: def.name,
        description: TEMPLATE_DESCRIPTIONS[def.type] || "",
        subject: custom ? custom.subject : def.subject,
        body: custom ? custom.body : def.body,
        isCustom: !!custom,
        id: custom ? custom.id : null,
        defaultSubject: def.subject,
        defaultBody: def.body,
        updatedAt: custom?.updatedAt ? custom.updatedAt.toISOString() : null,
      };
    });

    return {
      success: true,
      templates: merged,
      company: company || null,
      variables: AVAILABLE_VARIABLES,
    };
  } catch (error) {
    console.error("[getNotificationTemplates] Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Save or update a company-specific notification template
 */
export async function saveNotificationTemplate({ type, subject, body, name }) {
  try {
    const user = await getCurrentUser();
    if (!user?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    if (!type || !subject?.trim() || !body?.trim()) {
      return { success: false, error: "Subject and body cannot be empty." };
    }

    const companyId = user.companyId;

    // Check if existing custom record exists
    const existing = await db
      .select()
      .from(notificationTemplates)
      .where(
        and(
          eq(notificationTemplates.companyId, companyId),
          eq(notificationTemplates.type, type),
        ),
      )
      .limit(1);

    let savedId;
    if (existing.length > 0) {
      const [updated] = await db
        .update(notificationTemplates)
        .set({
          subject: subject.trim(),
          body: body.trim(),
          name: name || existing[0].name,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(notificationTemplates.id, existing[0].id))
        .returning();
      savedId = updated.id;
    } else {
      const def = DEFAULT_NOTIFICATION_TEMPLATES.find((d) => d.type === type);
      const [inserted] = await db
        .insert(notificationTemplates)
        .values({
          companyId,
          type,
          name: name || def?.name || type,
          subject: subject.trim(),
          body: body.trim(),
          isDefault: false,
          isActive: true,
        })
        .returning();
      savedId = inserted.id;
    }

    revalidatePath("/settings");
    return {
      success: true,
      id: savedId,
      message: "Template saved successfully.",
    };
  } catch (error) {
    console.error("[saveNotificationTemplate] Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Reset a company template to the system default
 */
export async function resetNotificationTemplate(type) {
  try {
    const user = await getCurrentUser();
    if (!user?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    const companyId = user.companyId;

    await db
      .delete(notificationTemplates)
      .where(
        and(
          eq(notificationTemplates.companyId, companyId),
          eq(notificationTemplates.type, type),
        ),
      );

    revalidatePath("/settings");
    return { success: true, message: "Template reset to system default." };
  } catch (error) {
    console.error("[resetNotificationTemplate] Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Render a live email preview with given template draft content
 */
export async function renderTemplatePreview({ type, subject, body }) {
  try {
    const user = await getCurrentUser();
    const companyId = user?.companyId;

    let company = MOCK_DATA.company;
    if (companyId) {
      const [c] = await db
        .select()
        .from(companies)
        .where(eq(companies.id, companyId))
        .limit(1);
      if (c) {
        company = {
          ...MOCK_DATA.company,
          companyName: c.companyName || MOCK_DATA.company.companyName,
          email: c.email || MOCK_DATA.company.email,
          phone: c.phone || MOCK_DATA.company.phone,
          bankName: c.bankName || MOCK_DATA.company.bankName,
          bankAccountNumber:
            c.bankAccountNumber || MOCK_DATA.company.bankAccountNumber,
          bankIfscCode: c.bankIfscCode || MOCK_DATA.company.bankIfscCode,
          bankBranch: c.bankBranch || MOCK_DATA.company.bankBranch,
        };
      }
    }

    // Customize variables based on notification type
    const isSubmitted = type === "BILL_SUBMITTED";
    const isDueSoon = type === "DUE_REMINDER";
    const isDueToday = type === "DUE_TODAY" || type === "INTERNAL_DUE_TODAY";
    const isOverdue = type === "OVERDUE_REMINDER";
    const isSuspension =
      type === "SERVICE_SUSPENSION_ALERT" ||
      type === "SERVICE_SUSPENSION_NOTICE";
    const isCleared = type === "PAYMENT_CLEARED";

    const typeSpecificData = {
      ...MOCK_DATA,
      overdueDays:
        isSubmitted || isDueSoon || isDueToday || isCleared
          ? "0"
          : isSuspension
            ? "30"
            : "14",
      dueDate: isSubmitted
        ? "20-Sep-2026"
        : isDueSoon
          ? "15-Sep-2026"
          : isDueToday
            ? "07-Sep-2026"
            : "24-Aug-2026", // past date for overdue / suspension
      outstandingAmount: isCleared ? "0.00" : MOCK_DATA.outstandingAmount,
    };

    const variables = {
      ...typeSpecificData,
      company,
      senderCompany: company.companyName,
      senderEmail: company.email,
      senderPhone: company.phone,
    };

    const previewSubject = replaceTemplateVariables(subject || "", variables);
    const previewBody = replaceTemplateVariables(body || "", variables);

    // Render using renderEmail
    const emailHtml = renderEmail({
      type: type === "INTERNAL_DUE_TODAY" ? "DUE_TODAY" : type,
      body: previewBody,
      variables,
      actionUrl: "#",
    });

    return {
      success: true,
      subject: previewSubject,
      html: emailHtml,
    };
  } catch (error) {
    console.error("[renderTemplatePreview] Error:", error);
    return { success: false, error: error.message };
  }
}
