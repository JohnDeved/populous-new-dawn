import type { Metadata } from 'next'
import { siteMetadata, videoGameStructuredData } from './site-metadata'
import './globals.css'

export const metadata: Metadata = siteMetadata

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(videoGameStructuredData).replace(/</g, '\\u003c'),
          }}
        />
        {children}
      </body>
    </html>
  )
}
