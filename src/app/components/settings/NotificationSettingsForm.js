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
} from "lucide-react";
import {
  updateNotificationSettings,
  triggerManualSchedulerRun,
  testNotificationEmail,
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
    sendInvoicePdf: initialSettings.sendInvoicePdf ?? true,
    ccAccountsEmail: initialSettings.ccAccountsEmail || "",
    ccSalesEmail: initialSettings.ccSalesEmail || "",
    notifyManager: initialSettings.notifyManager ?? false,
    businessStartHour: initialSettings.businessStartHour ?? 9,
    businessEndHour: initialSettings.businessEndHour ?? 18,
    skipWeekends: initialSettings.skipWeekends ?? false,
  });

  const [testEmail, setTestEmail] = useState("");
  const [isSaving, startSaveTransition] = useTransition();
  const [isTesting, startTestTransition] = useTransition();
  const [isRunningCron, startCronTransition] = useTransition();

  const [feedback, setFeedback] = useState(null);
  const [cronReport, setCronReport] = useState(null);

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
              {/* <p className="text-xs text-zinc-500">
                Triggered automatically based on invoice due dates and aging.
              </p> */}
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
              {/* <p className="mt-0.5 text-xs text-zinc-500">
                Sends a polite reminder before the invoice due date arrives.
              </p> */}
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
              {/* <p className="mt-0.5 text-xs text-zinc-500">
                Dispatches a notification on the exact morning of the invoice
                due date.
              </p> */}
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
              {/* <p className="mt-0.5 text-xs text-zinc-500">
                Periodically follows up with clients when invoices remain unpaid
                past their due date.
              </p> */}
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
              {/* <p className="mt-0.5 text-xs text-zinc-500">
                Sends initial submission email to client contact upon creating a
                new invoice.
              </p> */}
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
              {/* <p className="mt-0.5 text-xs text-zinc-500">
                Sends an instant thank-you receipt and ledger balance update
                when payment is recorded.
              </p> */}
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

          {/* Rule 6: Attach PDF / AWB Detail */}
          <div className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                Include AWB Breakdown
              </span>
              {/* <p className="mt-0.5 text-xs text-zinc-500">
                Embeds shipment AWBs and company bank/UPI details in all
                dispatched reminder templates.
              </p> */}
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
            {/* <p className="mt-1 text-[11px] text-zinc-400">
              Automated reminders will only be dispatched during these business
              hours.
            </p> */}
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

      {/* SECTION 4: AUTOMATION EXECUTION & TEST SANDBOX */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
              <Play size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Manual Trigger and Test Email
              </h3>
              {/* <p className="text-xs text-zinc-500">
                Manual trigger against schedule reminder and Send test email
              </p> */}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Manual Run Card */}
          <div className="flex flex-col justify-between rounded-xl border border-zinc-200 p-4 bg-zinc-50/50 dark:border-zinc-700 dark:bg-zinc-800/40">
            <div>
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100"></h4>
              <p className="mt-1 text-xs text-zinc-500">
                Run reminder emails immediately against notification schedule.
              </p>
            </div>

            <div className="mt-4">
              <button
                type="button"
                disabled={isRunningCron}
                onClick={handleTriggerAutomation}
                className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-purple-700 disabled:opacity-50"
              >
                {isRunningCron ? (
                  <>
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Evaluating Rules...</span>
                  </>
                ) : (
                  <>
                    <Play size={13} />
                    <span>Run Now</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Test Email Card */}
          <div className="flex flex-col justify-between rounded-xl border border-zinc-200 p-4 bg-zinc-50/50 dark:border-zinc-700 dark:bg-zinc-800/40">
            <div>
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                Send Test Email
              </h4>
              <p className="mt-1 text-xs text-zinc-500">
                Verify mail dispatcher and brand headers with a sample email.
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
        </div>

        {/* Cron Execution Report Preview */}
        {cronReport && (
          <div className="mt-4 rounded-xl border border-purple-200 bg-purple-50/60 p-4 text-xs dark:border-purple-900 dark:bg-purple-950/30">
            <h5 className="font-bold text-purple-900 dark:text-purple-200 mb-2">
              Email Trigger Result:
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
                  Processed
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
    </form>
  );
}
