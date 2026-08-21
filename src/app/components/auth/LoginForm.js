"use client";

import { useEffect, useState, useActionState } from "react";
import { Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { login } from "@/app/actions/auth/login";

const INITIAL_STATE = {
  success: false,
  message: null,
};

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    }, 3000);

    return () => clearTimeout(timer);
  }, [state]);

  useEffect(() => {
    if (state.success) {
      setPassword("");
      router.replace("/dashboard");
    }
  }, [state.success, router]);

  return (
    <div className="w-full rounded-2xl sm:rounded-3xl border border-zinc-200 bg-white p-5 sm:p-8 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 transition-all">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Login
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
          Enter your credentials to access your account
        </p>
      </div>

      <form action={formAction} className="space-y-4 sm:space-y-5">
        {/* Email */}
        <div>
          <label className="block mb-1.5 text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Email
          </label>

          <div className="flex items-center rounded-xl border border-zinc-300 bg-white px-3.5 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 transition-all dark:border-zinc-700 dark:bg-zinc-800/80 dark:focus-within:border-blue-500 dark:focus-within:ring-blue-900/30">
            <Mail className="mr-2.5 h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-zinc-400 dark:text-zinc-500" />

            <input
              type="email"
              name="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
              className="h-11 sm:h-12 w-full bg-transparent outline-none text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block mb-1.5 text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Password
          </label>

          <div className="flex items-center rounded-xl border border-zinc-300 bg-white px-3.5 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 transition-all dark:border-zinc-700 dark:bg-zinc-800/80 dark:focus-within:border-blue-500 dark:focus-within:ring-blue-900/30">
            <Lock className="mr-2.5 h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-zinc-400 dark:text-zinc-500" />

            <input
              type={showPassword ? "text" : "password"}
              name="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              className="h-11 sm:h-12 w-full bg-transparent outline-none text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="ml-2 p-1 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 focus:outline-none transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div
            className={`rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm font-medium animate-in fade-in duration-150 ${
              message?.success
                ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800/50 dark:bg-green-950/40 dark:text-green-300"
                : "border-red-200 bg-red-50 text-red-700 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-300"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={pending}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-800 hover:bg-zinc-900 py-3 sm:py-3.5 text-xs sm:text-sm font-semibold text-white transition hover:shadow-lg active:scale-[0.99] disabled:opacity-50 cursor-pointer dark:bg-blue-600 dark:hover:bg-blue-700"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            "Sign In"
          )}
        </button>
      </form>
    </div>
  );
}
