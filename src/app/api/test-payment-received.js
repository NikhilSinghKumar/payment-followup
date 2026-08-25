import { NextResponse } from "next/server";
import { db } from "@/db";
import { clients, invoices, companies } from "@/db/schema";
import {
  processClientPaymentSettlementEvent,
  processPaymentEvents,
} from "@/lib/notifications/event-services";
import { renderEmail } from "@/lib/notifications/email-renderer";
import { NOTIFICATION_TYPES } from "@/lib/notifications/notification-types";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/test-payment-received?mode=preview|send&email=target@example.com&clientId=123
 * Allows testing and previewing the Client-Wise Payment Received notification.
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") || "preview"; // 'preview' or 'send'
    const targetEmail = searchParams.get("email") || "nikhilsk369@gmail.com";
    const clientIdParam = searchParams.get("clientId");

    // 1. Fetch a client or fallback mock
    let client = null;
    let clientInvoices = [];

    if (clientIdParam) {
      client = await db.query.clients.findFirst({
        where: eq(clients.id, Number(clientIdParam)),
      });
    }

    if (!client) {
      // Find the first available client in the database
      client = await db.query.clients.findFirst();
    }

    const clientName = client?.companyName || "Acme Global Logistics Pvt Ltd";
    const clientId = client?.id || 1;

    // 2. Fetch sample invoices or create realistic mock sample
    if (client) {
      clientInvoices = await db.query.invoices.findMany({
        where: eq(invoices.clientId, clientId),
        limit: 3,
      });
    }

    const settledInvoices =
      clientInvoices.length > 0
        ? clientInvoices.map((inv, idx) => {
            const invAmt = Number(
              inv.netPayableAmount || inv.invoiceAmount || 45000,
            );
            const settledAmt = idx === 0 ? invAmt : Math.round(invAmt / 2);
            return {
              invoiceId: inv.id,
              invoiceNumber: inv.invoiceNumber,
              invoiceDate: inv.invoiceDate || new Date().toISOString(),
              invoiceAmount: invAmt,
              settledAmount: settledAmt,
              remainingBalance: Math.max(0, invAmt - settledAmt),
            };
          })
        : [
            {
              invoiceId: 101,
              invoiceNumber: "PAF-D/24-25/584",
              invoiceDate: "2024-08-15",
              invoiceAmount: 50000,
              settledAmount: 50000,
              remainingBalance: 0,
            },
            {
              invoiceId: 102,
              invoiceNumber: "PAF-D/24-25/612",
              invoiceDate: "2024-08-20",
              invoiceAmount: 75000,
              settledAmount: 25000,
              remainingBalance: 50000,
            },
          ];

    const totalSettled = settledInvoices.reduce(
      (sum, i) => sum + i.settledAmount,
      0,
    );

    const payload = {
      clientId,
      companyId: client?.companyId || null,
      email: targetEmail,
      clientName,
      paymentAmount: totalSettled,
      paymentDate: new Date().toISOString(),
      paymentMethod: "NEFT / Bank Transfer",
      referenceNumber: "UTR98320481239X",
      settledInvoices,
      totalAccountOutstanding: 50000,
      senderCompany: "PAFEX Express & Logistics",
      senderEmail: "accounts@pafex.com",
      senderPhone: "+91 98765 43210",
    };

    if (mode === "send") {
      const result = await processClientPaymentSettlementEvent(payload);
      return NextResponse.json({
        success: true,
        message: `Payment Received email dispatched to ${targetEmail}`,
        result,
        payload,
      });
    }

    const { renderTemplate } =
      await import("@/lib/notifications/notification-template");
    const { TEMPLATE_TYPES } =
      await import("@/lib/notifications/notification-types");

    const templateResult = await renderTemplate(
      client?.companyId || null,
      TEMPLATE_TYPES.PAYMENT_RECEIVED,
      payload,
    );

    // Default: render and return HTML preview
    const html = renderEmail({
      type: NOTIFICATION_TYPES.PAYMENT_RECEIVED,
      body: templateResult.body,
      variables: payload,
      actionUrl: `/clients/${clientId}`,
    });

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Email-Subject": encodeURIComponent(
          templateResult.subject || "Payment Received - PAFEX",
        ),
      },
    });
  } catch (err) {
    console.error("[Test Payment Received Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message, stack: err.stack },
      { status: 500 },
    );
  }
}
