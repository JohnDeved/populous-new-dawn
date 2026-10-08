import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createMission1VaultInput } from './mission1-vault-input.mjs'

// Execute the actual browser callback with imports replaced at their module
// boundary. No application module, dependency, browser or simulation is run.
function groundFixture({ point = { x: 0.8, z: 3.4 }, owned = true, object = false,
  context = { model: 3, enabled: true }, spellError = null, range = 20, afterRotation = () => {} } = {}) {
  const world = { turn: 657, lastOrderTurn: 0, paused: false, units: [{ id: 30, x: 0.5, z: 19, hp: 100, inside: null }] }
  const canvas = { getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }) }
  const scene = { world, cameraMotion: { active: false }, resultCamera: { active: false }, viewTransition: false, renderer: { domElement: canvas }, screen: () => ({ x: 0, y: 0 }),
    pickUnit: () => object ? { id: 91 } : null, picking: { pickPerson: () => null }, pickWorldObject: () => null,
    pick: event => typeof point === 'function' ? point(event) : point }
  globalThis.window = { testSceneRef: { current: scene } }
  globalThis.document = { elementFromPoint: (x, y) => (typeof owned === 'function' ? owned(x, y) : owned) ? canvas : null }
  const modules = {
    '/app/person-orders.ts': {},
    '/qa/erosion-ordinary/input.mjs': { createMoveContextProbe: () => p => typeof context === 'function' ? context(p) : context,
      entityInputState: () => ({ turn: world.turn }) },
    '/app/live-command.ts': { spellTargetError: () => spellError },
    '/app/spell-casting.ts': { spellRange: () => range },
    '/app/world-terrain-runtime.ts': { nativePosition: (_w, p) => ({ x: Math.round((p.x + 8) * 256), y: Math.round((-p.z - 8) * 256) }) },
    '/app/native-math.ts': { positionDistance: (a, b) => Math.hypot(a.x - b.x, a.y - b.y) },
  }
  const mouse = [], report = { actions: [] }
  const page = { mouse: {
    async move(x, y, options) { mouse.push({ type: 'move', x, y, options }) },
    async down(options) { mouse.push({ type: 'down', ...options }) },
    async up(options) { mouse.push({ type: 'up', ...options }); afterRotation() },
  }, async waitForFunction(fn, args) { assert.ok(fn(args)) }, evaluate(fn, args) {
    const run = Function('imports', `return (${fn.toString().replaceAll('import(', 'imports(')})`)(async path => {
      assert.ok(modules[path], `Unexpected module ${path}`); return modules[path]
    })
    return run(args)
  } }
  const input = createMission1VaultInput({ page, signal: new AbortController().signal,
    report, save() {}, originalShamanId: 30 })
  return { world, input, mouse, report }
}

test('same-cell far-bank terrain beyond helper aim precision remains a legitimate command3 pick', async () => {
  const { input, world } = groundFixture(), before = structuredClone(world)
  const hit = await input.fixedGround({ x: 0, z: 4 }, null, true)
  assert.equal(hit.rejection, null, 'Owned empty terrain in the intended native cell must not require an artificial 0.35 aim radius')
  assert.deepEqual(hit.point, { x: 0.8, z: 3.4 })
  assert.deepEqual(hit.context, { model: 3, enabled: true })
  assert.deepEqual(hit.wantedCell, { x: 4, y: 122 })
  assert.deepEqual(hit.pointCell, hit.wantedCell)
  assert.deepEqual(world, before)
})

test('far-bank cell selection rejects nearer wrong-cell picks and retains useful rejection diagnostics', async () => {
  const { input } = groundFixture({ point: event => event.clientX === 50 && event.clientY === 50
    ? { x: -0.02, z: 3.98 } : { x: 0.8, z: 3.4 } })
  const hit = await input.fixedGround({ x: 0, z: 4 }, null, true)
  assert.equal(hit.rejection, null)
  assert.deepEqual(hit.point, { x: 0.8, z: 3.4 })
  assert.equal(hit.rejectionCounts.wrongCell, 1)
  assert.equal(hit.nearestRejectedPoint.reason, 'wrongCell')
  assert.deepEqual(hit.nearestRejectedPoint.point, { x: -0.02, z: 3.98 })
})

test('far-bank ground never accepts unowned canvas, objects, missing terrain or disabled/non-move contexts', async () => {
  for (const [options, reason] of [
    [{ owned: false }, 'canvasOwnership'], [{ object: true }, 'objectHit'], [{ point: null }, 'noTerrainPick'],
    [{ context: { model: 3, enabled: false } }, 'commandContext'], [{ context: { model: 27, enabled: true } }, 'commandContext'],
  ]) {
    const { input } = groundFixture(options)
    const hit = await input.fixedGround({ x: 0, z: 4 }, null, true)
    assert.notEqual(hit.rejection, null, reason)
    assert.equal(hit.rejectionCounts[reason], 8281, reason)
    if (reason === 'commandContext') assert.equal(hit.nearestRejectedPoint.reason, reason)
  }
})

test('only the far-bank move opts into cell selection; accepted shore precision and spell gates remain', async () => {
  let input = groundFixture().input
  const shoreStyle = await input.fixedGround({ x: 0, z: 4 })
  assert.notEqual(shoreStyle.rejection, null)
  assert.equal(shoreStyle.rejectionCounts.aimPrecision, 8281)
  const cast = await input.fixedGround({ x: 0, z: 4 }, 'bridge')
  assert.equal(cast.rejection, null); assert.ok(cast.margin >= 128)
  input = groundFixture({ point: { x: -0.02, z: 3.98 } }).input
  assert.notEqual((await input.fixedGround({ x: 0, z: 4 }, 'bridge')).rejection, null)
  input = groundFixture({ spellError: { code: -2, message: 'Beyond your reach' } }).input
  const rejected = await input.fixedGround({ x: 0, z: 4 }, 'bridge')
  assert.notEqual(rejected.rejection, null); assert.equal(rejected.rejectionCounts.spellPredicate, 8281)
  input = groundFixture({ range: 15.8 }).input
  const margin = await input.fixedGround({ x: 0, z: 4 }, 'bridge')
  assert.notEqual(margin.rejection, null); assert.equal(margin.rejectionCounts.spellMargin, 8281)
  const driver = readFileSync(new URL('./mission1-vault-knowledge.mjs', import.meta.url), 'utf8')
  assert.match(driver, /report\.shore = await move\(\{ x: 0\.5, z: 19 \}\)/)
  assert.match(driver, /report\.crossing = await move\(\{ x: 0, z: 4 \}, true\)/)
})

test('ground cell and order contract stays bound to the shipped input/native movement path', () => {
  const source = path => readFileSync(new URL('../../app/' + path, import.meta.url), 'utf8')
  assert.match(source('scene-input-runtime.ts'), /const p = picked \?\? scene\.pick\(event\) \?\? clickedUnit/)
  assert.match(source('scene-input-runtime.ts'), /command\(scene\.world, p, event\)/)
  assert.match(source('live-command.ts'), /movementOrder\(w, nativePosition\(w, tree \?\? p\)\)/)
  assert.match(source('world-terrain-runtime.ts'), /x: short\(Math.round\(\(p.x \+ 8\) \* 256\)\)/)
  assert.match(source('world-terrain-runtime.ts'), /y: short\(Math.round\(\(-p.z - 8\) \* 256\)\)/)
  assert.match(source('person-orders.ts'), /const cell = \(y >> 9\) \* 128 \+ \(x >> 9\)/)
  assert.match(source('person-orders.ts'), /order.a = x\s+order.b = y/)
  const input = readFileSync(new URL('./mission1-vault-input.mjs', import.meta.url), 'utf8')
  assert.match(input, /Math.hypot\(point.x - hit.point.x, point.z - hit.point.z\) > 0.05/)
  assert.match(input, /after.lastOrderTurn > before.lastOrderTurn/)
  assert.match(input, /unit.order\?\.model === command/)
  assert.match(input, /assert.deepEqual\(recipients.map\(unit => unit.id\), expectedIds \?\? before.selected\)/)
})


test('far-bank camera recovery uses bounded ordinary right drags and retains every failed strict-cell probe', async () => {
  let rotations = 0
  const f = groundFixture({ point: () => rotations ? { x: 0.8, z: 3.4 } : { x: -0.02, z: 3.98 }, afterRotation() { rotations++ } })
  const before = structuredClone(f.world), hit = await f.input.farBankGround({ x: 0, z: 4 })
  assert.equal(hit.rejection, null); assert.equal(rotations, 1)
  const probes = f.report.actions.filter(a => a.label === 'far-bank-ground-probe')
  assert.equal(probes.length, 2); assert.equal(probes[0].hit.rejectionCounts.wrongCell, 8281)
  assert.deepEqual(probes.map(a => a.hit.target), [{ x: 0, z: 4 }, { x: 0, z: 4 }])
  assert.deepEqual(f.mouse.filter(e => e.type !== 'move'), [{ type: 'down', button: 'right' }, { type: 'up', button: 'right' }])
  assert.deepEqual(f.world, before)
  const blocked = groundFixture({ point: { x: -0.02, z: 3.98 } })
  assert.notEqual((await blocked.input.farBankGround({ x: 0, z: 4 })).rejection, null)
  assert.equal(blocked.report.actions.filter(a => a.label === 'far-bank-ground-probe').length, 3)
  assert.equal(blocked.mouse.filter(e => e.type === 'down').length, 2)
})

test('far-bank camera recovery never drags through an unowned corridor', async () => {
  const f = groundFixture({ point: { x: -0.02, z: 3.98 }, owned: x => x !== 536 })
  const hit = await f.input.farBankGround({ x: 0, z: 4 })
  assert.notEqual(hit.rejection, null)
  assert.equal(f.report.actions.filter(a => a.label === 'far-bank-ground-probe').length, 1)
  assert.equal(f.report.actions.find(a => a.label === 'far-bank-camera-corridor').corridor, null)
  assert.equal(f.mouse.length, 0)
})
