// @/app/opengraph-image.tsx
import { ImageResponse } from 'next/og';

// import { readFileSync } from 'fs';
// import { join } from 'node:path';

// Image metadata
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    <div
      style={{
        background: '#0f172a',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: 64,
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            background: '#2563eb',
            width: 48,
            height: 48,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            fontWeight: 700,
            color: 'white',
          }}
        >
          F
        </div>
        <span style={{ color: '#94a3b8', fontSize: 20 }}>
          Forgeva AI Assistant
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            color: 'white',
            fontSize: 52,
            fontWeight: 700,
            lineHeight: 1.1,
            marginBottom: 16,
          }}
        >
          AI-Powered SEO & AISO Optimization
        </div>
        <div style={{ color: '#64748b', fontSize: 22 }}>
          Next.js 15 · GraphQL · Anthropic Claude · Supabase
        </div>
      </div>

      <div style={{ color: '#334155', fontSize: 16 }}>
        github.com/duffymitch12/forgeva-ai-assistant
      </div>
    </div>
  );
}
