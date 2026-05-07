"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddPayment({ invoiceId, due }) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async () => {
    if (!amount) return alert("Enter amount");
    if (!paymentDate) return alert("Enter payment date");

    if (Number(amount) > due) {
      return alert("Amount exceeds due");
    }

    setLoading(true);

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoiceId,
          amount: Number(amount),
          method,
          paymentDate: new Date(paymentDate),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed");
        return;
      }

      // reset
      setAmount("");
      setMethod("");
      setPaymentDate("");

      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Error adding payment");
    } finally {
      setLoading(false);
    }
  };

  const formattedDue = new Intl.NumberFormat("en-IN").format(due || 0);

  return (
    <div className="bg-white/80 backdrop-blur-md border border-zinc-200 rounded-2xl shadow-md p-5 space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-zinc-800">Add Payment</h3>
        <p className="text-sm text-zinc-500">
          Record a payment for this invoice
        </p>
      </div>

      {/* Due Info */}
      <div className="flex items-center justify-between bg-zinc-50 border rounded-lg px-3 py-2">
        <span className="text-sm text-zinc-500">Outstanding</span>
        <span className="text-sm font-semibold text-zinc-800">
          ₹{formattedDue}
        </span>
      </div>

      {/* Amount */}
      <div className="space-y-1">
        <label className="text-sm text-zinc-600">Amount</label>
        <input
          type="number"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="1"
          max={due}
          className="input-primary focus:ring-blue-500 caret-blue-500"
        />
      </div>

      {/* Method */}
      <div className="space-y-1">
        <label className="text-sm text-zinc-600">Payment Method</label>
        <input
          type="text"
          placeholder="UPI / Cash / Bank"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="input-primary focus:ring-blue-500 caret-blue-500"
        />
      </div>

      {/* Date */}
      <div className="space-y-1">
        <label className="text-sm text-zinc-600">Payment Date</label>
        <input
          type="date"
          value={paymentDate}
          onChange={(e) => setPaymentDate(e.target.value)}
          className="input-primary focus:ring-blue-500 caret-blue-500"
        />
      </div>

      {/* Button */}
      <button
        onClick={handleSubmit}
        disabled={loading || due <= 0}
        className="
          w-full h-[42px] rounded-lg text-white text-sm font-medium
          bg-gradient-to-r from-blue-500 to-purple-500 cursor-pointer
          shadow-md hover:shadow-lg
          transition-all duration-200
          hover:scale-[1.02]
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        {loading ? "Adding..." : due <= 0 ? "Fully Paid" : "Add Payment"}
      </button>
    </div>
  );
}
