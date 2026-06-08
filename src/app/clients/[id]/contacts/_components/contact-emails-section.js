export default function ContactEmailsSection({ emails, setEmails }) {
  // =====================================
  // CHANGE
  // =====================================

  function handleChange(index, field, value) {
    setEmails((prev) =>
      prev.map((email, i) =>
        i === index
          ? {
              ...email,
              [field]: value,
            }
          : email,
      ),
    );
  }

  // =====================================
  // PRIMARY EMAIL
  // =====================================

  function handlePrimary(index) {
    setEmails((prev) =>
      prev.map((email, i) => ({
        ...email,
        isPrimary: i === index,
      })),
    );
  }

  // =====================================
  // ADD
  // =====================================

  function addEmail() {
    setEmails((prev) => [
      ...prev,
      {
        email: "",
        label: "work",
        isPrimary: false,
      },
    ]);
  }

  // =====================================
  // REMOVE
  // =====================================

  function removeEmail(index) {
    setEmails((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Email Addresses
        </h2>

        <button
          type="button"
          onClick={addEmail}
          className="text-sm font-medium text-blue-500 hover:text-blue-600 cursor-pointer"
        >
          + Add Email
        </button>
      </div>

      {/* ROWS */}

      <div className="space-y-3">
        {emails.map((item, index) => (
          <div key={index} className="rounded-2xl border border-zinc-200 p-4">
            <div className="grid gap-4 md:grid-cols-3">
              {/* EMAIL */}

              <div>
                <label className="mb-1 block text-sm text-zinc-600">
                  Email Address
                </label>

                <input
                  type="email"
                  value={item.email}
                  placeholder="accounts@company.com"
                  className="input-primary"
                  onChange={(e) => handleChange(index, "email", e.target.value)}
                />
              </div>

              {/* LABEL */}

              <div>
                <label className="mb-1 block text-sm text-zinc-600">
                  Label
                </label>

                <select
                  value={item.label}
                  className="input-primary"
                  onChange={(e) => handleChange(index, "label", e.target.value)}
                >
                  <option value="work">Work</option>

                  <option value="personal">Personal</option>

                  <option value="billing">Billing</option>

                  <option value="accounts">Accounts</option>
                </select>
              </div>

              {/* REMOVE */}
              {index > 0 && (
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeEmail(index)}
                    className="text-sm text-red-500 hover:text-red-600 cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* PRIMARY */}

            <div className="mt-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={item.isPrimary}
                  onChange={() => handlePrimary(index)}
                />

                <span className="text-sm text-zinc-700">Primary Email</span>
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
