// @/components/demo/SiteDetailContent.tsx
'use client';

import { useState, use, useEffect, useRef } from 'react';
import { getPageName } from '@/lib/utils';
import { gql, TypedDocumentNode } from '@apollo/client';
import { useQuery, useApolloClient } from '@apollo/client/react';
import { useUser } from '@clerk/nextjs';
import { ArrowRightIcon, ArrowSquareOutIcon } from '@phosphor-icons/react';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { ProposedEditsPanel } from '@/components/editor/ProposedEditsPanel';
import { AisoScoreBoard } from '@/components/seo/AisoScoreBoard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
// import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

// ── Types ──────────────────────────────────────────────────
type IndexedPage = {
  id: string;
  url: string;
  title: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  indexStatus: 'PENDING' | 'INDEXING' | 'COMPLETE' | 'ERROR';
  lastIndexedAt: string | null;
  wordCount: number | null;
};

type SiteData = {
  siteBySlug: {
    id: string;
    name: string;
    url: string;
    slug: string;
    createdAt: string;
    indexedPages: IndexedPage[];
  } | null;
};

type SiteVars = { slug: string };

// Progress event shape for SSE events from route.ts indexing
type ProgressStage =
  | 'crawling'
  | 'chunking'
  | 'embedding'
  | 'saving'
  | 'indexed'
  | 'generating_edits'
  | 'edits_complete'
  | 'complete'
  | 'error';

type IndexProgressState = {
  stage: ProgressStage;
  message: string;
  detail?: string;
  pageUrl?: string;
  pageIndex?: number;
  totalPages?: number;
} | null;

// ── Query ──────────────────────────────────────────────────
const GET_SITE_BY_SLUG: TypedDocumentNode<SiteData, SiteVars> = gql`
  query GetSiteBySlug($slug: String!) {
    siteBySlug(slug: $slug) {
      id
      name
      url
      slug
      createdAt
      indexedPages {
        id
        url
        title
        metaTitle
        metaDescription
        indexStatus
        lastIndexedAt
        wordCount
      }
    }
  }
`;

// ── Helpers ────────────────────────────────────────────────
function statusColor(status: IndexedPage['indexStatus']) {
  switch (status) {
    case 'COMPLETE':
      return 'bg-emerald-500';
    case 'INDEXING':
      return 'bg-amber-400 animate-pulse';
    case 'PENDING':
      return 'bg-zinc-400';
    case 'ERROR':
      return 'bg-rose-500';
  }
}

function statusLabel(status: IndexedPage['indexStatus']) {
  switch (status) {
    case 'COMPLETE':
      return 'Indexed';
    case 'INDEXING':
      return 'Indexing…';
    case 'PENDING':
      return 'Pending';
    case 'ERROR':
      return 'Error';
  }
}

function seoIssues(page: IndexedPage): string[] {
  const issues: string[] = [];
  if (!page.metaTitle) issues.push('Missing meta title');
  if (!page.metaDescription) issues.push('Missing meta description');
  if ((page.wordCount ?? 0) < 300 && (page.wordCount ?? 0) > 0)
    issues.push('Thin content');
  return issues;
}

// mapping stage name to human-readable label and icons
const STAGE_LABELS: Record<string, { label: string; icon: string }> = {
  crawling: { label: 'Crawling pages', icon: '🕷️' },
  chunking: { label: 'Analyzing content', icon: '🔍' },
  embedding: { label: 'Generating embeddings', icon: '🧠' },
  saving: { label: 'Saving to database', icon: '💾' },
  indexed: { label: 'Site indexed', icon: '✅' },
  generating_edits: { label: 'Generating AI edits', icon: '📝' },
  edits_complete: { label: 'Edits ready', icon: '🎯' },
  error: { label: 'Error', icon: '❌' },
};

const PHASE_1_STAGES = [
  'crawling',
  'chunking',
  'embedding',
  'saving',
  'indexed',
];

// ——— Index Progress Modal ────────────────────────────────────
type IndexProgressModalProps = {
  indexProgress: IndexProgressState;
  showSlowMessage: boolean;
  siteName: string | undefined;
};

function IndexProgressModal({
  indexProgress,
  showSlowMessage,
  siteName,
}: IndexProgressModalProps) {
  if (!indexProgress) return null;

  const currentStageIndex = PHASE_1_STAGES.indexOf(indexProgress.stage);
  // Progress percentage based on phase 1 only — modal dismisses after 'indexed'
  const progressPct =
    indexProgress.stage === 'indexed'
      ? 100
      : currentStageIndex >= 0
        ? Math.round((currentStageIndex / (PHASE_1_STAGES.length - 1)) * 100)
        : 5; // default for stages not in the pipeline list

  const isError = indexProgress.stage === 'error';
  const isComplete = indexProgress.stage === 'indexed';
  const stageInfo = STAGE_LABELS[indexProgress.stage] ?? {
    label: indexProgress.stage,
    icon: '⏳',
  };

  return (
    // Backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <Card className="w-full max-w-md shadow-2xl mx-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">
              Indexing {siteName}
            </CardTitle>
            <Badge
              variant="outline"
              className={
                isComplete
                  ? 'border-success/20 bg-success/10 text-success'
                  : isError
                    ? 'border-destructive/20 bg-destructive/10 text-destructive'
                    : 'border-warning/30 bg-warning/10 text-warning'
              }
            >
              {isComplete ? 'Complete' : isError ? 'Error' : 'Running'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Overall progress bar */}
          <Progress
            value={progressPct}
            className={`h-2 ${
              isComplete
                ? '[&>div]:bg-success'
                : isError
                  ? '[&>div]:bg-destructive'
                  : '[&>div]:bg-primary'
            }`}
          />

          {/* Current stage message */}
          <div className="flex items-start gap-3">
            <span className="text-xl leading-none mt-0.5">
              {stageInfo.icon}
            </span>
            <div className="space-y-0.5 min-w-0">
              <p className="text-sm font-medium text-foreground">
                {indexProgress.message}
              </p>
              {indexProgress.detail && (
                <p className="text-xs text-muted-foreground truncate">
                  {indexProgress.detail}
                </p>
              )}
              {indexProgress.totalPages && indexProgress.pageIndex && (
                <p className="text-xs text-muted-foreground">
                  Page {indexProgress.pageIndex} of {indexProgress.totalPages}
                </p>
              )}
            </div>
          </div>

          {/* Stage pipeline — only phase 1 stages */}
          <div className="space-y-1">
            {PHASE_1_STAGES.map((stage, i) => {
              const info = STAGE_LABELS[stage];
              const isDone = i < currentStageIndex || isComplete;
              const isCurrent = stage === indexProgress.stage;

              return (
                <div
                  key={stage}
                  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition-colors ${
                    isCurrent
                      ? 'bg-primary/8 text-primary font-medium'
                      : isDone
                        ? 'text-success'
                        : 'text-muted-foreground'
                  }`}
                >
                  <span className="text-sm w-4 text-center">
                    {isDone ? '✓' : isCurrent ? info.icon : '○'}
                  </span>
                  {info.label}
                  {/* Animated dots on the active stage */}
                  {isCurrent && !isComplete && !isError && (
                    <span className="ml-auto inline-flex gap-0.5">
                      {[0, 1, 2].map((j) => (
                        <span
                          key={j}
                          className="h-1 w-1 rounded-full bg-primary animate-bounce"
                          style={{ animationDelay: `${j * 0.15}s` }}
                        />
                      ))}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Slow message — shown after 2s if still running */}
          {showSlowMessage && !isComplete && !isError && (
            <p className="text-[11px] text-muted-foreground text-center">
              This may take a moment — crawling and embedding pages...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}



// ── Main Client component ────────────────────────────────────────
export function SiteDetailContent({ params }: { params: Promise<{ slug: string }> }) {
  const apolloClient = useApolloClient();
  const { isSignedIn, isLoaded } = useUser();

  const { slug } = use(params);

  const [indexing, setIndexing] = useState(false);
  const [indexResult, setIndexResult] = useState<string | null>(null);
  const [showSlowMessage, setShowSlowMessage] = useState(false);
  const [indexProgress, setIndexProgress] = useState<IndexProgressState>(null);
  const [editGenStatus, setEditGenStatus] = useState<
    'idle' | 'generating' | 'complete' | 'error'
  >('idle');

  // Disable protected buttons until auth state is confirmed
  const authReady = isLoaded && isSignedIn;
  const disableGuard = !authReady;

  const modalDismissedRef = useRef(false);

  const { loading, data, refetch } = useQuery<SiteData, SiteVars>( // error,
    GET_SITE_BY_SLUG,
    { variables: { slug } }
  );

  const site = data?.siteBySlug;
  const pages = site?.indexedPages ?? [];
  const totalPages = pages.length;
  const indexedCount = pages.filter((p) => p.indexStatus === 'COMPLETE').length;
  const pagesWithIssues = pages.filter((p) => seoIssues(p).length > 0).length;
  const totalWords = pages.reduce((sum, p) => sum + (p.wordCount ?? 0), 0);

  const StatCardLabels = [
    {
      label: 'Total Pages',
      value: totalPages,
      sub: null,
    },
    {
      label: 'Indexed',
      value: `${indexedCount} / ${totalPages}`,
      sub:
        indexedCount === totalPages
          ? 'All Indexed'
          : `${totalPages - indexedCount} remaining`,
      subColor: indexedCount === totalPages ? 'text-success' : 'text-warning',
    },
    {
      label: 'SEO Issues',
      value: pagesWithIssues,
      sub: pagesWithIssues === 0 ? 'All Clean :)' : 'pages need attention',
      valueColor: pagesWithIssues > 0 ? 'text-error' : 'text-success',
    },
    {
      label: 'Total Words',
      value: totalWords.toLocaleString(),
      sub: 'across all pages',
    },
  ];

  // ── Separator ────────────────────────────────────────────────
  useEffect(() => {
    if (!indexing) {
      setShowSlowMessage(false);
      return;
    }
    const timer = setTimeout(() => setShowSlowMessage(true), 2000);
    return () => clearTimeout(timer);
  }, [indexing]);

  async function handleIndexSite() {
    modalDismissedRef.current = false;

    if (!site) return;
    setIndexing(true);
    setIndexResult(null);
    setEditGenStatus('idle');
    setIndexProgress({ stage: 'crawling', message: 'Starting indexer...' });
    try {
      const res = await fetch('/api/index-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId: site.id, startUrl: site.url }),
      });

      // route now returns a stream check before read
      if (!res.body) {
        throw new Error(
          'No response stream — server may have returned an error'
        );
      }

      // non-stream error responses before stream open
      if (
        !res.ok &&
        res.headers.get('content-type')?.includes('application/json')
      ) {
        const errJson = await res.json();
        throw new Error(errJson.error ?? 'Unknown server error');
      }

      // Read SSE stream line by line
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        // keep last partial line in buffer
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6)) as {
              stage: ProgressStage;
              message: string;
              detail?: string;
              pageUrl?: string;
              pageIndex?: number;
              totalPages?: number;
            };

            // update modal
            if (!modalDismissedRef.current) {
              setIndexProgress(event);
            }

            // Phase 1 done
            if (event.stage === 'indexed') {
              setIndexing(false);
              setIndexResult(event.detail ?? 'Site indexed successfully');
              setEditGenStatus('generating');
              modalDismissedRef.current = true;

              setTimeout(() => setIndexProgress(null), 1500);
              refetch();
            }

            // ── Phase 2 complete ──────────────────────────
            // 'edits_complete' fires after all proposed edits are generated.
            // Evict Apollo cache so ProposedEditsPanel re-queries automatically.
            if (event.stage === 'edits_complete') {
              setEditGenStatus('complete');
              apolloClient.cache.evict({
                id: 'ROOT_QUERY',
                fieldName: 'proposedEdits',
              });
              apolloClient.cache.gc();
            }

            if (event.stage === 'error') {
              setIndexing(false);
              setIndexResult(`Error: ${event.detail ?? event.message}`);
              setEditGenStatus('error');
              setTimeout(() => setIndexProgress(null), 3000);
            }
          } catch {
            // Malformed SSE line — skip silently
          }
        }
      }
    } catch (err) {
      setIndexResult(
        `Network error: ${err instanceof Error ? err.message : String(err)}`
      );
      setIndexing(false);
      setTimeout(() => setIndexProgress(null), 3000);
    }
  }

  return (
    <div className="app-shell">
      <IndexProgressModal
        indexProgress={indexProgress}
        showSlowMessage={showSlowMessage}
        siteName={site?.name}
      />
      <div className="page-wrap flex flex-col gap-8">
        {/* Header Row */}
        <div className="flex md:flex-col gap-4 flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-semibold tracking-tight md:text-2xl">
              {site?.name ?? 'Site not found'}
            </h1>
            <Link
              href={site?.url ?? ''}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex flex-row"
            >
              {site?.url ?? 'No URL'}{' '}
              <ArrowSquareOutIcon className="w-4 h-4 mx-1 mt-0.5 text-primary/80 hover:text-primary" />
            </Link>
          </div>

          <Button
            onClick={handleIndexSite}
            disabled={indexing || loading || !site || disableGuard}
            aria-busy={indexing}
          >
            {indexing ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground/50 border-t-primary-foreground" />
                Indexing ...
              </span>
            ) : (
              'Index site'
            )}
          </Button>
        </div>

        {/* Indexing Result Alert */}
        {indexResult && (
          <Alert
            variant={
              indexResult.startsWith('Error') ||
              indexResult.startsWith('Network')
                ? 'destructive'
                : 'default'
            }
            className={
              !indexResult.startsWith('Error') &&
              !indexResult.startsWith('Network')
                ? 'border-success/30 text-success'
                : ''
            }
          >
            <AlertDescription>
              {indexResult} this is the index result
            </AlertDescription>
          </Alert>
        )}

        {/* Stats */}
        <section className="grid gap-3 md:grid-cols-4 grid-cols-2">
          {StatCardLabels.map(({ label, value, sub, valueColor, subColor }) => (
            <Card key={label} className="p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              <p
                className={`mt-2 text-3xl font-bold tabular-nums ${valueColor ?? 'text-foreground'}`}
              >
                {value}
              </p>

              {sub && (
                <p
                  className={`mt-1 text-xs ${subColor ?? 'text-muted-foreground'}`}
                >
                  {sub}
                </p>
              )}
            </Card>
          ))}
        </section>

        {/* —— Main Content Area ────────────────────────────────────── */}
        {/* Pages + per-page AISO */}
        <section>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-sm font-semibold tracking-tight">
                Indexed Pages
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Crawl status, SEO signals, and AISO scoring per URL.
              </p>
            </div>
            <Badge variant="outline" className="tabular-nums">
              {pages.length} pages
            </Badge>
          </div>
          <Separator className="mb-4" />

          <div className="space-y-3">
            {pages.map((page) => {
              const issues = seoIssues(page);
              return (
                // FIXME: Make this into an external component to be imported.
                <Card key={page.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="truncate text-sm">
                          {(getPageName(page.url) &&
                            `${getPageName(page.url)} Page`) ||
                            '(no title)'}
                        </CardTitle>
                        <Link
                          href={page.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group mt-0.5 truncate text-xs text-primary/70 hover:text-primary transition-colors inline-flex items-center gap-1 font-medium"
                        >
                          <span className="flex items-center">
                            <span className="transition-transform duration-200 group-hover:translate-x-[2px] tracking-tight">
                              Visit /{getPageName(page.url)}
                            </span>

                            <ArrowRightIcon className="text-primary ml-1 w-3 h-3 opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0.5" />
                          </span>
                        </Link>
                      </div>
                      {/* Status Badge */}
                      <Badge
                        variant="outline"
                        className={`shrink-0 gap-1.5 ${
                          page.indexStatus === 'COMPLETE'
                            ? 'border-success/30 text-success'
                            : page.indexStatus === 'ERROR'
                              ? 'border-destructive/30 text-destructive'
                              : page.indexStatus === 'INDEXING'
                                ? 'border-warning/30 text-warning'
                                : 'text-muted-foreground'
                        }`}
                      >
                        <span
                          className={`h-1.5 rounded-full ${statusColor(page.indexStatus)}`}
                        />
                        {statusLabel(page.indexStatus)}
                      </Badge>
                    </div>
                    {/* Word Count + SEO Issue Chips */}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge
                        variant="secondary"
                        className="tabular-nums text-[11px]"
                      >
                        {page.wordCount?.toLocaleString() ?? '—'} words
                      </Badge>
                      {issues.length === 0 ? (
                        <Badge className="bg-success/10 text-success border-success/20 text-[11px]">
                          SEO Clean :)
                        </Badge>
                      ) : (
                        issues.map((issue) => (
                          <Badge
                            key={issue}
                            variant="outline"
                            className="border-warning/30 text-warning text-[11px]"
                          >
                            {issue}
                          </Badge>
                        ))
                      )}
                    </div>
                  </CardHeader>

                  <Separator />

                  <CardContent className="pt-3 pb-3">
                    <p className="mb-2 text-[10px] font-semibold tracking-wide text-muted-foreground">
                      AISO Score
                    </p>
                    <AisoScoreBoard pageId={page.id} />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
        {/* ——— End Main Content Area ────────────────────────────────────── */}

        {/* —— Site assistant ────────────────────────────────────── */}
        {site?.id && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Assistant</CardTitle>
              <CardDescription>
                Ask questions about this site using its indexed content.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChatInterface siteId={site.id} />
            </CardContent>
          </Card>
        )}
        {site?.id && (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">
                    Pending edits
                  </CardTitle>
                  <CardDescription>
                    AI-proposed changes awaiting your review.
                  </CardDescription>
                </div>
                {/* Background edit generation status badge */}
                {editGenStatus === 'generating' && (
                  <Badge
                    variant="outline"
                    className="border-warning/30 bg-warning/10 text-warning gap-1.5 shrink-0 mt-0.5"
                  >
                    <span className="inline-flex gap-0.5">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="h-1 w-1 rounded-full bg-warning animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </span>
                    Generating edits...
                  </Badge>
                )}
                {editGenStatus === 'complete' && (
                  <Badge
                    variant="outline"
                    className="border-success/20 bg-success/10 text-success shrink-0 mt-0.5"
                  >
                    ✓ Edits ready
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ProposedEditsPanel siteId={site.id} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}