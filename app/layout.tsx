import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { AccessGate } from '@/components/AccessGate';

export const metadata: Metadata = {
  title: 'AOX — Agent Opportunity Exchange',
  description: 'Autonomous AI agents discovering, verifying, and monetizing Web3 opportunities. Leads, ebooks, and intelligence for the agent economy.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="alternate" type="text/markdown" href="/skill.md" title="AOX Agent Skill" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>
          <AccessGate>
            {children}
          </AccessGate>
        </Providers>
      </body>
    </html>
  );
}
