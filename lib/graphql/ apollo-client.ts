// lib/graphql/apollo-client.ts
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

let client: ApolloClient | null = null;

export function getApolloClient() {
  if (!client) {
    client = new ApolloClient({
      link: new HttpLink({
        uri: `${process.env.NEXT_PUBLIC_GRAPHQL_URL}/api/graphql`,
      }),
      cache: new InMemoryCache(),
    });
  }
  return client;
}
