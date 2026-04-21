// @/app/layout.tsx
// import { DemoBanner } from "@/components/demo-banner";
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import { ApolloWrapper } from '@/app/apollo-wrapper';

import { TooltipProvider } from '@/components/ui/tooltip';

import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://forgeva-ai-assistant.vercel.app/'),
  title: {
    default: 'Forgeva AI Assistant',
    template: '%s · Forgeva AI',
  },
  description:
    'AI-powered SEO and AISO optimization for local business websites.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ApolloWrapper>
          <TooltipProvider>{children}</TooltipProvider>
        </ApolloWrapper>
      </body>
    </html>
  );
}
