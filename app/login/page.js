"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { PublicHeader } from "@/components/PublicHeader";
import { Card } from "@/components/Card";
import { LoginForm } from "@/components/LoginForm";
import { supabase } from "@/lib/supabaseClient";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!supabase) return;

    let isMounted = true;

    async function redirectIfLoggedIn() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!isMounted || !session?.user) return;
      const nextPath = searchParams.get("next");
      router.replace(nextPath || "/app");
    }

    redirectIfLoggedIn();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const nextPath = searchParams.get("next");
        router.replace(nextPath || "/app");
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/90 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-950 dark:to-black">
      <PublicHeader />
      <main className="mx-auto w-full max-w-lg px-4 py-10">
        <Card className="mx-auto max-w-md">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Sign in with your email and password.
          </p>
          <LoginForm />
          <p className="mt-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
            <Link
              href="/signup"
              className="font-medium text-teal-700 hover:underline dark:text-teal-300"
            >
              Need an account?
            </Link>
          </p>
        </Card>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
