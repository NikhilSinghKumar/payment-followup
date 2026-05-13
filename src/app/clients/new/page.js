"use client";
import { useActionState } from "react";
import { createClient } from "../../actions/client";
import Link from "next/link";

export default function NewClientPage() {
  const [state, formAction] = useActionState(createClient, {});
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="h-1 w-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-400 mb-5" />
        {/* Card */}
        <div className="w-full max-w-xl bg-white/80 backdrop-blur-md rounded-2xl shadow-md border border-zinc-200 p-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-zinc-800">
              Add New Client
            </h2>
            <p className="text-sm text-zinc-500 mt-1">
              Enter client details to create a new record
            </p>
          </div>

          {state?.error && (
            <div className="mb-4 p-3 bg-red-100 text-red-600 rounded">
              {state.error}
            </div>
          )}

          {state?.success && (
            <div className="mb-4 p-3 bg-green-100 text-green-600 rounded">
              Client created successfully
            </div>
          )}

          {/* Form */}
          <form action={formAction} className="space-y-4">
            {/* Company Name */}
            <div>
              <label className="text-sm text-zinc-600 mb-1 block">
                Company Name *
              </label>
              <input
                name="companyName"
                placeholder="e.g. ABC Pvt Ltd"
                required
                className="input-primary focus:ring-blue-500 caret-blue-500"
              />
            </div>

            {/* Company Code */}
            <div>
              <label className="text-sm text-zinc-600 mb-1 block">
                Company Code *
              </label>
              <input
                name="companyCode"
                placeholder="e.g. ABC123"
                required
                className="input-primary focus:ring-blue-500 caret-blue-500"
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-sm text-zinc-600 mb-1 block">Email</label>
              <input
                name="email"
                type="email"
                placeholder="e.g. contact@company.com"
                className="input-primary focus:ring-blue-500 caret-blue-500"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="text-sm text-zinc-600 mb-1 block">Phone</label>
              <input
                name="phone"
                placeholder="e.g. +91 9876543210"
                className="input-primary focus:ring-blue-500 caret-blue-500"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="
              w-full h-[44px] rounded-lg 
              text-white text-sm font-medium
              bg-gradient-to-r from-blue-500 to-purple-500
              shadow-md hover:shadow-lg
              transition-all duration-200 cursor-pointer
              hover:scale-[1.02]
            "
            >
              Save Client
            </button>

            <Link
              href="/clients"
              className="text-sm text-blue-500 hover:underline"
            >
              ← Back to Clients
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
