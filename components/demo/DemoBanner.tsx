// @/components/(demo)/DemoBanner.tsx

'use client';

import Link from 'next/link';

import { useUser } from '@clerk/nextjs';
import { ArrowRightIcon, FlaskIcon } from '@phosphor-icons/react';

export function DemoBanner() {
  const { isSignedIn } = useUser();
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') return null;

  return (
    <div className="w-full shrink-0 border-b border-success/20 bg-success/10 px-4 py-2.5 ">
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
        {/* Mode label */}

        <span className="font-semibold text-success inline-flex items-center gap-1.5">
          <FlaskIcon size={16} weight="fill" />
          Demo Mode
        </span>

        {/* Contextual messages based on auth state */}
        {isSignedIn ? (
          <span className="text-success">
            Accept an edit, then see it live on the{' '}
            <Link
              href={process.env.NEXT_PUBLIC_CLIENT_SITE_URL ?? '#'}
              className="inline-flex items-center gap-0.5 font-medium text-success hover:text-success/70 underline underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              Mitch&apos;s Plumbing demo site{' '}
              <ArrowRightIcon className="size-3 ml-1" weight="bold" />
            </Link>
          </span>
        ) : (
          <span className="text-success/70">
            <Link
              href="/sign-up"
              className="font-medium text-success hover:text-success/70 underline underline-offset-2"
            >
              Sign up for free
            </Link>{' '}
            to interact with AI features.
          </span>
        )}

        {/* Divider dot */}
        <span className="text-success/30 md:hidden inline">|</span>

        {/* GitHub source link */}
        <Link
          href="https://github.com/duffymitch12/forgeva-ai-assistant"
          className="inline-flex items-center gap-0.5 font-medium text-success hover:text-success/70 underline underline-offset-2"
          target="_blank"
          rel="noopener noreferrer"
        >
          View source <ArrowRightIcon className="size-3 ml-1" weight="bold" />
        </Link>
      </div>
    </div>
  );
}
