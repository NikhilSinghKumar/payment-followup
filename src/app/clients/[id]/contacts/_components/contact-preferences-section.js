export default function ContactPreferencesSection({ form, handleChange }) {
  return (
    <div className="space-y-4">
      {/* ===================================== */}
      {/* HEADER */}
      {/* ===================================== */}

      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Communication Preferences
      </h2>

      {/* ===================================== */}
      {/* GRID */}
      {/* ===================================== */}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* PRIMARY CONTACT */}

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="isPrimary"
            checked={form.isPrimary}
            onChange={handleChange}
            className="mt-1"
          />

          <div>
            <p className="font-medium text-zinc-800">Primary Contact</p>

            <p className="text-sm text-zinc-500">
              Use this contact as the default client contact.
            </p>
          </div>
        </label>

        {/* RECEIVES INVOICE */}

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="receivesInvoice"
            checked={form.receivesInvoice}
            onChange={handleChange}
            className="mt-1"
          />

          <div>
            <p className="font-medium text-zinc-800">Receives Invoice</p>

            <p className="text-sm text-zinc-500">
              Send invoices and billing communications.
            </p>
          </div>
        </label>

        {/* RECEIVES FOLLOWUP */}

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="receivesFollowup"
            checked={form.receivesFollowup}
            onChange={handleChange}
            className="mt-1"
          />

          <div>
            <p className="font-medium text-zinc-800">Receives Follow-up</p>

            <p className="text-sm text-zinc-500">
              Include in payment reminder workflows.
            </p>
          </div>
        </label>

        {/* RECEIVES ESCALATION */}

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="receivesEscalation"
            checked={form.receivesEscalation}
            onChange={handleChange}
            className="mt-1"
          />

          <div>
            <p className="font-medium text-zinc-800">Receives Escalation</p>

            <p className="text-sm text-zinc-500">
              Include in overdue payment escalations.
            </p>
          </div>
        </label>
      </div>

      {/* ===================================== */}
      {/* STATUS */}
      {/* ===================================== */}

      {/* <div>
        <label className="mb-1 block text-sm text-zinc-600">
          Contact Status
        </label>

        <select
          name="status"
          value={form.status}
          onChange={handleChange}
          className="input-primary focus:ring-blue-500"
        >
          <option value="active">Active</option>

          <option value="inactive">Inactive</option>

          <option value="left_company">Left Company</option>

          <option value="do_not_contact">Do Not Contact</option>
        </select>
      </div> */}
    </div>
  );
}
