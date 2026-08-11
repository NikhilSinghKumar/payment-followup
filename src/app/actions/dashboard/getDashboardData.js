"use server";

import { db } from "@/db";
import { invoices, payments, paymentAllocations } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/auth";
import { and, eq, isNull, gt, sql } from "drizzle-orm";

const TIME_ZONE = "Asia/Kolkata";

/**
 * ============================================
 * DATE HELPERS
 * ============================================
 */

function getTodayIST() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00Z`);

  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
}

function getWeekStart(dateString) {
  const date = new Date(`${dateString}T00:00:00Z`);

  const day = date.getUTCDay();

  // Monday = 1
  // Sunday = 0
  const daysFromMonday = day === 0 ? 6 : day - 1;

  date.setUTCDate(date.getUTCDate() - daysFromMonday);

  return date.toISOString().slice(0, 10);
}

async function getAgingData(companyId) {
  const today = getTodayIST();

  const [result] = await db
    .select({
      notDue: sql`
        COALESCE(
          SUM(
            CASE
              WHEN ${invoices.dueDate} >= ${today}::date
              THEN ${invoices.outstandingAmount}
              ELSE 0
            END
          ),
          0
        )
      `,

      days1to30: sql`
        COALESCE(
          SUM(
            CASE
              WHEN ${invoices.dueDate} < ${today}::date
                AND ${invoices.dueDate} >=
                    (${today}::date - INTERVAL '30 days')
              THEN ${invoices.outstandingAmount}
              ELSE 0
            END
          ),
          0
        )
      `,

      days31to60: sql`
        COALESCE(
          SUM(
            CASE
              WHEN ${invoices.dueDate} <
                    (${today}::date - INTERVAL '30 days')
                AND ${invoices.dueDate} >=
                    (${today}::date - INTERVAL '60 days')
              THEN ${invoices.outstandingAmount}
              ELSE 0
            END
          ),
          0
        )
      `,

      days61to90: sql`
        COALESCE(
          SUM(
            CASE
              WHEN ${invoices.dueDate} <
                    (${today}::date - INTERVAL '60 days')
                AND ${invoices.dueDate} >=
                    (${today}::date - INTERVAL '90 days')
              THEN ${invoices.outstandingAmount}
              ELSE 0
            END
          ),
          0
        )
      `,

      days90Plus: sql`
        COALESCE(
          SUM(
            CASE
              WHEN ${invoices.dueDate} <
                    (${today}::date - INTERVAL '90 days')
              THEN ${invoices.outstandingAmount}
              ELSE 0
            END
          ),
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
      ),
    );

  return [
    {
      bucket: "Not Due",
      amount: Number(result.notDue || 0),
    },
    {
      bucket: "1–30 Days",
      amount: Number(result.days1to30 || 0),
    },
    {
      bucket: "31–60 Days",
      amount: Number(result.days31to60 || 0),
    },
    {
      bucket: "61–90 Days",
      amount: Number(result.days61to90 || 0),
    },
    {
      bucket: "90+ Days",
      amount: Number(result.days90Plus || 0),
    },
  ];
}

function formatDisplayDate(dateString) {
  const [year, month, day] = dateString.split("-");

  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/**
 * ============================================
 * RESOLVE DASHBOARD PERIOD
 * ============================================
 */

function resolvePeriod(period, customStartDate, customEndDate) {
  const today = getTodayIST();

  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7));

  // Financial year starts on April 1
  const financialYearStartYear = month >= 4 ? year : year - 1;

  // ==========================================
  // YTD
  // ==========================================

  if (period === "YTD") {
    const startDate = `${financialYearStartYear}-04-01`;

    return {
      startDate,
      endDate: today,
      label:
        `${formatDisplayDate(startDate)} – ` + `${formatDisplayDate(today)}`,
    };
  }

  // ==========================================
  // WEEKLY
  // ==========================================

  if (period === "WEEKLY") {
    const startDate = getWeekStart(today);

    return {
      startDate,
      endDate: today,
      label:
        `${formatDisplayDate(startDate)} – ` + `${formatDisplayDate(today)}`,
    };
  }

  // ==========================================
  // FORTNIGHT
  // ==========================================

  if (period === "FORTNIGHT") {
    // 14 calendar days INCLUDING today
    const startDate = addDays(today, -13);

    return {
      startDate,
      endDate: today,
      label:
        `${formatDisplayDate(startDate)} – ` + `${formatDisplayDate(today)}`,
    };
  }

  // ==========================================
  // DATE RANGE
  // ==========================================

  if (period === "DATE_RANGE" && customStartDate && customEndDate) {
    return {
      startDate: customStartDate,
      endDate: customEndDate,
      label:
        `${formatDisplayDate(customStartDate)} – ` +
        `${formatDisplayDate(customEndDate)}`,
    };
  }

  // ==========================================
  // FALLBACK → YTD
  // ==========================================

  const startDate = `${financialYearStartYear}-04-01`;

  return {
    startDate,
    endDate: today,
    label: `${formatDisplayDate(startDate)} – ` + `${formatDisplayDate(today)}`,
  };
}

function getTrendGranularity(period, startDate, endDate) {
  if (period === "WEEKLY" || period === "FORTNIGHT") {
    return "day";
  }

  if (period === "YTD") {
    return "month";
  }

  if (period === "DATE_RANGE" && startDate && endDate) {
    const start = new Date(`${startDate}T00:00:00Z`);
    const end = new Date(`${endDate}T00:00:00Z`);

    const days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

    return days <= 31 ? "day" : "month";
  }

  return "month";
}

/**
 * ============================================
 * MAIN DASHBOARD DATA
 * ============================================
 */

export async function getDashboardData({
  period = "YTD",
  startDate = "",
  endDate = "",
} = {}) {
  // ==========================================
  // AUTH
  // ==========================================

  const currentUser = await getCurrentUser();

  if (!currentUser?.user || !currentUser?.companyId) {
    throw new Error("Unauthorized");
  }

  const companyId = currentUser.companyId;
  const agingData = await getAgingData(companyId);

  // ==========================================
  // PERIOD
  // ==========================================

  const resolvedPeriod = resolvePeriod(period, startDate, endDate);

  const periodStart = resolvedPeriod.startDate;

  const periodEnd = resolvedPeriod.endDate;

  const trendGranularity = getTrendGranularity(period, periodStart, periodEnd);

  const collectionTrend = await getCollectionTrend({
    companyId,
    startDate: periodStart,
    endDate: periodEnd,
    granularity: trendGranularity,
  });

  // ==========================================
  // 90 DAYS AGO
  // ==========================================

  const ninetyDaysAgo = new Date();

  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // ==========================================
  // 1. TOTAL OUTSTANDING
  // CURRENT SNAPSHOT
  // ==========================================

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

  // ==========================================
  // 2. 90+ DAYS OUTSTANDING
  // CURRENT SNAPSHOT
  // ==========================================

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

  // ==========================================
  // 3. TODAY COLLECTION
  // ALWAYS TODAY
  // ==========================================

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
          DATE(
            ${payments.paymentDate}
            AT TIME ZONE 'Asia/Kolkata'
          )
          =
          DATE(
            NOW()
            AT TIME ZONE 'Asia/Kolkata'
          )
        `,
      ),
    );

  // ==========================================
  // 4. MONTH COLLECTION
  // ALWAYS CURRENT MONTH
  // ==========================================

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

        sql`
          ${payments.paymentDate}
          >=
          DATE_TRUNC(
            'month',
            NOW() AT TIME ZONE 'Asia/Kolkata'
          )
          AT TIME ZONE 'Asia/Kolkata'
        `,
      ),
    );

  // ==========================================
  // 5. PERIOD COLLECTION
  // YTD / WEEKLY / FORTNIGHT / DATE RANGE
  // ==========================================

  const [periodCollectionResult] = await db
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
          ${payments.paymentDate}
          >=
          (
            ${periodStart}::date
            AT TIME ZONE 'Asia/Kolkata'
          )
        `,

        sql`
          ${payments.paymentDate}
          <
          (
            (${periodEnd}::date + INTERVAL '1 day')
            AT TIME ZONE 'Asia/Kolkata'
          )
        `,
      ),
    );

  // ==========================================
  // TOTAL COLLECTION
  // ALL-TIME COLLECTION
  // ==========================================

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

  // ==========================================
  // 6. UNALLOCATED PAYMENTS
  // CURRENT SNAPSHOT
  // ==========================================

  const allocationTotals = db
    .select({
      paymentId: paymentAllocations.paymentId,

      allocatedAmount: sql`
        COALESCE(
          SUM(
            ${paymentAllocations.allocatedAmount}
          ),
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
              ${payments.amount}
              -
              COALESCE(
                ${allocationTotals.allocatedAmount},
                0
              ),
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

  // ==========================================
  // RETURN
  // ==========================================

  return {
    period,
    startDate: periodStart,
    endDate: periodEnd,
    periodLabel: resolvedPeriod.label,
    agingData,

    summary: {
      outstanding: Number(outstandingResult.total || 0),

      outstanding90Days: Number(outstanding90Result.total || 0),

      todayCollection: Number(todayCollectionResult.total || 0),

      monthCollection: Number(monthCollectionResult.total || 0),

      periodCollection: Number(periodCollectionResult.total || 0),

      totalCollection: Number(totalCollectionResult.total || 0),

      unallocatedPayments: Number(unallocatedResult.total || 0),
    },

    collectionTrend,
    trendGranularity,
  };
}

/**
 * ============================================
 * COLLECTION TREND
 * ============================================
 */

async function getCollectionTrend({
  companyId,
  startDate,
  endDate,
  granularity,
}) {
  if (granularity === "day") {
    const result = await db.execute(sql`
      WITH date_series AS (
        SELECT
          generate_series(
            ${startDate}::date,
            ${endDate}::date,
            INTERVAL '1 day'
          )::date AS period_date
      ),

      payment_totals AS (
        SELECT
          DATE(
            ${payments.paymentDate}
            AT TIME ZONE 'Asia/Kolkata'
          ) AS period_date,

          COALESCE(
            SUM(${payments.amount}),
            0
          ) AS collection

        FROM ${payments}

        WHERE
          ${payments.companyId} = ${companyId}
          AND ${payments.deletedAt} IS NULL
          AND ${payments.isVoided} = false

          AND ${payments.paymentDate} >=
            (
              ${startDate}::date
              AT TIME ZONE 'Asia/Kolkata'
            )

          AND ${payments.paymentDate} <
            (
              (${endDate}::date + INTERVAL '1 day')
              AT TIME ZONE 'Asia/Kolkata'
            )

        GROUP BY period_date
      )

      SELECT
        date_series.period_date AS date,

        COALESCE(
          payment_totals.collection,
          0
        ) AS collection

      FROM date_series

      LEFT JOIN payment_totals
        ON payment_totals.period_date =
           date_series.period_date

      ORDER BY date_series.period_date
    `);

    return result.rows.map((row) => ({
      date: row.date,
      collection: Number(row.collection || 0),
    }));
  }

  const result = await db.execute(sql`
    WITH date_series AS (
      SELECT
        generate_series(
          DATE_TRUNC(
            'month',
            ${startDate}::date
          ),
          DATE_TRUNC(
            'month',
            ${endDate}::date
          ),
          INTERVAL '1 month'
        )::date AS period_date
    ),

    payment_totals AS (
      SELECT
        DATE_TRUNC(
          'month',
          ${payments.paymentDate}
          AT TIME ZONE 'Asia/Kolkata'
        )::date AS period_date,

        COALESCE(
          SUM(${payments.amount}),
          0
        ) AS collection

      FROM ${payments}

      WHERE
        ${payments.companyId} = ${companyId}
        AND ${payments.deletedAt} IS NULL
        AND ${payments.isVoided} = false

        AND ${payments.paymentDate} >=
          (
            ${startDate}::date
            AT TIME ZONE 'Asia/Kolkata'
          )

        AND ${payments.paymentDate} <
          (
            (${endDate}::date + INTERVAL '1 day')
            AT TIME ZONE 'Asia/Kolkata'
          )

      GROUP BY period_date
    )

    SELECT
      date_series.period_date AS date,

      COALESCE(
        payment_totals.collection,
        0
      ) AS collection

    FROM date_series

    LEFT JOIN payment_totals
      ON payment_totals.period_date =
         date_series.period_date

    ORDER BY date_series.period_date
  `);

  return result.rows.map((row) => ({
    date: row.date,
    collection: Number(row.collection || 0),
  }));
}
