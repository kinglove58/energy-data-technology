import { SignUp } from '@clerk/nextjs';
import ClerkConfigNotice from '@/components/auth/ClerkConfigNotice';
import { clerkAuthAppearance } from '@/components/auth/clerkAppearance';

const clerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() &&
    process.env.CLERK_SECRET_KEY?.trim()
);

export default function SignUpPage() {
  if (!clerkConfigured) {
    return (
      <ClerkConfigNotice
        title="Sign up is unavailable."
        detail="Add the Clerk keys to the deployment environment and redeploy to enable account creation."
      />
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07100b] p-6 text-white">
      <div className="w-full max-w-md rounded-lg border border-emerald-300/20 bg-[#132018]/95 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <SignUp
          path="/sign-up"
          routing="path"
          signInUrl="/sign-in"
          appearance={clerkAuthAppearance}
        />
      </div>
    </main>
  );
}
