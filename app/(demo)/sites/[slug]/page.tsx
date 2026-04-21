// @app/(dashboard)/sites/[slug]


import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma/client';
import { Suspense } from 'react';
import { SiteDetailContent } from '@/components/demo/SiteDetailContent';


// ── Metadata ──────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const site = await prisma.site.findUnique({
    where: { slug },
    select: { name: true },
  });
  return {
    title: site?.name ?? 'Site Detail',
  };
}


// ── Server Component Export ─────────────────────────────────────────────────
export default function SiteDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="app-shell">
          <div className="page-wrap space-y-6">
            <div className="h-8 w-32 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-10 w-2/3 max-w-md animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900"
                />
              ))}
            </div>
            <div className="h-64 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
          </div>
        </div>
      }
    >
      <SiteDetailContent params={params} />
    </Suspense>
  );
}
