import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createMission1VaultInput } from './mission1-vault-input.mjs'

function guardBlock() {
  const source = readFileSync(new URL('./mission1-vault-knowledge.mjs', import.meta.url), 'utf8')
  const start = source.indexOf("      await page.keyboard.press('1');")
  const end = source.indexOf("      const delivered = await castInput(hit, 'blast')", start)
  assert.ok(start > 0 && end > start)
  return source.slice(start, end) + "      const delivered = await castInput(hit, 'blast')\n"
}
function guardFixture() {
  const world = { turn: 799, paused: true, mode: null, selected: [30], shots: { blast: 4 }, giftCounts: { blast: 0 },
    units: [{ id: 30, kind: 'shaman', team: 'blue', hp: 100, x: -1, z: 3, inside: null }, { id: 38, kind: 'brave', team: 'red', x: -9, z: -3, hp: 50 }], projectiles: [], effects: [] }
  const calls = [], listeners = [], report = { actions: [] }, canvas = {
    getBoundingClientRect: () => ({ left: 200, top: 0, width: 1240, height: 1000 }),
    addEventListener(type, fn, capture) { listeners.push({ type, fn, capture }) },
    removeEventListener(type, fn) { const i = listeners.findIndex(l => l.type === type && l.fn === fn); if (i >= 0) listeners.splice(i, 1) },
  }
  let liveHit = 38, spellError = null
  const scene = { world, renderer: { domElement: canvas }, unitMeshes: new Map(), screen: () => ({ x: 0, y: 0 }),
    pick: () => ({ x: -9, z: -3 }) }
  globalThis.window = { testSceneRef: { current: scene }, testStore: { getWorld: () => world } }
  const modules = {
    '/qa/erosion-ordinary/input.mjs': {
      findEntityInput(candidates, id, inspect) {
        for (const p of candidates) { const s = inspect(p); if (s.canvasOwned && s.hitId === id) return { ...p, interiorRadius: 2 } }
        return null
      },
      inspectEntityPoint: (_s, _c, p) => ({ ...p, canvasOwned: !world.paused, hitId: world.paused ? null : liveHit }),
      createMoveContextProbe: () => () => ({ enabled: true, model: 3 }), entityInputState: () => ({ turn: world.turn }),
    },
    '/app/live-command.ts': { spellTargetError: () => spellError },
    '/app/world-terrain-runtime.ts': { nativePosition(w, p) {
      assert.notEqual(w, world, 'Native synchronization must never receive live World')
      return { x: Math.round((p.x + 8) * 256), y: Math.round((-p.z - 8) * 256), h: 56 }
    } },
    '/app/spell-casting.ts': { spellRange: () => 12 },
    '/app/native-math.ts': { positionDistance: (a, b) => Math.hypot(a.x - b.x, a.y - b.y) },
    '/app/world-rules.ts': { SPELLS: [{ id: 'blast', model: 2 }] },
  }
  const page = {
    async evaluate(fn, args) {
      const run = Function('imports', `return (${fn.toString().replaceAll('import(', 'imports(')})`)(async path => {
        assert.ok(modules[path], path); return modules[path]
      }); return run(args)
    },
    async waitForFunction(fn, args) { assert.ok(fn(args)) },
    getByRole(role, options) {
      assert.equal(role, 'button'); assert.equal(options.exact, true)
      return { async click() { assert.equal(options.name, 'Resume game'); calls.push('public-resume'); world.paused = false } }
    },
    keyboard: { async press(key) { assert.equal(key, '1'); calls.push('select-blast'); world.mode = 'blast' } },
    mouse: { async click() {
      calls.push('cast-pointer'); const event = { isTrusted: true, button: 0, target: canvas }
      listeners.filter(l => l.capture).forEach(l => l.fn(event))
      world.shots.blast--; world.mode = null
      listeners.filter(l => !l.capture).forEach(l => l.fn(event))
    } },
  }
  const input = createMission1VaultInput({ page, signal: new AbortController().signal, report, save() {}, originalShamanId: 30 })
  return { world, calls, report, input, page, listeners, stale() { liveHit = 99 }, rejectRange() { spellError = { code: -2, message: 'Beyond your reach' } } }
}

test('guard action resumes publicly before a fresh entity probe and keeps real cast preflight', async () => {
  const f = guardFixture(), entityPoint = f.input.entityPoint
  f.input.entityPoint = async (...args) => {
    f.calls.push('entity-probe'); assert.equal(f.world.paused, false, 'Probe must follow public Resume so its target is not under the pause overlay')
    return entityPoint(...args)
  }
  const run = Function('assert', `return async ({ page, read, resume, input, guard, castInput, report, save, attempt }) => { ${guardBlock()} return delivered }`)(assert)
  const result = await run({ page: f.page, read: async () => f.world, resume: f.input.resume, input: f.input,
    guard: { id: 38 }, castInput: f.input.castInput, report: f.report, save() {}, attempt: 0 })
  assert.deepEqual(f.calls, ['select-blast', 'public-resume', 'entity-probe', 'cast-pointer'])
  const observed = f.report.actions.find(a => a.label === 'guard-blast-probe').hit
  assert.equal(observed.probe.paused, false); assert.equal(observed.castGeometry.nativeCaster.h, 56)
  assert.equal(observed.castGeometry.range, 3072); assert.ok(observed.castGeometry.distance > 0)
  assert.equal(result.before.stock, 4); assert.equal(result.after.stock, 3); assert.equal(f.listeners.length, 0)
})

test('entity probe records bounded per-reason search counts without attributing every miss to overlay', async () => {
  const f = guardFixture(), before = structuredClone(f.world)
  let hit = await f.input.entityPoint('units', 38, null, 'blast')
  assert.notEqual(hit.rejection, null); assert.equal(hit.probe.paused, true)
  assert.ok(hit.probe.rejections.canvasOwnership > 0)
  assert.equal(hit.probe.rejections.wrongTarget, 0); assert.ok(Object.keys(hit.probe.examples).length <= 4)
  assert.deepEqual(f.world, before)
  await f.input.resume(); f.stale()
  hit = await f.input.entityPoint('units', 38, null, 'blast')
  assert.notEqual(hit.rejection, null); assert.equal(hit.probe.rejections.canvasOwnership, 0)
  assert.ok(hit.probe.rejections.wrongTarget > 0); assert.equal(hit.probe.examples.wrongTarget.hitId, 99)
})

test('fresh cast gate still rejects changed actual hits and native range failures without consuming stock', async () => {
  for (const invalidate of ['stale', 'rejectRange']) {
    const f = guardFixture(); await f.input.resume(); f.world.mode = 'blast'
    const hit = await f.input.entityPoint('units', 38, null, 'blast'); assert.equal(hit.rejection, null)
    f[invalidate]()
    await assert.rejects(() => f.input.castInput(hit, 'blast'))
    assert.equal(f.world.shots.blast, 4); assert.equal(f.calls.includes('cast-pointer'), false); assert.equal(f.listeners.length, 0)
  }
})
