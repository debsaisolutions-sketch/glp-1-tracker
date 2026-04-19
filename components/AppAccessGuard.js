"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export function AppAccessGuard({ children }) {
  const router = useRouter();
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let mounted = true;

    async function checkAccess() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          if (mounted) setStatus("denied");
          router.replace("/login");
          return;
        }

        const response = await fetch("/api/check-access", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          if (mounted) setStatus("denied");
          router.replace("/pricing");
          return;
        }

        const result = await response.json();

        if (result?.hasAccess) {
          if (mounted) setStatus("allowed");
          return;
        }

        if (mounted) setStatus("denied");
        router.replace("/pricing");
      } catch (error) {
        console.error("Access check failed:", error);
        if (mounted) setStatus("denied");
        router.replace("/pricing");
      }
    }

    checkAccess();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (status === "checking") {
    return (
      <div style={{ padding: "24px", fontSize: "16px" }}>
        Checking access...
      </div>
    );
  }

  if (status !== "allowed") {
    return null;
  }

  return children;
}
