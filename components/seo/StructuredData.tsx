// @/components/seo/StructuredData.tsx
'use client';

import { useState } from 'react';

import { cn } from '@/lib/utils';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
// import { Item, ItemActions, ItemContent } from '@/components/ui/item';
import { ClipboardTextIcon } from '@phosphor-icons/react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const GENERATE_STRUCTURED_DATA_MUTATION = gql`
  mutation GenerateStructuredData($pageId: ID!) {
    generateStructuredData(pageId: $pageId) {
      jsonLd
      schemaType
      pageId
    }
  }
`;

type GenerateStructuredDataResult = {
  generateStructuredData: {
    jsonLd: string;
    schemaType: string;
    pageId: string;
  };
};

export function StructuredDataCard({
  pageId,
  dataPresenceScore,
}: {
  pageId: string;
  dataPresenceScore: number;
}) {
  const [copied, setCopied] = useState(false);

  const [generateJsonLd, { data, loading, error }] =
    useMutation<GenerateStructuredDataResult>(
      GENERATE_STRUCTURED_DATA_MUTATION
    );

  const handleGenerateStructuredData = () => {
    generateJsonLd({ variables: { pageId } });
  };

  const result = data?.generateStructuredData;
  const displayData = result?.jsonLd
    ? JSON.stringify(JSON.parse(result.jsonLd), null, 2)
    : null;

  const handleCopy = async () => {
    if (!displayData) return;
    await navigator.clipboard.writeText(displayData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // —— Score is fine —— no action needed ──────────────────────────────
  if (dataPresenceScore >= 10 && !displayData) {
    return (
      <p className="text-[11px] text-muted-foreground">
        Structured data presence score is {dataPresenceScore}/20 — no generation
        needed.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      {/* Generate prompt  — shown when score is low and no result yet */}
      {dataPresenceScore < 10 && !displayData && (
        <div className="space-y-2">
          <p className="text-[11px] text-muted-foreground">
            Score is low ({dataPresenceScore}/20). Generate ready-to-use JSON-LD
            markup to improve AI search visibility.
          </p>
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={handleGenerateStructuredData}
          >
            {loading ? 'Generating...' : 'Generate JSON-LD'}
          </Button>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription className="text-xs text-destructive-foreground">
            {error.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Generated Output */}
      {displayData && (
        <div className="space-y-2">
          {/* Header row — schema type badge + copy button */}
          <div className="flex items-center justify-between">
            {result?.schemaType && (
              <Badge variant="secondary" className="text-[11px]">
                {result.schemaType}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-7 gap-1.5 px-2 text-[11px] transition-colors',
                copied && 'text-success'
              )}
              onClick={handleCopy}
            >
              <ClipboardTextIcon className="size-3.5" />
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>

          {/* Code Block */}
          <pre
            className={cn(
              'max-h-64 overflow-auto rounded-lg border p-3 text-[11px] leading-relaxed font-mono transition-colors duration-200',
              copied
                ? 'border-success/30 bg-success/5'
                : 'border-border bg-muted/30'
            )}
          >
            {displayData}
          </pre>

          {/* Usage Instructions */}
          <p className="text-[10px] text-muted-foreground">
            Paste into a{' '}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">
              {`<script type="application/ld+json">`}
            </code>{' '}
            tag in your page{' '}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">
              {'<head>'}
            </code>
            .
          </p>
        </div>
      )}
    </div>
  );
}
