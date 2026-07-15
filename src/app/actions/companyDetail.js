"use server";

import { db } from "@/db";
import {
  companies,
  companyUsers,
  clients,
  invoices,
  payments,
} from "@/db/schema";

import { eq, and, count, isNull } from "drizzle-orm";

// =====================================================
// COMPANY SUMMARY
// =====================================================

export async function getCompanySummary(companyId) {
  const id = Number(companyId);

  // --------------------------------------------
  // Company
  // --------------------------------------------

  const company = await db.query.companies.findFirst({
    where: and(eq(companies.id, id), isNull(companies.deletedAt)),
  });

  if (!company) {
    return null;
  }

  // --------------------------------------------
  // Statistics
  // --------------------------------------------

  const [
    [{ totalUsers }],
    [{ totalClients }],
    [{ totalInvoices }],
    [{ totalPayments }],
  ] = await Promise.all([
    db
      .select({
        totalUsers: count(),
      })
      .from(companyUsers)
      .where(
        and(eq(companyUsers.companyId, id), eq(companyUsers.isActive, true)),
      ),

    db
      .select({
        totalClients: count(),
      })
      .from(clients)
      .where(and(eq(clients.companyId, id), isNull(clients.deletedAt))),

    db
      .select({
        totalInvoices: count(),
      })
      .from(invoices)
      .where(and(eq(invoices.companyId, id), isNull(invoices.deletedAt))),

    db
      .select({
        totalPayments: count(),
      })
      .from(payments)
      .where(and(eq(payments.companyId, id), isNull(payments.deletedAt))),
  ]);

  return {
    ...company,

    totalUsers,
    totalClients,
    totalInvoices,
    totalPayments,
  };
}

export async function getCompanyUsers(companyId) {
  const id = Number(companyId);

  return await db.query.companyUsers.findMany({
    where: and(eq(companyUsers.companyId, id), eq(companyUsers.isActive, true)),

    with: {
      user: true,
    },

    orderBy: (companyUsers, { asc }) => [asc(companyUsers.createdAt)],
  });
}

export async function getCompanyClients(companyId) {
  const id = Number(companyId);

  return await db.query.clients.findMany({
    where: and(eq(clients.companyId, id), isNull(clients.deletedAt)),

    orderBy: (clients, { asc }) => [asc(clients.companyName)],
  });
}
