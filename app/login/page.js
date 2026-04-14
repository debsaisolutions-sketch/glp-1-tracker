"use client";

import Link from "next/link";
import { useState } from "react";
import { PublicHeader } from "@/components/PublicHeader";
import { Card } from "@/components/Card";
import { TestModeAuthBanner } from "@/components/TestModeAuthBanner";

export default function LoginPage() {
  const [submitMessage, setSubmitMessage] = useState("");

  function onSubmit(e) {
    e.preventDefault();
    setSubmitMessage(
      "Sign-in is not connected in this preview—nothing was saved. Use Preview App on the home page to try the tracker on this device.",
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/90 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-950 dark:to-black">
      <PublicHeader />
      <main className="mx-auto w-full max-w-lg px-4 py-10">
        <TestModeAuthBanner />
        <Card className="mx-auto max-w-md">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            This screen is a layout placeholder only—no real authentication yet.
          </p>
          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
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
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none ring-teal-500/30 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-100 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              Sign-in not available (preview)
            </button>
          </form>
          {submitMessage ? (
            <p
              className="mt-4 rounded-xl border border-teal-200 bg-teal-50/80 px-3 py-2.5 text-sm leading-relaxed text-teal-950 dark:border-teal-900/60 dark:bg-teal-950/40 dark:text-teal-100"
              role="status"
            >
              {submitMessage}
            </p>
          ) : null}
          <p className="mt-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
            Want the UI tour?{" "}
            <Link
              href="/app"
              className="font-medium text-teal-700 hover:underline dark:text-teal-300"
            >
              Preview App
            </Link>
            {" · "}
            <Link
              href="/signup"
              className="font-medium text-teal-700 hover:underline dark:text-teal-300"
            >
              Sign up screen (preview)
            </Link>
          </p>
        </Card>
      </main>
    </div>
  );
}
