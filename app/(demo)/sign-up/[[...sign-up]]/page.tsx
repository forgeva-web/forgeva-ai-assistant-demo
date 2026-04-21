// @/app/(demo)/sign-up/[[...sign-up]]/page.tsx
import { Suspense } from 'react';

import { SignUp } from '@clerk/nextjs';

// Tells Next.js 16 don't attempt to prerender this page statically
// it contains dynamic data that only exists at req time
export const dynamic = 'force-dynamic';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Suspense fallback={<div>Loading...</div>}>
        <SignUp />
      </Suspense>
    </div>
  );
}
