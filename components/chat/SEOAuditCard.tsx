// @/components/chat/SEOAuditCard.tsx
// FIXME: Unsure if component used anymore may need to update or remove. Would be originally used in Site Detail page the top 4 tiles.
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  // CardDescription,
  CardContent,
  // CardFooter,
} from '@/components/ui/card';

export type SeoAuditResult = {
  url: string;
  title: string | null;
  wordCount: number | null;
  issues: string[];
  indexStatus: string;
};

export function SEOAuditCard({ result }: { result: SeoAuditResult }) {
  return (
    <Card className="text-sm">
      <CardHeader className="pb-2">
        {/* URL is the primary identifier — treat it as the card title */}
        <CardTitle className="truncate text-xs font-medium text-foreground">
          {result.url}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {result.wordCount?.toLocaleString() ?? '—'} words
        </p>
      </CardHeader>

      <CardContent>
        {result.issues.length === 0 ? (
          // Use semantic success token rather than hardcoded emerald
          <Badge
            variant="outline"
            className="border-success/20 bg-success/10 text-success text-[11px]"
          >
            No issues found
          </Badge>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {result.issues.map((issue) => (
              <Badge
                key={issue}
                variant="outline"
                className="border-warning/30 bg-warning/10 text-warning text-[11px]"
              >
                {issue}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
