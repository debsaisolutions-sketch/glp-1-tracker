/** Shared banner for /login and /signup while auth is not wired. */
export function TestModeAuthBanner() {
  return (
    <div
      className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100"
      role="status"
    >
      <p className="text-sm font-semibold leading-snug">
        Test version: account creation is not live yet.
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-amber-900/90 dark:text-amber-200/90">
        This preview is still being built. Real sign-in will be enabled when
        launch setup is complete.
      </p>
    </div>
  );
}
