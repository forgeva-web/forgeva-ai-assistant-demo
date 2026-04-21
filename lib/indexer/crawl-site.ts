// @/lib/indexer/crawl-site.ts
import { ChunkType } from '@/app/generated/prisma';
import { chunkContent } from '@/lib/indexer/chunker';
import { extractPage } from '@/lib/indexer/crawler';
import { generateEmbedding } from '@/lib/indexer/embed';
import { storeEmbedding } from '@/lib/indexer/store-embedding';
import { prisma } from '@/lib/prisma/client';
import { createHash } from 'crypto';

const BATCH_SIZE = 10;

type PageResult = {
  url: string;
  chunksWritten: number;
  status: 'indexed' | 'unchanged' | string;
};

export type CrawlResult = {
  success: boolean;
  pagesIndexed: number;
  pagesUnchanged: number;
  pagesFailed: number;
  results: PageResult[];
};

export async function crawlSite(
  siteId: string,
  startUrl: string
): Promise<CrawlResult> {
  const visited = new Set<string>();
  const queue: string[] = [startUrl];
  const results: PageResult[] = [];
  const baseOrigin = new URL(startUrl).origin;

  while (queue.length > 0) {
    const url = queue.shift()!;

    if (visited.has(url)) continue;
    visited.add(url);

    try {
      const extracted = await extractPage(url);

      // Enqueue same-domain links not yet visited
      for (const link of extracted.internalLinks) {
        try {
          const linkOrigin = new URL(link).origin;
          if (linkOrigin === baseOrigin && !visited.has(link)) {
            queue.push(link);
          }
        } catch {
          // skip malformed URLs
        }
      }

      const contentHash = createHash('sha256')
        .update(extracted.fullText)
        .digest('hex');

      // Skip if content unchanged and embeddings are present
      const existing = await prisma.indexedPage.findUnique({
        where: { siteId_url: { siteId, url } },
      });

      if (existing?.contentHash === contentHash) {
        const missingEmbeddings = await prisma.$queryRaw<[{ count: bigint }]>`
                    SELECT COUNT(*) as count FROM "ContentChunk"
                    WHERE "indexedPageId" = ${existing.id}
                    AND embedding IS NULL
                `;
        if (missingEmbeddings[0].count === 0n) {
          results.push({ url, chunksWritten: 0, status: 'unchanged' });
          continue;
        }
      }

      const wordCount = extracted.fullText.split(/\s+/).filter(Boolean).length;

      const indexedPage = await prisma.indexedPage.upsert({
        where: { siteId_url: { siteId, url } },
        create: {
          siteId,
          url,
          title: extracted.title,
          metaTitle: extracted.metaTitle,
          metaDescription: extracted.metaDescription,
          contentHash,
          wordCount,
          h1Count: extracted.h1s.length,
          missingAltCount: extracted.missingAltCount,
          indexStatus: 'INDEXING',
        },
        update: {
          title: extracted.title,
          metaTitle: extracted.metaTitle,
          metaDescription: extracted.metaDescription,
          contentHash,
          wordCount,
          h1Count: extracted.h1s.length,
          missingAltCount: extracted.missingAltCount,
          indexStatus: 'INDEXING',
        },
      });

      await prisma.contentChunk.deleteMany({
        where: { indexedPageId: indexedPage.id },
      });

      const allChunks = [
        ...chunkContent(
          [...extracted.h1s, ...extracted.h2s, ...extracted.h3s].join('\n\n'),
          ChunkType.HEADING
        ),
        ...chunkContent(extracted.paragraphs.join('\n\n'), ChunkType.PARAGRAPH),
        ...chunkContent(
          [extracted.metaTitle, extracted.metaDescription]
            .filter((s): s is string => Boolean(s))
            .join('\n\n'),
          ChunkType.META
        ),
        ...chunkContent(extracted.imageAlts.join('\n\n'), ChunkType.ALT_TEXT),
      ].map((chunk, i) => ({ ...chunk, chunkIndex: i }));

      if (allChunks.length === 0) {
        await prisma.indexedPage.update({
          where: { id: indexedPage.id },
          data: { indexStatus: 'ERROR' },
        });
        results.push({
          url,
          chunksWritten: 0,
          status: 'error: no content extracted',
        });
        continue;
      }

      await prisma.contentChunk.createMany({
        data: allChunks.map((chunk) => ({
          indexedPageId: indexedPage.id,
          chunkIndex: chunk.chunkIndex,
          content: chunk.text,
          contentType: chunk.contentType,
        })),
      });

      const savedChunks = await prisma.contentChunk.findMany({
        where: { indexedPageId: indexedPage.id },
        select: { id: true, content: true },
      });

      for (let i = 0; i < savedChunks.length; i += BATCH_SIZE) {
        const batch = savedChunks.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map((chunk) =>
            generateEmbedding(chunk.content).then((embedding) =>
              storeEmbedding(chunk.id, embedding)
            )
          )
        );
      }

      await prisma.indexedPage.update({
        where: { id: indexedPage.id },
        data: { indexStatus: 'COMPLETE', lastIndexedAt: new Date() },
      });

      results.push({ url, chunksWritten: allChunks.length, status: 'indexed' });
    } catch (pageError) {
      const message =
        pageError instanceof Error ? pageError.message : 'Unknown error';
      console.error(`Failed to index ${url}:`, message);
      results.push({ url, chunksWritten: 0, status: `error: ${message}` });
    }
  }

  return {
    success: true,
    pagesIndexed: results.filter((r) => r.status === 'indexed').length,
    pagesUnchanged: results.filter((r) => r.status === 'unchanged').length,
    pagesFailed: results.filter((r) => r.status.startsWith('error')).length,
    results,
  };
}
