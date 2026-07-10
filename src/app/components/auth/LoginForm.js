"use client";

import { useEffect, useActionState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/app/actions/auth/login";

const INITIAL_STATE = {
  success: false,
  message: null,
};

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(login, INITIAL_STATE);

  const router = useRouter();
  useEffect(() => {
    if (state.success) {
      router.replace("/clients");
    }
  }, [state.success, router]);

  return (
    <div className="w-full max-w-md rounded-xl bg-white p-8 shadow">
      <h1 className="mb-6 text-2xl font-bold">Login</h1>

      <form action={formAction} className="space-y-4">
        <div>
          <label>Email</label>

          <input
            type="email"
            name="email"
            className="mt-1 w-full rounded-lg border p-3"
          />
        </div>

        <div>
          <label>Password</label>

          <input
            type="password"
            name="password"
            className="mt-1 w-full rounded-lg border p-3"
          />
        </div>

        {state.message && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              state.success
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {state.message}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-blue-600 py-3 text-white disabled:opacity-50"
        >
          {pending ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
