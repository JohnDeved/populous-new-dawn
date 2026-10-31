import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url))
// Reviewed #762 atlas preserved by #838; this checks publication identity, not browser pixels.
const expectedPngHash = '41ac76c013b3926a5f186eadac7822c486f994132faf0bc9af10a96d6c53fd98'

test('shipped building atlas bytes match reviewed provenance and crop metadata', () => {
  const png = read('public/original/building-icons.png')
  const provenance = JSON.parse(read('public/original/building-icons-provenance.json'))
  const metadata = JSON.parse(read('app/original-building-icons.json'))
  assert.equal(createHash('sha256').update(png).digest('hex'), expectedPngHash)
  assert.equal(provenance.pngSha256, expectedPngHash)
  assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [300, 47])
  assert.deepEqual([metadata.width, metadata.height], [300, 47])
  assert.deepEqual(provenance.iconIds,
    Object.fromEntries(Object.entries(metadata.icons).map(([kind, icon]) => [kind, icon.id])))
})
