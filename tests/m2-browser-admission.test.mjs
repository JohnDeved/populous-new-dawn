import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { checkpointCodec } from '../scripts/tutorial-browser/checkpoint-codec.mjs'
import { assertM2Input, m2FunctionalLimitMs } from '../scripts/tutorial-browser/m2-pointer-f8.mjs'

test('checkpoint codec preserves shared buffers, typed offsets, Maps, Sets, cycles and special scalars', () => {
  const buffer = new ArrayBuffer(32),
    view = new Uint16Array(buffer, 4, 5)
  view.set([1, 257, 65535, 42, 19])
  const a = {
    view,
    second: new Uint8Array(buffer),
    data: new DataView(buffer, 2, 7),
    map: new Map(),
    set: new Set(),
    sparse: Array(4),
    values: [undefined, NaN, Infinity, -Infinity, -0, 1n],
  }
  a.self = a
  a.map.set(a, view)
  a.set.add(a)
  const encoded = checkpointCodec(a)
  const result = checkpointCodec(JSON.parse(JSON.stringify(encoded)), true)
  assert.deepEqual(result, a)
  assert.equal(result.view.buffer, result.second.buffer)
  assert.equal(result.map.get(result), result.view)
  assert.equal(result.self, result)
  assert.deepEqual(checkpointCodec(result), encoded)
})

test('codec is self-contained for browser initialization and rejects unsupported values', () => {
  const remote = runInNewContext(`(${checkpointCodec.toString()})`)
  const encoded = checkpointCodec({ a: new Float32Array([1.25, -0]), b: new Map([[2, 3]]) })
  const copied = JSON.parse(JSON.stringify(remote(remote(encoded, true))))
  assert.deepEqual(copied, encoded)
  assert.throws(() => checkpointCodec({ fn() {} }), /Unsupported/)
  assert.throws(() => checkpointCodec(new Date()), /Unsupported/)
  assert.throws(
    () => checkpointCodec({ root: ['ref', 0], nodes: [{ type: 'view', name: 'Function' }] }, true),
    /Unsupported/
  )
})

test('M2 functional acceptance rejects level, selection, order, clock and Scene drift', () => {
  const before = { level: 2, sameScene: true, selected: [1], orders: [[1, null]], turn: 12 }
  assertM2Input(before, structuredClone(before))
  for (const change of [
    { level: 1 },
    { sameScene: false },
    { selected: [2] },
    { orders: [[1, 'attack']] },
    { turn: 13 },
  ])
    assert.throws(() => assertM2Input(before, { ...before, ...change }))
})

test('M2 is explicit selection; legacy scenarios and security/time bounds retained', () => {
  const run = readFileSync(new URL('../scripts/tutorial-browser/run.mjs', import.meta.url), 'utf8')
  assert.match(run, /POPULOUS_BROWSER_SCENARIO \|\| 'tutorial'/)
  assert.match(run, /\['tutorial', 'm2-pointer-f8'\]/)
  assert.match(run, /180000/)
  assert.match(run, /120000/)
  assert.ok(run.indexOf('receipt.result =') < run.indexOf('receipt.selectorInspection ='))
  assert.ok(run.indexOf('receipt.selectorInspection =') < run.indexOf('receipt.sceneryPlacement ='))
  assert.equal(m2FunctionalLimitMs, 45000)
  const source = readFileSync(
    new URL('../scripts/tutorial-browser/m2-pointer-f8.mjs', import.meta.url),
    'utf8'
  )
  assert.match(source, /loadBoundaryMatched = true/)
  assert.match(source, /tx.oncomplete = resolve/)
  assert.doesNotMatch(source, /showAllMissions|\.tick\(|\.startMission\(|\.setWorld\(|--no-sandbox/)
})

test('M2 terminal acceptance includes late errors, timeout and cleanup failure', async () => {
  const { mkdtempSync, rmSync } = await import('node:fs')
  const { tmpdir } = await import('node:os')
  const { join } = await import('node:path')
  const { finishM2Functional } = await import('../scripts/tutorial-browser/m2-pointer-f8.mjs')
  const output = mkdtempSync(join(tmpdir(), 'm2-contract-'))
  try {
    const good = { errors: [] }
    await finishM2Functional({ context: { async close() {} }, report: good, output })
    assert.equal(good.status, 'passed')
    assert.equal(good.contextClosed, true)
    for (const kind of ['late', 'cleanup', 'timeout', 'scenario']) {
      const report = { errors: [], timedOut: kind === 'timeout' }
      const context = {
        async close() {
          if (kind === 'late') report.errors.push('late page error')
          if (kind === 'cleanup') throw Error('close failure')
        },
      }
      await assert.rejects(
        finishM2Functional({
          context,
          report,
          output,
          failure: kind === 'scenario' ? Error('original') : undefined,
        })
      )
      assert.equal(JSON.parse(readFileSync(join(output, 'm2-pointer-f8.json'))).status, 'failed')
    }
  } finally {
    rmSync(output, { recursive: true, force: true })
  }
})

test('ordinary null-mode pointer witnesses use processed tooltip cells, not placement pointer', async () => {
  const { m2RouteReady } = await import('../scripts/tutorial-browser/m2-pointer-f8.mjs')
  const scene = {
    pointer: null,
    pointerScreen: { clientX: 700, clientY: 340 },
    tooltipInput: {
      pointer: { clientX: 700, clientY: 340 },
      route: 'unmapped-cell',
      cell: 12000,
    },
  }
  const ready = runInNewContext(`(${m2RouteReady.toString()})`, {
    window: { testSceneRef: { current: scene } },
  })
  assert.equal(ready({ x: 700, y: 340, world: true }), true)
  scene.tooltipInput.cell = 0xa020
  assert.equal(ready({ x: 700, y: 340, world: true }), true)
  for (const invalid of [1, 0xffff, -2, 2 ** 32, NaN]) {
    scene.tooltipInput.cell = invalid
    assert.equal(ready({ x: 700, y: 340, world: true }), false)
  }
  scene.tooltipInput.cell = null
  assert.equal(ready({ x: 700, y: 340, world: true }), false)
  scene.tooltipInput.cell = 12000
  scene.tooltipInput.pointer.clientX = 699
  assert.equal(ready({ x: 700, y: 340, world: true }), false)
  scene.pointerScreen = null
  scene.tooltipInput.route = 'hud'
  assert.equal(ready({ x: 100, y: 300, world: false }), true)
  const source = readFileSync(
    new URL('../scripts/tutorial-browser/m2-pointer-f8.mjs', import.meta.url),
    'utf8'
  )
  assert.match(source, /name: \/\^Skip introduction\//)
  assert.doesNotMatch(source, /name: 'Skip introduction', exact: true/)
})
