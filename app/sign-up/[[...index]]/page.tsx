import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-6">
      <div className="w-full max-w-md rounded-2xl border border-border-dark bg-white/70 dark:bg-surface-dark/80 backdrop-blur shadow-xl p-6">
        <SignUp path="/sign-up" routing="path" />
      </div>
    </main>
  );
}
