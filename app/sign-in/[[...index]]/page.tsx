import { SignIn } from '@clerk/nextjs';
import ClerkConfigNotice from '@/components/auth/ClerkConfigNotice';

const clerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() &&
    process.env.CLERK_SECRET_KEY?.trim()
);

export default function SignInPage() {
  if (!clerkConfigured) {
    return (
      <ClerkConfigNotice
        title="Sign in is unavailable."
        detail="Add the Clerk keys to the deployment environment and redeploy to enable authentication."
      />
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-6">
      <div className="w-full max-w-md rounded-2xl border border-border-dark bg-white/70 dark:bg-surface-dark/80 backdrop-blur shadow-xl p-6">
        <SignIn path="/sign-in" routing="path" />
      </div>
    </main>
  );
}
