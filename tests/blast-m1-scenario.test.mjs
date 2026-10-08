import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import ordinaryM1EnemyBlast, { createM1EnemyPreparation } from '../qa/blast-ordinary/m1-scenario.mjs'

test('enemy admission has no stationary neighborhood helper or pixel offsets', () => {
  const source = readFileSync(new URL('../qa/blast-ordinary/m1-scenario.mjs', import.meta.url), 'utf8')
  const admission = source.slice(source.indexOf('    let previous\n'), source.indexOf("    }, 'first eligible real moving-enemy pixel and natural hover')"))
  assert.ok(admission.length > 0)
  assert.doesNotMatch(admission, /findEntityInput|interiorRadius|\bd[xy]\b/)
  assert.match(admission, /inspectEntityPoint\(s, 'units', point\)/)
  assert.match(admission, /actual\.canvasOwned && actual\.hitId === target\.id/)
})

test('preparation keeps first gate failures and motion when its bounded tail rolls', () => {
  const preparation = createM1EnemyPreparation(2)
  preparation.observe({ turn: 526, gates: { moving: false, pixel: false, range: true }, ready: false })
  preparation.observe({ turn: 527, gates: { moving: true, pixel: false, range: true }, ready: false })
  preparation.observe({ turn: 528, gates: { moving: true, pixel: true, range: true }, ready: true })
  preparation.observe({ turn: 529, gates: { moving: true, pixel: false, range: false }, ready: false })
  const result = preparation.read()
  assert.equal(result.total, 4); assert.equal(result.dropped, 2)
  assert.deepEqual(result.rows.map(row => row.turn), [528, 529])
  assert.equal(result.firstFailures.moving.turn, 526)
  assert.equal(result.firstFailures.pixel.turn, 526)
  assert.equal(result.firstFailures.range.turn, 529)
  assert.equal(result.firstMoving.turn, 527)
  assert.equal(result.firstReady.turn, 528)
})

test('retained preparation is detached from both producer and readers', () => {
  const preparation = createM1EnemyPreparation()
  const row = { turn: 526, gates: { moving: false, pixel: false }, position: { x: 1, y: 2 }, ready: false }
  preparation.observe(row)
  row.position.x = 99; row.gates.pixel = true
  const copy = preparation.read()
  copy.rows[0].position.y = 99; copy.firstFailures.pixel.position.x = 99
  const retained = preparation.read()
  assert.deepEqual(retained.rows[0].position, { x: 1, y: 2 })
  assert.equal(retained.firstFailures.pixel.gates.pixel, false)
  assert.deepEqual(retained.firstFailures.pixel.position, { x: 1, y: 2 })
})

test('preparation rejects invalid bounds and turns without adding evidence', () => {
  for (const capacity of [0, -1, 97, 1.5, Infinity]) assert.throws(() => createM1EnemyPreparation(capacity))
  const preparation = createM1EnemyPreparation()
  for (const turn of [-1, 1.5, NaN, undefined])
    assert.throws(() => preparation.observe({ turn, gates: {}, ready: false }))
  assert.equal(preparation.read().total, 0)
})

test('scenario refuses baseline or reused profiles before any browser operation', async () => {
  const previous = process.env.POPULOUS_BLAST_EXPECTATION
  let browserReads = 0
  const page = new Proxy({}, { get() { browserReads++; throw Error('Unexpected browser operation') } })
  try {
    process.env.POPULOUS_BLAST_EXPECTATION = 'baseline'
    await assert.rejects(ordinaryM1EnemyBlast({ page, receipt: {} }), /candidate/)
    process.env.POPULOUS_BLAST_EXPECTATION = 'candidate'
    await assert.rejects(ordinaryM1EnemyBlast({ page, receipt: { profile: { mode: 'reused' } } }), /fresh candidate profile/)
    assert.equal(browserReads, 0)
  } finally {
    if (previous === undefined) delete process.env.POPULOUS_BLAST_EXPECTATION
    else process.env.POPULOUS_BLAST_EXPECTATION = previous
  }
})
