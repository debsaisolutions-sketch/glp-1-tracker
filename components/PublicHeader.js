import Link from "next/link";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200/80 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3 sm:max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight text-teal-800 dark:text-teal-200"
        >
          <img
            src="/peptidepath-icon.png"
            alt="PeptidePath logo"
            width={28}
            height={28}
            className="h-7 w-7 rounded-md object-cover"
          />
          <span>PeptidePath</span>
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link
            href="/pricing"
            className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Sign in
          </Link>
          <Link
            href="/app"
            className="rounded-full bg-teal-600 px-3 py-1.5 font-medium text-white shadow-sm hover:bg-teal-700"
          >
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}
