"use server";

import { db } from "@/db";
import { invoices, payments, paymentAllocations } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/auth";
import { and, eq, isNull, gt, sql } from "drizzle-orm";

export async function getDashboardData() {
  // =====================================
  // AUTH
  // =====================================

  const currentUser = await getCurrentUser();

  if (!currentUser?.user || !currentUser?.companyId) {
    throw new Error("Unauthorized");
  }

  const companyId = currentUser.companyId;

  // =====================================
  // DATES
  // =====================================

  const today = new Date();

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const ninetyDaysAgo = new Date();

  ninetyDaysAgo.setDate(today.getDate() - 90);

  // =====================================
  // OUTSTANDING
  // =====================================

  const [outstandingResult] = await db
    .select({
      total: sql`
        COALESCE(
          SUM(${invoices.outstandingAmount}),
          0
        )
      `,
    })
    .from(invoices)
    .where(and(eq(invoices.companyId, companyId), isNull(invoices.deletedAt)));

  // =====================================
  // 90 DAYS OUTSTANDING
  // =====================================

  const [outstanding90Result] = await db
    .select({
      total: sql`
        COALESCE(
          SUM(${invoices.outstandingAmount}),
          0
        )
      `,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.companyId, companyId),
        isNull(invoices.deletedAt),
        gt(invoices.outstandingAmount, "0"),
        sql`${invoices.dueDate} <= ${ninetyDaysAgo}`,
      ),
    );

  // =====================================
  // TODAY COLLECTION
  // =====================================

  const [todayCollectionResult] = await db
    .select({
      total: sql`
        COALESCE(
          SUM(${payments.amount}),
          0
        )
      `,
    })
    .from(payments)
    .where(
      and(
        eq(payments.companyId, companyId),
        isNull(payments.deletedAt),
        eq(payments.isVoided, false),
        sql`
            DATE(${payments.paymentDate} AT TIME ZONE 'Asia/Kolkata')
            =
            DATE(NOW() AT TIME ZONE 'Asia/Kolkata')
          `,
      ),
    );

  // =====================================
  // MONTH COLLECTION
  // =====================================

  const [monthCollectionResult] = await db
    .select({
      total: sql`
        COALESCE(
          SUM(${payments.amount}),
          0
        )
      `,
    })
    .from(payments)
    .where(
      and(
        eq(payments.companyId, companyId),
        isNull(payments.deletedAt),
        eq(payments.isVoided, false),
        sql`${payments.paymentDate} >= ${monthStart}`,
      ),
    );

  // Total Collection

  const [totalCollectionResult] = await db
    .select({
      total: sql`
      COALESCE(
        SUM(${payments.amount}),
        0
      )
    `,
    })
    .from(payments)
    .where(
      and(
        eq(payments.companyId, companyId),
        isNull(payments.deletedAt),
        eq(payments.isVoided, false),
      ),
    );

  // =====================================
  // UNALLOCATED PAYMENTS
  // =====================================

  const allocationTotals = db
    .select({
      paymentId: paymentAllocations.paymentId,

      allocatedAmount: sql`
      COALESCE(
        SUM(${paymentAllocations.allocatedAmount}),
        0
      )
    `.as("allocated_amount"),
    })
    .from(paymentAllocations)
    .where(isNull(paymentAllocations.deletedAt))
    .groupBy(paymentAllocations.paymentId)
    .as("allocation_totals");

  const [unallocatedResult] = await db
    .select({
      total: sql`
      COALESCE(
        SUM(
          GREATEST(
            ${payments.amount} - COALESCE(${allocationTotals.allocatedAmount}, 0),
            0
          )
        ),
        0
      )
    `,
    })
    .from(payments)
    .leftJoin(allocationTotals, eq(allocationTotals.paymentId, payments.id))
    .where(
      and(
        eq(payments.companyId, companyId),
        isNull(payments.deletedAt),
        eq(payments.isVoided, false),
      ),
    );

  // =====================================
  // RETURN
  // =====================================

  return {
    summary: {
      outstanding: Number(outstandingResult.total || 0),

      outstanding90Days: Number(outstanding90Result.total || 0),

      todayCollection: Number(todayCollectionResult.total || 0),

      monthCollection: Number(monthCollectionResult.total || 0),

      totalCollection: Number(totalCollectionResult.total || 0),

      unallocatedPayments: Number(unallocatedResult.total || 0),
    },
  };
}
