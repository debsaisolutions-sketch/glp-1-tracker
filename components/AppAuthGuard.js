"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export function AppAuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(() => Boolean(supabase));

  useEffect(() => {
    if (!supabase) return;

    let isMounted = true;

    async function requireAuth() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (error || !session?.user) {
        const nextPath = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
        router.replace(`/login${nextPath}`);
        return;
      }

      setIsChecking(false);
    }

    requireAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session?.user) {
        const nextPath = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
        router.replace(`/login${nextPath}`);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  if (isChecking) {
    return (
      <div className="animate-pulse rounded-2xl bg-zinc-100 py-24 dark:bg-zinc-800" />
    );
  }

  return children;
}
