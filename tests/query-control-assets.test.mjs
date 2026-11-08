import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import art from '../decomp/research/native-help/query-control.json' with { type: 'json' }

test('all28 original Query glyph/frame assets retain declared bytes and source boundaries', () => {
  assert.equal(Object.keys(art.icons).length, 28)
  for (const asset of Object.values(art.icons)) {
    const bytes = readFileSync(new URL('../public' + asset.url, import.meta.url))
    assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256)
    assert.deepEqual([bytes.readUInt32BE(16), bytes.readUInt32BE(20)], [asset.width, asset.height])
  }
  assert.equal(art.originalExecuted, false)
  assert.equal(art.sourceDescriptor.helpTopic, 1051)
  assert.deepEqual(art.referenceRect, [64, 114, 13, 12])
})
