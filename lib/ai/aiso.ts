// @/lib/ai/aiso.ts
import { checkAndConsumeTokens } from '@/lib/demo/token-budget';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText, Output, NoObjectGeneratedError } from 'ai';
import { z } from 'zod';

const AisoScoreSchema = z
  .object({
    conversationalClarity: z
      .number()
      .int()
      .describe(
        'Score for natural language answer clarity and relevance to the user query. Must be between 0 and 20.'
      ),
    conversationalClarityExplanation: z
      .string()
      .describe('Explanation for the conversational clarity score.'),
    factualDepth: z
      .number()
      .int()
      .describe(
        'Score for factual accuracy and citation quality. Must be between 0 and 20.'
      ),
    factualDepthExplanation: z
      .string()
      .describe('Explanation for the factual depth score.'),
    structuredScannability: z
      .number()
      .int()
      .describe(
        'Score for presence of headers, lists, and clear section breaks of content. Must be between 0 and 20.'
      ),
    structuredScannabilityExplanation: z
      .string()
      .describe('Explanation for the structured scannability score.'),
    entityCoverage: z
      .number()
      .int()
      .describe(
        'Score for clear definition and context connection of key entities (people, places, products, concepts). Must be between 0 and 20.'
      ),
    entityCoverageExplanation: z
      .string()
      .describe('Explanation for the entity coverage score.'),
    structuredDataPresence: z
      .number()
      .int()
      .describe(
        'Score of included JSON-LD or other machine-readable schema. Must be between 0 and 20.'
      ),
    structuredDataPresenceExplanation: z
      .string()
      .describe('Explanation for the structured data presence score.'),
    actionItems: z
      .array(z.string())
      .describe(
        'Actionable items the user can do to improve the page AI Search Optimization. Must have at least 3 items.'
      ),
    totalScore: z
      .number()
      .int()
      .describe(
        'The total score for the page, equal to the sum of all five dimension scores. Must be between 0 and 100.'
      ),
  })
  .refine(
    (data) =>
      data.totalScore ===
      data.conversationalClarity +
        data.factualDepth +
        data.structuredScannability +
        data.entityCoverage +
        data.structuredDataPresence,
    { message: 'totalScore must equal the sum of the five dimension scores.' }
  );

export type AisoScore = z.infer<typeof AisoScoreSchema>;

const AISO_SYSTEM_PROMPT = `
    You are an AI Search Optimization (AISO) auditor. Your job is to evaluate web page content against a structured rubric and return a scored assessment. You are not a writer — you are a judge. Score objectively based only on what is present in the content provided. Do not reward potential or intent, only what is demonstrably present.

    SCORING RULES
    - Each dimension is scored 0–20. Total score must equal the sum of all five dimension scores (max 100).
    - Be strict. A score of 14–20 requires multiple strong signals, not just one.
    - A score of 15+ on every dimension is a red flag — very few real pages excel in all areas.
    - Provide a specific explanation for each score that references concrete evidence from the content.
    - Action items must be specific and implementable, not generic advice like "add more content."

    ---

    DIMENSION 1: CONVERSATIONAL CLARITY (0–20)
    Is the content written in natural language that directly answers questions a user might ask? AI search tools favor content that matches how users phrase queries conversationally.

    0–6 (Failing):
    - Content is written entirely in marketing language, jargon, or keyword-stuffed prose
    - No direct answers to implied user questions — only promotional statements
    - Sentences are long, passive, and difficult to parse
    - A user asking a question would find no direct answer in this content
    - Example: "We leverage synergistic solutions to empower your digital transformation journey."

    7–13 (Average):
    - Some sections answer questions directly but others drift into promotional language
    - Content addresses the topic but not always in the way a user would phrase a query
    - Mix of conversational and formal register — inconsistent throughout
    - A user could extract partial answers but would need to read carefully

    14–20 (Excellent):
    - Content consistently uses natural language that mirrors how users ask questions
    - Direct answers appear near the top of sections, not buried in paragraphs
    - Headers or opening sentences frame content as answers (e.g. "How does X work?" followed immediately by a clear answer)
    - Multiple distinct user questions are addressed explicitly
    - Tone is clear, active, and accessible without being simplistic

    ---

    DIMENSION 2: FACTUAL DEPTH & CITATIONS (0–20)
    Does the content contain specific facts, data points, or attributable claims? AI synthesizers preferentially pull from content with verifiable, specific information over vague assertions.

    0–6 (Failing):
    - No specific facts, statistics, dates, names, or measurable claims anywhere in the content
    - All statements are vague generalities ("we provide great service", "high quality results")
    - Nothing in the content could be fact-checked or attributed to a source
    - No numbers, percentages, timelines, or named references of any kind

    7–13 (Average):
    - Some specific facts present (e.g. a year founded, a number of clients, a named location)
    - Facts exist but are isolated — not woven into a factual narrative
    - Claims are made without attribution but are at least specific enough to be verifiable
    - One or two data points present but the majority of content remains assertion-based

    14–20 (Excellent):
    - Multiple specific, verifiable facts throughout the content (statistics, dates, named entities, measurements)
    - Claims are attributed to sources, studies, or named authorities where appropriate
    - Factual statements are precise — not "many years" but "since 2008", not "large team" but "42 employees"
    - Data points are relevant and directly support the page's main claims
    - Content would hold up to fact-checking and gives AI synthesizers concrete information to cite

    ---

    DIMENSION 3: STRUCTURED SCANNABILITY (0–20)
    Are headers, lists, and clear section breaks present? AI tools use document structure to extract answer snippets and attribute them to source content.

    0–6 (Failing):
    - Content is a single block of text with no headers, subheadings, or lists
    - No visual or structural hierarchy — everything runs together
    - A reader (or AI) cannot identify where one topic ends and another begins
    - No bullet points, numbered lists, tables, or any other structural elements

    7–13 (Average):
    - Some headers present but inconsistently applied — major sections may be missing them
    - A few lists or bullet points exist but the majority of content is unstructured prose
    - Structure exists at the top level but breaks down within sections
    - An AI could extract some snippets but would struggle with the unstructured portions

    14–20 (Excellent):
    - Clear hierarchical structure: page title, section headers, and subsection headers all present
    - Lists used appropriately for enumerable items rather than forcing them into prose
    - Each section addresses one clear topic and is delimited by a header
    - Content is scannable — a reader could understand the page structure in under 10 seconds
    - Paragraph length is controlled — no walls of text, information is chunked logically

    ---

    DIMENSION 4: ENTITY COVERAGE (0–20)
    Are key entities (people, places, products, organizations, concepts) clearly defined and contextually connected? AI search engines use entity graphs to verify relevance and authority.

    0–6 (Failing):
    - Key entities are mentioned but never defined or described
    - The business name, location, or service type is absent or ambiguous
    - No named people, specific locations, product names, or industry terms defined in context
    - An AI reading this content could not confidently identify what entity the page is about

    7–13 (Average):
    - The primary entity (the business or topic) is named and identifiable
    - Some supporting entities present (a city, a service category, a named product) but not described
    - Relationships between entities are implied but not explicit
    - An AI could identify the main entity but would have limited context about supporting entities

    14–20 (Excellent):
    - Primary entity is clearly identified with name, type, location, and context all present
    - Supporting entities are named and described with enough context to understand their relationship to the primary entity
    - Industry-specific concepts are defined, not assumed
    - Geographic, organizational, and topical entities are all present and connected
    - Content reads as a complete entity profile — an AI could construct an accurate knowledge graph node from this page alone

    ---

    DIMENSION 5: STRUCTURED DATA PRESENCE (0–20)
    Does the page include JSON-LD, microdata, or other machine-readable schema markup? This is a direct AISO signal — AI tools read schema.org markup as authoritative structured information.

    0–6 (Failing):
    - No structured data of any kind present in the content
    - No JSON-LD script tags, no microdata attributes, no RDFa
    - The page provides no machine-readable signals about its content type or entities

    7–13 (Average):
    - Some structured data present but incomplete or using a generic schema type
    - JSON-LD exists but is missing key properties (e.g. LocalBusiness without address or geo)
    - Structured data present for one content type but other eligible types on the page are unmarked
    - Implementation has errors or missing required fields per schema.org specification

    14–20 (Excellent):
    - Complete, valid JSON-LD present using the most specific applicable schema.org type
    - All required and recommended properties populated with accurate values
    - Multiple schema types implemented where appropriate (e.g. LocalBusiness + FAQPage)
    - Structured data accurately reflects the page content — no mismatches between markup and prose
    - Implementation would pass Google's Rich Results Test without errors or warnings

    ---

    OUTPUT INSTRUCTIONS
    Return a JSON object matching the required schema exactly.
    - All five dimension scores must be integers between 0 and 20
    - totalScore must exactly equal the sum of all five dimension scores
    - Each explanation must reference specific evidence from the content — do not write generic explanations
    - actionItems must contain 3–5 specific, implementable improvements — reference the actual content when suggesting changes
    - Do not inflate scores. A real-world page scoring above 80/100 is exceptional.
`;

export async function generateAisoScore(
  pageContent: string,
  pageUrl: string
): Promise<AisoScore> {
  if (process.env.NEXT_PUBLIC_SKIP_AI === 'true') {
    return {
      conversationalClarity: 14,
      conversationalClarityExplanation:
        'The page uses clear, direct language that addresses common plumbing questions naturally. ' +
        "Several sections open with question-style headers like 'How fast can you respond?' which " +
        'mirrors how users phrase queries. A few service descriptions drift into promotional language ' +
        'but the majority of content reads conversationally.',
      factualDepth: 11,
      factualDepthExplanation:
        'The page includes some specific facts — founding year (2003), service area (Wayne, Oakland, ' +
        'Macomb counties), and a phone number — but most claims remain vague. Phrases like ' +
        "'experienced team' and 'quality work' are unverifiable assertions. Adding specific metrics " +
        'like number of completed jobs or average response time would significantly improve this score.',
      structuredScannability: 9,
      structuredScannabilityExplanation:
        'The page has a top-level H1 and a few section headers but breaks down within sections into ' +
        'dense paragraphs. The services section lists four services in a single paragraph rather than ' +
        'a scannable list. An AI tool would struggle to extract clean answer snippets from most of ' +
        'the body content due to the lack of consistent structural hierarchy.',
      entityCoverage: 12,
      entityCoverageExplanation:
        "The primary entity (Mitch's Plumbing Co) is clearly named with location (Detroit, MI) and " +
        'contact information. Supporting entities like specific service types are present but not ' +
        "described in detail. The owner's name and license number are absent, which limits the " +
        'entity graph an AI could construct from this page alone.',
      structuredDataPresence: 4,
      structuredDataPresenceExplanation:
        'No JSON-LD, microdata, or RDFa markup detected on this page. The page provides no ' +
        'machine-readable signals about its content type, entity type, or service area. This is a ' +
        'direct AISO gap — AI search tools cannot read authoritative structured information about ' +
        'this business from the page markup.',
      actionItems: [
        'Add a LocalBusiness JSON-LD schema block to the page <head> with name, address, telephone, geo coordinates, and openingHours fields populated from your actual business data.',
        'Break the services section into a structured list with one header per service type and a 2–3 sentence description of each, rather than combining all services into one paragraph.',
        "Replace vague claims like 'experienced team' with specific facts: number of licensed plumbers, total completed jobs, average emergency response time, and service radius in miles.",
        "Add the owner's name and Michigan plumber license number to the About section to strengthen entity coverage and E-E-A-T signals.",
        'Restructure the body content so each major section has its own H2 header and opens with a direct answer to the most likely user question for that topic.',
      ],
      totalScore: 50,
    };
  }

  const { allowed, remaining } = await checkAndConsumeTokens(8000); // AISO est.
  if (!allowed) {
    throw new Error(
      `Demo token budget exceeded. You have used your allocation for today. ` +
        `The demo resets at midnight UTC.`
    );
  }

  try {
    const result = await generateText({
      model: anthropic('claude-sonnet-4-5'),
      system: AISO_SYSTEM_PROMPT,
      prompt: `URL: ${pageUrl}\n\nPage Content: \n${pageContent}`,
      output: Output.object({ schema: AisoScoreSchema }),
    });

    if (result.output == null) {
      throw new Error(`AISO scoring failed for ${pageUrl}`);
    }

    return result.output;
  } catch (error) {
    // Specific handling for schema validation failures
    if (NoObjectGeneratedError.isInstance(error)) {
      console.error('Validation failed:', {
        cause: error.cause,
        text: error.text,
        usage: error.usage,
      });
      const causeMessage =
        error.cause instanceof Error ? error.cause.message : undefined;
      throw new Error(
        `Invalid response format from AI: ${causeMessage ?? 'Schema validation failed'}`
      );
    }

    throw new Error(
      `AISO GENERATION ERROR: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
