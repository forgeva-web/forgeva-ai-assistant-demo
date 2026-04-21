// @app/api/index-site/route.ts
// <------
// HTTP entry point. Receives the POST request,
// orchestrates the crawl, returns a response.
// Thin — it delegates to the lib files below.
// respoonsible for the full crawl flow calling helpers, adding data to tables via Prisma, looping through internalLinks
// ** Content hash check before extractPage to see if already exists.
// <------
import { NextRequest } from 'next/server';

import { ChunkType } from '@/app/generated/prisma';
import { chunkContent } from '@/lib/indexer/chunker';
import type { ChunkResult } from '@/lib/indexer/chunker';
import { extractPage } from '@/lib/indexer/crawler';
import { generateEmbedding } from '@/lib/indexer/embed';
import { generateProposedEdits } from '@/lib/indexer/proposed-edits';
import { storeEmbedding } from '@/lib/indexer/store-embedding';
import { prisma } from '@/lib/prisma/client';
import { auth } from '@clerk/nextjs/server';
import { createHash } from 'crypto';

const BATCH_SIZE = 10;

// —— Progress event shape ———————————————————————————————————————————————————
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

type ProgressEvent = {
  stage: ProgressStage;
  message: string;
  pageUrl?: string;
  pageIndex?: number;
  totalPages?: number;
  detail?: string;
};

// —— Single page indexer ———————————————————————————————————————————————————
async function indexSinglePage(
  siteId: string,
  pageUrl: string,
  send: (event: ProgressEvent) => void
): Promise<{
  success: boolean;
  chunksWritten: number;
  pageId?: string;
  error?: string;
}> {
  try {
    send({
      stage: 'crawling',
      message: 'Crawling page',
      pageUrl,
      detail: pageUrl,
    });
    const extracted = await extractPage(pageUrl);

    const contentHash = createHash('sha256')
      .update(extracted.fullText)
      .digest('hex');

    const wordCount = extracted.fullText.split(/\s+/).filter(Boolean).length;

    send({
      stage: 'saving',
      message: 'Saving page data',
      pageUrl,
      detail: pageUrl,
    });
    const indexedPage = await prisma.indexedPage.upsert({
      where: { siteId_url: { siteId, url: pageUrl } },
      create: {
        siteId,
        url: pageUrl,
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

    send({
      stage: 'chunking',
      message: 'Analyzing content structure',
      pageUrl,
      detail: pageUrl,
    });
    const headingChunks: ChunkResult[] = chunkContent(
      [...extracted.h1s, ...extracted.h2s, ...extracted.h3s].join('\n\n'),
      ChunkType.HEADING
    );
    const paragraphChunks: ChunkResult[] = chunkContent(
      extracted.paragraphs.join('\n\n'),
      ChunkType.PARAGRAPH
    );
    const metaChunks: ChunkResult[] = chunkContent(
      [extracted.metaTitle, extracted.metaDescription]
        .filter((s): s is string => Boolean(s))
        .join('\n\n'),
      ChunkType.META
    );
    const altTextChunks: ChunkResult[] = chunkContent(
      extracted.imageAlts.join('\n\n'),
      ChunkType.ALT_TEXT
    );

    const allChunks = [
      ...headingChunks,
      ...paragraphChunks,
      ...metaChunks,
      ...altTextChunks,
    ].map((chunk, i) => ({ ...chunk, chunkIndex: i }));

    if (allChunks.length === 0) {
      await prisma.indexedPage.update({
        where: { id: indexedPage.id },
        data: { indexStatus: 'ERROR' },
      });
      return {
        success: false,
        chunksWritten: 0,
        error: 'No content extracted',
      };
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

    send({
      stage: 'embedding',
      message: 'Generating embeddings',
      pageUrl,
      detail: pageUrl,
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
      send({
        stage: 'embedding',
        message: 'Generating embeddings',
        pageUrl,
        detail: `${Math.min(i + BATCH_SIZE, savedChunks.length)} / ${savedChunks.length} chunks`,
      });
    }

    await prisma.indexedPage.update({
      where: { id: indexedPage.id },
      data: { indexStatus: 'COMPLETE', lastIndexedAt: new Date() },
    });

    console.log(
      `[crawler] ✔️ Indexed: ${pageUrl} (${allChunks.length} chunks)`
    );
    return {
      success: true,
      chunksWritten: allChunks.length,
      pageId: indexedPage.id,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[crawler] ✗ Failed: ${pageUrl} — ${message}`);

    // Mark as ERROR so it shows up in the dashboard — don't leave it as INDEXING
    await prisma.indexedPage.upsert({
      where: { siteId_url: { siteId, url: pageUrl } },
      create: {
        siteId,
        url: pageUrl,
        indexStatus: 'ERROR',
        contentHash: '',
        wordCount: 0,
        h1Count: 0,
        missingAltCount: 0,
      },
      update: { indexStatus: 'ERROR' },
    });

    return { success: false, chunksWritten: 0, error: message };
  }
}

// —— POST route ———————————————————————————————————————————————————————————
/*
  SSE headers on streaming response and returns a raw Response with a
  ReadableStream instead of NextResponse.json
*/
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // parse body before stream so can handle errors before streaming starts
  let siteId: string;
  let startUrl: string;

  // Manual 'Index site' button omits field so defaults to true.
  let generateEdits: boolean;

  try {
    const body = await request.json();
    siteId = body.siteId;
    startUrl = body.startUrl;
    generateEdits = body.generateEdits !== false;
    console.log('siteId', siteId);
    // const startUrl = 'http://localhost:3001';
    console.log('startUrl', startUrl);
    console.log('generateEdits', generateEdits);
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!siteId || !startUrl) {
    return new Response(
      JSON.stringify({ error: 'siteId and startUrl are required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Validate startUrl and derrive origin for same-origin filtering
  let startOrigin: string;
  try {
    startOrigin = new URL(startUrl).origin;
  } catch {
    return new Response(
      JSON.stringify({ error: `Invalid startUrl: ${startUrl}` }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  /* Helper functions
  - Resolve all internal links from start page to absolute URLs
  - extractPage may return relative paths (/services) or absolute URLs
  */
  function resolveUrl(href: string): string | null {
    try {
      return new URL(href, startUrl).href;
    } catch {
      return null;
    }
  }

  function isSameOrigin(url: string): boolean {
    try {
      return new URL(url).origin === startOrigin;
    } catch {
      return false;
    }
  }

  // ——— ReadableStream for progress events ———————————————————————————————————
  const stream = new ReadableStream({
    async start(controller) {
      function send(event: ProgressEvent) {
        const data = `data: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(new TextEncoder().encode(data));
      }

      try {
        // —— Discovery phase ———————————————————————————————————————————————————
        send({
          stage: 'crawling',
          message: 'Discovering pages',
          detail: startUrl,
        });

        const firstExtracted = await extractPage(startUrl);

        const firstHash = createHash('sha256')
          .update(firstExtracted.fullText)
          .digest('hex');

        const existingStart = await prisma.indexedPage.findUnique({
          where: { siteId_url: { siteId, url: startUrl } },
        });

        // flag set true if content and embeddings are unchanged
        let skipStartPage = false;
        if (existingStart?.contentHash === firstHash) {
          const missingEmbeddings = await prisma.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(*) as count FROM "ContentChunk"
          WHERE "indexedPageId" = ${existingStart.id}
          AND embedding IS null
        `;
          if (missingEmbeddings[0].count === 0n) {
            console.log(`[crawler] Start page unchanged, skipping ${startUrl}`);
            skipStartPage = true;
          }
        }

        // full list of URLs to index w/ BFS link discovery
        const allUrls = new Set<string>([startUrl]);
        const discoveryQueue: string[] = [...firstExtracted.internalLinks];

        for (const link of discoveryQueue) {
          const resolved = resolveUrl(link);
          if (!resolved || !isSameOrigin(resolved) || allUrls.has(resolved))
            continue;

          allUrls.add(resolved);

          // discover links from this page
          try {
            const linked = await extractPage(resolved);
            for (const l of linked.internalLinks) {
              const r = resolveUrl(l);
              if (r && isSameOrigin(r) && !allUrls.has(r))
                discoveryQueue.push(r);
            }
          } catch {
            /* skip — don't abort discovery for one bad page */
          }
        }

        const urlList = [...allUrls];
        send({
          stage: 'crawling',
          message: `Found ${urlList.length} page${urlList.length === 1 ? '' : 's'}`,
          detail: urlList.join(', '),
          totalPages: urlList.length,
        });

        // —— Phase 1: Index each discovered page ————————————————————————
        const indexedPageIds: string[] = [];
        const newlyIndexedPageIds: string[] = []; // pages crawled THIS run

        for (let i = 0; i < urlList.length; i++) {
          const pageUrl = urlList[i];

          send({
            stage: 'crawling',
            message: `Indexing page ${i + 1} of ${urlList.length}`,
            pageUrl,
            pageIndex: i + 1,
            totalPages: urlList.length,
          });

          // don't re-index unchanged pages
          if (pageUrl === startUrl && skipStartPage) {
            if (existingStart?.id) indexedPageIds.push(existingStart.id);
            continue;
          }

          const result = await indexSinglePage(siteId, pageUrl, send);

          if (result.pageId) {
            indexedPageIds.push(result.pageId);
            newlyIndexedPageIds.push(result.pageId); // only fresh indexed pages
          }
        }
        // —— Phase 1 complete notify FE ———————————————————————
        send({
          stage: 'indexed',
          message: 'Site indexed successfully',
          detail: `${urlList.length} page${urlList.length === 1 ? '' : 's'} indexed`,
          totalPages: urlList.length,
        });

        // Pause so FE can process the 'indexed' event and refetch page data before the slower proposed edit generation begins
        await new Promise((r) => setTimeout(r, 150));

        if (!generateEdits) {
          // fire edits_complete immediately to notify FE for Apollo cache eviction
          // case where applyEdit re-indexing completes.
          send({
            stage: 'edits_complete',
            message: 'Re-index complete',
            detail: 'Edit generation skipped — triggered by accepted edit',
          });
        } else {
          // filter to generate edits for those that have zero existing pending edits. Prevent duplicates
          const pagesNeedingEdits: string[] = [];
          for (const pageId of newlyIndexedPageIds) {
            const existingEdits = await prisma.proposedEdit.count({
              where: { indexedPageId: pageId, status: 'PENDING' },
            });
            if (existingEdits === 0) {
              pagesNeedingEdits.push(pageId);
            }
          }

          if (pagesNeedingEdits.length === 0) {
            // all new indexed pages already have edits skip generation
            send({
              stage: 'edits_complete',
              message: 'Proposed edits already exist',
              detail:
                'No new edits generated — existing edits are pending review',
            });
          } else {
            send({
              stage: 'generating_edits',
              message: 'Generating AI proposed edits...',
              detail: `0 / ${pagesNeedingEdits.length} pages`,
            });

            let editsGenerated = 0;
            for (let i = 0; i < pagesNeedingEdits.length; i++) {
              const pageId = pagesNeedingEdits[i];
              try {
                const edits = await generateProposedEdits(pageId, 2);
                editsGenerated += edits.length;
                send({
                  stage: 'generating_edits',
                  message: 'Generating AI proposed edits...',
                  detail: `${i + 1} / ${pagesNeedingEdits.length} pages — ${editsGenerated} edits so far`,
                });
              } catch (err) {
                console.error(
                  `[index-site] Edit generation failed for page ${pageId}:`,
                  err
                );
              }
            }

            send({
              stage: 'edits_complete',
              message: 'Proposed edits ready',
              detail: `${editsGenerated} edit${editsGenerated === 1 ? '' : 's'} generated`,
            });
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[index-site] Stream error: `, message);
        if (err instanceof Error) {
          console.error('cause:', (err as NodeJS.ErrnoException).cause);
        }
        send({ stage: 'error', message: 'Indexing failed', detail: message });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
