import { previewPaymentReceivedEmailAction } from "@/app/actions/notificationSettings";

export const dynamic = "force-dynamic";

export default async function TestPaymentPreviewPage({ searchParams }) {
  const params = await searchParams;
  const clientId = params?.clientId ? Number(params.clientId) : null;
  const result = await previewPaymentReceivedEmailAction(clientId);

  if (!result?.success) {
    return (
      <div className="p-8 text-red-600 bg-red-50 rounded-xl border border-red-200">
        <h2 className="font-bold text-lg">Error Rendering Preview</h2>
        <p className="text-sm mt-1">
          {result?.error || "Unknown error occurred"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Payment Received Email Live Browser Preview
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Subject:{" "}
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              {result.subject}
            </span>
          </p>
        </div>
        <a
          href="/settings?tab=notifications"
          className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300"
        >
          ← Back to Settings
        </a>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white shadow-xs overflow-hidden dark:border-zinc-800">
        <iframe
          title="Payment Received Email"
          srcDoc={result.html}
          className="w-full min-h-[750px] border-0"
        />
      </div>
    </div>
  );
}
