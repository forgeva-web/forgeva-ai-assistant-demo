// @/components/(demo)/DemoSidebar.tsx

'use client';

import { useState, useEffect } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { SignInButton, SignUpButton } from '@clerk/nextjs';
import { useUser, SignOutButton } from '@clerk/nextjs';
import {
  BrowserIcon,
  SignOutIcon,
  HouseIcon,
  GlobeIcon,
  CoinsIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';

// —— Tech Stack data ———————————————————————————————————————————————————_
const TECH_STACK = [
  {
    group: 'Frontend',
    items: ['Next.js 15', 'Apollo Client', 'shadcn/ui', 'Tailwind v4'],
  },
  {
    group: 'Backend',
    items: ['Apollo Server 4', 'GraphQL', 'Prisma 7', 'Supabase'],
  },
  {
    group: 'AI',
    items: ['Anthropic Claude', 'OpenAI Embeddings', 'Vercel AI SDK v6'],
  },
  {
    group: 'Infra',
    items: ['Clerk', 'Vercel', 'pgvector'],
  },
];

// —— Token usage types ———————————————————————————————————————————————————————
type TokenStatus = {
  tokensUsed: number;
  tokenBudget: number;
  remaining: number;
  percent: number;
};

function tokenProgressColor(percent: number): string {
  if (percent >= 90) return '[&>div]:bg-error';
  if (percent >= 65) return '[&>div]:bg-warning';
  return '[&>div]:bg-success';
}

function tokenBadgeClass(percent: number): string {
  if (percent >= 90) return 'border-error/20 bg-error/10 text-error';
  if (percent >= 65) return 'border-warning/20 bg-warning/10 text-warning';
  return 'border-success/20 bg-success/10 text-success';
}

// ——— Token usage widget ———————————————————————————————————————————————————
function TokenUsageWidget() {
  const [status, setStatus] = useState<TokenStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/demo/token-status')
      .then((r) => r.json())
      .then((data) => {
        if (data.allowed !== false) setStatus(data);
      })
      .catch((err: Error) => setFetchError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-2">
        {/* Label row skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-4 w-8 rounded-full" />
        </div>
        {/* Progress bar skeleton */}
        <Skeleton className="h-1.5 w-full rounded-full" />
        {/* Used / remaining row skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-14" />
        </div>
      </div>
    );
  }

  // —— Error — shadcn Alert, compact for sidebar context ————
  if (fetchError) {
    return (
      <Alert variant="destructive" className="mx-2 py-2 px-3">
        <WarningCircleIcon className="size-3.5" />
        <AlertDescription className="text-[10px] leading-snug ml-1">
          {fetchError}
        </AlertDescription>
      </Alert>
    );
  }

  if (!status) return null;

  const { tokensUsed, tokenBudget, remaining, percent } = status;
  const isExhausted = remaining <= 0;

  return (
    <div className="space-y-2 px-2">
      {/* Labe & percentage badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <CoinsIcon className="size-3 text-[#e9ad03]" weight="fill" />
          <span className="text-[11px] text-muted-foreground font-medium">
            Token Budget
          </span>
        </div>
        <Badge
          variant="outline"
          className={`text-[10px] tabular-nums ${tokenBadgeClass(percent)}`}
        >
          {percent}%
        </Badge>
      </div>

      {/* Progress bar */}
      <Progress
        value={percent}
        className={`h-1.5 ${tokenProgressColor(percent)}`}
      />

      {/* Used / remaining counts */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] tabular-nums text-muted-foreground">
          {tokensUsed.toLocaleString()} used
        </span>
        <span
          className={`text-[10px] tabular-nums font-medium ${isExhausted ? 'text-error' : 'text-muted-foreground'}`}
        >
          {isExhausted ? 'Exhausted' : `${remaining.toLocaleString()} left`}
        </span>
      </div>

      {/* Budget exhausted inline alert */}
      {isExhausted && (
        <Alert variant="destructive" className="py-2 px-3">
          <AlertDescription className="text-[10px] leading-snug">
            AI features disabled. Budget reset at midnight UTC.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// —— User info skeleton ———————————————————————————————————————————————————
function UserInfoSkeleton() {
  return (
    <div className="space-y-1.5 px-1">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="h-3 w-36" />
    </div>
  );
}

// —— Nav items ———————————————————————————————————————————————————————————
const NAV_ITEMS = [
  { href: '/', label: 'Overview', icon: HouseIcon },
  {
    href: '/sites/mitchs-plumbing',
    label: "Mitch's Plumbing Site Demo",
    icon: GlobeIcon,
  },
];

// —— Main component ———————————————————————————————————————————
export function DemoSidebar() {
  const { user, isLoaded, isSignedIn } = useUser();
  const pathname = usePathname();

  return (
    <Sidebar>
      {/* Brand */}
      <SidebarHeader className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
            <span className="text-[10px] font-bold text-primary-foreground">
              F
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold leading-none text-sidebar-foreground">
              Forgeva AI
            </p>
            <p className="text-[10px] text-sidebar-foreground/50 mt-0.5">
              Demo
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Nav */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarMenu>
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === href}
                  tooltip={label}
                >
                  <Link href={href}>
                    <Icon className="size-4" />
                    <span>{label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* Token usage */}
        <SidebarGroup className="my-auto">
          <SidebarGroupLabel>AI Usage</SidebarGroupLabel>
          {isSignedIn ? (
            <TokenUsageWidget />
          ) : (
            // Signed-out state show what they're missing and clear CTA
            <div className="space-y-3 px-2">
              {/* Feature list what signing-in unlocks */}
              <div className="space-y-1.5">
                {[
                  'Crawl and index client sites',
                  'AI chat with indexed content',
                  'Accept or reject SEO edits',
                  'Per-session token budget',
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-muted-foreground/40 shrink-0" />
                    <span className="text-[11px] text-muted-foreground">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              {/* Locked token widget preview */}
              <div className="space-y-1.5 opacity-40 pointer-events-none select-none">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <CoinsIcon
                      className="size-3 text-[#e9ad03]"
                      weight="fill"
                    />
                    <span className="text-[11px] text-muted-foreground font-medium">
                      Token Budget
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    ——
                  </Badge>
                </div>
                <Progress value={0} className="h-1.5" />
                <div className="flex justify-between">
                  <span className="text-[10px] text-muted-foreground">
                    0 used
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    — left
                  </span>
                </div>
              </div>

              {/* Auth CTAs */}
              <div className="flex flex-col gap-1.5">
                <SignInButton mode="modal">
                  <Button size="sm" className="w-full h-7 text-[11px]">
                    Sign In
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-7 text-[11px]"
                  >
                    Create free account
                  </Button>
                </SignUpButton>
              </div>

              <p className="text-[10px] text-muted-foreground/60 text-center leading-snug">
                Free demo access · No credit card required
              </p>
            </div>
          )}
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="space-y-3 mb-2">
        {/* User info — Skeleton while Clerk loads */}
        {!isLoaded ? (
          <UserInfoSkeleton />
        ) : user ? (
          <>
            <Separator />
            <div className="flex items-center justify-between px-1 gap-2">
              <div className="min-w-0 flex flex-col gap-0.5">
                <p className="text-[11px] font-medium text-sidebar-foreground truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-[10px] text-sidebar-foreground/50 truncate">
                  {user.primaryEmailAddress?.emailAddress}
                </p>
              </div>
              <SignOutButton>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 hover:bg-destructive/10 hover:text-destructive"
                >
                  <SignOutIcon className="size-3.5" />
                </Button>
              </SignOutButton>
            </div>
          </>
        ) : null}
      </SidebarFooter>
    </Sidebar>
  );
}
