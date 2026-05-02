import { getInvoices } from "../../actions/invoice";

export default function NewInvoicePage() {
  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Add Invoice</h1>

      <form action={getInvoices} className="flex flex-col gap-3">
        <input
          name="clientId"
          placeholder="Client ID"
          className="border p-2 rounded"
          required
        />

        <input
          name="amount"
          placeholder="Amount"
          type="number"
          className="border p-2 rounded"
          required
        />

        <input name="dueDate" type="date" className="border p-2 rounded" />

        <button className="bg-blue-600 text-white p-2 rounded">
          Save Invoice
        </button>
      </form>
    </div>
  );
}
