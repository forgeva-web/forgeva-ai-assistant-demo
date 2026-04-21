// @/app/(demo)/page.tsx

'use client';

import Link from 'next/link';

import type {
  GetDemoHomeSitesQuery,
  GetDemoHomeSitesQueryVariables,
} from '@/lib/graphql/generated/graphql-types';
import { gql, TypedDocumentNode } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  ArrowRightIcon,
  CheckCircleIcon,
  CircleIcon,
  GlobeIcon,
  SpeedometerIcon,
} from '@phosphor-icons/react';

import { TechStackSection } from '@/components/demo/TechStackSection';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

// ── Query ──────────────────────────────────────────────────
const GET_DEMO_HOME_SITES: TypedDocumentNode<
  GetDemoHomeSitesQuery,
  GetDemoHomeSitesQueryVariables
> = gql`
  query GetDemoHomeSites {
    sites {
      id
      name
      url
      slug
      indexedPages {
        id
        url
        indexStatus
        wordCount
        metaTitle
        metaDescription
      }
    }
  }
`;

// ── Demo steps indicator ───────────────────────────────────
const DEMO_STEPS = [
  'View the AISO scorecard for the plumbing site',
  'Generate JSON-LD structured data for the homepage',
  'Accept a proposed meta title or description edit',
  'Click View Client Site — see the change live within 30 seconds',
];

function DemoSteps() {
  return (
    <div className="space-y-2">
      {DEMO_STEPS.map((step, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
            {i + 1}
          </div>
          <p className="text-sm text-muted-foreground">{step}</p>
        </div>
      ))}
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  valueColor,
}: {
  label: string;
  value: string | number;
  sub?: string;
  valueColor?: string;
}) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-2 text-3xl font-bold tabular-nums ${valueColor ?? 'text-foreground'}`}
      >
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </Card>
  );
}

function indexedPageLabel(pageUrl: string): string {
  try {
    const pathname = new URL(pageUrl).pathname.replace(/\/$/, '') || '/';
    if (pathname === '/' || pathname === '') return 'Home';
    const segment = pathname.split('/').filter(Boolean).pop();
    return segment ? decodeURIComponent(segment) : 'Home';
  } catch {
    return 'Page';
  }
}

// ── Page ───────────────────────────────────────────────────
export default function DemoPage() {
  const { data, loading, error } = useQuery<
    GetDemoHomeSitesQuery,
    GetDemoHomeSitesQueryVariables
  >(GET_DEMO_HOME_SITES);

  // The demo always has exactly one site
  const site = data?.sites?.[0];
  const pages = site?.indexedPages ?? [];
  const totalPages = pages.length;
  const indexedCount = pages.filter((p) => p.indexStatus === 'COMPLETE').length;
  const pagesWithIssues = pages.filter(
    (p) => !p.metaTitle || !p.metaDescription
  ).length;
  const totalWords = pages.reduce((sum, p) => sum + (p.wordCount ?? 0), 0);

  return (
    <div className="page-wrap flex flex-col gap-8">
      {/* ── Hero / intro ──────────────────────────────────── */}
      <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xl">
          <Badge
            variant="outline"
            className="mb-3 border-success/20 bg-success/8 text-success text-[11px]"
          >
            Live Demo
          </Badge>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Forgeva AI Assistant
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This demo shows the assistant managing the SEO and AI search
            optimization of a real local business website. Changes you make here
            are reflected live on the client site within 30 seconds.
          </p>
        </div>

        {/* View client site CTA */}
        {process.env.NEXT_PUBLIC_CLIENT_SITE_URL && (
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link
              href={process.env.NEXT_PUBLIC_CLIENT_SITE_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <GlobeIcon className="size-4" />
              View Client Site
              <ArrowRightIcon className="size-3" />
            </Link>
          </Button>
        )}
      </header>

      <Separator />

      {/* ── How it works steps ────────────────────────────── */}
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          How to use this demo
        </p>
        <DemoSteps />
      </section>

      <Separator />

      {/* ── Tech stack section ──────────────────────────────── */}
      <TechStackSection />

      <Separator />

      {/* ── Site stats ────────────────────────────────────── */}
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Site at a glance
        </p>

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            <StatCard label="Total Pages" value={totalPages} />
            <StatCard
              label="Indexed"
              value={`${indexedCount} / ${totalPages}`}
              sub={
                indexedCount === totalPages
                  ? 'All indexed'
                  : `${totalPages - indexedCount} remaining`
              }
              valueColor={
                indexedCount === totalPages ? 'text-success' : 'text-warning'
              }
            />
            <StatCard
              label="SEO Issues"
              value={pagesWithIssues}
              sub={pagesWithIssues === 0 ? 'All clean' : 'pages need attention'}
              valueColor={pagesWithIssues > 0 ? 'text-error' : 'text-success'}
            />
            <StatCard
              label="Total Words"
              value={totalWords.toLocaleString()}
              sub="across all pages"
            />
          </div>
        )}
      </section>

      {/* ── Single site card ──────────────────────────────── */}
      {loading ? (
        <Skeleton className="h-32 w-full rounded-xl" />
      ) : site ? (
        <section>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Demo site
          </p>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <CardTitle className="text-base">{site.name}</CardTitle>
                  <a
                    href={site.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 block text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {site.url}
                  </a>
                </div>
                <Badge
                  variant="outline"
                  className="shrink-0 border-success/20 bg-success/8 text-success text-[11px]"
                >
                  Active
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pb-3">
              {/* Page index status indicators */}
              <div className="flex flex-wrap gap-2">
                {pages.map((page) => (
                  <div
                    key={page.id}
                    className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1"
                  >
                    {page.indexStatus === 'COMPLETE' ? (
                      <CheckCircleIcon
                        className="size-3 text-success"
                        weight="fill"
                      />
                    ) : (
                      <CircleIcon className="size-3 text-muted-foreground" />
                    )}
                    <span className="text-[11px] text-foreground">
                      {indexedPageLabel(page.url)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>

            <Separator />

            <CardFooter className="pt-3">
              <Button asChild size="sm">
                <Link href={`/sites/${site.slug}`}>
                  <SpeedometerIcon className="size-4" />
                  Open AISO Dashboard
                  <ArrowRightIcon className="size-3" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </section>
      ) : null}
    </div>
  );
}
