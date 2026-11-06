"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Loader2,
  Mail,
  Search,
  Send,
} from "lucide-react";
import {
  getCustomBulkEmailClients,
  previewCustomBulkEmail,
  sendCustomBulkEmail,
} from "@/app/actions/customBulkEmail";

export default function CustomBulkEmailForm() {
  const [clients, setClients] = useState([]),
    [selected, setSelected] = useState([]);
  const [search, setSearch] = useState(""),
    [subject, setSubject] = useState(""),
    [body, setBody] = useState("");
  const [expanded, setExpanded] = useState({}),
    [preview, setPreview] = useState(null),
    [result, setResult] = useState(null),
    [error, setError] = useState("");
  const [loading, startLoading] = useTransition(),
    [previewing, startPreview] = useTransition(),
    [sending, startSend] = useTransition();

  useEffect(() => {
    startLoading(async () => {
      const r = await getCustomBulkEmailClients();
      if (r.success) setClients(r.clients);
      else setError(r.error);
    });
  }, []);
  const visible = useMemo(
    () =>
      clients.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [clients, search],
  );
  const chosen = clients.filter((c) => selected.includes(c.id));
  const recipientCount = chosen.reduce((n, c) => n + c.recipients.length, 0);
  const changeSelected = (id, checked) => {
    setSelected((old) =>
      checked ? [...old, id] : old.filter((x) => x !== id),
    );
    setPreview(null);
    setResult(null);
  };
  const selectAllClients = () => {
    setSelected(clients.map((client) => client.id));
    setPreview(null);
    setResult(null);
    setError("");
  };
  const deselectAllClients = () => {
    setSelected([]);
    setPreview(null);
    setResult(null);
    setError("");
  };

  function makePreview() {
    setError("");
    setResult(null);
    if (chosen.length !== 1) {
      setError("Select exactly one client to preview the personalized email.");
      return;
    }
    startPreview(async () => {
      const r = await previewCustomBulkEmail({
        clientId: chosen[0].id,
        subject,
        body,
      });
      if (r.success) setPreview(r);
      else setError(r.error);
    });
  }
  function send() {
    setError("");
    setPreview(null);
    setResult(null);
    if (!selected.length || !subject.trim() || !body.trim()) {
      setError("Select at least one client and enter the subject and body.");
      return;
    }
    if (
      !window.confirm(
        `Send ${chosen.length} group email(s) to ${recipientCount} contact addresses? Each client receives one email with one primary To recipient and the remaining contacts in CC.`,
      )
    )
      return;
    startSend(async () => {
      const r = await sendCustomBulkEmail({
        clientIds: selected,
        subject,
        body,
      });
      if (r.success) setResult(r);
      else setError(r.error);
    });
  }

  return (
    <main className="mx-auto max-w-6xl space-y-5 bg-white text-slate-900">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Custom Bulk Email
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            One group email per client. Primary contact in To; remaining active
            contact emails in CC.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
          From: <b className="text-slate-900">accounts@pafex.in</b>
        </div>
      </header>
      {error && (
        <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={17} />
          {error}
        </div>
      )}
      {result && (
        <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 size={17} /> Sending completed
          </div>
          <p className="mt-1">
            Sent: {result.sent} · Failed: {result.failed} · Skipped:{" "}
            {result.skipped}
          </p>
          <div className="mt-3 space-y-2">
            {result.results.map((x) => (
              <div
                key={x.clientId}
                className="flex justify-between gap-3 border-t border-emerald-200 pt-2"
              >
                <span>
                  {x.clientName}{" "}
                  {x.recipientCount ? `(${x.recipientCount} recipients)` : ""}
                </span>
                <b>
                  {x.status}
                  {x.error ? `: ${x.error}` : ""}
                </b>
              </div>
            ))}
          </div>
        </section>
      )}
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-4">
            <div className="flex justify-between">
              <h2 className="font-semibold text-slate-900">
                1. Select clients
              </h2>
              <span className="text-xs text-slate-500">
                {chosen.length} selected
              </span>
            </div>
            <div className="relative mt-3">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search clients..."
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-400"
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-xs text-slate-500">
                <input
                  type="checkbox"
                  checked={
                    visible.length > 0 &&
                    visible.every((c) => selected.includes(c.id))
                  }
                  onChange={(e) => {
                    setSelected(
                      e.target.checked
                        ? [
                            ...new Set([
                              ...selected,
                              ...visible.map((c) => c.id),
                            ]),
                          ]
                        : selected.filter(
                            (id) => !visible.some((c) => c.id === id),
                          ),
                    );
                    setPreview(null);
                    setResult(null);
                  }}
                />
                Select all visible
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllClients}
                  disabled={
                    loading ||
                    !clients.length ||
                    selected.length === clients.length
                  }
                  className="rounded-md border border-blue-200 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Select all clients
                </button>
                <button
                  type="button"
                  onClick={deselectAllClients}
                  disabled={!selected.length}
                  className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Deselect all
                </button>
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              {clients.length} eligible clients with active contact emails
            </div>
          </div>
          <div className="max-h-[490px] divide-y divide-slate-100 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center gap-2 p-10 text-sm text-slate-500">
                <Loader2 className="animate-spin" />
                Loading...
              </div>
            ) : (
              visible.map((c) => {
                const primary = c.recipients.find((x) => x.isPrimary);
                return (
                  <div key={c.id} className="p-3.5">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(c.id)}
                        onChange={(e) => changeSelected(c.id, e.target.checked)}
                        className="mt-1"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-slate-800">
                          {c.name}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          {c.recipients.length} recipient(s)
                        </div>
                        {selected.includes(c.id) && primary && (
                          <div className="mt-2 break-all text-xs text-slate-600">
                            <b>To:</b> {primary.email}{" "}
                            <span className="text-slate-400">
                              · {c.recipients.length - 1} CC
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setExpanded((old) => ({ ...old, [c.id]: !old[c.id] }))
                        }
                        className="rounded p-1 text-slate-500 hover:bg-slate-100"
                      >
                        {expanded[c.id] ? (
                          <ChevronDown size={17} />
                        ) : (
                          <ChevronRight size={17} />
                        )}
                      </button>
                    </div>
                    {expanded[c.id] && (
                      <div className="ml-7 mt-3 space-y-2 rounded-lg bg-slate-50 p-3">
                        {c.recipients.map((r) => (
                          <div
                            key={r.emailId}
                            className="flex flex-wrap items-center gap-2 break-all text-xs text-slate-600"
                          >
                            <Mail size={13} />
                            {r.email}
                            {r.isPrimary && (
                              <b className="rounded bg-blue-100 px-1.5 py-0.5 text-blue-700">
                                Primary · To
                              </b>
                            )}
                          </div>
                        ))}
                        <p className="text-[11px] text-slate-400">
                          All listed active addresses are included when
                          selected.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
            {!loading && !visible.length && (
              <p className="p-8 text-center text-sm text-slate-500">
                No active client contact emails found.
              </p>
            )}
          </div>
          <div className="flex justify-between border-t border-slate-100 bg-slate-50 px-4 py-3 text-sm">
            <span className="text-slate-600">Selected group recipients</span>
            <b>
              {chosen.length} clients · {recipientCount} contacts
            </b>
          </div>
        </section>
        <div className="space-y-5">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="font-semibold text-slate-900">2. Compose email</h2>
            <label className="mt-4 block text-sm font-medium text-slate-800">
              Subject
            </label>
            <input
              value={subject}
              maxLength={250}
              onChange={(e) => {
                setSubject(e.target.value);
                setPreview(null);
              }}
              placeholder="Enter custom subject"
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-400"
            />
            <label className="mt-4 block text-sm font-medium text-slate-800">
              Email body
            </label>
            <textarea
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                setPreview(null);
              }}
              rows={10}
              placeholder={
                "Dear Sir/Madam,\n\nWrite your message here...\n\nThank you."
              }
              className="mt-1.5 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-400"
            />
            <p className="mt-2 text-xs text-slate-500">
              The PAFEX signature is appended automatically. Write your greeting
              and message directly in the email body.
            </p>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={makePreview}
                disabled={previewing}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
              >
                {previewing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Mail size={16} />
                )}{" "}
                Preview
              </button>
              <button
                type="button"
                onClick={send}
                disabled={sending || !selected.length}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                {sending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}{" "}
                Send {chosen.length} group email(s)
              </button>
            </div>
          </section>
          {preview && (
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-3">
                <b className="text-sm">Email preview · {chosen[0]?.name}</b>
                <p className="mt-1 break-all text-xs text-slate-500">
                  Subject: {preview.subject}
                </p>
              </div>
              <iframe
                title="Custom email preview"
                srcDoc={preview.html}
                className="h-[560px] w-full bg-slate-100"
              />
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
