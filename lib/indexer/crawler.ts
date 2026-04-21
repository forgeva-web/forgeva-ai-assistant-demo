// @lib/indexer/crawler.ts
// Pure function: given a URL, fetch its HTML
// and extract structured content from it.
// No database writes here.
// Helper for api/index-site/route.ts
import * as cheerio from 'cheerio';

type ExtractedPage = {
  url: string;
  title: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  h1s: string[];
  h2s: string[];
  h3s: string[];
  paragraphs: string[];
  imageAlts: string[];
  missingAltCount: number;
  internalLinks: string[];
  fullText: string; // all text concatenated so you can hash it
};

export async function extractPage(url: string): Promise<ExtractedPage> {
  const res = await fetch(url);

  const html = await res.text();
  const $ = cheerio.load(html);

  // Metadata
  const title = $('title').text().trim() || null;
  const metaTitle =
    $('meta[name="title"]').attr('content') ??
    $('meta[property="og:title"]').attr('content') ??
    null;
  const metaDescription = $('meta[name="description"]').attr('content') ?? null;

  // Other SEO data
  const h1s: string[] = $('h1')
    .map((_, el) => $(el).text().trim())
    .get();
  const h2s: string[] = $('h2')
    .map((_, el) => $(el).text().trim())
    .get();
  const h3s: string[] = $('h3')
    .map((_, el) => $(el).text().trim())
    .get();
  const paragraphs: string[] = $('p')
    .map((_, el) => $(el).text().trim())
    .get();

  // Count images missing alt text
  const imageAlts: string[] = [];
  let missingAltCount = 0;
  $('img').each((_, el) => {
    const alt = $(el).attr('alt');
    if (!alt) {
      missingAltCount++;
    } else {
      imageAlts.push(alt.trim());
    }
  });

  // Internal links — hrefs that start with / or match the site domain
  const internalLinks: string[] = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (href?.startsWith('/') || href?.includes('forgevaweb.com')) {
      internalLinks.push(href);
    }
  });

  const fullText = [
    url,
    title,
    metaTitle,
    metaDescription,
    h1s,
    h2s,
    h3s,
    paragraphs,
    imageAlts,
    missingAltCount,
    internalLinks,
  ]
    .filter(Boolean)
    .join(' ');

  return {
    url,
    title,
    metaTitle,
    metaDescription,
    h1s,
    h2s,
    h3s,
    paragraphs,
    imageAlts,
    missingAltCount,
    internalLinks,
    fullText,
  };
}
