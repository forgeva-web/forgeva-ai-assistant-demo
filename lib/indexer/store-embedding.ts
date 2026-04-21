// lib/indexer/store-embedding.ts
import { prisma } from '@/lib/prisma/client';

export async function storeEmbedding(chunkId: string, embedding: number[]) {
  try {
    if (!embedding || embedding.length === 0) {
      throw new Error('Invalid embedding');
    }

    console.log('=== storeEmbedding called ===');
    console.log('chunkId:', chunkId);
    console.log('embedding length:', embedding.length);
    console.log('first 3 values:', embedding.slice(0, 3));

    const vectorLiteral = `[${embedding.join(',')}]`;

    const result = await prisma.$executeRaw`
       UPDATE "ContentChunk"
        SET embedding = ${vectorLiteral}::vector
        WHERE id = ${chunkId}
    `;

    console.log('Rows updated:', result);

    if (result === 0) {
      throw new Error(`No chunk found with id: ${chunkId}`);
    }
  } catch (err) {
    console.error('=== storeEmbedding FAILED ===');
    console.error(err);
    throw err;
  }
}
