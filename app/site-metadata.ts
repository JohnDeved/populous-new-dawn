// Shared factual copy for document metadata and structured data.
export const siteTitle = 'Populous: New Dawn'
export const siteDescription =
  'An in-development single-player remake of Populous: The Beginning for desktop browsers. Lead your tribe, shape the land and wield spells.'

export const siteMetadata = {
  title: siteTitle,
  description: siteDescription,
  icons: { icon: '/favicon.ico' },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    type: 'website' as const,
  },
  twitter: {
    card: 'summary' as const,
    title: siteTitle,
    description: siteDescription,
  },
}

export const videoGameStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'VideoGame',
  name: siteTitle,
  description: siteDescription,
  gamePlatform: 'Desktop web browser',
  playMode: 'https://schema.org/SinglePlayer',
}
