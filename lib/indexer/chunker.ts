// @lib/indexer/chunker.ts
// Pure function: given a string of text,
// return an array of overlapping chunks.
// No network calls, no database writes here.
import { ChunkType } from '@/app/generated/prisma';

// TRY TO DO RECURSIVE CHARACTER TEXT SPLITTING
// Double newline(\n\n)  — paragraph break, strongest semantic boundary
// Single newline(\n)    — line break, weaker boundary
// Period + space(.)    — sentence end, weaker still
// Space()              — word boundary, last resort
/* Work your way through each boundary by strength at each stage if chunk is too big then move to next boundary to split it further.*/
export type ChunkResult = {
  text: string;
  contentType: ChunkType;
  chunkIndex: number;
};

const BOUNDARIES = [
  /\n\n+/, // paragraph
  /\n + /, // line
  /\./, // sentence
  / /, // word
];

const MAX_SIZE = 800;

function splitRecursive(text: string, boundaryIndex: number): string[] {
  // base case no more boundaries
  if (boundaryIndex >= BOUNDARIES.length) return [text];

  const pieces = text
    .split(BOUNDARIES[boundaryIndex])
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return pieces.flatMap((piece): string[] => {
    if (piece.length > MAX_SIZE) {
      return splitRecursive(piece, boundaryIndex + 1);
    }
    return [piece];
  });
}

function splitByBoundaries(text: string): string[] {
  return splitRecursive(text, 0);
}

function mergeSmallChunks(chunks: string[], minSize: number): string[] {
  const result: string[] = [];
  let current = '';

  for (const chunk of chunks) {
    if (current.length + chunk.length < minSize) {
      current = current ? `${current} ${chunk}` : chunk;
    } else {
      if (current) result.push(current);
      current = chunk;
    }
  }

  if (current) result.push(current);
  return result;
}

function addOverlap(chunks: string[], overlapSize: number): string[] {
  return chunks.map((chunk, i) => {
    if (i === 0) return chunk;
    const previousChunk = chunks[i - 1];
    const overlap = previousChunk.slice(-overlapSize);
    return `${overlap} ${chunk}`;
  });
}

export function chunkContent(
  fullText: string,
  contentType: ChunkType
): ChunkResult[] {
  const split = splitByBoundaries(fullText);
  const merged = mergeSmallChunks(split, 200);
  const withOverlap = addOverlap(merged, 100);

  return withOverlap.map((text, i) => ({
    text,
    contentType,
    chunkIndex: i,
  }));
}
