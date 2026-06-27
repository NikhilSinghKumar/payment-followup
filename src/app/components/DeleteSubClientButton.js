"use client";

import { useActionState } from "react";
import { deleteSubClient } from "@/app/actions/sub-client";

export default function DeleteSubClientButton({ clientId, subClientId }) {
  const deleteAction = deleteSubClient.bind(null, clientId, subClientId);

  const [, formAction] = useActionState(deleteAction, {});

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm("Are you sure you want to delete this sub client?")) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="rounded-md border border-red-200 px-3 py-1 text-sm text-red-600 hover:bg-red-50"
      >
        Delete
      </button>
    </form>
  );
}
