export default function ContactInformationSection({ form, handleChange }) {
  return (
    <div className="space-y-6">
      {/* ===================================== */}
      {/* HEADER */}
      {/* ===================================== */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Contact Information
        </h2>

        <p className="mt-1 text-sm text-zinc-500">
          Basic information about this contact.
        </p>
      </div>

      {/* ===================================== */}
      {/* NAME / DESIGNATION / DEPARTMENT */}
      {/* ===================================== */}

      <div className="grid gap-2 md:grid-cols-4">
        {/* NAME */}

        <div>
          <label className="mb-1 block text-sm text-zinc-600">
            Contact Name *
          </label>

          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="input-primary"
            placeholder="Rahul Sharma"
          />
        </div>

        {/* DESIGNATION */}

        <div>
          <label className="mb-1 block text-sm text-zinc-600">
            Designation
          </label>

          <input
            type="text"
            name="designation"
            value={form.designation}
            onChange={handleChange}
            className="input-primary"
            placeholder="Accounts Manager"
          />
        </div>

        {/* DEPARTMENT */}

        <div>
          <label className="mb-1 block text-sm text-zinc-600">Department</label>

          <input
            type="text"
            name="department"
            value={form.department}
            onChange={handleChange}
            className="input-primary"
            placeholder="Accounts"
          />
        </div>

        {/* ===================================== */}
        {/* STATUS */}
        {/* ===================================== */}

        <div>
          <label className="mb-1 block text-sm text-zinc-600">
            Contact Status
          </label>

          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="input-primary"
          >
            <option value="active">Active</option>

            <option value="inactive">Inactive</option>

            <option value="left_company">Left Company</option>

            <option value="do_not_contact">Do Not Contact</option>
          </select>
        </div>
      </div>

      {/* ===================================== */}
      {/* NOTES */}
      {/* ===================================== */}

      {/* <div>
        <label className="mb-1 block text-sm text-zinc-600">Notes</label>

        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          rows={4}
          className="input-primary"
          placeholder="Any notes about this contact..."
        />
      </div> */}
    </div>
  );
}
