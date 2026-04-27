"use client";

import { useState } from "react";
import { Card } from "@/components/Card";
import { MedicationSetupForm } from "@/components/MedicationSetupForm";
import { useAppState } from "@/components/AppStateContext";
import { PRIMARY_GOAL_OPTIONS } from "@/lib/constants";
import { supabase } from "@/lib/supabaseClient";

function btnBase(active) {
  return `w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors ${
    active
      ? "bg-teal-600 text-white shadow-sm"
      : "border border-zinc-200 bg-white text-zinc-900 hover:border-teal-200 hover:bg-teal-50/80 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:border-teal-800 dark:hover:bg-teal-950/40"
  }`;
}

export default function SettingsPage() {
  const {
    vial,
    setVial,
    primaryGoal,
    setPrimaryGoal,
    hydrated,
  } = useAppState();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  function onFieldChange(key, value) {
    setVial((s) => ({ ...s, [key]: value }));
  }

  function onPatch(patch) {
    setVial((s) => ({ ...s, ...patch }));
  }

  async function onPasswordSubmit(event) {
    event.preventDefault();
    setPasswordError("");
    setPasswordStatus("");

    if (!supabase) {
      setPasswordError(
        "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
      );
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setIsUpdatingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsUpdatingPassword(false);

    if (error) {
      setPasswordError(error.message || "Unable to update password.");
      return;
    }

    setPasswordStatus("Password updated successfully.");
    setNewPassword("");
    setConfirmPassword("");
  }

  if (!hydrated) {
    return (
      <div className="animate-pulse rounded-2xl bg-zinc-100 py-24 dark:bg-zinc-800" />
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-4">
      <header>
        <p className="text-xs font-medium uppercase tracking-wide text-teal-700 dark:text-teal-300">
          Primary goal
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          What you are mainly tracking for
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          This shapes gentle dashboard guidance (not medical advice). You can
          change it anytime.
        </p>
      </header>

      <Card className="space-y-2 p-3 sm:p-4">
        <div className="flex flex-col gap-2">
          {PRIMARY_GOAL_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setPrimaryGoal(opt.id)}
              className={btnBase(primaryGoal === opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Card>

      <header className="pt-2">
        <p className="text-xs font-medium uppercase tracking-wide text-teal-700 dark:text-teal-300">
          Medication Setup
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Vial & pen math
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Enter your medication and vial strength here so every dose log can
          convert units to mg correctly.
        </p>
      </header>

      <MedicationSetupForm
        settings={vial}
        onFieldChange={onFieldChange}
        onPatch={onPatch}
      />

      <header className="pt-2">
        <p className="text-xs font-medium uppercase tracking-wide text-teal-700 dark:text-teal-300">
          Account
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Set / change password
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Update your password without changing your account data.
        </p>
      </header>

      <Card className="space-y-4 p-3 sm:p-4">
        <form className="space-y-3" onSubmit={onPasswordSubmit}>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              New password
            </span>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none ring-teal-500/30 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Confirm password
            </span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none ring-teal-500/30 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>

          <button
            type="submit"
            disabled={isUpdatingPassword}
            className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isUpdatingPassword ? "Updating password..." : "Update password"}
          </button>

          {passwordError ? (
            <p className="text-sm text-rose-600 dark:text-rose-400">{passwordError}</p>
          ) : null}
          {passwordStatus ? (
            <p className="text-sm text-teal-700 dark:text-teal-300">{passwordStatus}</p>
          ) : null}
        </form>
      </Card>
    </div>
  );
}
