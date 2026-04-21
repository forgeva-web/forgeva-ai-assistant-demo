# Forgeva AI Assistant

> An AI-powered SEO and AISO (AI Search Optimization) platform that crawls, 
> scores, and improves website content using LLMs and semantic search.

## Overview

Most SEO tools are built around traditional search signals — meta tags, backlinks, 
keyword density. But as AI-powered search engines like Perplexity and ChatGPT become 
primary discovery surfaces, content needs to be optimized for how AI systems parse and 
cite information, not just how crawlers index it. Existing tools don't address this gap.

Forgeva AI Assistant solves this by crawling a client's website, chunking and embedding 
each page into a pgvector database, and scoring content across both traditional SEO 
dimensions and AI-readiness signals — what we call AISO (AI Search Optimization) scoring. 
The platform then uses Claude to generate specific, actionable proposed edits per page, 
which can be reviewed and applied directly from the dashboard, triggering on-demand 
revalidation of the live client site.

The core technical decisions were driven by real constraints: streaming SSE was chosen 
for the indexing pipeline so users get live progress feedback during what can be a 
multi-minute crawl, rather than staring at a spinner. GraphQL with Apollo was chosen 
over REST to allow the dashboard to fetch deeply nested site→page→score→edit relationships 
in a single query. Prisma 7 with a pg adapter over Supabase's connection pooler keeps 
the ORM layer compatible with Vercel's serverless edge environment without requiring a 
persistent connection.

## Features

- **Site crawler** — BFS-based crawler with per-page error isolation, extraction caching, 
  and configurable domain filtering
- **SSE indexing pipeline** — real-time progress streaming across crawl, chunk, embed, 
  and save stages with a live modal UI
- **AISO scoring** — per-page scoring across multiple AI-readiness dimensions using 
  Claude with structured output via Zod
- **Proposed edits** — AI-generated, page-specific content edit suggestions with 
  accept/reject workflow
- **RAG site assistant** — chat interface powered by pgvector similarity search and 
  Claude, scoped to the indexed site's content
- **Demo mode** — token budgeting, rate limiting, and a cron-based auto-reset system 
  for safe public demo access
- **On-demand revalidation** — accepted edits trigger `revalidateTag` on the connected 
  client site via a POST webhook, updating the live page without a full redeploy

## Architecture

The system is split into three layers: the **dashboard app** (this repo), the 
**GraphQL API** (Apollo Server 4 running as a Next.js route handler), and the 
**indexing pipeline** (a set of server-side modules that crawl, chunk, embed, and store 
page content).
