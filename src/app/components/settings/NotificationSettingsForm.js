"use client";

import { useState, useTransition } from "react";
import {
  Bell,
  Clock,
  Mail,
  ShieldCheck,
  Play,
  Send,
  Check,
  AlertCircle,
  Save,
  Calendar,
  Building,
  Sparkles,
  HelpCircle,
  Eye,
  Smartphone,
  Monitor,
  X,
} from "lucide-react";
import {
  updateNotificationSettings,
  triggerManualSchedulerRun,
  testNotificationEmail,
  previewPaymentReceivedEmailAction,
  sendTestPaymentReceivedEmailAction,
} from "@/app/actions/notificationSettings";

export default function NotificationSettingsForm({
  initialSettings = {},
  company = {},
}) {
  const [form, setForm] = useState({
    sendBillSubmission: initialSettings.sendBillSubmission ?? true,
    reminderBeforeDue: initialSettings.reminderBeforeDue ?? true,
    reminderDaysBefore: initialSettings.reminderDaysBefore ?? 2,
    sendDueTodayNotification: initialSettings.sendDueTodayNotification ?? true,
    sendOverdueReminder: initialSettings.sendOverdueReminder ?? true,
    overdueReminderDays: initialSettings.overdueReminderDays ?? 7,
    sendPaymentConfirmation: initialSettings.sendPaymentConfirmation ?? true,
    autoSendSuspensionNotice: initialSettings.autoSendSuspensionNotice ?? false,
    sendInternalSuspensionAlert:
      initialSettings.sendInternalSuspensionAlert ?? true,
    sendInvoicePdf: initialSettings.sendInvoicePdf ?? true,
    ccAccountsEmail: initialSettings.ccAccountsEmail || "",
    ccSalesEmail: initialSettings.ccSalesEmail || "",
    notifyManager: initialSettings.notifyManager ?? false,
    businessStartHour: initialSettings.businessStartHour ?? 9,
    businessEndHour: initialSettings.businessEndHour ?? 18,
    skipWeekends: initialSettings.skipWeekends ?? false,
  });

  const [testEmail, setTestEmail] = useState("");
  const [paymentTestEmail, setPaymentTestEmail] = useState("");
  const [isSaving, startSaveTransition] = useTransition();
  const [isTesting, startTestTransition] = useTransition();
  const [isTestingPayment, startPaymentTestTransition] = useTransition();
  const [isPreviewing, startPreviewTransition] = useTransition();
  const [isRunningCron, startCronTransition] = useTransition();

  const [feedback, setFeedback] = useState(null);
  const [cronReport, setCronReport] = useState(null);

  // Email Preview Modal States
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewSubject, setPreviewSubject] = useState("");
  const [previewDevice, setPreviewDevice] = useState("desktop"); // 'desktop' or 'mobile'

  function handleToggle(key) {
    setForm((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleChange(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave(e) {
    if (e) e.preventDefault();
    setFeedback(null);

    startSaveTransition(async () => {
      const res = await updateNotificationSettings(form);
      if (res.success) {
        setFeedback({ type: "success", message: res.message });
      } else {
        setFeedback({ type: "error", message: res.error });
      }
    });
  }

  function handleTriggerAutomation() {
    setFeedback(null);
    setCronReport(null);

    startCronTransition(async () => {
      const res = await triggerManualSchedulerRun();
      if (res.success) {
        setCronReport(res.result);
        setFeedback({ type: "success", message: res.message });
      } else {
        setFeedback({ type: "error", message: res.error });
      }
    });
  }

  function handleSendTestEmail() {
    if (!testEmail || !testEmail.includes("@")) {
      setFeedback({
        type: "error",
        message: "Please enter a valid email address to test.",
      });
      return;
    }

    setFeedback(null);
    startTestTransition(async () => {
      const res = await testNotificationEmail(testEmail);
      if (res.success) {
        setFeedback({ type: "success", message: res.message });
      } else {
        setFeedback({ type: "error", message: res.error });
      }
    });
  }

  function handlePreviewPaymentReceived() {
    setFeedback(null);
    startPreviewTransition(async () => {
      const res = await previewPaymentReceivedEmailAction();
      if (res.success) {
        setPreviewHtml(res.html);
        setPreviewSubject(res.subject);
        setPreviewModalOpen(true);
      } else {
        setFeedback({
          type: "error",
          message: res.error || "Failed to generate preview",
        });
      }
    });
  }

  function handleSendPaymentTestEmail() {
    if (!paymentTestEmail || !paymentTestEmail.includes("@")) {
      setFeedback({
        type: "error",
        message: "Please enter a valid email address to send test.",
      });
      return;
    }

    setFeedback(null);
    startPaymentTestTransition(async () => {
      const res = await sendTestPaymentReceivedEmailAction(paymentTestEmail);
      if (res.success) {
        setFeedback({ type: "success", message: res.message });
      } else {
        setFeedback({ type: "error", message: res.error });
      }
    });
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-xl p-3.5 text-xs font-medium ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/60 dark:text-red-200"
          }`}
        >
          {feedback.type === "success" ? (
            <Check size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* SECTION 1: AUTOMATED REMINDER RULES */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <Bell size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Automated Payment Reminders
              </h3>
              <p className="text-xs text-zinc-500">
                Triggered automatically based on invoice due dates and aging.
              </p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
          {/* Rule 1: Advance Due Notice */}
          <div className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Advance Due Reminder (Upcoming Due Date)
                </span>
                {form.reminderBeforeDue && (
                  <span className="rounded bg-blue-100 px-1.5 py-0.2 text-[10px] font-bold text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                    Active
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-zinc-500">
                Sends a polite reminder before the invoice due date arrives.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {form.reminderBeforeDue && (
                <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={form.reminderDaysBefore}
                    onChange={(e) =>
                      handleChange("reminderDaysBefore", e.target.value)
                    }
                    className="h-8 w-14 rounded-lg border border-zinc-200 text-center text-xs font-semibold text-zinc-800 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  />
                  <span>days before</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => handleToggle("reminderBeforeDue")}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  form.reminderBeforeDue
                    ? "bg-blue-600"
                    : "bg-zinc-300 dark:bg-zinc-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    form.reminderBeforeDue ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Rule 2: Due Today Reminder */}
          <div className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Due Today Notification
                </span>
                {form.sendDueTodayNotification && (
                  <span className="rounded bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                    Active
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-zinc-500">
                Dispatches a notification on the exact morning of the invoice
                due date.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleToggle("sendDueTodayNotification")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                form.sendDueTodayNotification
                  ? "bg-blue-600"
                  : "bg-zinc-300 dark:bg-zinc-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  form.sendDueTodayNotification
                    ? "translate-x-5"
                    : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Rule 3: Overdue Escalation Reminder */}
          <div className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Overdue Escalation Follow-up
                </span>
                {form.sendOverdueReminder && (
                  <span className="rounded bg-red-100 px-1.5 py-0.2 text-[10px] font-bold text-red-800 dark:bg-red-900 dark:text-red-200">
                    Active
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-zinc-500">
                Periodically follows up with clients when invoices remain unpaid
                past their due date.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {form.sendOverdueReminder && (
                <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                  <span>Every</span>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={form.overdueReminderDays}
                    onChange={(e) =>
                      handleChange("overdueReminderDays", e.target.value)
                    }
                    className="h-8 w-14 rounded-lg border border-zinc-200 text-center text-xs font-semibold text-zinc-800 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  />
                  <span>days</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => handleToggle("sendOverdueReminder")}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  form.sendOverdueReminder
                    ? "bg-blue-600"
                    : "bg-zinc-300 dark:bg-zinc-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    form.sendOverdueReminder ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Rule 4: Bill Submission Acknowledgement */}
          <div className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                Bill Submission Confirmation
              </span>
              <p className="mt-0.5 text-xs text-zinc-500">
                Sends initial submission email to client contact upon creating a
                new invoice.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleToggle("sendBillSubmission")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                form.sendBillSubmission
                  ? "bg-blue-600"
                  : "bg-zinc-300 dark:bg-zinc-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  form.sendBillSubmission ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Rule 5: Payment Receipt Acknowledgement */}
          <div className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                Payment Receipt Acknowledgement
              </span>
              <p className="mt-0.5 text-xs text-zinc-500">
                Sends an instant thank-you receipt and ledger balance update
                when payment is recorded.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleToggle("sendPaymentConfirmation")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                form.sendPaymentConfirmation
                  ? "bg-blue-600"
                  : "bg-zinc-300 dark:bg-zinc-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  form.sendPaymentConfirmation
                    ? "translate-x-5"
                    : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Rule 6: Service Suspension Notice */}
          <div className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Automated Service Suspension Notices to Clients
                </span>
                {form.autoSendSuspensionNotice ? (
                  <span className="rounded bg-red-100 px-1.5 py-0.2 text-[10px] font-bold text-red-800 dark:bg-red-900 dark:text-red-200">
                    Auto-Send Active
                  </span>
                ) : (
                  <span className="rounded bg-zinc-100 px-1.5 py-0.2 text-[10px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    Manual Review Only
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-zinc-500">
                When enabled, automatically emails formal service suspension
                notice to defaulters (&ge; 10 days past due). Disable to require
                manual approval in Suspension Center.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleToggle("autoSendSuspensionNotice")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                form.autoSendSuspensionNotice
                  ? "bg-red-600"
                  : "bg-zinc-300 dark:bg-zinc-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  form.autoSendSuspensionNotice
                    ? "translate-x-5"
                    : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Rule 7: Internal Team Suspension Alerts */}
          <div className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Internal Team Suspension Alerts
                </span>
                {form.sendInternalSuspensionAlert && (
                  <span className="rounded bg-blue-100 px-1.5 py-0.2 text-[10px] font-bold text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    Active
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-zinc-500">
                Notifies internal finance & operations team whenever a client
                crosses into service suspension default status.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleToggle("sendInternalSuspensionAlert")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                form.sendInternalSuspensionAlert
                  ? "bg-blue-600"
                  : "bg-zinc-300 dark:bg-zinc-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  form.sendInternalSuspensionAlert
                    ? "translate-x-5"
                    : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Rule 8: Attach PDF / AWB Detail */}
          <div className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                Include AWB Breakdown & Bank Coordinates
              </span>
              <p className="mt-0.5 text-xs text-zinc-500">
                Embeds shipment AWBs and company bank/UPI details in all
                dispatched reminder templates.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleToggle("sendInvoicePdf")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                form.sendInvoicePdf
                  ? "bg-blue-600"
                  : "bg-zinc-300 dark:bg-zinc-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  form.sendInvoicePdf ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: SCHEDULE & DISPATCH WINDOW */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <Clock size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Schedule & Operating Window
              </h3>
              <p className="text-xs text-zinc-500">
                Configure business hours and weekend handling for automated
                communications.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Business Hours Window
            </label>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-xs text-zinc-500">From</span>
                <select
                  value={form.businessStartHour}
                  onChange={(e) =>
                    handleChange("businessStartHour", e.target.value)
                  }
                  className="h-8 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs text-zinc-800 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  {[8, 9, 10, 11].map((h) => (
                    <option key={h} value={h}>
                      {h}:00 AM
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-xs text-zinc-500">to</span>
                <select
                  value={form.businessEndHour}
                  onChange={(e) =>
                    handleChange("businessEndHour", e.target.value)
                  }
                  className="h-8 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs text-zinc-800 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  {[17, 18, 19, 20].map((h) => (
                    <option key={h} value={h}>
                      {h - 12}:00 PM
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="mt-1 text-[11px] text-zinc-400">
              Automated reminders will only be dispatched during these business
              hours.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-800/40">
            <div>
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                Skip Weekends
              </span>
              <p className="text-[11px] text-zinc-500">
                Do not send reminders on Saturday and Sunday.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleToggle("skipWeekends")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                form.skipWeekends
                  ? "bg-blue-600"
                  : "bg-zinc-300 dark:bg-zinc-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  form.skipWeekends ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 3: TEAM ESCALATION & CC */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <Mail size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Team CC & Escalation Routing
              </h3>
              <p className="text-xs text-zinc-500">
                Keep your finance team and account managers in the loop.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Accounts Team CC Email
            </label>
            <input
              type="email"
              placeholder="accounts@company.com"
              value={form.ccAccountsEmail}
              onChange={(e) => handleChange("ccAccountsEmail", e.target.value)}
              className="h-8.5 w-full rounded-xl border border-zinc-200 px-3 text-xs text-zinc-800 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            />
            <p className="mt-1 text-[11px] text-zinc-400">
              Receives a copy of all outgoing client reminder emails.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Sales / Relationship Manager CC Email
            </label>
            <input
              type="email"
              placeholder="sales@company.com"
              value={form.ccSalesEmail}
              onChange={(e) => handleChange("ccSalesEmail", e.target.value)}
              className="h-8.5 w-full rounded-xl border border-zinc-200 px-3 text-xs text-zinc-800 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            />
            <p className="mt-1 text-[11px] text-zinc-400">
              Kept informed on overdue escalation notices.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 4: ON-DEMAND ACTIONS & TESTING */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
              <Play size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Testing & On-Demand Actions
              </h3>
              <p className="text-xs text-zinc-500">
                Evaluate reminder rules immediately or send a sample
                verification email.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* On-Demand Run Card */}
          <div className="flex flex-col justify-between rounded-xl border border-zinc-200 p-4 bg-zinc-50/50 dark:border-zinc-700 dark:bg-zinc-800/40">
            <div>
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                Evaluate & Dispatch Due Reminders Now
              </h4>
              <p className="mt-1 text-xs text-zinc-500">
                Instantly checks all active invoices against your configured
                reminder rules and sends any due notifications without waiting
                for the scheduled background run.
              </p>
            </div>

            <div className="mt-4">
              <button
                type="button"
                disabled={isRunningCron}
                onClick={handleTriggerAutomation}
                className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-purple-700 disabled:opacity-50 transition"
              >
                {isRunningCron ? (
                  <>
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Evaluating Invoices...</span>
                  </>
                ) : (
                  <>
                    <Play size={13} />
                    <span>Run Due Reminders Check</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Test Email Card */}
          <div className="flex flex-col justify-between rounded-xl border border-zinc-200 p-4 bg-zinc-50/50 dark:border-zinc-700 dark:bg-zinc-800/40">
            <div>
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                Send Sample Verification Email
              </h4>
              <p className="mt-1 text-xs text-zinc-500">
                Send a sample email to verify SMTP mail server connectivity and
                branding headers.
              </p>
            </div>

            <div className="mt-3 flex gap-2">
              <input
                type="email"
                placeholder="test@domain.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="h-8 flex-1 rounded-lg border border-zinc-200 px-2.5 text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              />
              <button
                type="button"
                disabled={isTesting}
                onClick={handleSendTestEmail}
                className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              >
                {isTesting ? "Sending..." : "Send Test"}
              </button>
            </div>
          </div>

          {/* Payment Received Email Preview & Live Test Card */}
          <div className="sm:col-span-2 flex flex-col justify-between rounded-xl border border-blue-200 p-4 bg-blue-50/40 dark:border-blue-900/60 dark:bg-blue-950/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-block rounded-full bg-blue-600/10 px-2 py-0.5 text-[11px] font-bold text-blue-700 dark:text-blue-300">
                    New Feature
                  </span>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Client Payment Received Email (Multi-Invoice Settlement)
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2 sm:mt-0">
                <button
                  type="button"
                  disabled={isPreviewing}
                  onClick={handlePreviewPaymentReceived}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-2xs hover:bg-blue-50 disabled:opacity-50 dark:border-blue-800 dark:bg-zinc-800 dark:text-blue-300"
                >
                  <Eye size={14} />
                  <span>
                    {isPreviewing
                      ? "Loading Preview..."
                      : "Interactive Preview"}
                  </span>
                </button>
              </div>
            </div>

            <div className="mt-3.5 pt-3 border-t border-blue-200/60 dark:border-blue-900/40 flex flex-col sm:flex-row items-center gap-2">
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                Send Live Sample:
              </span>
              <input
                type="email"
                placeholder="Enter email to receive test payment acknowledgment..."
                value={paymentTestEmail}
                onChange={(e) => setPaymentTestEmail(e.target.value)}
                className="h-8 flex-1 w-full rounded-lg border border-blue-200 bg-white px-3 text-xs text-zinc-800 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              />
              <button
                type="button"
                disabled={isTestingPayment}
                onClick={handleSendPaymentTestEmail}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap transition"
              >
                <Send size={13} />
                <span>
                  {isTestingPayment
                    ? "Sending Test..."
                    : "Send Test to My Email"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Execution Report Preview */}
        {cronReport && (
          <div className="mt-4 rounded-xl border border-purple-200 bg-purple-50/60 p-4 text-xs dark:border-purple-900 dark:bg-purple-950/30">
            <h5 className="font-bold text-purple-900 dark:text-purple-200 mb-2">
              Execution Summary:
            </h5>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-white p-2 border border-purple-100 dark:bg-zinc-800 dark:border-zinc-700">
                <span className="text-[10px] text-zinc-400 block uppercase">
                  Invoices Evaluated
                </span>
                <span className="text-base font-bold text-zinc-800 dark:text-zinc-100">
                  {cronReport.totals?.total || 0}
                </span>
              </div>
              <div className="rounded-lg bg-white p-2 border border-purple-100 dark:bg-zinc-800 dark:border-zinc-700">
                <span className="text-[10px] text-zinc-400 block uppercase">
                  Notifications Sent
                </span>
                <span className="text-base font-bold text-emerald-600">
                  {cronReport.totals?.processed || 0}
                </span>
              </div>
              <div className="rounded-lg bg-white p-2 border border-purple-100 dark:bg-zinc-800 dark:border-zinc-700">
                <span className="text-[10px] text-zinc-400 block uppercase">
                  Duration
                </span>
                <span className="text-base font-bold text-purple-700 dark:text-purple-300">
                  {cronReport.duration || 0}ms
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SAVE BUTTON BAR */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md transition hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Saving Settings...</span>
            </>
          ) : (
            <>
              <Save size={14} />
              <span>Save Notification Settings</span>
            </>
          )}
        </button>
      </div>

      {/* INTERACTIVE EMAIL PREVIEW MODAL (DESKTOP & MOBILE VIEWER) */}
      {previewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="flex flex-col h-[90vh] w-full max-w-4xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-5 py-3.5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-300">
                  <Mail size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Payment Received Email Preview
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Subject:{" "}
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                      {previewSubject}
                    </span>
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-lg border border-zinc-200 bg-white p-0.5 dark:border-zinc-700 dark:bg-zinc-800">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("desktop")}
                    className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                      previewDevice === "desktop"
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400"
                    }`}
                  >
                    <Monitor size={13} />
                    <span>Desktop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("mobile")}
                    className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                      previewDevice === "mobile"
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400"
                    }`}
                  >
                    <Smartphone size={13} />
                    <span>Mobile View (375px)</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewModalOpen(false)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body / iframe */}
            <div className="flex-1 bg-zinc-100 dark:bg-zinc-950 p-4 overflow-auto flex items-center justify-center">
              <div
                className={`transition-all duration-200 shadow-xl rounded-xl overflow-hidden bg-white ${
                  previewDevice === "mobile"
                    ? "w-[390px] h-[720px] max-h-full border-[8px] border-zinc-800 rounded-3xl"
                    : "w-full h-full max-w-3xl"
                }`}
              >
                <iframe
                  title="Email HTML Preview"
                  srcDoc={previewHtml}
                  className="w-full h-full border-0"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-zinc-200 bg-white px-5 py-3 dark:border-zinc-800 dark:bg-zinc-900 text-xs text-zinc-500">
              <span>
                💡 Tip: Switch to <strong>Mobile View</strong> to test
                horizontal touch scrolling on the invoice settlement breakdown.
              </span>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="rounded-lg bg-zinc-100 px-4 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
