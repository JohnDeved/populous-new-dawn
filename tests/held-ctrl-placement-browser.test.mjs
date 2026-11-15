import { browserCapMs } from '../scripts/tutorial-browser/scenario-policy.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  assertPlacementStep,
  inspectPlacementProbe,
  createPlacementProbeSearch,
  finishHeldCtrlPlacement,
  heldCtrlPlacementLimitMs,
} from '../scripts/tutorial-browser/held-ctrl-placement.mjs'

const state = () => ({ level: 1, paused: false, buildingIds: [1, 2], selected: [7], mode: 'hut' })
test('step oracle rejects missing/duplicate/replaced plans, modifier exit or selection drift', () => {
  const before = state(),
    after = { ...state(), buildingIds: [1, 2, 3] }
  assert.doesNotThrow(() => assertPlacementStep(before, after, 1, 'hut'))
  for (const patch of [
    { level: 2 },
    { paused: true },
    { mode: null },
    { selected: [] },
    { buildingIds: [1, 2] },
    { buildingIds: [1, 3, 4] },
    { buildingIds: [1, 2, 2] },
  ])
    assert.throws(() => assertPlacementStep(before, { ...after, ...patch }, 1, 'hut'))
  assert.doesNotThrow(() => assertPlacementStep(before, state(), 0, 'hut'))
  assert.doesNotThrow(() => assertPlacementStep(before, { ...after, mode: null }, 1, null))
})
async function fixture(run) {
  const output = mkdtempSync(join(tmpdir(), 'held-ctrl-placement-test-'))
  const report = { status: 'running', errors: [], previews: [], contextClosed: false }
  const context = { async close() {} }
  const read = () => JSON.parse(readFileSync(join(output, 'held-ctrl-placement.json'), 'utf8'))
  try {
    await run({ output, report, context, read })
  } finally {
    rmSync(output, { recursive: true, force: true })
  }
}
test('success receipt requires completed context cleanup', async () =>
  fixture(async options => {
    const result = await finishHeldCtrlPlacement(options)
    assert.equal(result.status, 'passed')
    assert.equal(result.contextClosed, true)
    assert.deepEqual(options.read(), result)
  }))
test('late runtime errors during cleanup reject acceptance', async () =>
  fixture(async options => {
    options.context.close = async () => {
      options.report.errors.push('late runtime error')
    }
    await assert.rejects(finishHeldCtrlPlacement(options), AggregateError)
    assert.equal(options.read().status, 'failed')
    assert.match(options.read().failures[0].message, /late runtime error/)
  }))
test('original failure, cleanup failure and deadline remain terminal failures', async () =>
  fixture(async options => {
    options.failed = true
    options.failure = Error('preview mismatch')
    options.report.timedOut = true
    options.context.close = async () => {
      throw Error('close failed')
    }
    await assert.rejects(finishHeldCtrlPlacement(options), AggregateError)
    const result = options.read()
    assert.equal(result.status, 'failed')
    assert.equal(result.contextClosed, false)
    assert.equal(result.failures.length, 3)
    assert.match(result.failures[0].message, /preview mismatch/)
    assert.match(result.failures[1].message, /close failed/)
    assert.match(result.failures[2].message, /60-second/)
  }))
test('source-only scenario preserves existing caps and uses real keyboard/mouse input', () => {
  assert.equal(heldCtrlPlacementLimitMs, 60000)
  assert.equal(browserCapMs('tutorial'), 240000)
  const source = readFileSync(
    new URL('../scripts/tutorial-browser/held-ctrl-placement.mjs', import.meta.url),
    'utf8'
  )
  assert.match(source, /keyboard.down\('Control'\)/)
  assert.match(source, /keyboard.up\('Control'\)/)
  assert.match(source, /page.mouse.click/)
  assert.match(source, /elementFromPoint/)
})
test('falsey original rejection remains a failure after cleanup', async () =>
  fixture(async options => {
    options.failed = true
    options.failure = undefined
    await assert.rejects(
      finishHeldCtrlPlacement(options),
      error => error instanceof AggregateError && error.errors[0] === undefined
    )
    assert.equal(options.read().status, 'failed')
  }))

test('dedicated owner bounds setup and episode without changing prior caps', () => {
  assert.equal(browserCapMs('held-ctrl-placement'), 90000)
  assert.equal(browserCapMs('building-panel-edges'), 90000)
  assert.equal(browserCapMs('frontend-held-escape'), 180000)
  const source = readFileSync(
    new URL('../scripts/tutorial-browser/run.mjs', import.meta.url),
    'utf8'
  )
  assert.match(source, /heldCtrlScenarioSha256: hash\(heldCtrlScenario\)/)
  assert.match(source, /receipt\.heldCtrlPlacement = await/)
  assert.ok(
    source.indexOf('}, receipt.browserCapMs)') < source.indexOf('receipt.heldCtrlPlacement = await')
  )
  assert.match(source, /held-ctrl-placement.json/)
})

test('probe observation distinguishes live canvas, occlusion and missing target without mutation', async () => {
  const { runInNewContext } = await import('node:vm')
  const canvas = { tagName: 'CANVAS', id: '', getAttribute: () => null }
  const overlay = { tagName: 'DIV', id: 'query', getAttribute: () => 'dialog' }
  const scene = {
    renderer: { domElement: canvas },
    cursor: { visible: true },
    world: { mode: 'hut', inputMask: 0 },
    pointerScreen: { clientX: 2, clientY: 3 },
    pointer: { x: 4, z: 5 },
    modalSuspended: false,
  }
  for (const hit of [canvas, overlay, null]) {
    const before = JSON.stringify(scene)
    const page = {
      evaluate: async (fn, point) =>
        runInNewContext(`(${fn})`, {
          window: { testSceneRef: { current: scene } },
          document: { elementFromPoint: () => hit },
        })(point),
    }
    const result = await inspectPlacementProbe(page, { x: 2, y: 3 })
    assert.equal(result.canvasOwned, hit === canvas)
    assert.equal(result.element?.tag ?? null, hit?.tagName ?? null)
    assert.equal(JSON.stringify(scene), before)
  }
})

test('candidate search consumes once while freshly validating each later placement', async () => {
  const inspected = [],
    hovered = [],
    skipped = [],
    observed = []
  let world = 0
  const search = createPlacementProbeSearch([0, 1, 2, 3, 4], {
    inspect: async point => {
      inspected.push([point, world])
      return { canvasOwned: point !== 2, point }
    },
    hover: async point => {
      hovered.push([point, world])
      return { cursor: { invalid: point === 0 } }
    },
    skipped: target => skipped.push(target.point),
    observed: point => observed.push(point),
  })
  assert.equal(await search(), 1)
  world = 1
  assert.equal(await search(), 3)
  world = 2
  assert.equal(await search(), 4)
  await assert.rejects(search(), /No distinct valid/)
  assert.deepEqual(inspected, [
    [0, 0],
    [1, 0],
    [2, 1],
    [3, 1],
    [4, 2],
  ])
  assert.deepEqual(hovered, [
    [0, 0],
    [1, 0],
    [3, 1],
    [4, 2],
  ])
  assert.deepEqual(skipped, [2])
  assert.deepEqual(observed, [0, 1, 3, 4])
})
test('candidate search propagates inspection and hover failures unchanged', async () => {
  for (const phase of ['inspect', 'hover'])
    for (const failure of [undefined, Error('timeout')]) {
      const search = createPlacementProbeSearch([0], {
        inspect: async () => {
          if (phase === 'inspect') throw failure
          return { canvasOwned: true }
        },
        hover: async () => {
          throw failure
        },
        skipped: () => assert.fail('not a skip'),
        observed: () => assert.fail('not observed'),
      })
      let caught = false
      await search().catch(error => {
        caught = true
        assert.equal(error, failure)
      })
      assert.equal(caught, true)
    }
})
