// @/components/seo/AisoScoreBoard.tsx — AISO score card (GraphQL + layout)
'use client';

import { useState } from 'react';

import { formatTimeAgo } from '@/lib/utils';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

import {
  AisoScoreWidget,
  type DimensionScores,
} from '@/components/seo/AisoDimensionScore';
import { StructuredDataCard } from '@/components/seo/StructuredData';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

const AISO_SCORE_QUERY = gql`
  query AisoScore($pageId: ID!) {
    aisoScore(pageId: $pageId) {
      id
      pageId
      totalScore
      scores
      actionItems
      createdAt
      updatedAt
    }
  }
`;

type AisoScoreQueryData = {
  aisoScore: {
    id: string;
    pageId: string;
    totalScore: number;
    scores: DimensionScores;
    actionItems: string[] | unknown;
    createdAt: string;
    updatedAt: string;
  } | null;
};

type AisoScoreQueryVars = { pageId: string };

/** Coerce JSON from GraphQL into DimensionScores when possible */
function asDimensionScores(raw: unknown): DimensionScores | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const keys: (keyof DimensionScores)[] = [
    'conversationalClarity',
    'conversationalClarityExplanation',
    'factualDepth',
    'factualDepthExplanation',
    'structuredScannability',
    'structuredScannabilityExplanation',
    'entityCoverage',
    'entityCoverageExplanation',
    'structuredDataPresence',
    'structuredDataPresenceExplanation',
  ];
  const out = {} as DimensionScores;
  for (const k of keys) {
    const v = o[k as string];
    if (k.includes('Explanation')) {
      (out as Record<string, unknown>)[k] = typeof v === 'string' ? v : '';
    } else {
      const n = typeof v === 'number' ? v : Number(v);
      (out as Record<string, unknown>)[k] = Number.isFinite(n) ? n : 0;
    }
  }
  return out;
}

function asActionItems(raw: unknown): string[] {
  if (Array.isArray(raw) && raw.every((x) => typeof x === 'string')) return raw;
  return [];
}

function scoreBadgeVariant(score: number): string {
  if (score >= 70) return 'bg-success/10 text-success border-success/20';
  if (score >= 45) return 'bg-warning/10 text-warning border-warning/20';
  return 'bg-error/10 text-error border-error/20';
}

function scoreProgressColor(score: number): string {
  if (score >= 70) return '[&>div]:bg-success';
  if (score >= 45) return '[&>div]:bg-warning';
  return '[&>div]:bg-error';
}

export function AisoScoreBoard({ pageId }: { pageId: string }) {
  const [open, setOpen] = useState(false);

  const { data, loading, error } = useQuery<
    AisoScoreQueryData,
    AisoScoreQueryVars
  >(AISO_SCORE_QUERY, {
    variables: { pageId },
    skip: !pageId,
  });

  const score = data?.aisoScore;
  const dimensions = score?.scores ? asDimensionScores(score.scores) : null;
  const actions = score ? asActionItems(score.actionItems) : [];

  // —— Loading state ──────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <Progress value={undefined} className="h-1.5 flex-1" />
        <Skeleton className="h-3 w-12 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  // —— Error state ──────────────────────────────────────
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription className="text-xs text-destructive-foreground">
          {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  // —— No score yet ──────────────────────────────────────
  if (!score) {
    return (
      <Alert variant="default">
        <AlertDescription className="text-xs italic text-muted-foreground">
          No score yet — generate one after indexing the site.
        </AlertDescription>
      </Alert>
    );
  }

  // —— Score exists ──────────────────────────────────────
  return (
    <>
      {/* Inline summary — one line per page card */}
      <div className="flex items-center gap-3">
        <Progress
          value={score.totalScore}
          className={`h-1.5 flex-1 ${scoreProgressColor(score.totalScore)}`}
        />
        <Badge
          variant="outline"
          className={`shrink-0 tabular-nums text-[11px] ${scoreBadgeVariant(score.totalScore)}`}
        >
          {score.totalScore} / 100
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 shrink-0 px-2 text-[11px]"
          onClick={() => setOpen(true)}
        >
          View Analysis
        </Button>
      </div>

      {/* —— Drawer —————————————————————————————————————————————————— */}
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="pb-2">
            <div className="flex items-center justify-between">
              <DrawerTitle>AISO Analysis</DrawerTitle>
              <Badge
                variant="outline"
                className={`text-sm ${scoreBadgeVariant(score.totalScore)}`}
              >
                {score.totalScore} / 100
              </Badge>
            </div>
            <DrawerDescription className="text-xs font-medium text-muted-foreground italic my-2">
              {score.createdAt &&
                score.updatedAt &&
                `Last scored ${formatTimeAgo(new Date(score.updatedAt))}`}
              {score.createdAt &&
                !score.updatedAt &&
                `First scored ${formatTimeAgo(new Date(score.createdAt))}`}
              {!score.createdAt && !score.updatedAt && 'Not scored yet'}
            </DrawerDescription>
            {/* Overall progress bar in drawer header */}
            <Progress
              value={score.totalScore}
              className={`mt-2 h-2 ${scoreProgressColor(score.totalScore)}`}
            />
          </DrawerHeader>
          {/* Scrollable Body */}
          <div className="overflow-y-auto px-4 pb-2">
            {/* Dimensions */}
            {dimensions && (
              <section>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Dimensions
                </p>
                <AisoScoreWidget scores={dimensions} />
              </section>
            )}

            <Separator className="my-4" />

            {/* Action Items */}
            {actions.length > 0 && (
              <section>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Action Items
                </p>
                <ol className="list-decimal space-y-2 pl-4">
                  {actions.map((item, i) => (
                    <li
                      key={i}
                      className="text-[13px] leading-relaxed text-muted-foreground"
                    >
                      {item}
                    </li>
                  ))}
                </ol>
              </section>
            )}

            <Separator className="my-4" />

            {/* Structured Data */}
            <section>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Structured Data
              </p>
              <StructuredDataCard
                pageId={pageId}
                dataPresenceScore={dimensions?.structuredDataPresence ?? 0}
              />
            </section>
          </div>

          <DrawerFooter className="pt-2">
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
