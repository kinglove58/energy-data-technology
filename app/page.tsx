import Link from 'next/link';
import ClerkConfigNotice from '@/components/auth/ClerkConfigNotice';

const clerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() &&
    process.env.CLERK_SECRET_KEY?.trim()
);

export default async function HomePage() {
  if (!clerkConfigured) {
    return (
      <ClerkConfigNotice
        title="Authentication is not configured for this deployment."
        detail="Once those environment variables are set, the sign-in flow and protected dashboard routes will work normally."
      />
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#07100b] px-6 py-12 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-5xl flex-col items-center justify-center text-center">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-sm font-semibold text-emerald-300 shadow-[0_0_35px_rgba(27,227,93,0.12)]">
          <span className="material-symbols-outlined text-base">bolt</span>
          Energy Data Network Assurance
        </div>
        <h1 className="max-w-4xl text-4xl font-bold leading-tight text-white sm:text-5xl">
          Secure, server-first revenue assurance with AI-powered insights.
        </h1>
        <p className="mt-6 max-w-3xl text-base leading-7 text-[#b7cfc0] sm:text-lg">
          Sign in to access the dashboard. All model calls, keys, and business logic run on the server via Next.js route handlers.
        </p>
        <div className="mt-10 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
          <Link
            href="/sign-in"
            className="w-full rounded-lg bg-[#1be35d] px-6 py-3 text-center text-base font-bold text-[#06120a] shadow-[0_18px_35px_rgba(27,227,93,0.25)] transition-colors hover:bg-[#34f071] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#70f59b] sm:w-auto"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="w-full rounded-lg border border-emerald-300/50 bg-white px-6 py-3 text-center text-base font-bold text-[#0b2414] shadow-sm transition-colors hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#70f59b] sm:w-auto"
          >
            Create Account
          </Link>
        </div>
      </div>
    </main>
  );
}
