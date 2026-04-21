// @codegen.ts
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  // Generate types from your local SDL (no need to run the server for introspection).
  schema: './lib/graphql/schema.ts',
  // Scan real TS/TSX files where your `gql` template literals live.
  documents: ['app/**/*.{ts,tsx}', 'lib/**/*.{ts,tsx}'],
  // Avoid failing generation while you’re still adding the first operations.
  ignoreNoDocuments: true,
  generates: {
    './lib/graphql/generated/graphql-types.ts': {
      plugins: ['typescript', 'typescript-operations'],
      // config: {
      //   withHooks: false,
      //   withComponent: false,
      // }
    },
  },
};

export default config;
