type Props = {
  title: string;
  detail?: string;
};

export default function ClerkConfigNotice({ title, detail }: Props) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-6">
      <div className="w-full max-w-xl rounded-2xl border border-amber-500/40 bg-white/80 dark:bg-surface-dark/90 backdrop-blur shadow-xl p-6 space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
          <span className="material-symbols-outlined text-base">warning</span>
          Clerk configuration required
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
        <p className="text-sm text-text-muted">
          Set <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> and <code>CLERK_SECRET_KEY</code> in Vercel for this deployment.
        </p>
        {detail ? <p className="text-sm text-text-muted">{detail}</p> : null}
      </div>
    </main>
  );
}
