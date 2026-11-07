import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorldState, addUnit } from '../app/world-state.ts'
import { createLivePerson, registerLivePerson, syncLivePersonCells } from '../app/live-people.ts'
import { cancelLiveBuildingAttack, startLiveCombatResponse } from '../app/live-building-combat.ts'
import { currentPersonOrder, emptyPersonOrder } from '../app/person-orders.ts'
import { createComputerQueue } from '../app/computer.ts'
import { computerSelectionWorld } from '../app/computer-runtime.ts'
import { withCampaignTribe } from '../app/campaign-runtime.ts'
import { canAutoEngage, engagementRange } from '../app/melee-engagement.ts'
import { combatWorld, combatPerson } from '../app/live-combat.ts'
import { eligibleCombatPerson } from '../app/combat-targets.ts'
import rules from '../app/original-rules.json' with { type: 'json' }

// Supplied continuation, not a campaign witness. The reviewed 00436ca0 closure
// preserves the same person's +af. The +89=0 variant excludes target release;
// command19, no assignment0x20, and order.object0 exclude specialized cleanup.
const tribe = 2

function fixture(owner, retained) {
  const w = createWorldState(6), ai = w.campaignAIs[tribe]
  assert.ok(ai)
  Object.assign(ai, createComputerQueue())
  Object.assign(w, { turn: 0, units: [], buildings: [], fights: [], selected: [], levelFlags2: 0 })
  w.manaWorld.gameFlags = 0
  w.outcome.alliances.fill(0)
  for (const field of ['categories', 'flags', 'buildingIds', 'owners']) w.land[field].fill(0)
  w.objectCells.objects.clear()
  w.objectCells.heads.fill(0)
  w.pathfinding.people.clear()
  w.buildingOrders.records = Array.from({ length: 800 }, emptyPersonOrder)
  Object.assign(w.buildingOrders, { cursor: 2, active: 1 })
  const u = addUnit(w, 'yellow', 'warrior', { x: 0, z: 0 }), p = createLivePerson(w, u)
  const enemy = addUnit(w, 'blue', 'shaman', { x: 1.5, z: 0 })
  Object.assign(p, { state: 10, previousState: 10, substate: 1, computerAssignment: owner,
    assignment: 0, workTarget: 0, workFlags: 0, vehicle: 0, motionGroup: 0,
    flags2: 0x08000000, flags3: 0x42200, flags4: 0x20000300,
    commandStatus: 19, commandCursor: 0, immediateCommand: 0,
    commands: [1, 0, 0, 0, 0, 0, 0, 0] })
  u.native = p
  if (retained) u.entry = { person: p }
  // Known byte supplied by the fixture; cleanup has no native +7f write.
  u.nativeFlags7f = 0xa4
  Object.assign(w.buildingOrders.records[1], { model: 19, flags: 0, references: 1, object: 0 })
  const task = ai.tasks[owner - 1]
  Object.assign(task, { flags: 1, type: 20, phase: 16, members: [u.id] })
  registerLivePerson(w, p)
  syncLivePersonCells(w)
  return { w, u, p, enemy, ai, task, owner, retained }
}

function query(w, id) {
  // Explicit raw-native mode includes an empty state10 owner while its response
  // has not yet entered the presentation command dispatcher.
  const result = withCampaignTribe(w, tribe, () => computerSelectionWorld(w, tribe, true))
  return { source: result.sources.get(id), busy: result.world.units.get(id).busy }
}

function guard(c) {
  const { w, u, p, owner, retained } = c, order = currentPersonOrder(w.buildingOrders, p)
  assert.deepEqual([p.class, p.model, p.tribe, p.state, p.substate], [1, 3, tribe, 10, 1])
  assert.deepEqual([p.assignment & 0x20, p.workTarget, p.motionGroup, p.immediateCommand], [0, 0, 0, 0])
  assert.deepEqual(p.commands, [1, 0, 0, 0, 0, 0, 0, 0])
  assert.deepEqual([order.model, order.flags & 1, order.references, order.object], [19, 0, 1, 0])
  assert.equal(w.buildingOrders.active, 1)
  assert.equal(u.native, p)
  assert.equal(w.objectCells.objects.get(u.id), p)
  assert.equal(u.entry?.person, retained ? p : undefined)
  assert.ok(!u.flight && !u.fight && !u.builder && !u.casting && !u.lift && u.work === null)
  assert.equal(w.pathfinding.people.has(u.id), false)
  assert.equal(w.motionRoutes.active, 0)
  assert.equal(w.turn & rules.personModels[p.model].scanMask, 0)
  assert.equal(w.levelFlags2 & 0x2000000, 0)
  assert.equal(query(w, u.id).source, p)
  assert.equal(query(w, u.id).busy, owner)
  assert.deepEqual(c.task.members, [u.id])
}

function observe(c) {
  const { w, u, p, ai } = c, registered = w.objectCells.objects.get(u.id), selected = query(w, u.id)
  return { registeredSame: registered === p, assignment: registered?.computerAssignment,
    querySame: selected.source === p, busy: selected.busy,
    ownershipFlag: registered && (registered.flags3 & 0x2000), flags7f: u.nativeFlags7f,
    rosterOwners: ai.tasks.flatMap((task, i) => task.members?.includes(u.id) ? [i + 1] : []) }
}

function continuation(c) {
  guard(c)
  const { w, u, p, enemy, owner } = c
  const seeds = [w.randomState, w.cosmeticRandom.randomState]
  cancelLiveBuildingAttack(w, u)
  assert.deepEqual(p.commands, Array(8).fill(0), 'setup: actual cancellation cleared the queue')
  assert.deepEqual([p.commandStatus, p.immediateCommand, w.buildingOrders.active,
    w.buildingOrders.records[1].references], [0, 0, 0, 0])
  assert.equal(p.flags2 & 0x08000000, 0)
  assert.equal(p.flags4 & 0x200, 0)
  assert.deepEqual([p.state, p.substate, p.computerAssignment, p.flags3 & 0x2000], [10, 1, owner, 0x2000])
  const cancelled = observe(c)
  syncLivePersonCells(w)
  const reconciled = observe(c)
  assert.equal(canAutoEngage(p, undefined, () => false), true,
    'setup: the retained empty-order source can respond')
  const { world } = combatWorld(w, combatPerson(u), engagementRange(p, undefined, false))
  assert.equal(eligibleCombatPerson(world, combatPerson(u), world.objects.get(enemy.id)), true,
    'setup: actual adapter supplies an eligible hostile target')
  assert.equal(startLiveCombatResponse(w, u), true, 'setup: actual response allocated and attached')
  assert.ok(u.native?.immediateCommand)
  assert.equal(currentPersonOrder(w.buildingOrders, u.native)?.model, 21)
  assert.equal(w.buildingOrders.records[u.native.immediateCommand].references, 1)
  assert.equal(w.buildingOrders.active, 1)
  assert.equal(w.objectCells.objects.get(u.id), u.native)
  assert.deepEqual([w.randomState, w.cosmeticRandom.randomState], seeds)
  const responded = observe(c), clone = structuredClone(w), clonedUnit = clone.units.find(v => v.id === u.id),
    clonedPerson = clone.objectCells.objects.get(u.id), clonedQuery = query(clone, u.id)
  assert.equal(clonedPerson, clonedUnit.native, 'setup: clone preserves the current alias graph')
  const readback = { assignment: clonedPerson.computerAssignment, busy: clonedQuery.busy,
    queryIsRegistered: clonedQuery.source === clonedPerson,
    rosterOwners: clone.campaignAIs[tribe].tasks.flatMap((task, i) => task.members?.includes(u.id) ? [i + 1] : []) }
  const expected = { registeredSame: true, assignment: owner, querySame: true, busy: owner,
    ownershipFlag: 0x2000, flags7f: 0xa4, rosterOwners: [owner] }
  assert.deepEqual({ cancelled, reconciled, responded, readback }, {
    cancelled: expected, reconciled: expected, responded: expected,
    readback: { assignment: owner, busy: owner, queryIsRegistered: true, rosterOwners: [owner] },
  }, 'missing raid ownership continuation: ordinary order cancellation must retain the registered person')
}

test('sole native raid owner survives cancellation, reconciliation and successful response', () => {
  continuation(fixture(3, false))
})

test('a retained entry alias preserves the same raid owner through the continuation', () => {
  continuation(fixture(3, true))
})

test('a retained foreign task owner stays foreign through cancellation and response', () => {
  continuation(fixture(4, true))
})
