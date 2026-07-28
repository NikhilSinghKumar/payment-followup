"use client";

import { useEffect, useState, useActionState } from "react";
import { Mail, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { login } from "@/app/actions/auth/login";

const INITIAL_STATE = {
  success: false,
  message: null,
};

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, formAction, pending] = useActionState(login, INITIAL_STATE);
  const [message, setMessage] = useState(null);

  const router = useRouter();

  useEffect(() => {
    if (!state.message) return;

    setMessage({
      success: state.success,
      text: state.message,
    });

    const timer = setTimeout(() => {
      setMessage(null);
    }, 2000);

    return () => clearTimeout(timer);
  }, [state]);

  useEffect(() => {
    if (state.success) {
      setPassword("");
      router.replace("/clients");
    }
  }, [state.success, router]);

  return (
    <div className="w-full max-w-md border border-zinc-500 rounded-3xl bg-white p-5">
      <h1 className="mb-6 text-2xl font-bold text-zinc-800">Login</h1>

      <form action={formAction} className="space-y-5">
        {/* Email */}
        <div>
          <label className="block mb-2 text-sm font-medium text-zinc-600">
            Email
          </label>

          <div className="flex items-center rounded-xl border border-zinc-400 bg-white px-4 focus-within:border-zinc-600 transition-colors">
            <Mail className="mr-3 h-5 w-5 text-zinc-400" />

            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="h-12 w-full bg-transparent outline-none text-zinc-800 placeholder:text-zinc-400"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block mb-2 text-sm font-medium text-zinc-600">
            Password
          </label>

          <div className="flex items-center rounded-xl border border-zinc-400 bg-white px-4 focus-within:border-zinc-600 transition-colors">
            <Lock className="mr-3 h-5 w-5 text-zinc-400" />

            <input
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="h-12 w-full bg-transparent outline-none text-zinc-800 placeholder:text-zinc-400"
            />
          </div>
        </div>

        {message && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              message?.success
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-gray-700 mb-4 py-3.5 font-semibold text-white transition hover:bg-indigo-950 hover:shadow-lg active:scale-[0.99] disabled:opacity-50 cursor-pointer"
        >
          {pending ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
