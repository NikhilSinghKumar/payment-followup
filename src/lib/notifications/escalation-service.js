import { db } from "@/db";
import {
  invoices,
  clients,
  companies,
  users,
  roles,
  departments,
  companyUsers,
  notificationEscalationRules,
  invoiceEscalationStates,
  notificationLogs,
  clientContacts,
  clientContactEmails,
  followups,
  followupInvoices,
} from "@/db/schema";
import { eq, and, or, asc, desc, isNull, sql } from "drizzle-orm";
import { sendEmail } from "@/lib/email";

/**
 * Ensures default escalation tier rules exist for a company if none defined.
 */
export async function ensureDefaultEscalationRules(companyId) {
  try {
    const existingRules = await db
      .select()
      .from(notificationEscalationRules)
      .where(eq(notificationEscalationRules.companyId, companyId))
      .orderBy(asc(notificationEscalationRules.tierLevel));

    if (existingRules.length > 0) {
      return existingRules;
    }

    // Lookup company roles to map
    const companyRolesList = await db
      .select()
      .from(roles)
      .where(and(eq(roles.companyId, companyId), isNull(roles.deletedAt)));

    const collectorRole =
      companyRolesList.find((r) =>
        /collection|executive|staff|officer|user/i.test(r.roleName),
      ) || companyRolesList[0];

    const managerRole =
      companyRolesList.find((r) =>
        /manager|lead|accountant|head/i.test(r.roleName),
      ) || companyRolesList[0];

    const adminRole =
      companyRolesList.find((r) =>
        /admin|director|owner|management/i.test(r.roleName),
      ) || companyRolesList[0];

    const defaultTiers = [
      {
        companyId,
        tierLevel: 1,
        daysAfterDue: 1,
        targetRoleId: collectorRole?.id || null,
        description:
          "Tier 1: Initial reminder to Collections Team on 1st day overdue",
        emailTemplateKey: "TIER_1_COLLECTOR",
        isActive: true,
      },
      {
        companyId,
        tierLevel: 2,
        daysAfterDue: 4,
        targetRoleId: managerRole?.id || null,
        description:
          "Tier 2: Escalation to Accounts Lead / Manager (3 days after Tier 1)",
        emailTemplateKey: "TIER_2_MANAGER",
        isActive: true,
      },
      {
        companyId,
        tierLevel: 3,
        daysAfterDue: 8,
        targetRoleId: adminRole?.id || null,
        description: "Tier 3: Executive Escalation to Finance Head / Director",
        emailTemplateKey: "TIER_3_EXECUTIVE",
        isActive: true,
      },
    ];

    const inserted = await db
      .insert(notificationEscalationRules)
      .values(defaultTiers)
      .returning();

    return inserted;
  } catch (error) {
    console.error("ensureDefaultEscalationRules error:", error);
    return [];
  }
}

/**
 * Evaluates and executes hierarchical escalations for a company's overdue invoices.
 */
export async function evaluateAndRunEscalations(companyId) {
  const summary = {
    companyId,
    totalOverdueInvoices: 0,
    evaluated: 0,
    escalated: 0,
    resolvedPaid: 0,
    skipped: 0,
    errors: [],
    details: [],
  };

  try {
    // 1. Fetch active rules for this company ordered by tier
    let rules = await db
      .select()
      .from(notificationEscalationRules)
      .where(
        and(
          eq(notificationEscalationRules.companyId, companyId),
          eq(notificationEscalationRules.isActive, true),
        ),
      )
      .orderBy(asc(notificationEscalationRules.tierLevel));

    if (rules.length === 0) {
      rules = await ensureDefaultEscalationRules(companyId);
    }

    if (rules.length === 0) {
      return summary;
    }

    // 2. Fetch company details
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    const now = new Date();

    // 3. Fetch all active clients with pending/overdue invoices for this company
    const allInvoices = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        clientId: invoices.clientId,
        invoiceDate: invoices.invoiceDate,
        dueDate: invoices.dueDate,
        status: invoices.status,
        netPayableAmount: invoices.netPayableAmount,
        outstandingAmount: invoices.outstandingAmount,
        clientName: clients.companyName,
        clientEmail: clients.email,
        clientPhone: clients.phone,
      })
      .from(invoices)
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .where(
        and(eq(invoices.companyId, companyId), isNull(invoices.deletedAt)),
      );

    // Group invoices by client
    const clientInvoicesMap = new Map();

    for (const inv of allInvoices) {
      summary.evaluated++;

      // Fetch current escalation state
      const [existingState] = await db
        .select()
        .from(invoiceEscalationStates)
        .where(eq(invoiceEscalationStates.invoiceId, inv.id))
        .limit(1);

      const outstanding = Number(
        inv.outstandingAmount ?? inv.netPayableAmount ?? 0,
      );
      const isPaid =
        inv.status === "paid" || outstanding <= 0 || inv.status === "cancelled";

      // If invoice was paid or settled, resolve escalation state
      if (isPaid) {
        if (existingState && existingState.status !== "RESOLVED_PAID") {
          await db
            .update(invoiceEscalationStates)
            .set({
              status: "RESOLVED_PAID",
              notes: `Resolved: Invoice is paid or has zero balance (Status: ${inv.status}).`,
              updatedAt: new Date(),
            })
            .where(eq(invoiceEscalationStates.id, existingState.id));
          summary.resolvedPaid++;
        }
        continue;
      }

      if (!inv.clientId) continue;

      let clientEntry = clientInvoicesMap.get(inv.clientId);
      if (!clientEntry) {
        clientEntry = {
          clientId: inv.clientId,
          clientName: inv.clientName || "Valued Client",
          clientEmail: inv.clientEmail,
          clientPhone: inv.clientPhone,
          invoices: [],
          escalatableInvoices: [],
        };
        clientInvoicesMap.set(inv.clientId, clientEntry);
      }

      const dueDateTime = inv.dueDate ? new Date(inv.dueDate) : null;
      let daysOverdue = 0;
      let isOverdue = false;

      if (dueDateTime) {
        const todayDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        );
        const dueDateClean = new Date(
          dueDateTime.getFullYear(),
          dueDateTime.getMonth(),
          dueDateTime.getDate(),
        );
        const diffMs = todayDate.getTime() - dueDateClean.getTime();
        daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        isOverdue = daysOverdue > 0;
      }

      const invoiceItem = {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate,
        dueDate: inv.dueDate,
        outstandingAmount: outstanding,
        netPayableAmount: Number(inv.netPayableAmount || 0),
        status: inv.status,
        daysOverdue: Math.max(0, daysOverdue),
        isOverdue,
        existingState,
      };

      clientEntry.invoices.push(invoiceItem);

      if (isOverdue) {
        summary.totalOverdueInvoices++;
        const currentTier = existingState?.currentTier || 0;
        const nextRule = rules.find(
          (r) => r.tierLevel > currentTier && daysOverdue >= r.daysAfterDue,
        );

        if (nextRule) {
          invoiceItem.nextRule = nextRule;
          clientEntry.escalatableInvoices.push(invoiceItem);
        } else {
          summary.skipped++;
        }
      } else {
        summary.skipped++;
      }
    }

    // Now process escalations per client, grouping by highest qualifying tier
    for (const [clientId, clientEntry] of clientInvoicesMap.entries()) {
      if (clientEntry.escalatableInvoices.length === 0) {
        continue;
      }

      // Group escalatable invoices by tier rule
      const tierGroups = new Map();
      for (const inv of clientEntry.escalatableInvoices) {
        const tier = inv.nextRule.tierLevel;
        if (!tierGroups.has(tier)) {
          tierGroups.set(tier, {
            rule: inv.nextRule,
            invoices: [],
          });
        }
        tierGroups.get(tier).invoices.push(inv);
      }

      for (const [tierLevel, group] of tierGroups.entries()) {
        const rule = group.rule;
        const targetEmails = await resolveEscalationRecipients(companyId, rule);

        if (targetEmails.length === 0) {
          summary.errors.push(
            `Client ${clientEntry.clientName}: No recipients found for Tier ${tierLevel}`,
          );
          continue;
        }

        const maxDaysOverdue = Math.max(
          ...group.invoices.map((inv) => inv.daysOverdue),
        );

        const emailHtml = generateClientEscalationEmailHtml({
          companyName: company?.companyName || "PAFEX Logistics",
          clientName: clientEntry.clientName,
          clientEmail: clientEntry.clientEmail,
          clientPhone: clientEntry.clientPhone,
          allClientInvoices: clientEntry.invoices,
          escalatedInvoices: group.invoices,
          tierLevel,
          tierDescription: rule.description,
          maxDaysOverdue,
        });

        const invoiceNumbersStr = group.invoices
          .map((i) => i.invoiceNumber)
          .join(", ");
        const subject = `[ESCALATION TIER ${tierLevel}] Outstanding Invoices (${group.invoices.length} Overdue) - ${clientEntry.clientName}`;

        let isDelivered = false;
        let errorMessage = null;

        try {
          await sendEmail({
            to: targetEmails,
            subject,
            html: emailHtml,
          });
          isDelivered = true;
        } catch (err) {
          console.error("Escalation email send failed:", err);
          errorMessage = err?.message || "Email dispatch failed";
        }

        // Log notification in notification_logs for the client and primary invoice
        const primaryInvoice = group.invoices[0];
        await db.insert(notificationLogs).values({
          companyId,
          clientId,
          invoiceId: primaryInvoice?.id || null,
          channel: "EMAIL",
          recipient: targetEmails.join(", "),
          subject,
          status: isDelivered ? "DELIVERED" : "FAILED",
          errorMessage,
          sentAt: new Date(),
        });

        // Update escalation states for each escalated invoice in this group
        for (const inv of group.invoices) {
          const subsequentRule = rules.find((r) => r.tierLevel > tierLevel);
          const dueDateTime = inv.dueDate ? new Date(inv.dueDate) : now;
          const nextDueAt = subsequentRule
            ? new Date(
                dueDateTime.getTime() +
                  subsequentRule.daysAfterDue * 24 * 60 * 60 * 1000,
              )
            : null;

          const newStatus = subsequentRule ? "PENDING" : "MAX_TIER_REACHED";

          if (inv.existingState) {
            await db
              .update(invoiceEscalationStates)
              .set({
                currentTier: tierLevel,
                lastEscalatedAt: new Date(),
                nextEscalationDueAt: nextDueAt,
                status: newStatus,
                notes: `Escalated to Tier ${tierLevel} (${inv.daysOverdue} days overdue). Grouped Client Notice. Recipients: ${targetEmails.join(", ")}`,
                updatedAt: new Date(),
              })
              .where(eq(invoiceEscalationStates.id, inv.existingState.id));
          } else {
            await db.insert(invoiceEscalationStates).values({
              invoiceId: inv.id,
              companyId,
              currentTier: tierLevel,
              lastEscalatedAt: new Date(),
              nextEscalationDueAt: nextDueAt,
              status: newStatus,
              notes: `Escalated to Tier ${tierLevel} (${inv.daysOverdue} days overdue). Grouped Client Notice. Recipients: ${targetEmails.join(", ")}`,
            });
          }

          summary.escalated++;
        }

        summary.details.push({
          client: clientEntry.clientName,
          invoices: invoiceNumbersStr,
          tier: tierLevel,
          daysOverdue: maxDaysOverdue,
          recipients: targetEmails,
        });
      }
    }
  } catch (error) {
    console.error("evaluateAndRunEscalations error:", error);
    summary.errors.push(
      error?.message || "Execution error in escalation engine",
    );
  }

  return summary;
}

/**
 * Helper to resolve target user emails based on rule and role (INTERNAL TEAM ONLY).
 */
async function resolveEscalationRecipients(companyId, rule) {
  const emails = new Set();

  if (rule.customEmail) {
    rule.customEmail
      .split(",")
      .map((e) => e.trim())
      .filter((e) => e.includes("@"))
      .forEach((e) => emails.add(e));
  }

  if (rule.targetUserId) {
    const [u] = await db
      .select({ email: users.email })
      .from(users)
      .where(
        and(
          eq(users.id, rule.targetUserId),
          eq(users.isActive, true),
          isNull(users.deletedAt),
        ),
      )
      .limit(1);

    if (u?.email) emails.add(u.email);
  }

  // Resolve users by Department
  if (rule.targetDepartmentId) {
    const deptConditions = [
      eq(companyUsers.companyId, companyId),
      eq(companyUsers.departmentId, rule.targetDepartmentId),
      eq(companyUsers.isActive, true),
      eq(users.isActive, true),
      isNull(users.deletedAt),
    ];

    // If role is also specified, narrow by role as well
    if (rule.targetRoleId) {
      deptConditions.push(eq(companyUsers.roleId, rule.targetRoleId));
    }

    const deptUsers = await db
      .select({ email: users.email })
      .from(companyUsers)
      .innerJoin(users, eq(users.id, companyUsers.userId))
      .where(and(...deptConditions));

    deptUsers.forEach((du) => {
      if (du.email) emails.add(du.email);
    });
  } else if (rule.targetRoleId) {
    // Role only
    const roleUsers = await db
      .select({ email: users.email })
      .from(companyUsers)
      .innerJoin(users, eq(users.id, companyUsers.userId))
      .where(
        and(
          eq(companyUsers.companyId, companyId),
          eq(companyUsers.roleId, rule.targetRoleId),
          eq(companyUsers.isActive, true),
          eq(users.isActive, true),
          isNull(users.deletedAt),
        ),
      );

    roleUsers.forEach((ru) => {
      if (ru.email) emails.add(ru.email);
    });
  }

  // Fallback to company admin/finance users or company email if no specific recipient resolved
  if (emails.size === 0) {
    // Attempt to resolve active company admin/finance users
    const adminUsers = await db
      .select({ email: users.email })
      .from(companyUsers)
      .innerJoin(users, eq(users.id, companyUsers.userId))
      .where(
        and(
          eq(companyUsers.companyId, companyId),
          eq(companyUsers.isActive, true),
          eq(users.isActive, true),
          isNull(users.deletedAt),
        ),
      )
      .limit(5);

    adminUsers.forEach((au) => {
      if (au.email) emails.add(au.email);
    });

    if (emails.size === 0) {
      const [comp] = await db
        .select({ email: companies.email })
        .from(companies)
        .where(eq(companies.id, companyId))
        .limit(1);

      if (comp?.email) {
        emails.add(comp.email);
      }
    }
  }

  return Array.from(emails);
}

/**
 * Generates an internal HTML email for a client's escalated overdue invoices with complete invoice list table.
 */
function generateClientEscalationEmailHtml({
  companyName,
  clientName,
  clientEmail,
  clientPhone,
  allClientInvoices = [],
  escalatedInvoices = [],
  tierLevel,
  tierDescription,
  maxDaysOverdue,
}) {
  const tierColor =
    tierLevel === 1 ? "#d97706" : tierLevel === 2 ? "#dc2626" : "#7f1d1d";
  const tierBadge =
    tierLevel === 1
      ? "TIER 1 (COLLECTIONS & AR)"
      : tierLevel === 2
        ? "TIER 2 (MANAGEMENT ESCALATION)"
        : "TIER 3 (EXECUTIVE CRITICAL ESCALATION)";

  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(Number(val || 0));

  const formatDate = (val) => {
    if (!val) return "—";
    const d = new Date(val);
    return isNaN(d.getTime())
      ? "—"
      : d.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
  };

  const totalOutstandingAll = allClientInvoices.reduce(
    (sum, inv) => sum + Number(inv.outstandingAmount || 0),
    0,
  );
  const totalOverdueAmount = allClientInvoices
    .filter((inv) => inv.isOverdue)
    .reduce((sum, inv) => sum + Number(inv.outstandingAmount || 0), 0);
  const overdueCount = allClientInvoices.filter((inv) => inv.isOverdue).length;

  const invoiceRows = allClientInvoices
    .map((inv, idx) => {
      const isEscalatedThisTier = escalatedInvoices.some(
        (e) => e.id === inv.id,
      );
      const isPastDue = inv.isOverdue;
      const rowBg = isEscalatedThisTier
        ? "#FEF2F2"
        : idx % 2 === 1
          ? "#F8FAFC"
          : "#FFFFFF";

      let statusBadge = "";
      if (isPastDue) {
        statusBadge = `
          <span style="background: #FEE2E2; color: #991B1B; padding: 2px 7px; border-radius: 4px; font-size: 11px; font-weight: 700; display: inline-block; white-space: nowrap;">
            ${inv.daysOverdue}d Overdue
          </span>
        `;
      } else {
        statusBadge = `
          <span style="background: #DCFCE7; color: #166534; padding: 2px 7px; border-radius: 4px; font-size: 11px; font-weight: 600; display: inline-block; white-space: nowrap;">
            Current / Due Soon
          </span>
        `;
      }

      return `
        <tr style="background-color: ${rowBg}; border-bottom: 1px solid #E2E8F0;">
          <td style="padding: 10px 12px; font-size: 13px; font-weight: 600; color: #0F172A; white-space: nowrap;">
            ${inv.invoiceNumber}
            ${
              isEscalatedThisTier
                ? `<span style="display: block; font-size: 10px; color: ${tierColor}; font-weight: 700; margin-top: 2px;">● Escalating (Tier ${tierLevel})</span>`
                : ""
            }
          </td>
          <td style="padding: 10px 10px; font-size: 12px; color: #475569; white-space: nowrap;">
            ${formatDate(inv.invoiceDate)}
          </td>
          <td style="padding: 10px 10px; font-size: 12px; font-weight: 600; color: ${isPastDue ? "#DC2626" : "#334155"}; white-space: nowrap;">
            ${formatDate(inv.dueDate)}
          </td>
          <td style="padding: 10px 10px; font-size: 12px; text-align: center; white-space: nowrap;">
            ${statusBadge}
          </td>
          <td style="padding: 10px 10px; font-size: 13px; text-align: right; color: #475569; white-space: nowrap;">
            ${formatCurrency(inv.netPayableAmount || inv.outstandingAmount)}
          </td>
          <td style="padding: 10px 12px; font-size: 13px; text-align: right; font-weight: 700; color: ${isPastDue ? "#DC2626" : "#0F172A"}; white-space: nowrap;">
            ${formatCurrency(inv.outstandingAmount)}
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <style>
        @media only screen and (max-width: 600px) {
          .email-card-container {
            width: 100% !important;
            margin: 0 !important;
            border-radius: 0 !important;
            border-left: none !important;
            border-right: none !important;
          }
          .email-card-body {
            padding: 16px 12px !important;
          }
          .table-scroll-wrapper {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .statement-table {
            min-width: 580px !important;
            width: 100% !important;
          }
          .scroll-hint {
            display: block !important;
          }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <div class="email-card-container" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 680px; width: 100%; margin: 16px auto; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <!-- Header Banner -->
        <div style="background-color: ${tierColor}; padding: 18px 20px; color: #ffffff; border-top-left-radius: 11px; border-top-right-radius: 11px;">
          <span style="font-size: 11px; font-weight: 800; letter-spacing: 0.05em; background: rgba(255,255,255,0.25); padding: 3px 8px; border-radius: 4px; display: inline-block;">
            ${tierBadge}
          </span>
          <h2 style="margin: 8px 0 0 0; font-size: 19px; font-weight: 700; color: #ffffff; line-height: 1.3;">
            Client Dues Escalation: ${clientName}
          </h2>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: rgba(255,255,255,0.9); line-height: 1.4;">
            ${tierDescription || "Overdue payment threshold reached. Immediate action required by internal team."}
          </p>
        </div>

        <div class="email-card-body" style="padding: 20px 18px;">
          <p style="color: #334155; font-size: 14px; line-height: 1.5; margin-top: 0;">
            Attention Team,
          </p>
          <p style="color: #334155; font-size: 13px; line-height: 1.6;">
            This internal escalation notice has been triggered for <strong>${clientName}</strong>. 
            There are <strong>${overdueCount} overdue invoice(s)</strong> totaling <strong style="color: ${tierColor};">${formatCurrency(totalOverdueAmount)}</strong> (Oldest is <span style="font-weight: 700;">${maxDaysOverdue} days overdue</span>).
          </p>

          <!-- Client Overview Box -->
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px 16px; margin: 16px 0;">
            <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
              <tr>
                <td style="color: #64748b; padding: 4px 0; width: 130px; font-size: 12px;">Client Name:</td>
                <td style="font-weight: 700; color: #0f172a;">${clientName}</td>
              </tr>
              ${
                clientPhone
                  ? `<tr><td style="color: #64748b; padding: 4px 0; font-size: 12px;">Phone:</td><td style="color: #0f172a;">${clientPhone}</td></tr>`
                  : ""
              }
              ${
                clientEmail
                  ? `<tr><td style="color: #64748b; padding: 4px 0; font-size: 12px;">Email:</td><td style="color: #0f172a; word-break: break-all;">${clientEmail}</td></tr>`
                  : ""
              }
              <tr>
                <td style="color: #64748b; padding: 4px 0; font-size: 12px;">Total Dues:</td>
                <td style="font-size: 13px; font-weight: 800; color: #0F172A;">${formatCurrency(totalOutstandingAll)} (${allClientInvoices.length} Invoices)</td>
              </tr>
              <tr>
                <td style="color: #64748b; padding: 4px 0; font-size: 12px;">Total Overdue:</td>
                <td style="font-size: 14px; font-weight: 800; color: ${tierColor};">${formatCurrency(totalOverdueAmount)} (${overdueCount} Overdue)</td>
              </tr>
            </table>
          </div>

          <!-- Invoices List Table Section -->
          <div style="margin: 20px 0 10px 0;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <div style="font-size: 14px; font-weight: 700; color: #0F172A;">
                Statement of Open & Overdue Invoices
              </div>
            </div>
            
            <!-- Mobile Horizontal Scroll Tip -->
            // <div class="scroll-hint" style="font-size: 11px; color: #64748b; background-color: #f1f5f9; padding: 4px 8px; border-radius: 4px; margin-bottom: 6px; display: inline-block;">
            //   👉 <em>Swipe horizontally to view all columns</em>
            // </div>

            <!-- Scrollable Table Wrapper -->
            <div class="table-scroll-wrapper" style="width: 100%; max-width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; border: 1px solid #E2E8F0; border-radius: 8px;">
              <table class="statement-table" style="width: 100%; min-width: 580px; font-size: 12px; border-collapse: collapse; background-color: #ffffff;">
                <thead>
                  <tr style="background: #F1F5F9; border-bottom: 1px solid #CBD5E1; color: #475569; font-weight: 700;">
                    <th style="padding: 10px 12px; text-align: left; white-space: nowrap;">Invoice #</th>
                    <th style="padding: 10px 10px; text-align: left; white-space: nowrap;">Date</th>
                    <th style="padding: 10px 10px; text-align: left; white-space: nowrap;">Due Date</th>
                    <th style="padding: 10px 10px; text-align: center; white-space: nowrap;">Aging Status</th>
                    <th style="padding: 10px 10px; text-align: right; white-space: nowrap;">Total (₹)</th>
                    <th style="padding: 10px 12px; text-align: right; white-space: nowrap;">Balance Due (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  ${invoiceRows}
                </tbody>
                <tfoot>
                  <tr style="background: #F8FAFC; border-top: 2px solid #E2E8F0; font-weight: 700;">
                    <td colspan="4" style="padding: 10px 12px; text-align: right; color: #0F172A; font-size: 13px;">
                      Total Outstanding:
                    </td>
                    <td colspan="2" style="padding: 10px 12px; text-align: right; color: ${tierColor}; font-size: 14px; font-weight: 800; white-space: nowrap;">
                      ${formatCurrency(totalOutstandingAll)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div style="margin-top: 24px; text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || ""}/invoices" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-size: 13px; font-weight: 700; text-decoration: none; padding: 11px 22px; border-radius: 8px;">
              Open Collections Dashboard & Record Follow-up
            </a>
          </div>
        </div>

        <div style="background-color: #f1f5f9; padding: 12px 20px; font-size: 11px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; border-bottom-left-radius: 11px; border-bottom-right-radius: 11px;">
          ${companyName} Automated Escalation & AR Recovery Engine
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generates an internal HTML email for single invoice escalation (fallback).
 */
function generateEscalationEmailHtml({
  companyName,
  invoiceNumber,
  clientName,
  clientEmail,
  clientPhone,
  dueDate,
  daysOverdue,
  outstandingAmount,
  tierLevel,
  tierDescription,
  invoiceId,
}) {
  const tierColor =
    tierLevel === 1 ? "#d97706" : tierLevel === 2 ? "#dc2626" : "#7f1d1d";
  const tierBadge =
    tierLevel === 1
      ? "TIER 1 (COLLECTIONS)"
      : tierLevel === 2
        ? "TIER 2 (MANAGEMENT ESCALATION)"
        : "TIER 3 (EXECUTIVE CRITICAL)";

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
      <div style="background-color: ${tierColor}; padding: 18px 24px; color: #ffffff;">
        <span style="font-size: 11px; font-weight: 800; letter-spacing: 0.05em; background: rgba(255,255,255,0.25); padding: 3px 8px; border-radius: 4px;">
          ${tierBadge}
        </span>
        <h2 style="margin: 8px 0 0 0; font-size: 18px; font-weight: 700; color: #ffffff;">
          Overdue Payment Escalation: ${invoiceNumber}
        </h2>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: rgba(255,255,255,0.9);">
          ${tierDescription || "Payment SLA breached. Action required by internal team."}
        </p>
      </div>

      <div style="padding: 24px;">
        <p style="color: #334155; font-size: 14px; line-height: 1.5; margin-top: 0;">
          Attention Team,
        </p>
        <p style="color: #334155; font-size: 13px; line-height: 1.6;">
          Invoice <strong>${invoiceNumber}</strong> issued to <strong>${clientName}</strong> is now <span style="color: ${tierColor}; font-weight: 700;">${daysOverdue} days overdue</span>. As per policy, this case has escalated to <strong>Tier ${tierLevel}</strong>.
        </p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 18px 0;">
          <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
            <tr>
              <td style="color: #64748b; padding: 4px 0; width: 140px;">Invoice Number:</td>
              <td style="font-weight: 600; color: #0f172a;">${invoiceNumber}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 4px 0;">Client Name:</td>
              <td style="font-weight: 600; color: #0f172a;">${clientName}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 4px 0;">Due Date:</td>
              <td style="font-weight: 600; color: #0f172a;">${dueDate}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 4px 0;">Days Overdue:</td>
              <td style="font-weight: 700; color: ${tierColor};">${daysOverdue} Days</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 4px 0;">Outstanding Balance:</td>
              <td style="font-size: 15px; font-weight: 800; color: #0f172a;">${outstandingAmount}</td>
            </tr>
            ${
              clientPhone
                ? `<tr><td style="color: #64748b; padding: 4px 0;">Client Contact:</td><td style="color: #0f172a;">${clientPhone}</td></tr>`
                : ""
            }
            ${
              clientEmail
                ? `<tr><td style="color: #64748b; padding: 4px 0;">Client Email:</td><td style="color: #0f172a;">${clientEmail}</td></tr>`
                : ""
            }
          </table>
        </div>

        <div style="margin-top: 24px; text-align: center;">
          <a
            href="#"
            onclick="return false;"
            style="display: inline-block; background-color: #9ca3af; color: #ffffff; font-size: 13px; font-weight: 700; text-decoration: none; padding: 11px 22px; border-radius: 8px; cursor: not-allowed;"
          >
            Open Collections Dashboard & Record Follow-up
          </a>
        </div>
      </div>

      <div style="background-color: #f1f5f9; padding: 12px 24px; font-size: 11px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0;">
        ${companyName} Automated Escalation & AR Recovery Engine
      </div>
    </div>
  `;
}
