"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import {
  saveNotificationTemplate,
  resetNotificationTemplate,
  renderTemplatePreview,
} from "@/app/actions/notificationTemplates";
import { AVAILABLE_VARIABLES } from "@/lib/notifications/template-constants";
import {
  Mail,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Monitor,
  Tag,
  Info,
  Layers,
  Clock,
  ShieldAlert,
  CreditCard,
  FileCheck,
  Check,
  RefreshCw,
} from "lucide-react";

export default function EmailTemplatesManager({
  initialTemplates = [],
  company = {},
}) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [selectedType, setSelectedType] = useState(
    initialTemplates[0]?.type || "BILL_SUBMITTED",
  );

  const activeTemplate =
    templates.find((t) => t.type === selectedType) || templates[0] || {};

  // Form states for the currently selected template
  const [subject, setSubject] = useState(activeTemplate.subject || "");
  const [body, setBody] = useState(activeTemplate.body || "");
  const [activeInput, setActiveInput] = useState("body"); // "subject" | "body"

  // Live preview state
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewSubject, setPreviewSubject] = useState("");
  const [previewDevice, setPreviewDevice] = useState("desktop"); // "desktop" | "mobile"
  const [isRenderingPreview, setIsRenderingPreview] = useState(false);

  // Feedback notifications
  const [feedback, setFeedback] = useState(null);
  const [isPending, startTransition] = useTransition();

  const subjectInputRef = useRef(null);
  const bodyTextareaRef = useRef(null);

  // Handle switching selected template
  const handleSelectTemplate = (newType) => {
    setSelectedType(newType);
    const tmpl = templates.find((t) => t.type === newType);
    if (tmpl) {
      setSubject(tmpl.subject || "");
      setBody(tmpl.body || "");
      setFeedback(null);
    }
  };

  // Debounced live preview generation
  useEffect(() => {
    let isCurrent = true;
    const timer = setTimeout(async () => {
      setIsRenderingPreview(true);
      try {
        const res = await renderTemplatePreview({
          type: selectedType,
          subject,
          body,
        });
        if (isCurrent && res.success) {
          setPreviewHtml(res.html);
          setPreviewSubject(res.subject);
        }
      } catch (err) {
        console.error("Preview render failed:", err);
      } finally {
        if (isCurrent) setIsRenderingPreview(false);
      }
    }, 350);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [selectedType, subject, body]);

  // Insert variable placeholder at cursor position
  const handleInsertVariable = (tag) => {
    if (activeInput === "subject") {
      const el = subjectInputRef.current;
      if (!el) {
        setSubject((prev) => prev + " " + tag);
        return;
      }
      const start = el.selectionStart || 0;
      const end = el.selectionEnd || 0;
      const nextVal = subject.slice(0, start) + tag + subject.slice(end);
      setSubject(nextVal);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + tag.length, start + tag.length);
      }, 0);
    } else {
      const el = bodyTextareaRef.current;
      if (!el) {
        setBody((prev) => prev + " " + tag);
        return;
      }
      const start = el.selectionStart || 0;
      const end = el.selectionEnd || 0;
      const nextVal = body.slice(0, start) + tag + body.slice(end);
      setBody(nextVal);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + tag.length, start + tag.length);
      }, 0);
    }
  };

  // Save template handler
  const handleSave = () => {
    if (!subject.trim() || !body.trim()) {
      setFeedback({
        type: "error",
        message: "Subject and body cannot be empty.",
      });
      return;
    }

    startTransition(async () => {
      setFeedback(null);
      const res = await saveNotificationTemplate({
        type: selectedType,
        subject,
        body,
        name: activeTemplate.name,
      });

      if (res.success) {
        setTemplates((prev) =>
          prev.map((t) =>
            t.type === selectedType
              ? {
                  ...t,
                  subject: subject.trim(),
                  body: body.trim(),
                  isCustom: true,
                  id: res.id,
                }
              : t,
          ),
        );
        setFeedback({
          type: "success",
          message: "Template saved and activated for your company.",
        });
      } else {
        setFeedback({
          type: "error",
          message: res.error || "Failed to save template.",
        });
      }
    });
  };

  // Reset to system default
  const handleReset = () => {
    if (
      !confirm("Reset this email template back to the PAFEX default wording?")
    ) {
      return;
    }

    startTransition(async () => {
      setFeedback(null);
      const res = await resetNotificationTemplate(selectedType);
      if (res.success) {
        const defSubject =
          activeTemplate.defaultSubject || activeTemplate.subject;
        const defBody = activeTemplate.defaultBody || activeTemplate.body;

        setSubject(defSubject);
        setBody(defBody);

        setTemplates((prev) =>
          prev.map((t) =>
            t.type === selectedType
              ? {
                  ...t,
                  subject: defSubject,
                  body: defBody,
                  isCustom: false,
                  id: null,
                }
              : t,
          ),
        );
        setFeedback({
          type: "success",
          message: "Template has been reset to system default wording.",
        });
      } else {
        setFeedback({
          type: "error",
          message: res.error || "Failed to reset template.",
        });
      }
    });
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "BILL_SUBMITTED":
        return <FileCheck size={15} className="text-blue-500" />;
      case "DUE_REMINDER":
      case "DUE_TODAY":
      case "INTERNAL_DUE_TODAY":
        return <Clock size={15} className="text-amber-500" />;
      case "OVERDUE_REMINDER":
        return <AlertCircle size={15} className="text-orange-500" />;
      case "SERVICE_SUSPENSION_NOTICE":
      case "SERVICE_SUSPENSION_ALERT":
        return <ShieldAlert size={15} className="text-red-500" />;
      case "PAYMENT_RECEIVED":
      case "PAYMENT_CLEARED":
        return <CreditCard size={15} className="text-emerald-500" />;
      default:
        return <Mail size={15} className="text-zinc-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Mail className="text-blue-600" size={20} />
              Email Notification Templates
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              <span className="h-2 w-2 rounded-full bg-blue-600"></span>
              {templates.filter((t) => t.isCustom).length} Customized
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              <span className="h-2 w-2 rounded-full bg-zinc-400"></span>
              {templates.filter((t) => !t.isCustom).length} Default
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Sidebar + Editor + Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column: Template Selector */}
        <div className="lg:col-span-3 space-y-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Email Types ({templates.length})
            </div>

            <div className="space-y-1 mt-1">
              {templates.map((tmpl) => {
                const isSelected = tmpl.type === selectedType;
                return (
                  <button
                    key={tmpl.type}
                    type="button"
                    onClick={() => handleSelectTemplate(tmpl.type)}
                    className={`w-full text-left rounded-xl p-2.5 transition flex flex-col gap-1 ${
                      isSelected
                        ? "bg-blue-600 text-white shadow-xs"
                        : "hover:bg-zinc-100 text-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-semibold text-xs truncate">
                        {getTypeIcon(tmpl.type)}
                        <span className="truncate">{tmpl.name}</span>
                      </div>
                      {tmpl.isCustom ? (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                          }`}
                        >
                          Custom
                        </span>
                      ) : (
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
                            isSelected
                              ? "bg-white/10 text-white/80"
                              : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                          }`}
                        >
                          Default
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Middle column: Editor */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
            {/* Template Header */}
            <div className="flex items-start justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    {activeTemplate.name}
                  </h3>
                  {activeTemplate.isCustom ? (
                    <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                      Company Template
                    </span>
                  ) : (
                    <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      System Default
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {activeTemplate.description}
                </p>
              </div>

              {activeTemplate.isCustom && (
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isPending}
                  title="Revert back to default text"
                  className="flex items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <RotateCcw size={12} />
                  <span>Reset Default</span>
                </button>
              )}
            </div>

            {/* Feedback Alert */}
            {feedback && (
              <div
                className={`rounded-xl p-3 text-xs flex items-center gap-2 ${
                  feedback.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800"
                    : "bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800"
                }`}
              >
                {feedback.type === "success" ? (
                  <CheckCircle2 size={16} className="shrink-0" />
                ) : (
                  <AlertCircle size={16} className="shrink-0" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            {/* Subject Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  Email Subject Line
                </label>
                <span className="text-[11px] text-zinc-400">
                  Supports placeholders like
                  &#123;&#123;invoiceNumber&#125;&#125;
                </span>
              </div>
              <input
                ref={subjectInputRef}
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                onFocus={() => setActiveInput("subject")}
                placeholder="e.g. Overdue Payment Reminder - PAFEX"
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>

            {/* Placeholder Variable Palette */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Tag size={13} className="text-blue-500" />
                  Insert Placeholders
                </label>
                <span className="text-[11px] text-zinc-400">
                  Target:{" "}
                  {activeInput === "subject" ? "Subject Line" : "Message Body"}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-zinc-50 border border-zinc-100 dark:bg-zinc-800/50 dark:border-zinc-800">
                {AVAILABLE_VARIABLES.map((v) => (
                  <button
                    key={v.tag}
                    type="button"
                    onClick={() => handleInsertVariable(v.tag)}
                    title={v.desc}
                    className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-[11px] font-mono font-medium text-zinc-700 shadow-2xs border border-zinc-200 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-blue-900/30"
                  >
                    <span>+</span>
                    <span>{v.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Body Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  Message Body Content
                </label>
              </div>
              <textarea
                ref={bodyTextareaRef}
                rows={9}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onFocus={() => setActiveInput("body")}
                placeholder="Write your email body message here..."
                className="w-full rounded-xl border border-zinc-200 bg-white p-3 text-xs leading-relaxed text-zinc-900 shadow-2xs outline-none focus:border-blue-500 font-sans dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-500 disabled:opacity-50 transition"
              >
                {isPending ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>Save Template Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right column: Live Rendered Preview */}
        <div className="lg:col-span-4 space-y-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            {/* Preview Toolbar */}
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Live Email Preview
                </span>
                {isRenderingPreview && (
                  <RefreshCw size={12} className="animate-spin text-blue-500" />
                )}
              </div>
            </div>

            {/* Subject preview pill */}
            <div className="mt-3 rounded-xl bg-zinc-100 p-2.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              <span className="font-semibold text-zinc-500 text-[11px] block">
                Subject:
              </span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {previewSubject || "No subject set"}
              </span>
            </div>

            {/* iframe simulator */}
            <div className="mt-3 flex justify-center bg-zinc-100 p-2 rounded-xl border border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 overflow-hidden">
              <div
                style={{
                  width: previewDevice === "mobile" ? "360px" : "100%",
                  transition: "width 0.2s ease",
                }}
                className="bg-white rounded-lg shadow-xs overflow-hidden"
              >
                <iframe
                  title="Email Live Preview"
                  srcDoc={previewHtml}
                  className="w-full h-[540px] border-none bg-white"
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
