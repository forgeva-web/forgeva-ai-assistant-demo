// lib/graphql/resolvers.ts
import type { GraphQLContext } from '@/app/api/graphql/route';
import type { ContentChunk } from '@/app/generated/prisma';
import type { Prisma } from '@/app/generated/prisma';
import { generateAisoScore } from '@/lib/ai/aiso';
import {
  detectPageType,
  generateStructuredData,
} from '@/lib/ai/structured-data';
import type { StructuredData } from '@/lib/ai/structured-data';
import { urlToPageSlug, revalidateClientSite } from '@/lib/client-site';
import { EditStatus } from '@/lib/graphql/generated/graphql-types';
import { prisma } from '@/lib/prisma/client';
import { GraphQLError } from 'graphql';
import slugify from 'slugify';

function authGuard(context: GraphQLContext, operation: string): void {
  if (!context.userId) {
    throw new GraphQLError(`${operation} requires authentication.`, {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
}

function demoGuard(op: string): void {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') {
    throw new GraphQLError(`${op} is disabled in demo mode.`, {
      extensions: { code: 'DEMO_MODE' },
    });
  }
}

// Guard ONLY these two: createSite and indexSite

export const resolvers = {
  Query: {
    sites: () => prisma.site.findMany(),

    site: (_: unknown, { id }: { id: string }) =>
      prisma.site.findUnique({ where: { id } }),

    siteBySlug: (_: unknown, { slug }: { slug: string }) =>
      prisma.site.findUnique({ where: { slug } }),

    // Stubbed until Phase 3
    seoAudit: () => null,
    aisoScore: async (_: unknown, { pageId }: { pageId: string }) => {
      const page = await prisma.indexedPage.findUnique({
        where: { id: pageId },
        include: {
          aisoScore: true,
          chunks: true,
        },
      });
      if (!page) throw new Error('Page not found');

      // Cache hit return existing score
      if (page.aisoScore) return page.aisoScore;

      const pageContent = page.chunks
        .sort((a: ContentChunk, b: ContentChunk) => a.chunkIndex - b.chunkIndex)
        .map((c) => c.content)
        .join('\n\n');

      // Cache miss generate new score
      const result = await generateAisoScore(pageContent, page.url);
      const scoresJson: Prisma.InputJsonValue = {
        conversationalClarity: result.conversationalClarity,
        conversationalClarityExplanation:
          result.conversationalClarityExplanation,

        factualDepth: result.factualDepth,
        factualDepthExplanation: result.factualDepthExplanation,

        structuredScannability: result.structuredScannability,
        structuredScannabilityExplanation:
          result.structuredScannabilityExplanation,

        entityCoverage: result.entityCoverage,
        entityCoverageExplanation: result.entityCoverageExplanation,

        structuredDataPresence: result.structuredDataPresence,
        structuredDataPresenceExplanation:
          result.structuredDataPresenceExplanation,
      };

      return await prisma.aisoScore.create({
        data: {
          pageId,
          totalScore: result.totalScore,
          scores: scoresJson,
          actionItems: result.actionItems,
        },
      });
    },

    chatSession: () => null,

    proposedEdits: (
      _: unknown,
      { siteId, status }: { siteId: string; status?: string }
    ) =>
      prisma.proposedEdit.findMany({
        where: {
          indexedPage: { siteId },
          ...(status ? { status: status as EditStatus } : {}),
        },
        include: {
          indexedPage: true,
        },
      }),
  },

  Mutation: {
    createSite: (
      _: unknown,
      { name, url }: { name: string; url: string },
      context: GraphQLContext
    ) => {
      authGuard(context, 'createSite');
      demoGuard('createSite');
      const slug = slugify(name, { lower: true, strict: true });
      return prisma.site.create({ data: { name, url, slug } });
    },

    indexSite: (
      _: unknown,
      { siteId }: { siteId: string },
      context: GraphQLContext
    ) => {
      authGuard(context, 'indexSite');
      // demoGuard('indexSite');
      prisma.indexedPage.updateMany({
        where: { siteId },
        data: { indexStatus: 'PENDING' },
      });
    },

    // Stubbed until Phase 3
    sendMessage: () => null,

    applyEdit: async (
      _: unknown,
      { editId }: { editId: string },
      context: GraphQLContext
    ) => {
      authGuard(context, 'applyEdit');
      const edit = await prisma.proposedEdit.findUnique({
        where: { id: editId },
        include: { indexedPage: true }, // needed for URL revalidation
      });

      if (!edit) throw new Error('Edit not found');

      const fieldMap: Record<string, string> = {
        META_TITLE: 'metaTitle',
        META_DESCRIPTION: 'metaDescription',
        BODY_COPY: 'bodyContent',
      };

      const prismaField = fieldMap[edit.fieldName];
      if (!prismaField) throw new Error(`Unknown field: ${edit.fieldName}`);

      await prisma.indexedPage.update({
        where: { id: edit.indexedPageId },
        data: { [prismaField]: edit.proposedValue },
      });

      const updatedEdit = await prisma.proposedEdit.update({
        where: { id: editId },
        data: { status: 'ACCEPTED', appliedAt: new Date() },
      });

      // Fire revalidation on the client site — non-blocking, non-fatal
      const pageSlug = urlToPageSlug(edit.indexedPage.url);
      void revalidateClientSite({
        tags: [`page-seo-${pageSlug}`, `page-content-${pageSlug}`],
        path: pageSlug === 'home' ? '/' : `/${pageSlug}`,
      });

      return updatedEdit;
    },

    rejectEdit: (
      _: unknown,
      { editId }: { editId: string },
      context: GraphQLContext
    ) => {
      authGuard(context, 'rejectEdit');
      prisma.proposedEdit.update({
        where: { id: editId },
        data: { status: 'REJECTED' },
      });
    },

    generateStructuredData: async (
      _: unknown,
      { pageId }: { pageId: string },
      context: GraphQLContext
    ) => {
      authGuard(context, 'generateStructuredData');
      const page = await prisma.indexedPage.findUnique({
        where: { id: pageId },
        include: {
          chunks: true,
        },
      });

      if (!page) throw new Error('Page not found');

      try {
        const pageContent = page.chunks
          .sort((a, b) => a.chunkIndex - b.chunkIndex)
          .map((c) => c.content)
          .join('\n\n');

        const pageType = detectPageType(pageContent);

        const structuredData = (await generateStructuredData(
          pageContent,
          pageType
        )) as StructuredData;

        return {
          jsonLd: JSON.stringify(structuredData),
          schemaType: pageType,
          pageId,
        };
      } catch (error) {
        console.error('❌ generateStructuredData ERROR:', {
          pageId,
          error,
        });

        if (error instanceof GraphQLError) {
          throw error; // preserve original error
        }

        throw new GraphQLError(
          'Internal server error while generating structured data',
          {
            extensions: {
              code: 'INTERNAL_SERVER_ERROR',
              originalMessage:
                error instanceof Error ? error.message : String(error),
            },
          }
        );
      }
    },
  },

  // Nested resolver — resolves indexedPages on the Site type
  Site: {
    indexedPages: (parent: { id: string }) =>
      prisma.indexedPage.findMany({ where: { siteId: parent.id } }),
  },
};
