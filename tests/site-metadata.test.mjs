import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { siteTitle, siteDescription, siteMetadata, videoGameStructuredData } from '../app/site-metadata.ts'

test('document and social metadata agree on the current name and development scope', () => {
  assert.equal(siteTitle, 'Populous: New Dawn')
  assert.match(siteDescription, /in-development single-player/)
  assert.match(siteDescription, /desktop browsers/)
  for (const metadata of [siteMetadata, siteMetadata.openGraph, siteMetadata.twitter]) {
    assert.equal(metadata.title, siteTitle)
    assert.equal(metadata.description, siteDescription)
    assert.equal(Object.hasOwn(metadata, 'images'), false)
  }
  assert.equal(siteMetadata.twitter.card, 'summary')
})

test('VideoGame structured data is restrained and matches public metadata', () => {
  assert.deepEqual(videoGameStructuredData, {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: siteTitle,
    description: siteDescription,
    gamePlatform: 'Desktop web browser',
    playMode: 'https://schema.org/SinglePlayer',
  })
  assert.equal(Object.hasOwn(siteMetadata, 'alternates'), false)
  assert.equal(Object.hasOwn(siteMetadata, 'robots'), false)
})

test('root layout emits the shared structured data and no stale social image', () => {
  const layout = readFileSync(new URL('../app/layout.tsx', import.meta.url), 'utf8')
  assert.match(layout, /metadata: Metadata = siteMetadata/)
  assert.match(layout, /type="application\/ld\+json"/)
  assert.match(layout, /JSON\.stringify\(videoGameStructuredData\)/)
  assert.match(layout, /\.replace\(\/<\/g, '\\\\u003c'\)/)
  assert.doesNotMatch(layout, /headers\(|og\.png|The First Dawn/)
  const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8')
  assert.match(readme, /^# Populous: New Dawn/)
})
