import { prisma } from '@/lib/prisma/client';

// import { PrismaPg } from '@prisma/adapter-pg'

// const adapter = new PrismaPg({
//   connectionString: process.env.DIRECT_URL!,
//   ssl: {
//     rejectUnauthorized: false
//   }
// })

export async function runSeed() {
  console.log('Resetting demo data...');

  // ——— Clean slate —————————————————————————————————————————
  await prisma.proposedEdit.deleteMany();
  await prisma.aisoScore.deleteMany();
  await prisma.contentChunk.deleteMany();
  await prisma.chatSession.deleteMany();
  await prisma.pageContent.deleteMany();
  await prisma.indexedPage.deleteMany();
  await prisma.siteConfig.deleteMany();
  await prisma.site.deleteMany();

  console.log('🗑️ Cleared DB of all previous data.');

  // ——— Site ————————————————————————————————————————————————
  const site = await prisma.site.create({
    data: {
      name: 'Mitch Better Fix My Pipes Plumbing Co.',
      url: 'http://localhost:3001/',
      slug: 'mitchs-plumbing',
    },
  });

  console.log('✅ Site created', site);

  //   // ——— Indexed Pages ————————————————————————————————————————
  //   const home = await prisma.indexedPage.create({
  //     data: {
  //       siteId: site.id,
  //       url: 'https://mitchbetterfixmypipes.com',
  //       title: 'Mitch Better Fix My Pipes | Plumbing Services Oakland County, MI',
  //       metaTitle: 'Plumbing Services',
  //       metaDescription: 'We fix plumbing issues for homes and businesses.',
  //       contentHash: 'mbfmp_home',
  //       wordCount: 520,
  //       h1Count: 1,
  //       missingAltCount: 2,
  //       indexStatus: 'COMPLETE',
  //       lastIndexedAt: new Date(),
  //     },
  //   });

  //   const services = await prisma.indexedPage.create({
  //     data: {
  //       siteId: site.id,
  //       url: 'https://mitchbetterfixmypipes.com/services',
  //       title: 'Services | Mitch Better Fix My Pipes',
  //       metaTitle: null,
  //       metaDescription: null,
  //       contentHash: 'mbfmp_services',
  //       wordCount: 310,
  //       h1Count: 0,
  //       missingAltCount: 3,
  //       indexStatus: 'COMPLETE',
  //       lastIndexedAt: new Date(),
  //     },
  //   });

  //   const about = await prisma.indexedPage.create({
  //     data: {
  //       siteId: site.id,
  //       url: 'https://mitchbetterfixmypipes.com/about',
  //       title: 'About Mitch',
  //       metaTitle: null,
  //       metaDescription: null,
  //       contentHash: 'mbfmp_about',
  //       wordCount: 180,
  //       h1Count: 1,
  //       missingAltCount: 0,
  //       indexStatus: 'PENDING',
  //       lastIndexedAt: null,
  //     },
  //   });
  //   const contact = await prisma.indexedPage.create({
  //     data: {
  //       siteId: site.id,
  //       url: 'https://mitchbetterfixmypipes.com/contact',
  //       title: 'Contact Us',
  //       metaTitle: null,
  //       metaDescription: null,
  //       contentHash: 'mbfmp_contact',
  //       wordCount: 90,
  //       h1Count: 1,
  //       missingAltCount: 0,
  //       indexStatus: 'PENDING',
  //       lastIndexedAt: null,
  //     },
  //   });

  //   console.log('✅ Indexed pages created');

  //   // ——— Content Chunks (HOME) ————————————————————————————————————————
  //   await prisma.contentChunk.createMany({
  //     data: [
  //     {
  //       indexedPageId: home.id,
  //       chunkIndex: 0,
  //       contentType: 'HEADING',
  //       content: 'Mitch Better Fix My Pipes Plumbing Co.'
  //     },
  //     {
  //         indexedPageId: home.id,
  //         chunkIndex: 1,
  //         contentType: 'PARAGRAPH',
  //         content:
  //           'Serving Metro Oakland County, MI, Mitch Better Fix My Pipes Plumbing Co. provides fast, reliable plumbing services for homeowners and small businesses. Whether it’s a burst pipe, clogged drain, or broken water heater, we show up on time and fix it right.',
  //       },
  //       {
  //         indexedPageId: home.id,
  //         chunkIndex: 2,
  //         contentType: 'PARAGRAPH',
  //         content:
  //           'We specialize in emergency plumbing, drain cleaning, and leak detection. Our licensed technicians are available 24/7 and always provide upfront pricing before any work begins.',
  //       },
  //       {
  //         indexedPageId: home.id,
  //         chunkIndex: 3,
  //         contentType: 'PARAGRAPH',
  //         content:
  //           'Located in Oakland County, MI, MI. Call (313) 555-0199. Open 24 hours for emergency service. Proudly serving Wayne, Oakland, and Macomb counties.',
  //       },
  //   ],
  // });

  // // ── Content Chunks (SERVICES) ──────────────────────────────
  //   await prisma.contentChunk.createMany({
  //     data: [
  //       {
  //         indexedPageId: services.id,
  //         chunkIndex: 0,
  //         contentType: 'HEADING',
  //         content: 'Our Plumbing Services',
  //       },
  //       {
  //         indexedPageId: services.id,
  //         chunkIndex: 1,
  //         contentType: 'PARAGRAPH',
  //         content:
  //           'We offer a full range of plumbing services including drain cleaning, pipe repair, leak detection, and water heater installation. Our team works on both residential and small commercial properties.',
  //       },
  //       {
  //         indexedPageId: services.id,
  //         chunkIndex: 2,
  //         contentType: 'PARAGRAPH',
  //         content:
  //           'Emergency plumbing is available 24/7. If you have a burst pipe or flooding issue, we respond quickly to minimize damage and restore your system.',
  //       },
  //       {
  //         indexedPageId: services.id,
  //         chunkIndex: 3,
  //         contentType: 'PARAGRAPH',
  //         content:
  //           'We also install and repair sinks, faucets, toilets, and garbage disposals. All work is backed by a satisfaction guarantee.',
  //       },
  //     ],
  //   });

  //   console.log('✓ Content chunks created');

  //   // ── Pre-Generated AISO Scores (HOME) ────────────────────────────
  //   await prisma.aisoScore.create({
  //   data: {
  //     pageId: home.id,
  //     totalScore: 58,
  //     scores: {
  //       conversationalClarity: 14,
  //       conversationalClarityExplanation:
  //         'The homepage uses plain language and directly addresses common customer concerns like emergency availability and service area. A few sections drift into vague promotional phrasing.',
  //       factualDepth: 12,
  //       factualDepthExplanation:
  //         'The page includes a phone number and service area but lacks specific facts like years in business, number of completed jobs, or named service guarantees that AI synthesizers prefer.',
  //       structuredScannability: 11,
  //       structuredScannabilityExplanation:
  //         'There is one H1 and some paragraph breaks but no section headers or lists. An AI tool would struggle to extract clean answer snippets from the body content.',
  //       entityCoverage: 10,
  //       entityCoverageExplanation:
  //         'The business name and county are present but the owner name, license number, and specific service area neighborhoods are absent. Entity graph coverage is incomplete.',
  //       structuredDataPresence: 11,
  //       structuredDataPresenceExplanation:
  //         'No JSON-LD or microdata detected. The page provides no machine-readable signals about the business type, location, or services offered.',
  //     },
  //     actionItems: [
  //       'Add a LocalBusiness JSON-LD schema block with name, address, telephone, geo coordinates, and openingHours.',
  //       'Replace the generic meta title with a keyword-rich version targeting "Oakland County plumbing" and the business name.',
  //       'Add section headers (H2) for each service type so AI tools can extract individual answer snippets.',
  //       'Include the owner name and Michigan plumber license number to strengthen entity coverage.',
  //       'Add specific facts: years in business, number of completed jobs, and average response time.',
  //     ],
  //   },
  // });

  //   // ── Pre-Generated AISO Scores (SERVICES) ──────────────────────────────
  //   await prisma.aisoScore.create({
  //   data: {
  //     pageId: services.id,
  //     totalScore: 46,
  //     scores: {
  //       conversationalClarity: 12,
  //       conversationalClarityExplanation:
  //         'The services page content is readable and addresses what customers might search for, but it reads more like a service catalogue than a direct answer to user questions. Phrases like "full range of plumbing services" are vague and do not mirror how someone would phrase a search query. Adding question-style headers like "Do you offer emergency drain cleaning?" would significantly improve this dimension.',

  //       factualDepth: 10,
  //       factualDepthExplanation:
  //         'The page mentions service types and a satisfaction guarantee but provides no verifiable specifics — no pricing ranges, no turnaround times, no credentials, and no named technicians or license numbers. AI synthesizers strongly prefer content with attributable, measurable claims. The line about emergency availability duplicates the homepage without adding new factual weight.',

  //       structuredScannability: 9,
  //       structuredScannabilityExplanation:
  //         'The page has no H1 heading and no section headers, which means an AI tool reading this page cannot identify where one service ends and another begins. The content is written as three undifferentiated paragraphs. Breaking each service type into its own headed section would dramatically improve how AI tools parse and attribute snippets from this page.',

  //       entityCoverage: 7,
  //       entityCoverageExplanation:
  //         'The business name does not appear on this page at all, and the service area is never mentioned — a visitor arriving directly on this URL would have no way to know which county or region the business serves. The entities that do appear (drain cleaning, water heater, garbage disposals) are described generically without connecting them to the business identity or geographic context that AI search tools use to verify relevance.',

  //       structuredDataPresence: 8,
  //       structuredDataPresenceExplanation:
  //         'No JSON-LD, microdata, or RDFa markup is present on this page. A Service schema type would be appropriate here to explicitly declare the services offered, their service area, and the provider. Without machine-readable markup, AI tools must infer all of this from prose — which on this page is thin enough that inference will likely fail.',
  //     },
  //     actionItems: [
  //       'Add a meta title and meta description — both are currently missing, which means search engines and AI tools have no authoritative summary of what this page covers.',
  //       'Add an H1 heading and individual H2 headers for each service category so AI tools can extract clean, attributed snippets per service.',
  //       'Include the business name and service area (Oakland County, MI) at least once on this page so the entity context is clear to AI search tools arriving directly on this URL.',
  //       'Add a Service or LocalBusiness JSON-LD block to provide machine-readable structured data about the services offered and the geographic area served.',
  //       'Replace vague phrases like "full range of plumbing services" with specific service names and concrete details such as average response time or service guarantee terms.',
  //     ],
  //   },
  // });

  //   console.log('✓ AISO scores created');

  //   // ── Proposed Edits ─────────────────────────────────────────
  //   await prisma.proposedEdit.createMany({
  //     data: [
  //       {
  //         indexedPageId: home.id,
  //         fieldName: 'META_TITLE',
  //         originalValue: 'Plumbing Services',
  //         proposedValue:
  //           'Emergency Plumbing Oakland County, MI | Mitch Better Fix My Pipes',
  //         status: 'PENDING',
  //       },
  //       {
  //         indexedPageId: home.id,
  //         fieldName: 'META_DESCRIPTION',
  //         originalValue:
  //           'We fix plumbing issues for homes and businesses.',
  //         proposedValue:
  //           'Mitch Better Fix My Pipes offers 24/7 emergency plumbing in Oakland County, MI. Fast, reliable service for drains, pipes, and water heaters.',
  //         status: 'PENDING',
  //       },
  //       {
  //         indexedPageId: services.id,
  //         fieldName: 'META_TITLE',
  //         originalValue: '',
  //         proposedValue:
  //           'Plumbing Services Oakland County, MI | Drain Cleaning & Repairs',
  //         status: 'PENDING',
  //       },
  //       {
  //         indexedPageId: services.id,
  //         fieldName: 'META_DESCRIPTION',
  //         originalValue: '',
  //         proposedValue:
  //           'Full-service plumbing in Oakland County, MI including drain cleaning, pipe repair, and water heater installation. Call today.',
  //         status: 'PENDING',
  //       },
  //     ],
  //   });

  //   console.log('✓ Proposed edits created');

  //   // ── Chat Session (RAG Demo) ────────────────────────────────
  //   await prisma.chatSession.create({
  //     data: {
  //       siteId: site.id,
  //       messages: [
  //         {
  //           role: 'assistant',
  //           content:
  //             'Welcome! This is a demo plumbing site. You can analyze pages, generate AISO scores, and apply SEO improvements.',
  //         },
  //         {
  //           role: 'user',
  //           content: 'What issues does my homepage have?',
  //         },
  //         {
  //           role: 'assistant',
  //           content:
  //             'Your homepage has a weak meta title, limited keyword targeting, and no structured data. Improving these will increase visibility in search results.',
  //         },
  //       ],
  //     },
  //   });

  //   console.log('✓ Chat session created');

  //   // ── SiteConfig ─────────────────────────────────────────────
  //   await prisma.siteConfig.createMany({
  //     data: [
  //       { siteId: site.id, key: 'phone',        value: '(313) 555-0199'                    },
  //       { siteId: site.id, key: 'phone_href',   value: 'tel:3135550199'                    },
  //       { siteId: site.id, key: 'address',      value: 'Oakland County, MI'                },
  //       { siteId: site.id, key: 'service_area', value: 'Wayne, Oakland & Macomb counties'  },
  //       { siteId: site.id, key: 'hours',        value: '24/7 for emergencies'              },
  //       { siteId: site.id, key: 'founded',      value: '2003'                              },
  //       { siteId: site.id, key: 'nav_brand',    value: 'Mitch Better Fix My Pipes'         },
  //     ],
  //   });

  //   console.log('✓ Site config created');

  //   // ── PageContent (HOME) ─────────────────────────────────────
  //   await prisma.pageContent.createMany({
  //     data: [
  //       {
  //         indexedPageId: home.id,
  //         key: 'hero_heading',
  //         value: 'Mitch Better Fix My Pipes Plumbing Co.',
  //         contentType: 'TEXT',
  //       },
  //       {
  //         indexedPageId: home.id,
  //         key: 'hero_subheading',
  //         value: 'Fast, reliable plumbing for Oakland County, MI homeowners and businesses.',
  //         contentType: 'TEXT',
  //       },
  //       {
  //         indexedPageId: home.id,
  //         key: 'hero_cta_primary_label',
  //         value: 'Call (313) 555-0199',
  //         contentType: 'TEXT',
  //       },
  //       {
  //         indexedPageId: home.id,
  //         key: 'hero_cta_primary_href',
  //         value: 'tel:3135550199',
  //         contentType: 'TEXT',
  //       },
  //       {
  //         indexedPageId: home.id,
  //         key: 'hero_cta_secondary_label',
  //         value: 'View Services',
  //         contentType: 'TEXT',
  //       },
  //       {
  //         indexedPageId: home.id,
  //         key: 'about_blurb',
  //         value: 'Family-owned and operated since 2003. Licensed, insured, and available 24/7 for emergency service across Wayne, Oakland, and Macomb counties.',
  //         contentType: 'TEXT',
  //       },
  //     ],
  //   });

  //   // ── PageContent (SERVICES) ─────────────────────────────────
  //   await prisma.pageContent.createMany({
  //     data: [
  //       {
  //         indexedPageId: services.id,
  //         key: 'page_heading',
  //         value: 'Our Plumbing Services',
  //         contentType: 'TEXT',
  //       },
  //       {
  //         indexedPageId: services.id,
  //         key: 'page_intro',
  //         value: 'Full-service plumbing for residential and small commercial properties in Oakland County, MI.',
  //         contentType: 'TEXT',
  //       },
  //     ],
  //   });

  //   // ── PageContent (ABOUT) ────────────────────────────────────
  //   await prisma.pageContent.createMany({
  //     data: [
  //       {
  //         indexedPageId: about.id,
  //         key: 'page_heading',
  //         value: 'About Mitch',
  //         contentType: 'TEXT',
  //       },
  //       {
  //         indexedPageId: about.id,
  //         key: 'body_paragraph_1',
  //         value: "Mitch Better Fix My Pipes Plumbing Co. has served Oakland County homeowners and businesses since 2003. We're a family-owned operation with a simple promise: show up on time, fix it right, and charge a fair price.",
  //         contentType: 'TEXT',
  //       },
  //       {
  //         indexedPageId: about.id,
  //         key: 'body_paragraph_2',
  //         value: 'All our technicians are licensed and insured in the state of Michigan. We provide upfront pricing before any work begins — no surprises, no hidden fees.',
  //         contentType: 'TEXT',
  //       },
  //     ],
  //   });

  //   // ── PageContent (CONTACT) ──────────────────────────────────
  //   await prisma.pageContent.createMany({
  //     data: [
  //       {
  //         indexedPageId: contact.id,
  //         key: 'page_heading',
  //         value: 'Contact Us',
  //         contentType: 'TEXT',
  //       },
  //       {
  //         indexedPageId: contact.id,
  //         key: 'page_intro',
  //         value: "Call us any time — we're available 24/7 for emergency plumbing across Oakland County.",
  //         contentType: 'TEXT',
  //       },
  //     ],
  //   });

  //   console.log('✓ Page content created');

  console.log('🎉 Demo seed complete');
}

// This block only runs when seed.ts is executed directly via CLI:
// npx prisma db seed OR npx tsx prisma/seed.ts
// When the file is imported as a module, require.main !== module
// so this block is skipped entirely
const isDirectExecution = process.argv[1] === new URL(import.meta.url).pathname;

if (isDirectExecution) {
  runSeed()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
