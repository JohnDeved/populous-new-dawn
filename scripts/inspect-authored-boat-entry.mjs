// Read-only observation of createWorld's actual constructor boundary. The temporary
// module differs only by this observer call; no terrain, object or slot is changed.
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, unlinkSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const input = resolve('app/world-initialization.ts'),
  source = readFileSync(input, 'utf8')
const token = '        initializeAuthoredBoat(w, vehicle)'
assert.equal(source.split(token).length, 2)
const temp = resolve(`app/.boat-entry-${process.pid}.ts`),
  rows = []
const cells = [1426, 1427, 1428, 1555, 1556, 1683, 1684],
  corners = [1426, 1427, 1554, 1555]
globalThis.__inspectBoatEntry = (w, v, o) =>
  rows.push({
    authoredIndex: o.index,
    seed: { x: v.x, y: v.y },
    buildings: w.buildings.map(b => b.id),
    vehicles: w.vehicles.map(v => ({ id: v.id, model: v.model, x: v.x, y: v.y, active: v.active })),
    enabledSlots: Array.from({ length: 15 }, (_, i) => w.indexedSearch[(i + 1) * 12]),
    cells: cells.map(i => ({ index: i, flags: w.land.flags[i], category: w.land.categories[i] })),
    heightCorners: corners.map(i => ({ index: i, height: w.land.heights[i] })),
  })
try {
  writeFileSync(
    temp,
    source.replace(token, '        globalThis.__inspectBoatEntry(w, vehicle, o)\n' + token)
  )
  const { createWorld } = await import(pathToFileURL(temp).href),
    w = createWorld(10)
  const inputs = [
    'app/world-initialization.ts',
    'app/vehicle-initialization.ts',
    'app/vehicle-routing.ts',
    'app/native-terrain.ts',
    'app/native-math.ts',
    'app/indexed-search.ts',
    'app/level-ten.ts',
    'app/original-rules.json',
    'app/original-search.json',
  ].map(path => ({ path, sha256: sha(readFileSync(path)) }))
  const result = {
    head: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    inputs,
    sourceSha256: sha(source),
    scope: 'Actual M10 authored constructor entry; observation only',
    rows,
    final: w.vehicles.map(v => ({
      id: v.id,
      x: v.x,
      y: v.y,
      h: v.h,
      heading: v.heading,
      physics: v.physics,
      speed: v.speed,
      navigationFlags: v.navigationFlags,
    })),
  }
  mkdirSync('work/boat-initialization', { recursive: true })
  writeFileSync('work/boat-initialization/m10-entry.json', JSON.stringify(result, null, 2) + '\n')
  assert.equal(rows.length, 1)
  assert.equal(rows[0].authoredIndex, 109)
  assert.deepEqual(rows[0].seed, { x: 9814, y: 6230 })
  assert.equal(rows[0].buildings.length, 14)
  assert.deepEqual(
    rows[0].cells,
    cells.map(index => ({
      index,
      flags: index === 1426 ? 0x1000011 : 17,
      category: index === 1426 ? 8 : 1,
    }))
  )
  assert.deepEqual(
    rows[0].heightCorners,
    corners.map(index => ({ index, height: 0 }))
  )
  assert.deepEqual(rows[0].enabledSlots, Array(15).fill(0))
  assert.deepEqual(rows[0].vehicles, [])
  assert.deepEqual([w.vehicles[0].x, w.vehicles[0].y], [9586, 6002])
  console.log(JSON.stringify(result, null, 2))
} finally {
  unlinkSync(temp)
  delete globalThis.__inspectBoatEntry
}
