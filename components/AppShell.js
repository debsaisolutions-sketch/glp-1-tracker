"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/app", label: "Home" },
  { href: "/app/doses", label: "Doses" },
  { href: "/app/daily", label: "Daily" },
  { href: "/app/progress", label: "Progress" },
  { href: "/app/settings", label: "Settings" },
];

export function AppShell({ children }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/90 via-white to-zinc-50 pb-24 dark:from-zinc-950 dark:via-zinc-950 dark:to-black">
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col px-4 pt-4 sm:px-5">
        {children}
      </div>

      <nav
        className="fixed bottom-0 left-0 right-0 z-20 border-t border-zinc-200/80 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95"
        aria-label="App navigation"
      >
        <div className="mx-auto flex max-w-lg justify-between gap-1 px-2 py-2 safe-area-pb">
          {nav.map((item) => {
            const active =
              item.href === "/app"
                ? pathname === "/app"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 rounded-xl px-1 py-2 text-center text-xs font-medium transition-colors sm:text-sm ${
                  active
                    ? "bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-100"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
