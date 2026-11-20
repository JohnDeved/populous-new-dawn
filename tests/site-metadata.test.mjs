import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import ts from 'typescript'
import { renderToStaticMarkup } from 'react-dom/server'

const source = readFileSync(new URL('../app/layout.tsx', import.meta.url), 'utf8')
let code = ts.transpileModule(source, {
  compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText
code = code.replace(/import ['"]\.\/globals\.css['"];?/, '')
code = code.replace(/(['"])react\/jsx-runtime\1/g, JSON.stringify(import.meta.resolve('react/jsx-runtime')))
// The old metadata owner reads a request host. Supply that framework boundary so
// the baseline fails on product content, rather than a missing framework import.
code = code.replace(/import \{ headers \} from ['"]next\/headers['"];?/, 'const headers = async () => new Map([["host", "localhost:3000"]]);')
const layout = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
const metadata = layout.metadata ?? await layout.generateMetadata()

test('document and social metadata consistently describe the unfinished desktop game', () => {
  assert.equal(metadata.title, 'Populous: New Dawn')
  assert.match(metadata.description, /in-development.*single-player.*desktop browsers/)
  assert.equal(metadata.openGraph.title, metadata.title)
  assert.equal(metadata.openGraph.description, metadata.description)
  assert.equal(metadata.twitter.title, metadata.title)
  assert.equal(metadata.twitter.description, metadata.description)
  assert.equal(metadata.twitter.card, 'summary')
  assert.deepEqual(metadata.openGraph.images, [])
  assert.deepEqual(metadata.twitter.images, [])
  assert.equal(metadata.robots, undefined)
  assert.equal(metadata.alternates, undefined)
})

test('actual root layout emits matching restrained VideoGame JSON-LD and preserves children', () => {
  const html = renderToStaticMarkup(layout.default({ children: 'game-child-marker' }))
  assert.match(html, /<html lang="en">/)
  assert.match(html, /game-child-marker/)
  const scripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  assert.equal(scripts.length, 1)
  const data = JSON.parse(scripts[0][1])
  assert.equal(data['@context'], 'https://schema.org')
  assert.equal(data['@type'], 'VideoGame')
  assert.equal(data.name, metadata.title)
  assert.equal(data.description, metadata.description)
  assert.equal(data.playMode, 'https://schema.org/SinglePlayer')
  assert.equal(data.gamePlatform, 'Desktop web browser')
  for (const absent of ['url', 'image', 'datePublished', 'offers', 'aggregateRating', 'publisher']) {
    assert.equal(data[absent], undefined, `no unsupported ${absent}`)
  }
})

test('framework fallback boundary respects explicit empty social images', async () => {
  const { applyFileBasedMetadata } = await import(new URL('./server/file-based-metadata.js', import.meta.resolve('vinext')))
  // This helper boundary excludes per-page sources; actual route discovery is
  // covered below, and the deployed document is checked separately.
  const routes = ['openGraph', 'twitter'].map(kind => ({
    routePrefix: '', routeSegments: [],
    headData: { kind, href: '/unrelated-game-asset.png', type: 'image/png' },
  }))
  const applied = await applyFileBasedMetadata(metadata, '/', {}, routes)
  assert.deepEqual(applied.openGraph.images, [])
  assert.deepEqual(applied.twitter.images, [])
})

// The unpatched Vinext matcher still accepts some unrelated numeric names.
// Keep internal gameplay code clear of those names and scan the actual app tree.
test('the app tree does not expose gameplay modules as social image routes', async () => {
  const { scanMetadataFiles, matchMetadataFileBaseName } = await import(new URL('./server/metadata-routes.js', import.meta.resolve('vinext')))
  for (const kind of ['icon', 'apple-icon', 'opengraph-image', 'twitter-image']) {
    assert.equal(matchMetadataFileBaseName(kind, kind), kind)
    assert.equal(matchMetadataFileBaseName(kind, `${kind}1`), `${kind}1`)
  }
  for (const kind of ['icon', 'apple-icon', 'opengraph-image', 'twitter-image']) {
    assert.equal(matchMetadataFileBaseName(kind, 'stone-head-149-model'), null)
  }
  const routes = scanMetadataFiles(new URL('../app', import.meta.url).pathname)
  assert.deepEqual(routes.filter(route => ['twitter-image', 'opengraph-image'].includes(route.type)), [])
})
