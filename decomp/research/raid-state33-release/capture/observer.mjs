// A passive prefix of one maintained scenario. No game mutation or native encoding.
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { serialize } from 'node:v8'
import { createHash } from 'node:crypto'

const root = process.cwd()
const output = resolve(process.env.PND_STATE33_CAPTURE_OUTPUT ?? '')
assert.equal(process.env.PND_STATE33_CAPTURE, 'approved-single-passive-capture')
assert.equal(output, resolve(root, 'work/orchestration/state33-release-capture-20261007-01'))
const expected = JSON.parse(readFileSync(resolve(root,
  'decomp/research/raid-state33-release/observed-3227.json'), 'utf8'))
const cases = [], completed = Symbol('capture-complete')
const digest = value => createHash('sha256').update(value).digest('hex')
const jsonValue = value => JSON.parse(JSON.stringify(value))
let tickCalls = 0, snapshotBytes = 0, snapshotSha256, result

export function test(name, fn) { cases.push({ name, fn }) }

function order(w, p) {
  if (!p) return null
  const immediate = p.immediateCommand, queued = p.commands?.[p.commandCursor]
  const current = immediate || queued
  return { immediate, cursor: p.commandCursor, queued, current,
    currentRecord: current ? w.buildingOrders.records[current] : null,
    queuedRecord: queued ? w.buildingOrders.records[queued] : null }
}

// Reproduce exactly the old observer's known fields, without inventing missing ones.
function knownActor(w, expectedActor) {
  const id = expectedActor.id, unit = w.units.find(u => u.id === id)
  assert.ok(unit)
  const registered = w.objectCells.objects.get(id)
  const keys = Object.keys(expectedActor.registered)
  const pick = p => p && Object.fromEntries(keys.filter(key => key in p).map(key => [key, p[key]]))
  const owners = { native: unit.native, fight: unit.fight?.motion, flight: unit.flight,
    entry: unit.entry?.person, builder: unit.builder?.person }
  return { id, present: true, team: unit.team, kind: unit.kind, hp: unit.hp,
    target: unit.target, inside: unit.inside, work: unit.work, fighting: unit.fighting,
    fight: unit.fight && { ...unit.fight, motion: undefined }, registered: pick(registered),
    owners: Object.fromEntries(Object.entries(owners).map(([name, p]) =>
      [name, { registered: p != null && p === registered, fields: pick(p), order: order(w, p) }])),
    registeredOrder: order(w, registered) }
}

function capture(w) {
  const tasks = w.campaignAIs.flatMap((ai, tribe) => ai?.tasks?.flatMap((task, index) =>
    task.type === 20 ? [{ tribe, index, ...task }] : []) ?? [])
  const observed = jsonValue({ case: expected.case, kind: 'after-tick', turn: w.turn,
    turnCalls: tickCalls, status: w.status, random: w.randomState,
    cosmetic: w.cosmeticRandom.randomState, tasks,
    selectionOwner: w.ai.selectionOwner,
    actors: expected.actors.map(actor => knownActor(w, actor)) })
  // The old multi-case observer's world ordinal3 is not a game input.
  const { provenance, world: _worldOrdinal, ...knownExpected } = expected
  assert.deepEqual(observed, knownExpected, 'The unchanged scenario must reproduce raw line4446')
  assert.equal(w.buildingOrders.records.length, 800)
  assert.equal(w.campaignAIs[3].tasks.length, 10)
  const people = [10, 11].map(id => {
    const unit = w.units.find(u => u.id === id), registered = w.objectCells.objects.get(id)
    return { id, unit, registered, owners: { native: unit.native, fight: unit.fight?.motion,
      flight: unit.flight, entry: unit.entry?.person, builder: unit.builder?.person },
      nativeFlags7f: { present: Object.hasOwn(unit, 'nativeFlags7f'), value: unit.nativeFlags7f } }
  })
  const cells = [...new Set(people.map(({ registered: p }) =>
    ((p.y & 65535) >>> 9) * 128 + ((p.x & 65535) >>> 9)))].map(index => ({
    index, head: w.objectCells.heads[index],
    fields: Object.fromEntries(Object.entries(w.land)
      .filter(([, value]) => Array.isArray(value) || ArrayBuffer.isView(value))
      .map(([key, value]) => [key, { present: index in value, value: value[index] }])),
  }))
  const buildingIds = new Set([1022, ...cells.map(cell => w.land.buildingIds[cell.index] & 1023)])
  const raw = {
    kind: 'Unmodified port data; native representation is not encoded',
    turn: w.turn, tickCalls, people, cells,
    buildings: w.buildings.filter(building => buildingIds.has(building.id)),
    target1022: { unit: w.units.find(unit => unit.id === 1022),
      building: w.buildings.find(building => building.id === 1022),
      registered: w.objectCells.objects.get(1022) },
    // Keep complete identity-preserving registry/heads for chain and referent binding.
    objectCells: w.objectCells, orders: w.buildingOrders,
    ai: w.ai, campaignAIs: w.campaignAIs, activeCampaignTribe: w.activeCampaignTribe,
    selected: w.selected, manaWorld: w.manaWorld, manaTribes: w.manaTribes,
    castingTribes: w.castingTribes, tribeCount: w.tribeCount, levelFlags2: w.levelFlags2,
    outcome: w.outcome, drawMode: w.drawMode, random: w.randomState,
    cosmetic: w.cosmeticRandom.randomState,
    // Orders' existing port adapter can read these owners; preserve them for later binding.
    motionRoutes: w.motionRoutes, pathfinding: w.pathfinding,
  }
  const bytes = serialize(raw)
  snapshotBytes = bytes.length
  assert.ok(snapshotBytes <= 7 * 1024 * 1024, 'Leave1MiB of the8MiB cap for readable receipts')
  snapshotSha256 = digest(bytes)
  const report = JSON.stringify({ kind: raw.kind, format: 'node:v8 serialization',
    nodeVersion: process.version, sourceHead: process.env.PND_STATE33_SOURCE_HEAD,
    snapshotBytes, snapshotSha256, provenance, observed,
    nativeFlags7f: people.map(p => ({ id: p.id, ...p.nativeFlags7f })),
    propertyKeys: people.map(p => ({ id: p.id, unit: Object.keys(p.unit),
      registered: Object.keys(p.registered) })),
    interpretation: 'Absent properties and undefined values remain distinct in snapshot.bin; no native normalization.'
  }, null, 2) + '\n'
  assert.ok(snapshotBytes + Buffer.byteLength(report) < 8 * 1024 * 1024 - 65536)
  writeFileSync(resolve(output, 'snapshot.bin'), bytes, { flag: 'wx' })
  writeFileSync(resolve(output, 'snapshot.json'), report, { flag: 'wx' })
  throw completed
}

export function observeTick(fn, w, dt) {
  assert.ok(tickCalls < 3227, 'Never advance after the predeclared capture boundary')
  assert.equal(dt, 1 / 12)
  const value = fn(w, dt)
  tickCalls++
  assert.equal(w.turn, tickCalls, 'No clock jumps are permitted')
  if (tickCalls === 3227) capture(w)
  return value
}

export async function run() {
  assert.deepEqual(cases.map(c => c.name), [expected.case])
  try {
    await cases[0].fn()
    throw new Error('The maintained scenario returned without the required capture')
  } catch (error) {
    if (error === completed) result = { status: 'capture-complete',
      maintainedTestStatus: 'not-run to completion; later assertions unexecuted',
      tickCalls, snapshotBytes, snapshotSha256 }
    else {
      result = { status: 'failed', tickCalls,
        error: { name: error.name, message: error.message, stack: error.stack } }
      process.exitCode = 1
    }
  }
  writeFileSync(resolve(output, 'result.json'), JSON.stringify(result, null, 2) + '\n', { flag: 'wx' })
  console.log(JSON.stringify(result))
}
