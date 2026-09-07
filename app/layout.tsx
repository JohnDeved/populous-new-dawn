import type { Metadata } from 'next';
import { headers } from 'next/headers';
import './globals.css';
export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get('host') || 'localhost:3000';
  const origin = `${host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https'}://${host}`;
  return {
    title: 'Populous · The First Dawn',
    description: 'Lead your tribe. Shape the earth. Become a god. A playable browser tribute to Populous: The Beginning.',
    icons: { icon: '/favicon.png' },
    openGraph: { title: 'Populous · The First Dawn', description: 'Lead your tribe. Shape the earth. Become a god.', type: 'website', images: [{ url: `${origin}/og.png`, width: 1536, height: 1024, alt: 'A blue coastal tribe beneath a rocky mountain at dawn' }] },
    twitter: { card: 'summary_large_image', title: 'Populous · The First Dawn', images: [`${origin}/og.png`] },
  };
}
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
