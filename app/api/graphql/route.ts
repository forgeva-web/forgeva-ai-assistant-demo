// app/api/graphql/route.ts
import { NextRequest } from 'next/server';

import { resolvers } from '@/lib/graphql/resolvers';
import { typeDefs } from '@/lib/graphql/schema';
import { checkRateLimit } from '@/lib/rate-limit';
import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { auth } from '@clerk/nextjs/server';

// context type
export type GraphQLContext = {
  userId: string | null;
};

const server = new ApolloServer({ typeDefs, resolvers });

const handler = startServerAndCreateNextHandler(server, {
  context: async (): Promise<GraphQLContext> => {
    // auth() reads the Clerk session from the request headers
    // Returns { userId: string } if signed in, { userId: null } if not
    const { userId } = await auth();
    return { userId };
  },
});

export async function GET(request: NextRequest) {
  if (process.env.DISABLE_GRAPHQL === 'true') {
    return new Response('GraphQL disabled in frontend-only mode', {
      status: 503,
    });
  }
  return handler(request);
}

export async function POST(request: NextRequest) {
  // Rate limit demo mode requests check

  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
    if (!checkRateLimit(ip, 10, 60_000)) {
      return new Response(
        JSON.stringify({
          errors: [{ message: 'Rate limit exceeded. Try again in a minute.' }],
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
  // GraphQL disabled in frontend-only development mode check
  if (process.env.DISABLE_GRAPHQL === 'true') {
    return new Response('GraphQL disabled in frontend-only mode', {
      status: 503,
    });
  }
  return handler(request);
}
