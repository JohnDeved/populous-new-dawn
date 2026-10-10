import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorldState, addUnit } from '../app/world-state.ts'
import { createLivePerson } from '../app/live-people.ts'
import { createComputerQueue, computerPhase } from '../app/computer.ts'
import { withCampaignTribe } from '../app/campaign-runtime.ts'
import { computerSelectionWorld, stepComputerTasks } from '../app/computer-runtime.ts'
import { selectComputerPeople } from '../app/computer-selection.ts'
import rules from '../app/original-rules.json' with { type: 'json' }

// Supplied controller-boundary cases, not a campaign witness or native execution.
// 004cb7b2–004cb813 admits the tribe's state14 set only after phase3 completes.
// 004cca6b–004cca75 / 004f2520 release only this slot's matching assignment.
// Native task+31 is not represented here: pre-set person0x2000 makes either
// admission OR-mask outcome identical. Known7f upper bits are explicit inputs.
const tribe = 2, index = 2, owner = index + 1

function fixture(phase = 3) {
  const w = createWorldState(6), ai = w.campaignAIs[tribe]
  assert.ok(ai, 'fixture: Mission6 has the requested computer tribe')
  Object.assign(ai, createComputerQueue(), { cursor: index, flags: 2, selectionOwner: index })
  Object.assign(w, { turn: 0, units: [], buildings: [], fights: [], selected: [] })
  w.objectCells.objects.clear()
  w.objectCells.heads.fill(0)
  w.pathfinding.people.clear()
  ai.constructionBase = 0
  const task = ai.tasks[index]
  Object.assign(task, { flags: 1, type: 20, phase, requested: 1, selected: 1,
    remaining: 6, quotas: [0, 0, 0, 0, 0, 0], members: [] })
  assert.equal(computerPhase(w.turn, tribe), 'dispatch', 'fixture: scheduled dispatcher turn')
  assert.equal(rules.personStateFlags[14] & 8, 0, 'fixture: state14 is not idle recruitment')
  assert.equal(rules.personStateFlags[17] & 8, 8, 'fixture: state17 permits idle recruitment')
  assert.equal(rules.personStateFlags[10] & 8, 0, 'fixture: empty state10 is not idle recruitment')
  return { w, ai, task }
}

function person(c, { state = 14, assignment = 0, team = 'yellow', flags7f = 0xa5 } = {}) {
  const u = addUnit(c.w, team, 'warrior', { x: 0, z: 0 }), p = createLivePerson(c.w, u)
  Object.assign(p, { state, previousState: state, computerAssignment: assignment,
    flags2: 0, flags3: 0x2200, flags4: 0, assignment: 0, workFlags: 0,
    vehicle: 0, commandStatus: 0, immediateCommand: 0, commandCursor: 0,
    commands: Array(8).fill(0) })
  u.native = p
  if (flags7f !== undefined) u.nativeFlags7f = flags7f
  c.w.objectCells.objects.set(u.id, p)
  assert.equal(p.class, 1)
  assert.equal(p.model, 3)
  assert.equal(p.tribe, team === 'yellow' ? tribe : 0)
  return { u, p }
}

function membership({ u, p }) {
  return { assignment: p.computerAssignment, flags3: p.flags3,
    hasFlags7f: Object.hasOwn(u, 'nativeFlags7f'), flags7f: u.nativeFlags7f }
}

function visit(c) {
  const beforeAI = c.w.ai, beforeTribe = c.w.activeCampaignTribe
  assert.equal(withCampaignTribe(c.w, tribe, () => stepComputerTasks(c.w, tribe)), undefined)
  assert.equal(c.ai.cursor, index + 1, 'actual dispatcher completed exactly this task visit')
  assert.equal(c.w.ai, beforeAI)
  assert.equal(c.w.activeCampaignTribe, beforeTribe)
}

test('phase3 completion admits prior, other-state14 and final-fallback people', () => {
  const c = fixture(), prior = person(c), other = person(c, { assignment: 99 }),
    fallback = person(c, { state: 17 }), nonselected = person(c, { state: 10 }),
    otherTribe = person(c, { team: 'blue' })
  // Empty state10 native owners are omitted by the presentation selector. Keep
  // this control visible through its actual retained entry owner instead of
  // allowing the adapter to synthesize an idle state17 person from its path.
  nonselected.u.entry = { person: nonselected.p }
  c.task.members = [prior.u.id]
  c.task.requested = 2
  const selection = withCampaignTribe(c.w, tribe, () => computerSelectionWorld(c.w, tribe))
  assert.equal(selection.sources.get(nonselected.u.id), nonselected.p)
  assert.equal(selection.world.units.get(nonselected.u.id).state, 10)
  assert.deepEqual(selectComputerPeople(selection.world, -1, -1, -1, 1, 0, 7, 100),
    [fallback.u.id], 'fixture: only the designated fallback is eligible in the actual adapter')
  const controls = [nonselected, otherTribe].map(membership)
  visit(c)
  assert.equal(c.task.phase, 4, 'fixture: actual phase3 completion was reached')
  assert.equal(c.task.selected, 2, 'fixture: fallback selector supplied one person')
  assert.equal(fallback.p.state, 14, 'fixture: final select action ran before admission check')
  assert.deepEqual([nonselected, otherTribe].map(membership), controls)
  assert.deepEqual([prior, other, fallback].map(membership), Array.from({ length: 3 }, () => ({
    assignment: owner, flags3: 0x2200, hasFlags7f: true, flags7f: 0xa4,
  })), 'missing phase3 completion ownership: admit the full current state14 set')
})

test('phase3 admission uses the registered person rather than a stale native alias', () => {
  const c = fixture(), admitted = person(c), staleOnly = person(c, { state: 10 })
  admitted.u.entry = { person: admitted.p }
  admitted.u.native = { ...admitted.p, state: 10, computerAssignment: 87 }
  staleOnly.u.entry = { person: staleOnly.p }
  staleOnly.u.native = { ...staleOnly.p, state: 14, computerAssignment: 88 }
  c.task.members = [admitted.u.id]
  const staleBefore = structuredClone([admitted.u.native, staleOnly.u.native]),
    excludedBefore = membership(staleOnly)
  visit(c)
  assert.equal(c.task.phase, 4)
  assert.equal(c.w.objectCells.objects.get(admitted.u.id), admitted.p)
  assert.equal(c.w.objectCells.objects.get(staleOnly.u.id), staleOnly.p)
  assert.deepEqual([admitted.u.native, staleOnly.u.native], staleBefore)
  assert.deepEqual(membership(staleOnly), excludedBefore)
  assert.deepEqual(membership(admitted), {
    assignment: owner, flags3: 0x2200, hasFlags7f: true, flags7f: 0xa4,
  }, 'missing phase3 completion ownership: write the registered state14 person')
})

test('an unfinished quota visit changes selection state without admitting people', () => {
  const c = fixture(), prior = person(c), selected = person(c, { state: 17 })
  Object.assign(c.task, { members: [prior.u.id], requested: 2, remaining: 1,
    quotas: [0, 100, 0, 0, 0, 0] })
  const before = [prior, selected].map(membership)
  visit(c)
  assert.deepEqual({ phase: c.task.phase, remaining: c.task.remaining, selected: c.task.selected },
    { phase: 3, remaining: 2, selected: 2 })
  assert.equal(selected.p.state, 14, 'fixture: actual quota selection action ran')
  assert.deepEqual([prior, selected].map(membership), before)
})

test('final selection count zero does not admit an unrelated state14 person', () => {
  const c = fixture(), unrelated = person(c)
  Object.assign(c.task, { requested: 0, selected: 0 })
  const before = membership(unrelated)
  visit(c)
  assert.equal(c.task.flags & 1, 0, 'fixture: current port takes its no-selection retirement')
  assert.deepEqual(membership(unrelated), before)
})

test('a returned person blocked from state14 is not admitted from its selected ID', () => {
  const c = fixture(), blocked = person(c, { state: 17 })
  Object.assign(c.task, { requested: 1, selected: 0 })
  blocked.p.flags2 |= 0x100000
  const before = membership(blocked)
  visit(c)
  assert.equal(c.task.phase, 4)
  assert.equal(c.task.selected, 1, 'fixture: selector returned the blocked person')
  assert.ok(c.task.members.includes(blocked.u.id))
  assert.equal(blocked.p.state, 17, 'fixture: real state initializer refused the transition')
  assert.deepEqual(membership(blocked), before)
})

test('phase23 releases all registered matching owners and preserves foreign ownership', () => {
  const c = fixture(23), listed = person(c, { assignment: owner }),
    unlisted = person(c, { state: 10, assignment: owner }),
    foreign = person(c, { assignment: owner + 1 }),
    otherTribe = person(c, { assignment: owner, team: 'blue' }),
    unknownFlags = person(c, { assignment: owner })
  delete unknownFlags.u.nativeFlags7f
  c.task.members = [listed.u.id, foreign.u.id]
  const controls = [foreign, otherTribe].map(membership),
    unchanged = structuredClone({ pool: c.w.buildingOrders, random: c.w.randomState,
      cosmetic: c.w.cosmeticRandom.randomState })
  visit(c)
  assert.equal(c.task.flags & 3, 0)
  assert.deepEqual(c.task.members, [])
  assert.equal(c.ai.flags & 2, 0)
  assert.equal(c.ai.selectionOwner, 10)
  assert.deepEqual([foreign, otherTribe].map(membership), controls)
  assert.deepEqual({ pool: c.w.buildingOrders, random: c.w.randomState,
    cosmetic: c.w.cosmeticRandom.randomState }, unchanged)
  assert.equal(Object.hasOwn(unknownFlags.u, 'nativeFlags7f'), false,
    'unknown upper membership bits must not become an invented known zero byte')
  assert.deepEqual([listed, unlisted, unknownFlags].map(membership), [
    { assignment: 0, flags3: 0x200, hasFlags7f: true, flags7f: 0xa4 },
    { assignment: 0, flags3: 0x200, hasFlags7f: true, flags7f: 0xa4 },
    { assignment: 0, flags3: 0x200, hasFlags7f: false, flags7f: undefined },
  ], 'missing phase23 matched-owner release: clear ownership before slot reuse')
})

test('phase23 does not release a stale matching alias or a foreign registered owner', () => {
  const c = fixture(23), foreign = person(c, { state: 10, assignment: owner + 1 })
  foreign.u.entry = { person: foreign.p }
  foreign.u.native = { ...foreign.p, computerAssignment: owner }
  c.task.members = [foreign.u.id]
  const before = structuredClone({ p: foreign.p, stale: foreign.u.native,
    membership: membership(foreign) })
  visit(c)
  assert.equal(c.task.flags & 1, 0)
  assert.deepEqual(c.task.members, [])
  assert.equal(c.w.objectCells.objects.get(foreign.u.id), foreign.p)
  assert.deepEqual({ p: foreign.p, stale: foreign.u.native,
    membership: membership(foreign) }, before)
})
