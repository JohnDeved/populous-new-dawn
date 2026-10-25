import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import test, { mock } from 'node:test'

if (!process.execArgv.includes('--experimental-test-module-mocks')) {
  test('deferred veto Set through actual task dispatch', t => {
    const env = { ...process.env, NODE_OPTIONS: '', NODE_PATH: '' }
    delete env.NODE_TEST_CONTEXT
    const result = spawnSync(
      process.execPath,
      ['--experimental-test-module-mocks', '--test', fileURLToPath(import.meta.url)],
      { encoding: 'utf8', timeout: 30_000, env }
    )
    t.diagnostic(result.stdout)
    assert.equal(result.status, 0, result.stdout + result.stderr)
  })
} else {
  const construction = await import('../app/construction-runtime.ts')
  let preparations = 0,
    proposals = 0,
    accept = false,
    selected = 0,
    paths = 0,
    sets = 0,
    footprintCalls = 0,
    throwFootprint = false,
    selectionCalls = 0,
    routeAccepted = false
  const footprints = new WeakSet()
  const shapes = await import('../app/building-shapes.ts')
  mock.module(new URL('../app/building-shapes.ts', import.meta.url), {
    cache: true,
    namedExports: {
      ...shapes,
      buildingFootprintCells(...args) {
        footprintCalls++
        if (throwFootprint) throw new RangeError('footprint witness')
        const cells = shapes.buildingFootprintCells(...args)
        footprints.add(cells)
        return cells
      },
    },
  })
  const NativeSet = globalThis.Set
  globalThis.Set = new Proxy(NativeSet, {
    construct(target, args, receiver) {
      if (args[0] && footprints.has(args[0])) sets++
      return Reflect.construct(target, args, receiver)
    },
  })
  mock.module(new URL('../app/construction-runtime.ts', import.meta.url), {
    cache: true,
    namedExports: {
      ...construction,
      prepareBuildingSiteCheck() {
        preparations++
        return () => {
          proposals++
          return { valid: accept, flags: 0 }
        }
      },
      checkBuildingSite() {
        preparations++
        proposals++
        return { valid: accept, flags: 0 }
      },
    },
  })
  const selection = await import('../app/computer-selection.ts')
  mock.module(new URL('../app/computer-selection.ts', import.meta.url), {
    cache: true,
    namedExports: {
      ...selection,
      selectComputerPeople(...args) {
        selectionCalls++
        return selected ? [selected] : selection.selectComputerPeople(...args)
      },
    },
  })
  const commands = await import('../app/live-command.ts')
  mock.module(new URL('../app/live-command.ts', import.meta.url), {
    cache: true,
    namedExports: {
      ...commands,
      findPath() {
        paths++
        return routeAccepted ? [{ x: 0, z: 0 }] : []
      },
    },
  })
  const { createWorld } = await import('../app/world-initialization.ts')
  const { stepComputerTasks } = await import('../app/computer-runtime.ts?deferred-veto')
  function scenario() {
    const w = createWorld(6)
    for (const t of w.ai.tasks) t.flags = 0
    Object.assign(w.ai.tasks[0], {
      flags: 1,
      type: 0,
      phase: 2,
      requested: 1,
      target: 0x8080,
      elapsed: 0,
      remaining: 2000,
      mode: 1,
      fallback: 0,
      members: [],
    })
    w.ai.cursor = 0
    w.turn = 1
    w.units = [] // Valid proposals fail worker selection, not placement.
    preparations = proposals = paths = selected = sets = footprintCalls = 0
    throwFootprint = routeAccepted = false
    selectionCalls = 0
    return w
  }
  test('rejected proposals retain footprint evaluation but allocate no veto Sets', () => {
    const w = scenario()
    accept = false
    stepComputerTasks(w, w.activeCampaignTribe)
    assert.equal(proposals, 40)
    assert.equal(preparations, 1)
    assert.equal(sets, 0)
    assert.equal(footprintCalls, proposals)
    stepComputerTasks(w, w.activeCampaignTribe)
    assert.equal(proposals, 80)
    assert.equal(preparations, 2)
    assert.equal(sets, 0)
    assert.equal(footprintCalls, proposals)
  })
  test('valid sites with a selected worker but no route retain selection order', () => {
    const w = scenario()
    accept = true
    const source = createWorld(6)
    const unit = source.units.find(u => u.team !== 'wild' && u.kind === 'brave')
    w.units = [unit]
    selected = unit.id
    stepComputerTasks(w, w.activeCampaignTribe)
    assert.equal(proposals, 40)
    assert.equal(sets, 40)
    assert.equal(paths, 40)
    assert.equal(selectionCalls, 40)
    assert.equal(preparations, 40)
    assert.equal(sets, 40)
    assert.equal(w.ai.tasks[0].phase, 2)
  })
  test('valid sites with no worker retain selection behavior', () => {
    const w = scenario()
    accept = true
    stepComputerTasks(w, w.activeCampaignTribe)
    assert.equal(proposals, 40)
    assert.equal(preparations, 40)
    assert.equal(sets, 40)
    assert.equal(w.ai.tasks[0].phase, 2)
  })
  test('throwing footprint still precedes site preparation and selection', () => {
    const w = scenario()
    accept = true
    throwFootprint = true
    assert.throws(() => stepComputerTasks(w, w.activeCampaignTribe), /footprint witness/)
    assert.equal(footprintCalls, 1)
    assert.equal(preparations, 0)
    assert.equal(proposals, 0)
    assert.equal(paths, 0)
    assert.equal(sets, 0)
  })
  test('wild veto still avoids pathfinding at an accepted site', async () => {
    const w = scenario()
    accept = true
    const source = createWorld(6)
    const wild = source.units.find(u => u.team === 'wild')
    assert.ok(wild)
    // One proposal centered on a deterministic footprint tile.
    w.ai.tasks[0].remaining = 1
    const { spiralCell } = await import('../app/native-math.ts')
    const rules = (await import('../app/original-rules.json', { with: { type: 'json' } })).default
    const cell = spiralCell(w.ai.tasks[0].target, 0, 1)
    const cells = shapes.buildingFootprintCells({
      object: rules.buildingObjects[1],
      angle: 0,
      anchorX: (cell & 254) << 8,
      anchorY: cell & 0xfe00,
    })
    const i = cells[0]
    Object.assign(wild, {
      x: (i & 127) * 2 - 8,
      z: -(i >> 7) * 2 - 8,
      hp: 100,
      inside: null,
      lift: null,
    })
    w.units = [wild]
    selected = wild.id
    stepComputerTasks(w, w.activeCampaignTribe)
    assert.equal(proposals, 1)
    assert.equal(selectionCalls, 0)
    assert.equal(sets, 1)
    assert.equal(paths, 0)
    assert.equal(
      w.buildings.some(b => b.preparation),
      source.buildings.some(b => b.preparation)
    )
  })

  test('accepted route retains first winning site and creates exactly one plan', () => {
    const w = scenario()
    accept = routeAccepted = true
    const source = createWorld(6)
    const unit = source.units.find(u => u.team !== 'wild' && u.kind === 'brave')
    w.units = [unit]
    selected = unit.id
    const before = w.buildings.length
    stepComputerTasks(w, w.activeCampaignTribe)
    assert.equal(proposals, 1)
    assert.equal(sets, 1)
    assert.equal(selectionCalls, 1)
    assert.equal(paths, 1)
    assert.equal(w.buildings.length, before + 1)
    assert.equal(w.ai.tasks[0].phase, 4)
    assert.equal(w.ai.tasks[0].elapsed, 1)
  })
}
