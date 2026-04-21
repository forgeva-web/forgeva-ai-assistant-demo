// @/components/seo/AisoScoreWidget.tsx
'use client';

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

export type DimensionScores = {
  conversationalClarity: number;
  conversationalClarityExplanation: string;
  factualDepth: number;
  factualDepthExplanation: string;
  structuredScannability: number;
  structuredScannabilityExplanation: string;
  entityCoverage: number;
  entityCoverageExplanation: string;
  structuredDataPresence: number;
  structuredDataPresenceExplanation: string;
};

type DimensionDef = {
  scoreKey: keyof DimensionScores;
  explanationKey: keyof DimensionScores;
  label: string;
  shortLabel: string;
};

const DIMENSIONS: DimensionDef[] = [
  {
    scoreKey: 'conversationalClarity',
    explanationKey: 'conversationalClarityExplanation',
    label: 'Conversational clarity',
    shortLabel: 'Clarity',
  },
  {
    scoreKey: 'factualDepth',
    explanationKey: 'factualDepthExplanation',
    label: 'Factual depth',
    shortLabel: 'Facts',
  },
  {
    scoreKey: 'structuredScannability',
    explanationKey: 'structuredScannabilityExplanation',
    label: 'Structured scannability',
    shortLabel: 'Structure',
  },
  {
    scoreKey: 'entityCoverage',
    explanationKey: 'entityCoverageExplanation',
    label: 'Entity coverage',
    shortLabel: 'Entities',
  },
  {
    scoreKey: 'structuredDataPresence',
    explanationKey: 'structuredDataPresenceExplanation',
    label: 'Structured data',
    shortLabel: 'Schema',
  },
];

function scoreTone(score: number) {
  if (score >= 14)
    return {
      badge: 'bg-success/10 text-success border-success/20',
      progress: '[&>div]:bg-success',
    };
  if (score >= 7)
    return {
      badge: 'bg-warning/10 text-warning border-warning/20',
      progress: '[&>div]:bg-warning',
    };
  return {
    badge: 'bg-error/10 text-error border-error/20',
    progress: '[&>div]:bg-error',
  };
}

export function AisoScoreWidget({ scores }: { scores: DimensionScores }) {
  return (
    <div className="space-y-4" role="group" aria-label="AISO dimension scores">
      {DIMENSIONS.map(({ scoreKey, explanationKey, label }, i) => {
        const num = scores[scoreKey];
        const explanation = scores[explanationKey];
        const score = typeof num === 'number' ? num : Number(num);
        const percent = Math.round((score / 20) * 100);
        const { badge, progress } = scoreTone(score);

        return (
          <div key={scoreKey}>
            {/* Label Row */}
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-foreground">{label}</p>
              <Badge
                variant="outline"
                className={`shrink-0 tabular-nums text-[11px] ${badge}`}
              >
                {Number.isFinite(score) ? score : '—'} / 20
              </Badge>
            </div>

            {/* Progress Bar — shadcn Progress component */}
            <Progress value={percent} className={`h-1.5 ${progress}`} />

            {/* Explanation */}
            {explanation && (
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                {explanation}
              </p>
            )}

            {/* Separator between items except last */}
            {i < DIMENSIONS.length - 1 && <Separator className="mt-4" />}
          </div>
        );
      })}
    </div>
  );
}
