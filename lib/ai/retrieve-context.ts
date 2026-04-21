// @/lib/ai/retrieve-context.ts
import { ChunkType } from '@/app/generated/prisma';
import { generateEmbedding } from '@/lib/indexer/embed';
import { prisma } from '@/lib/prisma/client';

// TODO:
/*
    IMPL: retrieveContext(query: string, siteId: string, topK?: number)
    in lib/ai/retrieve-context.ts using the raw SQL pattern
    from the setup guide's reference section
*/

export type ChunkResult = {
  id: string;
  content: string;
  url: string; // source page URL
  similarity: number; // 0-1 higher is more relevant
  text: string;
  contentType: ChunkType;
  chunkIndex: number;
};

export async function retrieveContext(
  query: string,
  siteId: string,
  topK = 6
): Promise<ChunkResult[]> {
  const queryEmbedding = await generateEmbedding(query);

  const vectorLiteral = `[${queryEmbedding.join(',')}]`;

  const results = await prisma.$queryRaw<ChunkResult[]>`
        SELECT
            c.id,
            c.content,
            p.url,
            1 - (c.embedding <=> ${vectorLiteral}::vector) AS similarity
        FROM "ContentChunk" c
        JOIN "IndexedPage" p ON c."indexedPageId" = p.id
        JOIN "Site" s ON p."siteId" = s.id
        WHERE s.id = ${siteId}
            AND c.embedding IS NOT NULL
        ORDER BY c.embedding <=> ${vectorLiteral}::vector
        LIMIT ${topK}
    `;
  return results;
}

/*
    Write a buildSystemPrompt(chunks: ChunkResult[], siteUrl: string)
    function that formats the
    retrieved chunks into a clear system prompt,
    labeling each chunk with its source URL and
    content type
*/
