import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) {
    redirect('/dashboard');
  }

  return (
    <main className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-2xl text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
          <span className="material-symbols-outlined text-base">bolt</span>
          Energy Data Network Assurance
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
          Secure, server-first revenue assurance with AI-powered insights.
        </h1>
        <p className="text-text-muted text-base">
          Sign in to access the dashboard. All model calls, keys, and business logic run on the server via Next.js route handlers.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/sign-in"
            className="w-full sm:w-auto px-5 py-3 rounded-lg bg-primary text-black font-bold shadow-sm hover:bg-primary-hover transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="w-full sm:w-auto px-5 py-3 rounded-lg border border-border-dark text-white font-semibold hover:bg-white/5 transition-colors"
          >
            Create Account
          </Link>
        </div>
      </div>
    </main>
  );
}
