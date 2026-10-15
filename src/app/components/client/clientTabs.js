import Link from "next/link";

const tabs = [
  {
    key: "invoices",
    label: "Invoices",
  },
  {
    key: "payments",
    label: "Payments",
  },
  {
    key: "followups",
    label: "Followups",
  },
  {
    key: "sub-clients",
    label: "Sub Clients",
  },
  {
    key: "locations",
    label: "Locations",
  },
  {
    key: "contacts",
    label: "Contacts",
  },
];

export default function ClientTabs({
  clientId,
  activeTab = "invoices",
  rightContent = null,
}) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800">
      <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-1.5 overflow-x-auto [scrollbar-width:none]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;

          return (
            <Link
              key={tab.key}
              href={`/clients/${clientId}?tab=${tab.key}`}
              className={`shrink-0 rounded-t-xl px-3 sm:px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-all ${
                isActive
                  ? "border border-b-white border-zinc-200 bg-white text-zinc-900 shadow-2xs dark:border-zinc-700 dark:border-b-zinc-900 dark:bg-zinc-900 dark:text-zinc-100"
                  : "text-zinc-500 hover:bg-zinc-100/80 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {rightContent && (
        <div className="flex shrink-0 items-center gap-2 pb-1 sm:pb-0">
          {rightContent}
        </div>
      )}
    </div>
  );
}
