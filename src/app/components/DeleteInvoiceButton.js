"use client";

import { useTransition } from "react";
import { deleteInvoice } from "@/app/actions/invoice";
import { useRouter } from "next/navigation";

export default function DeleteInvoiceButton({ invoiceId }) {
  const [pending, startTransition] = useTransition();

  const router = useRouter();

  const handleDelete = () => {
    const confirmed = confirm("Are you sure you want to delete this invoice?");

    if (!confirmed) return;

    startTransition(async () => {
      const res = await deleteInvoice(invoiceId);

      if (res?.error) {
        alert(res.error);
        return;
      }

      router.refresh();
    });
  };

  return (
    <button
      onClick={handleDelete}
      disabled={pending}
      className="px-3 py-1 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600 disabled:opacity-50 cursor-pointer"
    >
      {pending ? "Deleting..." : "Delete"}
    </button>
  );
}
