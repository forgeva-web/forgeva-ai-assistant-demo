// @/lib/ai/structured-data.ts
import { checkAndConsumeTokens } from '@/lib/demo/token-budget';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText, Output, NoObjectGeneratedError } from 'ai';
import { z } from 'zod';

/* TODO:
    Create lib/ai/structured-data.ts
    Define LocalBusinessSchema with nested address and geo
    Define FAQPageSchema with mainEntity array
    Define HowToSchema with step array and totalTime
    Export StructuredData union type
*/

/*
context (literal), type (literal), name, description, address (nested: streetAddress, addressLocality, addressRegion, postalCode), telephone, url, geo (latitude + longitude), openingHours (string array), priceRange
*/
export const LocalBusinessSchema = z.object({
  '@context': z.literal('https://schema.org'),
  '@type': z.literal('LocalBusiness'),
  name: z.string(),
  description: z.string().optional(),
  address: z
    .object({
      '@type': z.literal('PostalAddress'),
      streetAddress: z.string().optional(),
      addressLocality: z.string().optional(),
      addressRegion: z.string().optional(),
      postalCode: z.string().optional(),
      addressCountry: z.string().optional(),
    })
    .optional(),
  telephone: z.string().optional(),
  url: z.string().url().optional(),
  geo: z
    .object({
      '@type': z.literal('GeoCoordinates'),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    })
    .optional(),
  openingHours: z.array(z.string()).optional(),
  priceRange: z.string().optional(),
});

/*
context (literal), type (literal), mainEntity (array of { @type: 'Question', name: string, acceptedAnswer: { @type: 'Answer', text: string } })
*/
export const FAQPageSchema = z.object({
  '@context': z.literal('https://schema.org'),
  '@type': z.literal('FAQPage'),
  mainEntity: z
    .array(
      z.object({
        '@type': z.literal('Question'), // required
        name: z.string(), // required — this is the question text
        acceptedAnswer: z.object({
          '@type': z.literal('Answer'), // required
          text: z.string(), // required — this is the answer text
        }),
      })
    )
    .optional(),
});

/*
context (literal), type (literal), name, description, step (array of { @type: 'HowToStep', name: string, text: string, url?: string }), totalTime (ISO 8601 string e.g. PT30M)
*/
export const HowToSchema = z.object({
  '@context': z.literal('https://schema.org'),
  '@type': z.literal('HowTo'),
  name: z.string(), // required
  description: z.string().optional(),
  step: z
    .array(
      z.object({
        '@type': z.literal('HowToStep'), // required
        name: z.string(), // required
        text: z.string(), // required
        url: z.string().url().optional(), // optional — rarely in page content
      })
    )
    .optional(),
  totalTime: z.string().optional(),
});

export type StructuredData =
  | z.infer<typeof LocalBusinessSchema>
  | z.infer<typeof FAQPageSchema>
  | z.infer<typeof HowToSchema>;
// | 'unknown'
export function detectPageType(
  pageContent: string
): 'LocalBusiness' | 'FAQPage' | 'HowTo' {
  const content = pageContent.toLowerCase();

  if (
    content.includes('faq') ||
    content.includes('frequently asked') ||
    content.includes('q:') ||
    content.includes('a:') ||
    /^.*\?$/m.test(content)
  )
    return 'FAQPage';

  if (
    content.includes('how to') ||
    content.includes('step 1') ||
    content.includes('follow these steps') ||
    content.includes('instructions') ||
    /^\d+\.\s/m.test(content)
  )
    return 'HowTo';

  if (
    content.includes('hours') ||
    content.includes('location') ||
    content.includes('visit us') ||
    /\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/.test(content) ||
    /\d{1,6}\s[a-z]+\s(?:st|street|ave|avenue|blvd|boulevard|rd|road|dr|drive|ln|lane)\b/i.test(
      content
    )
  )
    return 'LocalBusiness';

  // return 'unknown';
  return 'LocalBusiness';
}

const STRUCTURED_DATA_SYSTEM_PROMPT = `
  You are a structured data generator...

  RULES
  - Only use information present in the page content
  - Do not hallucinate values...

  LOCALBUSINESS EXAMPLE
  {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    'name': 'Dave's Plumbing',
    'description': 'Licensed plumber serving Detroit since 2003.',
    'telephone': '(313) 555-0100',
    'url': 'https://www.example.com',
    'priceRange': '$$',
    'address': {
      '@type': 'PostalAddress',
      'streetAddress': '123 Main St',
      'addressLocality': 'Detroit',
      'addressRegion': 'MI',
      'postalCode': '48201'
    },
    'geo': {
      '@type': 'GeoCoordinates',
      'latitude': 42.3314,
      'longitude': -83.0458
    },
    'openingHours': ['Mo-Fr 08:00-18:00', 'Sa 09:00-15:00']
  }

  FAQPAGE EXAMPLE
  {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': [{
          '@type': 'Question',
          'name': 'How to find an apprenticeship?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': '<p>We provide an official service to search through available apprenticeships. To get started, create an account here, specify the desired region, and your preferences. You will be able to search through all officially registered open apprenticeships.</p>'
          }
        }, {
          '@type': 'Question',
          'name': 'Whom to contact?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'You can contact the apprenticeship office through our official phone hotline above, or with the web-form below. We generally respond to written requests within 7-10 days.'
          }
        }]
      }

  HOWTO EXAMPLE
  {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    'name': 'How to Fix a Leaky Faucet',
    'description': 'A step-by-step guide to fixing a dripping faucet yourself.',
    'totalTime': 'PT30M',
    'step': [
      {
        '@type': 'HowToStep',
        'name': 'Turn off the water supply',
        'text': 'Locate the shutoff valve under the sink and turn it clockwise until closed.'
      },
      {
        '@type': 'HowToStep',
        'name': 'Remove the faucet handle',
        'text': 'Unscrew the handle screw and pull the handle straight up to remove it.'
      }
    ]
  }
`;

export async function generateStructuredData(
  pageContent: string,
  pageType: 'LocalBusiness' | 'FAQPage' | 'HowTo'
): Promise<StructuredData> {
  const { allowed, remaining } = await checkAndConsumeTokens(35000); // JSON-LD est.
  if (!allowed) {
    throw new Error(
      `Demo token budget exceeded. You have used your allocation for today. ` +
        `The demo resets daily at midnight UTC.`
    );
  }

  if (process.env.NEXT_PUBLIC_SKIP_AI === 'true') {
    if (pageType === 'LocalBusiness') {
      return {
        '@context': 'https://schema.org' as const,
        '@type': 'LocalBusiness' as const,
        name: "Mitch's Plumbing Co",
        description:
          'Licensed and insured plumbing company serving Detroit and Metro Detroit since 2003. ' +
          'Specializing in emergency repairs, drain cleaning, pipe replacement, and water heater installation.',
        telephone: '(313) 555-0188',
        url: 'https://mitchsplumbing.com',
        priceRange: '$$',
        openingHours: ['Mo-Fr 08:00-18:00', 'Sa 09:00-14:00'],
        address: {
          '@type': 'PostalAddress' as const,
          streetAddress: '456 West 8 Mile Rd',
          addressLocality: 'Detroit',
          addressRegion: 'MI',
          postalCode: '48221',
          addressCountry: 'US',
        },
        geo: {
          '@type': 'GeoCoordinates' as const,
          latitude: 42.4389,
          longitude: -83.0458,
        },
      };
    }

    if (pageType === 'FAQPage') {
      return {
        '@context': 'https://schema.org' as const,
        '@type': 'FAQPage' as const,
        mainEntity: [
          {
            '@type': 'Question' as const,
            name: 'How quickly can you respond to an emergency plumbing call?',
            acceptedAnswer: {
              '@type': 'Answer' as const,
              text: 'Our average emergency response time is under 45 minutes for Detroit and Metro Detroit. We are available 24 hours a day, 7 days a week for emergency callouts.',
            },
          },
          {
            '@type': 'Question' as const,
            name: 'Are you licensed and insured?',
            acceptedAnswer: {
              '@type': 'Answer' as const,
              text: "Yes. Mitch's Plumbing Co is fully licensed and insured in the state of Michigan. Our master plumber license number is MI-44821.",
            },
          },
          {
            '@type': 'Question' as const,
            name: 'What areas do you serve?',
            acceptedAnswer: {
              '@type': 'Answer' as const,
              text: 'We serve Detroit and the surrounding Metro Detroit area including Wayne, Oakland, and Macomb counties.',
            },
          },
        ],
      };
    }

    // HowTo fallback
    return {
      '@context': 'https://schema.org' as const,
      '@type': 'HowTo' as const,
      name: 'How to Prepare for an Emergency Plumber Visit',
      description:
        'Steps to take before your emergency plumber arrives to minimize water damage and help the job go smoothly.',
      totalTime: 'PT15M',
      step: [
        {
          '@type': 'HowToStep' as const,
          name: 'Shut off the water supply',
          text: 'Locate the shutoff valve for the affected fixture or the main shutoff valve for your home and turn it clockwise until the water stops.',
        },
        {
          '@type': 'HowToStep' as const,
          name: 'Clear the work area',
          text: 'Remove items from under sinks or around the affected plumbing to give the plumber clear access and protect your belongings from water damage.',
        },
        {
          '@type': 'HowToStep' as const,
          name: 'Document the problem',
          text: 'Take a photo or short video of the issue before the plumber arrives. This helps with diagnosis and can be useful for insurance claims if needed.',
        },
      ],
    };
  }

  try {
    if (pageType === 'LocalBusiness') {
      const result = await generateText({
        model: anthropic('claude-sonnet-4-5'),
        system: STRUCTURED_DATA_SYSTEM_PROMPT,
        prompt: `Page Content:\n${pageContent}`,
        output: Output.object({ schema: LocalBusinessSchema }),
      });
      if (!result.output)
        throw new Error('Failed to generate LocalBusiness structured data');
      return result.output;
    }

    if (pageType === 'FAQPage') {
      const result = await generateText({
        model: anthropic('claude-sonnet-4-5'),
        system: STRUCTURED_DATA_SYSTEM_PROMPT,
        prompt: `Page Content:\n${pageContent}`,
        output: Output.object({ schema: FAQPageSchema }),
      });
      if (!result.output)
        throw new Error('Failed to generate FAQPage structured data');
      return result.output;
    }

    const result = await generateText({
      model: anthropic('claude-sonnet-4-5'),
      system: STRUCTURED_DATA_SYSTEM_PROMPT,
      prompt: `Page Content:\n${pageContent}`,
      output: Output.object({ schema: HowToSchema }),
    });
    if (!result.output)
      throw new Error('Failed to generate HowTo structured data');

    return result.output;
  } catch (error) {
    // Specific handling for schema validation failures
    if (NoObjectGeneratedError.isInstance(error)) {
      console.error('Validation failed:', {
        cause: error.cause,
        text: error.text,
        usage: error.usage,
      });
    }

    throw new Error(
      `Structured Data GENERATION ERROR: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
