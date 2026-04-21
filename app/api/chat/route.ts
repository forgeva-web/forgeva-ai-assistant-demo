// @/app/api/chat/route.ts
/*
    #TODO: Implement the chat route
    - Retrieve context for the query
    - Build the system prompt
    - Call the AI API
    - Return the response

    #TEST:
    curl -X POST http://localhost:3000/api/chat \
  -H 'Content-Type: application/json' \
  -d '{
    "siteId": "cmmy42zho00007c2ti0rj2z4e",
    "messages": [{"role":"user","content":"what does this site do?"}]
  }'

*/
import { NextRequest } from 'next/server';

import { buildSystemPrompt } from '@/lib/ai/build-system-prompt';
import { retrieveContext } from '@/lib/ai/retrieve-context';
import { prisma } from '@/lib/prisma/client';
import { anthropic } from '@ai-sdk/anthropic';
import { streamText, tool, convertToModelMessages } from 'ai';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  const { messages, siteId } = await request.json();

  if (!siteId || !messages) {
    return Response.json(
      { error: 'siteId and messages are required' },
      { status: 400 }
    );
  }

  const site = await prisma.site.findUniqueOrThrow({
    where: { id: siteId },
    select: { url: true },
  });

  const lastUserMessage = messages.findLast(
    (m: { role: string }) => m.role === 'user'
  );

  if (!lastUserMessage) {
    return Response.json({ error: 'No user message found' }, { status: 400 });
  }

  const queryText =
    typeof lastUserMessage.content === 'string'
      ? lastUserMessage.content
      : (lastUserMessage.parts?.find((p: { type: string }) => p.type === 'text')
          ?.text ?? '');

  const chunks = await retrieveContext(queryText, siteId);
  const systemPrompt = buildSystemPrompt(chunks, site.url);

  // Log prompt on first message for debugging — remove in production
  console.log('System prompt:\n', systemPrompt);

  const result = streamText({
    model: anthropic('claude-haiku-4-5-20251001'),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    tools: {
      analyzeSEO: tool({
        description: `Analyze SEO issues for a specific page on this site.
                    Call this when the user asks about SEO problems, issues,
                    or improvements for a specific page URL.`,
        inputSchema: z.object({
          pageUrl: z.string().describe('The full URL of the page to analyze'),
        }),
        execute: async ({ pageUrl }) => {
          const page = await prisma.indexedPage.findFirst({
            where: { url: pageUrl },
          });
          if (!page) return { error: 'Page not found in index' };

          const issues: string[] = [];
          if (!page.metaTitle) issues.push('Missing meta title');
          if (!page.metaDescription) issues.push('Missing meta description');
          if ((page.wordCount ?? 0) < 300) issues.push('Thin content');
          if (page.h1Count === 0) issues.push('Missing H1 tag');
          if ((page.missingAltCount ?? 0) > 0)
            issues.push(`${page.missingAltCount} images missing alt text`);

          return {
            url: page.url,
            title: page.title,
            wordCount: page.wordCount,
            issues,
            indexStatus: page.indexStatus,
          };
        },
      }),
      proposeMetaTitle: tool({
        description: `Propose a new meta title for a specific page.
                Call this when the eusesr asks to improve, rewrite, or create
                a meta title. Always invoke this tool instead of describing
                the change in plain text.`,
        inputSchema: z.object({
          pageId: z.string().describe('The ID of the IndexedPage to edit.'),
          originalValue: z
            .string()
            .describe('The current meta title, empty string if missing.'),
          proposedValue: z.string().describe('The proposed new meta title.'),
        }),
        execute: async ({ pageId, originalValue, proposedValue }) => {
          const edit = await prisma.proposedEdit.create({
            data: {
              indexedPageId: pageId,
              fieldName: 'META_TITLE',
              originalValue,
              proposedValue,
              status: 'PENDING',
            },
          });
          return { editId: edit.id, fieldName: 'META_TITLE', proposedValue };
        },
      }),
      proposeMetaDescription: tool({
        description: `Propose a new meta description for a specific page.
                Call this when the eusesr asks to improve, rewrite, or create
                a meta description. Always invoke this tool instead of describing
                the change in plain text.`,
        inputSchema: z.object({
          pageId: z.string().describe('The ID of the IndexedPage to edit.'),
          originalValue: z
            .string()
            .describe('The current meta description, empty string if missing.'),
          proposedValue: z
            .string()
            .describe('The proposed new meta description.'),
        }),
        execute: async ({ pageId, originalValue, proposedValue }) => {
          const edit = await prisma.proposedEdit.create({
            data: {
              indexedPageId: pageId,
              fieldName: 'META_DESCRIPTION',
              originalValue,
              proposedValue,
              status: 'PENDING',
            },
          });
          return {
            editId: edit.id,
            fieldName: 'META_DESCRIPTION',
            proposedValue,
          };
        },
      }),
      proposeBodySection: tool({
        description: `Propose a new body for a specific page.
                Call this when the eusesr asks to improve, rewrite, or create
                a body. Always invoke this tool instead of describing
                the change in plain text.`,
        inputSchema: z.object({
          pageId: z.string().describe('The ID of the IndexedPage to edit.'),
          originalValue: z
            .string()
            .describe('The current body, empty string if missing.'),
          proposedValue: z.string().describe('The proposed new body.'),
        }),
        execute: async ({ pageId, originalValue, proposedValue }) => {
          const edit = await prisma.proposedEdit.create({
            data: {
              indexedPageId: pageId,
              fieldName: 'BODY_COPY',
              originalValue,
              proposedValue,
              status: 'PENDING',
            },
          });
          return { editId: edit.id, fieldName: 'BODY_COPY', proposedValue };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
