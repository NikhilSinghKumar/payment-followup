"use client";

export default function InvoiceBasicFields({ client, invoice = {} }) {
  return (
    <div className="space-y-4">
      {/* Hidden Fields */}
      <input type="hidden" name="clientId" value={client?.id ?? ""} />
      <input
        type="hidden"
        name="subClientId"
        value={invoice?.subClientId ?? ""}
      />
      {/* ===================================== */}
      {/* ROW 1 */}
      {/* ===================================== */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Company Code */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-600">
            Company Code
          </label>

          <input
            name="companyCode"
            defaultValue={client?.companyCode ?? ""}
            readOnly
            className="input-primary bg-zinc-100 cursor-not-allowed"
          />
        </div>

        {/* Invoice Number */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-600">
            Invoice Number <span className="text-red-500">*</span>
          </label>

          <input
            name="invoiceNumber"
            defaultValue={invoice?.invoiceNumber ?? ""}
            placeholder="INV-001"
            required
            className="input-primary"
          />
        </div>

        {/* Invoice Date */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-600">
            Invoice Date <span className="text-red-500">*</span>
          </label>

          <input
            type="date"
            name="invoiceDate"
            defaultValue={invoice?.invoiceDate ?? ""}
            required
            className="input-primary"
          />
        </div>
      </div>

      {/* ===================================== */}
      {/* ROW 2 */}
      {/* ===================================== */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Invoice Amount */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-600">
            Invoice Amount (₹) <span className="text-red-500">*</span>
          </label>

          <input
            type="number"
            name="invoiceAmount"
            step="0.01"
            min="0"
            defaultValue={invoice?.invoiceAmount ?? ""}
            required
            className="input-primary"
          />
        </div>

        {/* Due Date */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-600">Due Date</label>

          <input
            type="date"
            name="dueDate"
            defaultValue={invoice?.dueDate ?? ""}
            className="input-primary"
          />
        </div>

        {/* Deduction */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-600">
            Deduction Amount
          </label>

          <input
            type="number"
            name="deductionAmount"
            step="0.01"
            min="0"
            defaultValue={invoice?.deductionAmount ?? "0"}
            className="input-primary"
          />
        </div>
      </div>

      {/* ===================================== */}
      {/* ROW 3 */}
      {/* ===================================== */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Other Charges */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-600">
            Other Charges
          </label>

          <input
            type="number"
            name="otherCharges"
            step="0.01"
            min="0"
            defaultValue={invoice?.otherCharges ?? "0"}
            className="input-primary"
          />
        </div>

        {/* Notes */}
        {/* <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-600">Notes</label>

          <textarea
            rows={3}
            name="notes"
            defaultValue={invoice?.notes ?? ""}
            placeholder="Remarks, payment reference, GST remarks, etc."
            className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-800 placeholder:text-zinc-400 outline-none resize-y focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div> */}
      </div>
    </div>
  );
}
