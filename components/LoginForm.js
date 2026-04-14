"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const CONFIRMATION_MESSAGE = "Check your email for login link";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    setConfirmationMessage("");

    if (!supabase) {
      setErrorMessage(
        "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
      );
      return;
    }

    setIsSending(true);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo:
          typeof window !== "undefined" ? `${window.location.origin}/app` : undefined,
      },
    });

    setIsSending(false);

    if (error) {
      setErrorMessage(error.message || "Unable to send login link.");
      return;
    }

    setConfirmationMessage(CONFIRMATION_MESSAGE);
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
      <div>
        <label
          htmlFor="email"
          className="text-xs font-medium text-zinc-600 dark:text-zinc-400"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none ring-teal-500/30 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>

      <button
        type="submit"
        disabled={isSending}
        className="w-full rounded-xl border border-zinc-200 bg-zinc-100 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-70 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
      >
        {isSending ? "Sending..." : "Send login link"}
      </button>

      {confirmationMessage ? (
        <p
          className="rounded-xl border border-teal-200 bg-teal-50/80 px-3 py-2.5 text-sm leading-relaxed text-teal-950 dark:border-teal-900/60 dark:bg-teal-950/40 dark:text-teal-100"
          role="status"
        >
          {confirmationMessage}
        </p>
      ) : null}

      {errorMessage ? (
        <p
          className="rounded-xl border border-rose-200 bg-rose-50/80 px-3 py-2.5 text-sm leading-relaxed text-rose-900 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-100"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}
    </form>
  );
}
