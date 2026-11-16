import type { Metadata } from 'next'
import './globals.css'

const title = 'Populous: New Dawn'
const description =
  'An in-development single-player remake of Populous: The Beginning for desktop browsers. Build a tribe, command followers and cast spells.'

export const metadata: Metadata = {
  title,
  description,
  icons: { icon: '/favicon.ico' },
  openGraph: { title, description, type: 'website' },
  twitter: { card: 'summary', title, description },
}

const game = {
  '@context': 'https://schema.org',
  '@type': 'VideoGame',
  name: title,
  description,
  gamePlatform: 'Desktop web browser',
  playMode: 'https://schema.org/SinglePlayer',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(game).replace(/</g, '\\u003c') }}
        />
        {children}
      </body>
    </html>
  )
}
