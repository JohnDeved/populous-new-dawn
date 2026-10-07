import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { deserialize } from 'node:v8'
import test from 'node:test'
import { createWorldState } from '../app/world-state.ts'
import { withCampaignTribe } from '../app/campaign-runtime.ts'
import { stepComputerTasks } from '../app/computer-runtime.ts'

const bytes = readFileSync(new URL('./fixtures/raid-state33-release.bin', import.meta.url))
assert.equal(createHash('sha256').update(bytes).digest('hex'),
  '389ce3174fd613bb7841502ee737301a3e131451022ad8b7152f1613fa316562')
function fixture() {
  const raw = deserialize(bytes), w = createWorldState(2)
  Object.assign(w, { units: raw.people.map(p => p.unit), buildings: raw.buildings,
    objectCells: raw.objectCells, buildingOrders: raw.orders, ai: raw.ai,
    campaignAIs: raw.campaignAIs, activeCampaignTribe: raw.activeCampaignTribe,
    selected: raw.selected, manaWorld: raw.manaWorld, manaTribes: raw.manaTribes,
    castingTribes: raw.castingTribes, tribeCount: raw.tribeCount, levelFlags2: raw.levelFlags2,
    outcome: raw.outcome, drawMode: raw.drawMode, randomState: raw.random, turn: raw.turn,
    motionRoutes: raw.motionRoutes, pathfinding: raw.pathfinding })
  w.cosmeticRandom.randomState = raw.cosmetic
  for (const cell of raw.cells) for (const [key, item] of Object.entries(cell.fields))
    if (item.present) w.land[key][cell.index] = item.value
  const ai = w.campaignAIs[3]
  assert.equal(ai.cursor, 2)
  ai.cursor = 1 // The same isolated visit projection as the accepted native/port pair.
  const u = w.units[0], p = w.objectCells.objects.get(10)
  assert.equal(u.native, p)
  assert.equal(p.computerAssignment, 0)
  assert.equal(Object.hasOwn(u, 'nativeFlags7f'), false)
  return { w, ai, u, p }
}
function snapshot(w) {
  return structuredClone({ units: w.units, registry: w.objectCells, pool: w.buildingOrders,
    tasks: w.campaignAIs, selected: w.selected, routes: w.motionRoutes,
    pathfinding: w.pathfinding, buildings: w.buildings, manaTribes: w.manaTribes,
    random: w.randomState, cosmetic: w.cosmeticRandom.randomState })
}
function visit(c, released) {
  const { w, u, p } = c, expected = snapshot(w)
  expected.tasks[3].cursor = 2
  expected.tasks[3].tasks[1].elapsed = 360
  if (released) {
    const person = expected.registry.objects.get(10)
    Object.assign(person, { state: 10, previousState: 33, substate: 0, flags2: 0x40021000,
      timer: 0, motionTimer: 0, motionMode: 0, commandCursor: 0, commandStatus: 0,
      anchorX: 38656, anchorY: 28416, computerAssignment: 0 })
    person.flags3 = (person.flags3 & ~0x2000) >>> 0
    person.commands[1] = 0
    expected.pool.records[131].references = 0
    expected.pool.active = 2
    expected.tasks[3].tasks[1].members = [11]
    if (Object.hasOwn(expected.units[0], 'nativeFlags7f')) expected.units[0].nativeFlags7f &= 254
  }
  assert.equal(withCampaignTribe(w, 3, () => stepComputerTasks(w, 3)), undefined)
  assert.equal(w.objectCells.objects.get(10), p)
  assert.equal(w.units[0], u)
  assert.deepEqual(snapshot(w), expected, 'full owner/queue/pool/world delta matches the bounded contract')
}

test('phase6 releases the captured living state33 member through the actual dispatcher', () => {
  visit(fixture(), true)
})

test('release retains the actual registered controller and all unrelated Unit ownership', () => {
  for (const owner of ['fight', 'flight', 'entry', 'builder']) {
    const c = fixture()
    c.u.native = null
    if (owner === 'fight') c.u.fight = { motion: c.p, group: 0, opponent: 11 }
    else if (owner === 'flight') c.u.flight = c.p
    else c.u[owner] = { person: c.p, retainedMarker: 123 }
    c.u.work = 77
    c.u.vault = { retainedMarker: 99 }
    visit(c, true)
  }
})

test('substate2 uses byte animationMode at+a8, independently of commandPhase at+aa', () => {
  const wait = fixture()
  Object.assign(wait.p, { substate: 2, animationMode: 4, commandPhase: 9 })
  visit(wait, false)
  const release = fixture()
  Object.assign(release.p, { substate: 2, animationMode: 5, commandPhase: 0 })
  visit(release, true)
})

test('release preserves known upper membership flags and leaves absent flags absent', () => {
  for (const assignment of [0, 2]) {
    const c = fixture()
    c.p.computerAssignment = assignment
    c.u.nativeFlags7f = 0xa5
    visit(c, true)
  }
})

test('unknown consumed release fields do not cause partial release or invented zeros', () => {
  for (const mutate of [
    c => { c.p.substate = 2; delete c.p.animationMode },
    c => { c.p.substate = 2; c.p.animationMode = 256 },
    c => { delete c.p.flags3 },
    c => { delete c.p.assignment },
    c => { delete c.p.commands },
    c => { delete c.p.commands[0] },
    c => { c.p.commands[1] = 800 },
    c => { delete c.w.buildingOrders.records[131].references },
    c => { c.w.buildingOrders.records[131].object = 1 },
    c => { c.w.buildingOrders.records[131].model = 30 },
    c => { c.p.commands[2] = 131 },
    c => { delete c.p.renderFlags },
    c => { delete c.p.computerAssignment },
    c => { c.p.computerAssignment = 99 },
    c => { c.p.tribe = 0 },
    c => { c.u.team = 'blue' },
    c => { c.p.model = 3 },
    c => { c.u.nativeFlags7f = 256 },
  ]) {
    const c = fixture()
    mutate(c)
    visit(c, false)
  }
})
