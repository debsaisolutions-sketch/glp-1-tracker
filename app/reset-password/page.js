"use client";

import Link from "next/link";
import { useState } from "react";
import { PublicHeader } from "@/components/PublicHeader";
import { Card } from "@/components/Card";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function onSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!supabase) {
      setErrorMessage(
        "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
      );
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message || "Unable to update password.");
      return;
    }

    setSuccessMessage("Password updated. You can sign in now.");
    setPassword("");
    setConfirmPassword("");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/90 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-950 dark:to-black">
      <PublicHeader />
      <main className="mx-auto w-full max-w-lg px-4 py-10">
        <Card className="mx-auto max-w-md">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Reset password
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Enter your new password below.
          </p>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div>
              <label
                htmlFor="new-password"
                className="text-xs font-medium text-zinc-600 dark:text-zinc-400"
              >
                New password
              </label>
              <input
                id="new-password"
                name="new-password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none ring-teal-500/30 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="text-xs font-medium text-zinc-600 dark:text-zinc-400"
              >
                Confirm password
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none ring-teal-500/30 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-100 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-70 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              {isSubmitting ? "Updating..." : "Update password"}
            </button>
          </form>

          {errorMessage ? (
            <p
              className="mt-4 rounded-xl border border-rose-200 bg-rose-50/80 px-3 py-2.5 text-sm leading-relaxed text-rose-900 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-100"
              role="alert"
            >
              {errorMessage}
            </p>
          ) : null}

          {successMessage ? (
            <p
              className="mt-4 rounded-xl border border-teal-200 bg-teal-50/80 px-3 py-2.5 text-sm leading-relaxed text-teal-950 dark:border-teal-900/60 dark:bg-teal-950/40 dark:text-teal-100"
              role="status"
            >
              {successMessage}
            </p>
          ) : null}

          <p className="mt-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
            <Link
              href="/login"
              className="font-medium text-teal-700 hover:underline dark:text-teal-300"
            >
              Back to sign in
            </Link>
          </p>
        </Card>
      </main>
    </div>
  );
}
