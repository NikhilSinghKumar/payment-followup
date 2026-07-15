export default function ContactNumbersSection({ numbers, setNumbers }) {
  // =====================================
  // CHANGE
  // =====================================

  function handleChange(index, field, value) {
    setNumbers((prev) =>
      prev.map((number, i) =>
        i === index
          ? {
              ...number,
              [field]: value,
            }
          : number,
      ),
    );
  }

  // =====================================
  // PRIMARY
  // =====================================

  function handlePrimary(index) {
    setNumbers((prev) =>
      prev.map((number, i) => ({
        ...number,
        isPrimary: i === index,
      })),
    );
  }

  // =====================================
  // ADD
  // =====================================

  function addNumber() {
    setNumbers((prev) => [
      ...prev,
      {
        countryCode: "+91",
        number: "",
        type: "mobile",
        isPrimary: false,
        isWhatsapp: false,
      },
    ]);
  }

  // =====================================
  // REMOVE
  // =====================================

  function removeNumber(index) {
    setNumbers((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      {/* HEADER */}

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Contact Numbers
        </h2>

        <button
          type="button"
          onClick={addNumber}
          className="text-sm font-medium text-blue-500 hover:text-blue-600 cursor-pointer"
        >
          + Add Number
        </button>
      </div>

      {/* ROWS */}

      <div className="space-y-3">
        {numbers.map((item, index) => (
          <div key={index} className="rounded-2xl border border-zinc-200 p-4">
            <div className="grid gap-4 md:grid-cols-4">
              {/* COUNTRY CODE */}

              <div>
                <label className="mb-1 block text-sm text-zinc-600">
                  Country Code
                </label>

                <input
                  value={item.countryCode}
                  className="input-primary"
                  onChange={(e) =>
                    handleChange(index, "countryCode", e.target.value)
                  }
                />
              </div>

              {/* NUMBER */}

              <div>
                <label className="mb-1 block text-sm text-zinc-600">
                  Number
                </label>

                <input
                  value={item.number}
                  placeholder="9876543210"
                  className="input-primary"
                  onChange={(e) =>
                    handleChange(index, "number", e.target.value)
                  }
                />
              </div>

              {/* TYPE */}

              <div>
                <label className="mb-1 block text-sm text-zinc-600">Type</label>

                <select
                  value={item.type}
                  className="input-primary"
                  onChange={(e) => handleChange(index, "type", e.target.value)}
                >
                  <option value="mobile">Mobile</option>

                  <option value="whatsapp">WhatsApp</option>

                  <option value="landline">Landline</option>

                  <option value="office">Office</option>
                </select>
              </div>

              {/* REMOVE */}
              {index > 0 && (
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeNumber(index)}
                    className="text-sm text-red-500 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* FLAGS */}

            <div className="mt-4 flex flex-wrap gap-6">
              {/* PRIMARY */}

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={item.isPrimary}
                  onChange={() => handlePrimary(index)}
                />

                <span className="text-sm text-zinc-700">Primary Number</span>
              </label>

              {/* WHATSAPP */}

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={item.isWhatsapp}
                  onChange={(e) =>
                    handleChange(index, "isWhatsapp", e.target.checked)
                  }
                />

                <span className="text-sm text-zinc-700">WhatsApp Enabled</span>
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
