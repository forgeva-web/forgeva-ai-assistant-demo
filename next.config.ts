// @/next.config.ts
import type { NextConfig } from 'next';

import { readFileSync } from 'fs';
import { resolve } from 'path';

const pkg = JSON.parse(
  readFileSync(resolve(process.cwd(), 'package.json'), 'utf-8')
) as { version: string };

const nextConfig: NextConfig = {
  // cacheComponents: true,
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
  },
  turbopack: {},
  serverExternalPackages: ['pg', '@prisma/adapter-pg'],
};

export default nextConfig;
