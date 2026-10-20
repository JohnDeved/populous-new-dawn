import test from 'node:test'
import assert from 'node:assert/strict'
import { mission10SelectionQuery, mission10ExpectedSelection, encodeMission10Query, decodeMission10Query } from '../scripts/local-render/mission10-selection.mjs'
import { validateMission10SelectionEvidence } from '../scripts/local-render/mission10-selection-evidence.mjs'
import { mission10ReceiptFixture, mission10EvidenceFixture, mission10QueryFixture } from './support/mission10-profile-receipt.mjs'

// Exact query projection of the retained 19-person failed pre-action capture.
// Artifact 12225828640 SHA256 8f166fa395da88beec79844ace78bdefc2e51a3b369b72d5a503b55e0c60f027.
// Birth attribution was not historically captured; this is observed roster data.
const captured = { point: [8920, 4893], nearby: false, boat: [5,111,63,112,114,113], people: [
  [63,7,9659,6018,0,0,62],[111,3,9704,6063,0,0,62],[112,3,9625,5984,0,0,62],
  [113,3,9523,5882,0,0,62],[114,3,9568,5927,0,0,62],[115,4,8960,64256,0,0,0],
  [116,4,9984,65280,0,0,0],[117,4,11008,63232,0,0,0],[118,4,6912,1792,0,0,0],
  [119,2,9473,62718,0,0,0],[120,2,8960,65280,0,0,0],[121,2,7306,62721,0,0,0],
  [122,2,7424,1792,0,0,0],[123,2,11008,61184,0,0,0],[127,2,9367,62719,0,0,0],
  [129,2,7293,62719,0,0,0],[142,2,30461,3328,0,0,0],[144,2,32512,1280,0,0,0],[146,2,33856,4353,0,0,0],
] }
const raw = q => ({ paused: true, selected: [], point: { x: q.point[0], y: q.point[1] }, nearby: q.nearby,
  vehicles: [{ id: 62, active: true, model: 1, passengerCount: q.boat[0], passengers: q.boat.slice(1) }],
  people: q.people.map(([id, model, x, y, priority, flags4, vehicle]) => ({ id, model, x, y,
    assignment: priority << 12, flags4, vehicle, team: 'blue', hp: 50, owners: { native: null, flight: null, fight: null, entry: null, builder: null, route: null },
      ownerAliases: { native: null, flight: null, fight: null, entry: null, builder: null, route: null } })) })
test('observed nineteen-person roster retains all rows and every eligible extra in exact selections', () => {
  assert.deepEqual(mission10SelectionQuery(raw(captured)), captured)
  assert.deepEqual(decodeMission10Query(encodeMission10Query(captured)), captured)
  assert.deepEqual(mission10ExpectedSelection(captured, 'Select follower', 'Shift').selected, captured.people.map(p => p[0]))
  for (const occupied of [true, false]) {
    const q = mission10QueryFixture(occupied)
    // Interleaved new actors preserve authored identity/class subsequence and
    // observation order. Equal-distance selection must not sort them by ID.
    q.people.splice(1, 0, [201,2,257,256,0,0,0], [200,2,257,256,0,0,0])
    assert.deepEqual(mission10SelectionQuery(raw(q)), q)
    for (const modifier of ['single', 'Control', 'Shift']) {
      const result = mission10ExpectedSelection(q, 'Select follower', modifier)
      assert.ok(result.selected.includes(201)); if (modifier !== 'single') assert.ok(result.selected.includes(200))
    }
    assert.deepEqual(mission10ExpectedSelection(q, 'Select follower', 'single').primary, [201])
  }
})
test('all live raw facts and authored subsequence fail closed without filtering corrupt extras', () => {
  for (const mutate of [
    r => r.people.splice(0,1), r => r.people.reverse(), r => { r.people[0].model = 2 },
    r => { r.people[0].team = 'green' }, r => r.people.push(structuredClone(r.people[0])),
    ...['x','y','assignment','flags4','vehicle','model','hp'].map(key => r => { r.people.at(-1)[key] = NaN }),
    r => { r.people.at(-1).vehicle = 62 }, r => { r.people.at(-1).model = 99 },
  ]) { const r = raw(captured); mutate(r); assert.throws(() => mission10SelectionQuery(r)) }
})
test('trusted raw admission rejects omitted extras, changed observations, unknown sets and false preservation', () => {
  const value = mission10ReceiptFixture('1'.repeat(40))
  for (const phase of value.phases) for (const row of phase.selection) {
    const q = decodeMission10Query(row.query); q.people.push([200,2,800,256,0,0,0]); row.query = encodeMission10Query(q)
    for (const c of row.checks) c[3] = mission10ExpectedSelection(q, ['Select warrior','Select follower'][c[0]], ['single','Control','Shift'][c[1]]).selected
  }
  const good = mission10EvidenceFixture(value)[0]
  assert.equal(validateMission10SelectionEvidence(good, ['boarded']).length, 1)
  for (const mutate of [
    r => r.selection[0].query.people.pop(), r => r.selection[0].checks[5].selected.pop(),
    r => r.selection[0].checks[0].selected.push(999), r => r.observations.pop(),
    r => r.observations.push(structuredClone(r.observations.find(o => o.label === 'boarded-strip-paused'))), r => { r.observations[1].paused = false },
    r => { r.observations[2].orders.changed = true }, r => { r.observations[2].selectionState.people.at(-1).owners = { native: { flags4: 1 } } },
    r => { r.selection[0].checks[0].preserved = false }, r => { r.observations[2].selectionState.people.at(-1).team = 'red' },
  ]) { const bad = structuredClone(good); mutate(bad); assert.throws(() => validateMission10SelectionEvidence(bad, ['boarded'])) }
})
