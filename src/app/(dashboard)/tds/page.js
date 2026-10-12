import { getTdsManagementData } from "@/app/actions/tds";
import TdsManagementClient from "./_components/TdsManagementClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "TDS Management | PAFEX",
  description:
    "TDS verification, Form 26AS matching, and accounting reconciliation.",
};

export default async function TdsPage({ searchParams }) {
  const resolvedParams = await searchParams;
  const clientId = resolvedParams?.clientId || "ALL";
  const status = resolvedParams?.status || "ALL";
  const search = resolvedParams?.search || "";

  const data = await getTdsManagementData({
    clientId,
    status,
    search,
  });

  return (
    <TdsManagementClient
      initialClients={data.clients}
      initialInvoices={data.invoices}
      initialSummary={data.summary}
    />
  );
}
