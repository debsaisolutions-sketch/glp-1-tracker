"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isResetSending, setIsResetSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  function toReadableError(error, fallback) {
    if (!error) return fallback;
    const msg =
      typeof error?.message === "string" ? error.message.trim() : "";
    if (msg && msg !== "{}") return msg;
    return fallback;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    setResetMessage("");

    if (!supabase) {
      setErrorMessage(
        "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
      );
      return;
    }

    setIsSending(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setIsSending(false);

    if (error) {
      setErrorMessage(error.message || "Unable to sign in.");
      return;
    }
  }

  async function handleForgotPassword(event) {
    event.preventDefault();
    setErrorMessage("");
    setResetMessage("");

    if (!supabase) {
      setErrorMessage(
        "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
      );
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage("Enter your email first.");
      return;
    }

    setIsResetSending(true);
    try {
      const timeoutMs = 11000;
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => resolve({ timedOut: true }), timeoutMs);
      });
      const requestPromise = supabase.auth
        .resetPasswordForEmail(trimmedEmail, {
          redirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/reset-password`
              : undefined,
        })
        .then((result) => ({ ...result, timedOut: false }));

      const result = await Promise.race([requestPromise, timeoutPromise]);

      if (result?.timedOut) {
        setErrorMessage("Password reset request timed out. Please try again.");
        return;
      }

      if (result?.error) {
        setErrorMessage(
          toReadableError(result.error, "Unable to send password reset link."),
        );
        return;
      }

      setResetMessage("Password reset link sent. Check your email.");
    } catch (error) {
      setErrorMessage(
        toReadableError(error, "Unable to send password reset link."),
      );
    } finally {
      setIsResetSending(false);
    }
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

      <div>
        <label
          htmlFor="password"
          className="text-xs font-medium text-zinc-600 dark:text-zinc-400"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Your password"
          className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none ring-teal-500/30 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>

      <button
        type="submit"
        disabled={isSending}
        className="w-full rounded-xl border border-zinc-200 bg-zinc-100 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-70 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
      >
        {isSending ? "Signing in..." : "Sign in"}
      </button>
      <button
        type="button"
        onClick={handleForgotPassword}
        disabled={isResetSending}
        className="w-full text-center text-xs font-medium text-teal-700 underline-offset-4 hover:underline dark:text-teal-300"
      >
        {isResetSending ? "Sending reset link..." : "Forgot password?"}
      </button>

      {errorMessage ? (
        <p
          className="rounded-xl border border-rose-200 bg-rose-50/80 px-3 py-2.5 text-sm leading-relaxed text-rose-900 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-100"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}
      {resetMessage ? (
        <p
          className="rounded-xl border border-teal-200 bg-teal-50/80 px-3 py-2.5 text-sm leading-relaxed text-teal-950 dark:border-teal-900/60 dark:bg-teal-950/40 dark:text-teal-100"
          role="status"
        >
          {resetMessage}
        </p>
      ) : null}
    </form>
  );
}
