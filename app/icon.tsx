// @/app/icon.tsx
import { ImageResponse } from 'next/og';

// Image metadata
export const size = { width: 32, height: 32 };

export const contentType = 'image/png';

// Image generation
export default function Icon() {
  return (
    new ImageResponse(
      // ImageResponse JSX elt.
      <div
        style={{
          background: '#2563eb',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 6,
          fontSize: 18,
          fontWeight: 700,
          color: 'white',
        }}
      >
        F
      </div>,
    {
      ...size,
    }
  )
  );
}
