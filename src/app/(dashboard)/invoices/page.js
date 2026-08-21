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
    <div className="space-y-4">
      {/* Top Search & Actions Bar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Search Box */}
        <div className="w-full lg:max-w-md">
          <SearchBox />
        </div>

        {/* Action Buttons Group */}
        <div className="flex flex-wrap items-center gap-2">
          <ImportInvoices />

          <a
            href="/api/import-invoice-sample"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-600 shadow-2xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          >
            Sample (CSV)
          </a>

          <ExportInvoicesButton />

          <Link
            href="/invoices/new"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 text-xs font-medium text-white shadow-xs transition hover:from-blue-500 hover:to-indigo-500"
          >
            + New Invoice
          </Link>
        </div>
      </div>

      {/* Filter Chips / Dropdowns */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200/80 bg-white p-2.5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
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
