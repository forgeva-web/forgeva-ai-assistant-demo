// @/lib/ai/build-system-prompt.ts
import type { ChunkResult } from '@/lib/ai/retrieve-context';

export function buildSystemPrompt(
  chunks: ChunkResult[],
  siteUrl: string
): string {
  const contextBlocks = chunks
    .map((chunk, index) => {
      return `[CHUNK ${index + 1} — source: ${chunk.url} — type: ${chunk.contentType}]\n${chunk.content}`;
    })
    .join('\n\n');

  return `
<role>
You are an SEO assistant for ${siteUrl}. Answer questions about this website
using only the provided context below. Reference specific content from the site
when answering. If the context does not contain enough information to answer
the question, say so directly — do not guess or use general knowledge.
</role>

<tools>
When the user asks to improve, rewrite, create, or suggest changes to a meta title, meta description, or body ccontent for a specific page, ALWAYS use the appropriate propose tool. Never describe the change in plain text — always invoke the tool so the user can review and accept or reject the proposal. You will need the pageId of the IndexedPage. If you do not have it, ask the user which page URL they are referring to and retrieve the pageId from the context.
</tools>

<context>
${contextBlocks}
</context>
`;
}
