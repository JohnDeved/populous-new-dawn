import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { matchMetadataFileBaseName, scanMetadataFiles, invalidateMetadataFileCache } from '../node_modules/vinext/dist/server/metadata-routes.js'

test('metadata filenames require their own prefix, retaining optional single-digit variants', () => {
  for (const kind of ['icon', 'apple-icon', 'opengraph-image', 'twitter-image']) {
    assert.equal(matchMetadataFileBaseName(kind, kind), kind)
    for (let i = 0; i < 10; i++) {
      assert.equal(matchMetadataFileBaseName(kind, `${kind}${i}`), `${kind}${i}`)
      assert.equal(matchMetadataFileBaseName(kind, `${'x'.repeat(kind.length)}${i}`), null)
    }
    for (const suffix of ['10', '-1', 'a', '']) {
      if (suffix) assert.equal(matchMetadataFileBaseName(kind, `${kind}${suffix}`), null)
    }
  }
  assert.equal(matchMetadataFileBaseName('twitter-image', 'stone-head-149'), null)
  assert.equal(matchMetadataFileBaseName('robots', 'robots'), 'robots')
  assert.equal(matchMetadataFileBaseName('robots', 'robots1'), null)
})

test('file scanner ignores game module but retains genuine social image routes', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pnd-metadata-filenames-'))
  try {
    for (const file of ['stone-head-149.ts', 'twitter-image.tsx', 'twitter-image9.png', 'opengraph-image.png']) writeFileSync(join(dir, file), '')
    invalidateMetadataFileCache()
    const routes = scanMetadataFiles(dir)
    assert.deepEqual(routes.map(r => r.filePath.split('/').at(-1)).sort(), ['opengraph-image.png', 'twitter-image.tsx', 'twitter-image9.png'])
  } finally {
    invalidateMetadataFileCache()
    rmSync(dir, { recursive: true, force: true })
  }
})
