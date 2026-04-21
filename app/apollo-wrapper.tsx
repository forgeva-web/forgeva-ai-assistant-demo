'use client';

import { HttpLink } from '@apollo/client';
import {
  ApolloNextAppProvider,
  ApolloClient,
  InMemoryCache,
} from '@apollo/client-integration-nextjs';

function makeClient() {
  const httpLink = new HttpLink({
    // Use an absolute URL for SSR
    uri: 'http://localhost:3000/api/graphql',
    fetchOptions: {
      // Optional: Next.js specific fetch options
      // Note: This doesn't work with `export const dynamic = "force-static"`
    },
  });

  return new ApolloClient({
    cache: new InMemoryCache(),
    link: httpLink,
    defaultOptions: {
      watchQuery: {
        fetchPolicy:
          process.env.NODE_ENV === 'development'
            ? 'cache-first'
            : 'cache-and-network',
      },
    },
  });
}

export function ApolloWrapper({ children }: React.PropsWithChildren) {
  return (
    <ApolloNextAppProvider makeClient={makeClient}>
      {children}
    </ApolloNextAppProvider>
  );
}
