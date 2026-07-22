import type { Metadata } from 'next';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'DailyAid — Elderly Care Platform',
  description: 'DailyAid is a professional care platform that simplifies daily routines and medication tracking for the elderly.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=JetBrains+Mono:wght@100..800&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, fontFamily: '"DM Serif Display", serif' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
