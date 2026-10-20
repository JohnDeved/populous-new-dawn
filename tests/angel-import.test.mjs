import assert from 'node:assert/strict'
import test from 'node:test'
import { createHash } from 'node:crypto'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import angel from '../app/original-angel.json' with { type: 'json' }
import pins from '../scripts/angel-inputs.json' with { type: 'json' }

const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const asset = new URL('../app/original-angel.json', import.meta.url)

test('verified Angel data retains two textured bases and seventeen raw point sets', () => {
  assert.equal(hash(readFileSync(asset)), 'b30b00102c96c7b992354a459eb4fa256ed5bd51773194742c3ed886b1f38c89')
  assert.deepEqual(Object.keys(angel.bases), ['62', '69'])
  assert.deepEqual(Object.keys(angel.points).map(Number), Array.from({ length: 17 }, (_, i) => 62 + i))
  assert.deepEqual(angel.provenance.inputSha256, pins.inputSha256)
  assert.deepEqual(angel.provenance.banks, [2, 6])
  for (const points of Object.values(angel.points)) {
    assert.equal(points.length, 87)
    assert.ok(points.every(p => p.length === 3 && p.every(n => Number.isInteger(n) && n >= -32768 && n <= 32767)))
  }
  for (const [id, base] of Object.entries(angel.bases)) {
    assert.equal(base.model.faces.length, 222)
    assert.equal(base.model.scale, 160)
    assert.equal(base.pointIndices.length, 471)
    assert.equal(base.model.p.length, 1413)
    assert.equal(base.model.uv.length, 942)
    assert.equal(base.model.tiles.filter(tile => angel.tribeTiles.includes(tile)).length, 73)
    for (const [vertex, index] of base.pointIndices.entries())
      for (let axis = 0; axis < 3; axis++)
        assert.equal(Math.round(base.model.p[vertex * 3 + axis] * 480 * (axis === 2 ? -1 : 1)), angel.points[id][index][axis])
    assert.deepEqual(angel.cycles[base.morph].segments.map(s => [s.first, s.last, s.duration]), [
      [0, 1, 2], [2, 3, 2], [4, 5, 2], [6, 7, 2], [8, 9, 2], [10, 11, 2],
    ])
    assert.equal(angel.cycles[base.morph].lastFrame, 11)
  }
  assert.equal(hash(readFileSync(new URL('../public/original/atlas.png', import.meta.url))), pins.modelAtlasSha256)
})

test('scoped importer refuses invalid source bytes without changing its owned output', () => {
  const directory = mkdtempSync(join(tmpdir(), 'angel-import-'))
  const before = readFileSync(asset)
  try {
    mkdirSync(join(directory, 'objects'))
    const name = Object.keys(pins.inputSha256)[0]
    writeFileSync(join(directory, name), 'not original game data')
    for (const args of [[], ['--check']]) {
      const result = spawnSync('python3', [new URL('../scripts/import-angel.py', import.meta.url).pathname, directory, ...args], { encoding: 'utf8', timeout: 10000 })
      assert.equal(result.status, 1)
      assert.match(result.stderr, /Unexpected source hash/)
      assert.deepEqual(readFileSync(asset), before)
    }
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})
