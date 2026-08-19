import { getFollowups } from "@/app/actions/followup";
import FollowupTable from "@/app/components/followup/FollowupTable";
import FollowupToolbar from "@/app/components/followup/FollowupToolbar";

export const dynamic = "force-dynamic";

export default async function FollowupsPage({ searchParams }) {
  const resolvedParams = await searchParams;
  const query = resolvedParams?.q || "";
  const startDate = resolvedParams?.startDate || "";
  const endDate = resolvedParams?.endDate || "";
  const date = resolvedParams?.date || "";

  const followups = await getFollowups({
    query,
    startDate,
    endDate,
    date,
  });

  const hasFilter = Boolean(query || startDate || endDate || date);

  return (
    <div className="space-y-4">
      {/* Search, Date Range Filter & Actions Toolbar */}
      <FollowupToolbar totalCount={followups.length} />

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <FollowupTable followups={followups} hasFilter={hasFilter} />
      </div>
    </div>
  );
}
