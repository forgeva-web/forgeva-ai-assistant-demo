// @/lib/indexer/proposed-edits.ts
/*
    Generates structured proposed edits for a single indexed page.
    server-side only
*/
import { prisma } from '@/lib/prisma/client';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText, Output } from 'ai';
import { z } from 'zod';

// —— Schema —————————————————————————————————————
const ProposedEditSchema = z.object({
  edits: z
    .array(
      z.object({
        fieldName: z
          .enum(['META_TITLE', 'META_DESCRIPTION'])
          .describe(
            'The field to edit. META_TITLE should be under 60 characters. META_DESCRIPTION should be under 160 characters.'
          ),
        originalValue: z
          .string()
          .describe(
            'The current value of the field. Use empty string if the field is not set.'
          ),
        proposedValue: z
          .string()
          .describe(
            'The improved value optimized for AI search and local SEO. Must not exceed the character limit for the field.'
          ),
        reasoning: z
          .string()
          .describe(
            'One sentence explaining why this specific change improves AISO or local SEO.'
          ),
      })
    )
    .describe('Exactly the number of edits requested — no more, no less.'),
});

type ProposedEditOutput = z.infer<typeof ProposedEditSchema>;

// ——— System Prompt —————————————————————————————————————
const PROPOSED_EDITS_SYSTEM_PROMPT = `
    You are an expert in AI Search Optimization (AISO) and local SEO for small businesses.

    Your task is to analyze web page content and generate specific, actionable improvements to meta titles and meta descriptions.

    Rules for META_TITLE:
    - Must be under 60 characters
    - Include the primary service and location (city, state) when relevant
    - Include the business name if space allows
    - Lead with the most important keyword for that page

    Rules for META_DESCRIPTION:
    - Must be under 160 characters
    - Expand on the title with supporting details
    - Include a call to action or differentiator
    - Mention service area, availability, or key credential when relevant

    Always prefer specific, verifiable claims over vague marketing language.
    For pages missing meta fields entirely, prioritize those first.`;

// —— Main function —————————————————————————————————————
export async function generateProposedEdits(
  pageId: string,
  count: number = 2
): Promise<ProposedEditOutput['edits']> {
  const page = await prisma.indexedPage.findUnique({
    where: { id: pageId },
    include: {
      chunks: {
        orderBy: { chunkIndex: 'asc' },
        take: 20, // enough context w/out blowing the prompt window
      },
    },
  });

  if (!page) throw new Error(`Page not found: ${pageId}`);

  // Skip if enough PENDING edits already exist for this page
  // This prevents duplicate generation if indexing runs twice
  const existingCount = await prisma.proposedEdit.count({
    where: { indexedPageId: pageId, status: 'PENDING' },
  });
  if (existingCount >= count) {
    console.log(
      `[proposed-edits] Skipping ${page.url} — already has ${existingCount} pending edits`
    );
    return [];
  }

  // Build page content string from chunks
  const pageContent = page.chunks.map((c) => c.content).join('\n\n');

  if (!pageContent.trim()) {
    console.warn(
      `[proposed-edits] No chunk content for page ${page.url} — skipping`
    );
    return [];
  }

  // Determine how many of each field type to request based on what's missing
  // Pages missing both fields need 2 META_DESCRIPTION + 1 META_TITLE minimum
  const missingTitle = !page.metaTitle;
  const missingDescription = !page.metaDescription;

  const priorityNote = [
    missingTitle &&
      'META_TITLE is currently missing — treat this as highest priority',
    missingDescription &&
      'META_DESCRIPTION is currently missing — treat this as high priority',
  ]
    .filter(Boolean)
    .join('. ');

  try {
    const result = await generateText({
      model: anthropic('claude-sonnet-4-5'),
      output: Output.object({ schema: ProposedEditSchema }),
      system: PROPOSED_EDITS_SYSTEM_PROMPT,
      prompt: `Analyze this web page and generate exactly ${count} proposed edits.

                Page URL: ${page.url}
                Current meta title: ${page.metaTitle ?? '(not set)'}
                Current meta description: ${page.metaDescription ?? '(not set)'}
                ${priorityNote ? `\nPriority note: ${priorityNote}` : ''}

                Page content extracted from crawl:
                ${pageContent}

                Generate exactly ${count} proposed edits targeting META_TITLE and META_DESCRIPTION.
                You may propose multiple edits for the same field if both need improvement.
                For fields that are missing, use empty string as the originalValue.`,
    });

    const { edits } = result.output;

    // Save to database — skipDuplicates prevents crashes if called twice
    await prisma.proposedEdit.createMany({
      data: edits.map((edit) => ({
        indexedPageId: pageId,
        fieldName: edit.fieldName,
        originalValue: edit.originalValue,
        proposedValue: edit.proposedValue,
        status: 'PENDING',
      })),
      skipDuplicates: true,
    });

    console.log(
      `[proposed-edits] ✓ Generated ${edits.length} edits for ${page.url}`
    );
    return edits;
  } catch (err) {
    console.error(`[proposed-edits] ✗ Failed for ${page.url}:`, err);
    throw err; // re-throw so route.ts can catch and log per-page failures
  }
}
