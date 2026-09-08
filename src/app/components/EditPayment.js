"use client";

import { useState } from "react";
import EditPaymentModal from "@/app/components/payment/EditPaymentModal";

export default function EditPayment({ payment, onUpdated }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-2.5 py-1 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-xs font-medium hover:bg-amber-100 transition"
      >
        Edit
      </button>

      <EditPaymentModal
        isOpen={open}
        onClose={() => setOpen(false)}
        payment={payment}
        onSuccess={() => {
          if (onUpdated) onUpdated();
        }}
      />
    </>
  );
}
