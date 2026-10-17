// Targeted frozen-function differential: dependency boundaries are supplied, not
// a claim of complete campaign/native equivalence. No copied runtime module.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { stripTypeScriptTypes } from 'node:module'
import vm from 'node:vm'

// Exact function from accepted 6cfb658d5cfaf42db86b70bbf82ef8af57735a5c.
// Fixture avoids adding a Git-history prerequisite to this test.
const original = readFileSync(new URL('./fixtures/placement-check-site-original.ts.txt', import.meta.url), 'utf8')
const candidate = readFileSync(new URL('../app/construction-runtime.ts', import.meta.url), 'utf8')
function load(source, dependencies) {
  const start = source.indexOf('export function checkBuildingSite(')
  const nextFunction = source.indexOf('\nexport function buildingPlanPose(', start)
  const end = nextFunction < 0 ? source.length : nextFunction
  assert.ok(start >= 0 && end > start)
  return vm.runInNewContext(stripTypeScriptTypes(source.slice(start, end).replace('export ', '')) +
    '\ncheckBuildingSite', dependencies)
}
const cell = i => ({ x: (i & 127) * 512, y: (i >> 7) * 512 })
function run(source, setup = () => {}, options = {}) {
  const trace = [], seen = [], w = {
    manaTribes: [{ playerType: 1 }],
    land: { flags: new Uint32Array(16384), buildingIds: new Uint16Array(16384) },
    buildings: [], trees: [], shrines: [], teams: [], stones: [], levelStart: {},
  }
  const deps = {
    syncNativeTerrain: () => trace.push('sync terrain'),
    syncLandscapeObjects: () => trace.push('sync scenery'),
    tribeForTeam: team => { trace.push(`tribe ${team}`); return 0 },
    buildingModel: b => { trace.push('building model'); return b.model },
    nativePosition: (_w, p) => { trace.push(`position ${p.label}`); return { x: p.x, y: p.y } },
    rules: { buildingObjects: { 18: 23 } },
    buildingFootprintCells: pose => { trace.push(['vault', { ...pose }]); return [4, 5] },
    campaignShamanTeams: () => { trace.push('teams'); return w.teams },
    campaignPosition: (_w, team) => { trace.push(`center ${team}`); return { ...cell(8), label: 'center' } },
    reincarnationStones: () => { trace.push('stones'); return w.stones },
    levelStartStoneExists: (_start, _tribe, index) => { trace.push(`stone ${index}`); return index !== 1 },
    buildingFootprintTiles: () => options.tiles ?? [0, 1, 2, 3, 4, 5, 8, 9].map(index => ({ index, mask: 1 })),
    buildingCellValid: (world, tribe, packed, mask, model, plan, computer) => {
      const i = ((packed & 0xfe00) >> 9) * 128 + ((packed & 254) >> 1)
      const objects = Array.from(world.scenery(i))
      for (let n = 1; n < objects.length; n++) assert.notEqual(objects[n], objects[n - 1])
      const id = world.land.buildingIds[i] & 1023
      seen.push({ i, objects: objects.map(o => ({ ...o })), flags: world.land.flags[i], id,
        building: id ? { ...world.building(id) } : null, mask, model, plan, computer })
      if (options.failAt === i) { tribe.flags |= 0x20000000; return false }
      return true
    },
  }
  setup(w, trace)
  let result, error
  try { result = load(source, deps)(w, {}, 1, 'blue', 0) } catch (e) { error = { name: e.name, message: e.message } }
  return structuredClone({ trace, seen, result, error,
    flags: [...w.land.flags], buildingIds: [...w.land.buildingIds] })
}
function compare(setup, options) {
  const expected = run(original, setup, options), actual = run(candidate, setup, options)
  assert.deepEqual(actual, expected)
  return actual
}

test('oracle is the immutable accepted construction runtime', () => {
  assert.equal(createHash('sha256').update(original).digest('hex'), 'b4cbe2fce86b4273a93ee8361030298107f5db62c99e943c0a130236b5866ac4')
})
test('singleton cells, three-way collisions, dead trees and independent descriptors', () => {
  const result = compare(w => {
    w.trees = [0, 0, 0, 1, 2].map((i, n) => ({ ...cell(i), label: `tree${n}`, model: n, logs: n === 4 ? 0 : 1 }))
  })
  assert.deepEqual(result.seen[0].objects.map(o => o.model), [0, 1, 2])
  assert.deepEqual(result.seen[1].objects, [{ class: 5, model: 3 }])
  assert.deepEqual(result.seen[2].objects, [])
})
test('shrines, vault footprint and live reincarnation stones preserve order and flags', () => {
  const result = compare(w => {
    w.trees = [{ ...cell(0), label: 'tree', model: 2, logs: 1 }]
    w.shrines = [{ ...cell(0), label: 'shrine', kind: 'head' },
      { ...cell(4), label: 'vault', kind: 'vault', id: 19, angle: 0 }]
    w.teams = ['blue']; w.stones = [cell(0), cell(8), cell(9)]
  })
  assert.deepEqual(result.seen[0].objects.map(o => o.model), [2, 9, 12])
  assert.equal(result.seen.find(x => x.i === 4).id, 19)
  assert.deepEqual(result.seen.find(x => x.i === 8).objects, [])
  assert.equal(result.seen.find(x => x.i === 9).objects[0].model, 12)
})
test('later getters cannot mutate frozen flags, building IDs or captured earlier models', () => {
  const result = compare((w, trace) => {
    const first = { ...cell(0), label: 'first', model: 2, logs: 1 }
    const later = { ...cell(1), label: 'later', logs: 1 }
    Object.defineProperty(later, 'model', { get() {
      trace.push('mutating model getter'); first.model = 99
      w.land.flags[0] = 0x10000; w.land.buildingIds[0] = 77
      return 3
    } })
    w.trees = [first, later]
  })
  assert.equal(result.seen[0].objects[0].model, 2)
  assert.equal(result.seen[0].flags, 2); assert.equal(result.seen[0].id, 0)
  assert.equal(result.flags[0], 0x10000); assert.equal(result.buildingIds[0], 77)
})
test('throwing getters preserve read order and prevent all validity calls', () => {
  const result = compare((w, trace) => {
    const tree = { ...cell(0), label: 'throwing', logs: 1 }
    Object.defineProperty(tree, 'model', { get() { trace.push('throw model'); throw new Error('sentinel') } })
    w.trees = [tree]; w.shrines = [{ ...cell(2), label: 'not visited', kind: 'head' }]
  })
  assert.deepEqual(result.error, { name: 'Error', message: 'sentinel' }); assert.equal(result.seen.length, 0)
})
test('ordered validity short-circuit and feedback are unchanged', () => {
  const result = compare(w => { w.trees = [{ ...cell(0), label: 'tree', logs: 1, model: 12 }] }, { failAt: 1 })
  assert.deepEqual(result.seen.map(x => x.i), [0, 1])
  assert.deepEqual(result.result, { valid: false, flags: 0x20000000 })
})
