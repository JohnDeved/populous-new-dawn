import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createMission1VaultInput } from './mission1-vault-input.mjs'

// Recorded ordinary05 boundary, not an explanation of the intervening timing.
const observed = { pixel: { x: 829, y: 406 }, point: { x: 0.19049569848425563, z: 3.448176976648938 },
  target: { x: 0, z: 4 }, search: { turn: 692, frame: 787, hitId: null }, fresh: { turn: 702, frame: 795, hitId: 28 } }
function fixture({ staleFor = 1, ambiguousClick = false, wrongDeliveredOrder = false, changeSelection = false } = {}) {
  const world = { turn: 691, lastOrderTurn: 473, paused: false, mode: null, selected: [30],
    units: [{ id: 30, kind: 'shaman', team: 'blue', hp: 100, inside: null, work: null,
      native: { commands: [1], commandCursor: 0, immediateCommand: 0 } }],
    buildingOrders: { records: [null, { model: 27, a: 29, b: 0, flags: 0 }] } }
  const log = [], listeners = [], report = { actions: [] }
  let searches = 0, preflights = 0, clicks = 0, hitId = null
  const canvas = { getBoundingClientRect: () => ({ left: 200, top: 0, width: 1240, height: 1000 }),
    addEventListener(type, fn) { listeners.push({ type, fn }) },
    removeEventListener(type, fn) { const i = listeners.findIndex(l => l.type === type && l.fn === fn); if (i >= 0) listeners.splice(i, 1) } }
  const scene = { world, frame: 786, cameraMotion: { active: false }, resultCamera: { active: false }, viewTransition: false,
    renderer: { domElement: canvas }, pointerAck: { target: 0, until: 1 },
    screen: () => ({ x: ((829 - 200) / 1240) * 2 - 1, y: 1 - 406 / 1000 * 2 }),
    pick: () => ({ ...observed.point }), pickUnit: () => null,
    picking: { pickPerson: () => null }, pickWorldObject: () => hitId ? { id: hitId } : null }
  globalThis.window = { testSceneRef: { current: scene }, testStore: { getWorld: () => world } }
  globalThis.document = { elementFromPoint: () => canvas }
  const modules = {
    '/app/person-orders.ts': { currentPersonOrder: (pool, p) => pool.records[p.immediateCommand || p.commands[p.commandCursor]] },
    '/app/live-command.ts': { spellTargetError: () => null },
    '/qa/erosion-ordinary/input.mjs': {
      createMoveContextProbe: () => () => ({ model: 3, enabled: true }),
      entityInputState: () => ({ turn: world.turn, frame: scene.frame, camera: 'unchanged', projection: 'unchanged' }),
      inspectEntityPoint: (_s, _c, point) => ({ ...point, canvasOwned: true, hitId }), findEntityInput: () => null,
      observeEntityPointer: () => ({ finish: () => ({ errors: [], restored: true,
        events: clicks ? ['pointerdown', 'pointerup'].map(type => ({ type, button: 0, trusted: true, canvasOwned: true, canvasTarget: true, args: {} })) : [] }) }),
    },
    '/app/spell-casting.ts': { spellRange: () => 20 },
    '/app/world-terrain-runtime.ts': { nativePosition: (_w, p) => ({ x: Math.round((p.x + 8) * 256), y: Math.round((-p.z - 8) * 256) }) },
    '/app/native-math.ts': { positionDistance: () => 0 },
  }
  const page = { async evaluate(fn, args) {
    const search = args?.target && Object.hasOwn(args, 'spell')
    const preflight = args?.command !== undefined
    if (search) { searches++; hitId = null; world.turn = searches === 1 ? 692 : 702 + searches; scene.frame = searches === 1 ? 787 : 795 + searches; log.push('search') }
    if (preflight) {
      preflights++; world.turn = preflights === 1 ? 702 : 702 + preflights; scene.frame = preflights === 1 ? 795 : 795 + preflights
      hitId = preflights <= staleFor ? 28 : null
      if (changeSelection) world.selected = [99]
      log.push('preflight')
    }
    const run = Function('imports', `return (${fn.toString().replaceAll('import(', 'imports(')})`)(async path => {
      assert.ok(modules[path], path); log.push('import:' + path); return modules[path]
    })
    const result = await run(args)
    if (search) log.push('search-return')
    if (preflight) log.push(result.rejection ? 'preflight-rejected' : 'preflight-accepted')
    return result
  }, async waitForFunction(fn, args) { assert.ok(fn(args)) }, mouse: { async click() {
    clicks++; log.push('click')
    if (ambiguousClick) throw Error('Ambiguous pointer delivery')
    world.lastOrderTurn = world.turn; scene.pointerAck = { target: 0, until: 2 }
    world.buildingOrders.records[1] = { model: wrongDeliveredOrder ? 28 : 3, flags: 0,
      a: Math.round((observed.point.x + 8) * 256) & 65535, b: Math.round((-observed.point.z - 8) * 256) & 65535 }
    listeners.forEach(l => l.fn())
  } } }
  const save = () => log.push('save')
  const input = createMission1VaultInput({ page, signal: new AbortController().signal, report, save, originalShamanId: 30 })
  return { input, log, report, world, counts: () => ({ searches, preflights, clicks }) }
}
async function runActualMoveFragment(f) {
  const source = readFileSync(new URL('./mission1-vault-knowledge.mjs', import.meta.url), 'utf8')
  const move = source.indexOf('    const move = async'), start = source.indexOf('      const ', move), end = source.indexOf('      const recipient =', start)
  assert.ok(move > 0 && end > start)
  await f.input.prepareDispatch()
  const run = Function('assert', `return async ({ input, fixedGround, dispatch, point, cellMove, originalShamanId }) => { ${source.slice(start, end)} return { hit, delivered } }`)(assert)
  return run({ input: f.input, fixedGround: f.input.fixedGround, dispatch: f.input.dispatch, point: observed.target, cellMove: true, originalShamanId: 30 })
}

test('observed null-to-model28 pre-click staleness is rejected then only a new validated probe is dispatched', async () => {
  const f = fixture(), result = await runActualMoveFragment(f)
  assert.equal(result.delivered.after.units[0].order.model, 3)
  assert.deepEqual(f.counts(), { searches: 2, preflights: 2, clicks: 1 })
  const rejected = f.report.actions.filter(a => a.label === 'final-dispatch-preflight' && a.preflight.rejection)
  assert.equal(rejected.length, 1); assert.equal(rejected[0].inputAttempted, false); assert.equal(rejected[0].preflight.diagnostics.pick.hitId, 28)
  assert.equal(rejected[0].hit.turn, 692); assert.equal(rejected[0].preflight.diagnostics.state.turn, 702)
  assert.deepEqual(rejected[0].hit.point, observed.point)
  const accepted = f.log.lastIndexOf('preflight-accepted'), click = f.log.indexOf('click')
  assert.deepEqual(f.log.slice(accepted + 1, click), [], 'No import, extra evaluation or persistence may separate accepted preflight and click')
  assert.equal(f.log.slice(f.log.indexOf('search-return'), click).includes('save'), false)
})

test('exhausted stale pre-click probes never dispatch or widen the target/attempt bound', async () => {
  const f = fixture({ staleFor: 99 })
  await assert.rejects(() => runActualMoveFragment(f), /stale/)
  assert.deepEqual(f.counts(), { searches: 3, preflights: 3, clicks: 0 })
  assert.equal(f.report.actions.filter(a => a.label === 'final-dispatch-preflight' && a.preflight.rejection).length, 3)
  assert.ok(f.report.actions.filter(a => a.label === 'far-bank-ground-probe').every(a => a.hit.target.x === 0 && a.hit.target.z === 4))
})

test('ambiguous/dispatched input and changed original recipients never cause a re-probe retry', async () => {
  for (const options of [{ ambiguousClick: true }, { wrongDeliveredOrder: true }, { changeSelection: true }]) {
    const f = fixture({ staleFor: 0, ...options })
    await assert.rejects(() => runActualMoveFragment(f))
    assert.equal(f.counts().searches, 1); assert.equal(f.counts().preflights, 1)
    assert.equal(f.counts().clicks, options.changeSelection ? 0 : 1)
  }
})
