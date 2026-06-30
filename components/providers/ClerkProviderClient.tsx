'use client';

import { ClerkProvider } from '@clerk/nextjs';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();

export default function ClerkProviderClient({ children }: Props) {
  // Client-only wrapper avoids calling next/headers() on the server (Next 15 requires awaiting it).
  if (!publishableKey) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInForceRedirectUrl="/dashboard"
      signUpForceRedirectUrl="/dashboard"
    >
      {children}
    </ClerkProvider>
  );
}
