import { getFollowups } from "@/app/actions/followup";
import FollowupTable from "@/app/components/followup/FollowupTable";
import Link from "next/link";

export default async function FollowupsPage() {
  const followups = await getFollowups();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-end">
        <Link
          href="/followups/new"
          className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
        >
          + Add Follow-up
        </Link>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <FollowupTable followups={followups} />
      </div>
    </div>
  );
}
