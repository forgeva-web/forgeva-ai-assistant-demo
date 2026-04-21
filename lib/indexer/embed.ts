// @lib/indexer/embed.ts
// Async function: given a string, call the
// embedding API and return a number[].
// No database writes here.
import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';

export async function generateEmbedding(text: string): Promise<number[]> {
  const result = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: text,
  });

  return result.embedding;
}
