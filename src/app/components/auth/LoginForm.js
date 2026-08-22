"use client";

import { useEffect, useState, useActionState } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
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
    }, 4000);

    return () => clearTimeout(timer);
  }, [state]);

  useEffect(() => {
    if (state.success) {
      setPassword("");
      router.replace("/dashboard");
    }
  }, [state.success, router]);

  return (
    <div className="w-full">
      {/* Title & Subtitle */}
      <div className="mb-6 text-left">
        <h1 className="text-2xl font-bold tracking-tight text-indigo-950">
          LOGIN
        </h1>
        <p className="mt-1 text-xs text-slate-500 font-normal">
          Enter your credentials to access your account
        </p>
      </div>

      {/* Login Form */}
      <form action={formAction} className="space-y-4">
        {/* Email Field */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-700">
            EMAIL
          </label>
          <div className="group relative flex items-center rounded-xl border border-slate-200 bg-white px-3.5 transition-all focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-100">
            <Mail
              className="h-4 w-4 shrink-0 text-slate-400 transition-colors group-focus-within:text-slate-600"
              strokeWidth={1.75}
            />
            <input
              type="email"
              name="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
              className="h-11 w-full bg-transparent px-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none"
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-700">
            PASSWORD
          </label>
          <div className="group relative flex items-center rounded-xl border border-slate-200 bg-white px-3.5 transition-all focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-100">
            <Lock
              className="h-4 w-4 shrink-0 text-slate-400 transition-colors group-focus-within:text-slate-600"
              strokeWidth={1.75}
            />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              className="h-11 w-full bg-transparent px-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="rounded p-1 text-slate-400 hover:text-slate-600 transition focus:outline-none"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" strokeWidth={1.75} />
              ) : (
                <Eye className="h-4 w-4" strokeWidth={1.75} />
              )}
            </button>
          </div>
        </div>

        {/* Inline Feedback Alerts */}
        {message && (
          <div
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${
              message?.success
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-800"
            }`}
          >
            {message?.success ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Sign In Button */}
        <button
          type="submit"
          disabled={pending}
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-950 text-s font-semibold text-white shadow-sm transition hover:bg-[#30277C] active:scale-[0.99] cursor-pointer disabled:opacity-60"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Signing In...</span>
            </>
          ) : (
            <span>SIGN IN</span>
          )}
        </button>
      </form>
    </div>
  );
}
