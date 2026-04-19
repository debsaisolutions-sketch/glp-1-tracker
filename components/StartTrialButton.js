"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { supabase } from "@/lib/supabaseClient";

export function StartTrialButton({ className }) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function onClick() {
    setLoading(true);
    setErrorMessage("");

    let email = "";
    let supabaseUserId = "";

    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) {
        email = user.email;
        supabaseUserId = user.id;
      }
    }

    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        supabaseUserId,
      }),
    });

    const payload = await response.json().catch(() => ({}));

    setLoading(false);

    if (!response.ok || (!payload?.url && !payload?.sessionId)) {
      setErrorMessage(payload?.error || "Unable to start checkout.");
      return;
    }

    window.location.assign(payload.url);
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className={className}
      >
        {loading ? "Redirecting..." : "Start your 7-day free trial"}
      </button>
      {errorMessage ? (
        <p
          className="mt-2 text-center text-xs text-rose-700 dark:text-rose-300"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
