"use client";

import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";
import { Card } from "@/components/Card";

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/90 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-950 dark:to-black">
      <PublicHeader />
      <main className="mx-auto w-full max-w-lg px-4 py-10">
        <Card className="mx-auto max-w-md">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Mock signup—no data is saved yet.
          </p>
          <form className="mt-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label
                htmlFor="name"
                className="text-xs font-medium text-zinc-600 dark:text-zinc-400"
              >
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none ring-teal-500/30 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>
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
                autoComplete="new-password"
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none ring-teal-500/30 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
            >
              Create account
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-teal-700 hover:underline dark:text-teal-300">
              Log in
            </Link>
          </p>
        </Card>
      </main>
    </div>
  );
}
