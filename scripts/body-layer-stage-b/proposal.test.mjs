import test from 'node:test'
import assert from 'node:assert/strict'
import { gzipSync } from 'node:zlib'
import { readFileSync } from 'node:fs'
import { timedCallback } from './timed-page.mjs'
import { protocol } from './protocol.mjs'
import { summarize, compareTerminal } from './terminal-proof.mjs'
import { verifyReferences } from './reference-binding.mjs'
import { sha } from '../../scripts/body-layer-stage-a/io.mjs'
import { checkpointCodec } from '../../scripts/tutorial-browser/checkpoint-codec.mjs'

test('fixed eight fresh children, four warmups and 24 samples; missing references prevent launch', () => {
  assert.equal(protocol.order.length, 8)
  assert.equal(protocol.warmups, 4)
  assert.equal(protocol.measured, 24)
  for (const cohort of ['camera', 'animation'])
    assert.deepEqual(
      protocol.order.filter(r => r[0] === cohort).map(r => r.slice(1)),
      [
        ['baseline', 'AB'],
        ['candidate', 'AB'],
        ['candidate', 'BA'],
        ['baseline', 'BA'],
      ]
    )
  assert.throws(() => verifyReferences('/tmp/body-stage-b-missing-references'), /ENOENT/)
  const r = summarize(Array.from({ length: 28 }, (_, i) => ({ index: i, elapsedMs: i })))
  assert.equal(r.measured.length, 24)
  assert.equal(r.p50, 15)
  assert.equal(r.p95, 26)
  assert.equal(r.max, 27)
  assert.throws(() =>
    summarize(Array.from({ length: 28 }, (_, i) => ({ index: i, elapsedMs: NaN })))
  )
})
test('timer brackets actual animate only; original exceptions retained and successor canceled', async () => {
  const originals = Object.fromEntries(
    ['window', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'].map(k => [
      k,
      Object.getOwnPropertyDescriptor(globalThis, k),
    ])
  )
  const calls = [],
    world = { inputMask: 0, turn: 70 },
    scene = {
      world,
      frame: 42,
      cameraPosition: { angle: 0 },
      previous: 0,
      view: {
        painter: { transparentMeshes: [], renderLeaseBases: [], suppressedBodyMaterials: [] },
      },
      renderer: { info: { render: { calls: 123, triangles: 300, lines: 0, points: 0, frame: 1 } } },
    }
  let clock = 0
  try {
    Object.defineProperty(globalThis, 'performance', {
      configurable: true,
      value: {
        now() {
          calls.push('clock')
          return (clock += 10)
        },
      },
    })
    globalThis.window = {
      testSceneRef: { current: scene },
      testStore: { getWorld: () => world },
      __bodyStep: 0,
    }
    globalThis.requestAnimationFrame = fn => {
      calls.push('raf')
      fn()
      return 1
    }
    globalThis.cancelAnimationFrame = () => calls.push('cancel')
    window.__bodyCapture = () => {
      calls.push('capture')
      return { pixels: 'raw' }
    }
    window.__bodyPack = async x => {
      calls.push('pack')
      return x
    }
    scene.animate = now => {
      calls.push('animate')
      scene.previous = now
    }
    const row = await timedCallback({
      now: 123,
      cohort: 'camera',
      expectedAngle: 0,
      index: 0,
      expected: { previous: 0, preTurn: 70, preStep: 0, turn: 70, step: 1, now: 123 },
      terminal: true,
    })
    assert.deepEqual(calls, [
      'cancel',
      'raf',
      'clock',
      'animate',
      'clock',
      'cancel',
      'capture',
      'pack',
    ])
    assert.equal(row.elapsedMs, 10)
    calls.length = 0
    const error = new Error('original')
    scene.animate = () => {
      throw error
    }
    const failed = await timedCallback({
      now: 124,
      cohort: 'camera',
      expectedAngle: 0,
      index: 1,
      expected: { previous: 123, preTurn: 70, preStep: 1, turn: 70, step: 2, now: 124 },
    })
    assert.equal(failed.status, 'failed')
    assert.equal(failed.elapsedMs, 10)
    assert.match(failed.error.message, /original/)
    assert.equal(calls.at(-1), 'cancel')
  } finally {
    for (const [k, d] of Object.entries(originals)) {
      if (d) Object.defineProperty(globalThis, k, d)
      else delete globalThis[k]
    }
  }
})
test('terminal oracle preserves full encoded graph, raw pixels and same-source counters', () => {
  const shared = { n: -0 },
    state = checkpointCodec({ a: shared, b: shared, n: NaN, u: undefined }),
    picks = checkpointCodec([{ id: 2, depth: Infinity }]),
    pixels = Buffer.from([1, 2, 3, 4]),
    body = Buffer.from(JSON.stringify({ state, picks })),
    row = {
      pixelFile: 'pixel',
      stateFile: 'state',
      pixelSha256: sha(pixels),
      stateSha256: sha(body),
      width: 1,
      height: 1,
      counters: { calls: 4 },
    }
  const report = {
    revision: 'source',
    cohort: 'camera',
    side: 'baseline',
    environment: { gpu: 'fixture' },
    browserVersion: 'v',
    browserBinary: { sha256: 'binary' },
    initialStateSha256: 'initial',
  }
  const reference = {
      ...report,
      status: 'passed',
      steps: Array(28).fill(row),
      controls: Array(24).fill({}),
    },
    actual = {
      state,
      picks,
      pixels: pixels.toString('base64'),
      width: 1,
      height: 1,
      counters: row.counters,
    },
    read = f => gzipSync(f === 'pixel' ? pixels : body)
  assert.equal(compareTerminal(report, actual, reference, read, checkpointCodec).status, 'passed')
  assert.throws(() =>
    compareTerminal(
      report,
      { ...actual, state: checkpointCodec({ a: { n: 0 } }) },
      reference,
      read,
      checkpointCodec
    )
  )
  assert.throws(() =>
    compareTerminal(report, { ...actual, pixels: 'AAAAAA==' }, reference, read, checkpointCodec)
  )
  assert.throws(() =>
    compareTerminal(report, { ...actual, counters: { calls: 5 } }, reference, read, checkpointCodec)
  )
})
test('worker has no per-step observation, graph or readback work', () => {
  const s = readFileSync(new URL('./worker.mjs', import.meta.url), 'utf8'),
    loop = s.slice(
      s.indexOf('  for (let i = 0; i < p.callbacks; i++) {'),
      s.indexOf('    if (i === 27)')
    )
  assert.match(loop, /timedCallback/)
  for (const forbidden of [
    'observe(',
    'picksAfterPixels',
    'store(',
    'persist(',
    'readPixels',
    'JSON.stringify',
  ])
    assert.ok(!loop.includes(forbidden), forbidden)
})

test('setup reserve fails before timing when 760s children plus40s finalization cannot fit', async () => {
  const { admitRemaining } = await import('./budget.mjs')
  assert.equal(admitRemaining(900000, 100000, 0).required, 800000)
  assert.throws(() => admitRemaining(900000, 100001, 0))
  assert.equal(admitRemaining(900000, 195000, 1).required, 705000)
  const source = readFileSync(new URL('./worker.mjs', import.meta.url), 'utf8')
  assert.match(source, /process.on\('SIGTERM'/)
  assert.ok(
    source.indexOf('persist() // completed rows') < source.indexOf('await context?.close()')
  )
  assert.match(source, /report.attempt\s*=/)
})

test('actual SIGTERM handler persists completed rows and attempted-step metadata before bounded exit', async () => {
  const { spawn } = await import('node:child_process'),
    { mkdtempSync, writeFileSync } = await import('node:fs'),
    { tmpdir } = await import('node:os'),
    { join } = await import('node:path')
  const dir = mkdtempSync(join(tmpdir(), 'body-signal-')),
    receipt = join(dir, 'partial.json'),
    script = join(dir, 'child.mjs')
  const source = readFileSync(new URL('./worker.mjs', import.meta.url), 'utf8')
  const block = source.slice(
    source.indexOf('const workerStarted'),
    source.indexOf('const pendingResponses')
  )
  writeFileSync(
    script,
    `import {writeFileSync} from 'node:fs';let browser={close:async()=>{}},timer;const p={childMs:60000};const report={status:'incomplete',steps:[{index:0,elapsedMs:12}],attempt:{index:1,elapsedMs:null}};const persist=()=>writeFileSync(${JSON.stringify(receipt)},JSON.stringify(report));\n${block}\nconsole.log('ready');setInterval(()=>{},1000);`
  )
  const child = spawn(process.execPath, [script], { stdio: ['ignore', 'pipe', 'pipe'] })
  let signaled = false
  child.stdout.on('data', () => {
    if (!signaled) {
      signaled = true
      child.kill('SIGTERM')
    }
  })
  const result = await new Promise((resolve, reject) => {
    child.on('error', reject)
    child.on('exit', (code, signal) => resolve({ code, signal }))
  })
  assert.equal(result.code, 1)
  assert.equal(result.signal, null)
  const saved = JSON.parse(readFileSync(receipt))
  assert.equal(saved.interruption, 'SIGTERM')
  assert.equal(saved.status, 'incomplete')
  assert.deepEqual(saved.steps, [{ index: 0, elapsedMs: 12 }])
  assert.deepEqual(saved.attempt, { index: 1, elapsedMs: null })
})
