'use client';

import { ClerkProvider } from '@clerk/nextjs';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

export default function ClerkProviderClient({ children }: Props) {
  // Client-only wrapper avoids calling next/headers() on the server (Next 15 requires awaiting it).
  return <ClerkProvider>{children}</ClerkProvider>;
}
