import Link from "next/link";

const tabs = [
  {
    key: "overview",
    label: "Overview",
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
];

export default function ClientTabs({ clientId, activeTab = "overview" }) {
  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max gap-2 border-b border-zinc-200">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;

          return (
            <Link
              key={tab.key}
              href={`/clients/${clientId}?tab=${tab.key}`}
              className={`rounded-t-xl px-4 py-3 text-sm font-medium transition-all ${
                isActive
                  ? "border border-b-white border-zinc-200 bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
