import {
  getInvoices,
  getFinancialYears,
  getMaxOutstandingAmount,
} from "../../actions/invoice";
import Link from "next/link";
import ImportInvoices from "../../components/ImportInvoices";
import SearchBox from "../../components/SearchBox";
import FilterDropdown from "../../components/FilterDropdown";
import AgingFilterDropdown from "../../components/invoice/AgingFilterDropdown";
import FinancialYearFilterDropdown from "../../components/invoice/FinancialYearFilterDropdown";
import MonthFilterDropdown from "../../components/invoice/MonthFilterDropdown";
import AmountRangeFilter from "../../components/invoice/AmountRangeFilter";
import AlphabetDropdown from "../../components/invoice/AlphabetDropdown";
import ExportInvoicesButton from "../../components/invoice/ExportInvoicesButton";
import InvoicesTableClient from "../../components/invoice/InvoicesTableClient";

export default async function InvoicePage({ searchParams }) {
  const resolvedParams = await searchParams;
  const query = resolvedParams?.q || "";
  const status = resolvedParams?.status || "";
  const sort = resolvedParams?.sort || "high";
  const aging = resolvedParams?.aging || "";
  const financialYear = resolvedParams?.financialYear || "";
  const month = resolvedParams?.month || "";
  const alphabet = resolvedParams?.alphabet || "";

  const minAmount = resolvedParams?.minAmount || "";
  const maxAmount = resolvedParams?.maxAmount || "";
  const maxOutstanding = await getMaxOutstandingAmount();

  const data = await getInvoices(
    query,
    status,
    sort,
    aging,
    financialYear,
    month,
    minAmount,
    maxAmount,
    alphabet,
  );

  const years = await getFinancialYears();

  return (
    <div className="bg-zinc-50">
      <div className="flex items-center justify-center mb-2">
        <div className="flex items-center gap-2">
          <SearchBox />
          <ImportInvoices />

          <a
            href="/api/import-invoice-sample"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-zinc-500 border border-zinc-200 underline py-2 px-3 rounded-lg"
          >
            Sample(csv)
          </a>
          <ExportInvoicesButton />

          <Link
            href="/invoices/new"
            className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:shadow-md"
          >
            + New Invoice
          </Link>
        </div>
      </div>

      <div className="flex justify-center items-center gap-2 mb-6">
        <AlphabetDropdown />
        <FilterDropdown />
        <AmountRangeFilter maxAmount={maxOutstanding} />
        <AgingFilterDropdown />
        <MonthFilterDropdown />
        <FinancialYearFilterDropdown years={years} />
      </div>

      {/* Invoices Interactive Table with Multi-Select & Bulk Reminders */}
      <InvoicesTableClient invoices={data} />
    </div>
  );
}
