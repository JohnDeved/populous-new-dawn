// Independent revalidation of retained browser observations. Hashes bind bytes;
// they never substitute for recomputing the original-contract selected sets.
import assert from 'node:assert/strict'
import { mission10SelectionQuery, mission10SelectionPreserved, mission10ExpectedSelection,
  mission10Controls, mission10Modifiers } from './mission10-selection.mjs'

export function validateMission10SelectionEvidence(result, names) {
  assert.equal(result.status, 'passed')
  assert.deepEqual(result.selection.map(row => row.phase), names)
  const observation = label => {
    const rows = result.observations.filter(row => row.label === label)
    assert.equal(rows.length, 1, `Missing/duplicate M10 observation: ${label}`)
    const row = rows[0]
    assert.equal(row.paused, true); assert.equal(row.selectionState.paused, true)
    assert.equal(row.turn, row.selectionState.turn)
    assert.deepEqual(row.selected, row.selectionState.selected)
    return row
  }
  for (const row of result.selection) {
    const before = observation(`${row.phase}-strip-paused`)
    assert.deepEqual(row.occupants, before.party.map(({ id, hp, vehicle }) => ({ id, hp, vehicle })))
    for (const person of row.occupants) {
      const observed = before.selectionState.people.find(p => p.id === person.id)
      assert.equal(observed?.team, 'blue'); assert.equal(observed.hp, person.hp); assert.equal(observed.vehicle, person.vehicle)
    }
    assert.equal(row.checks.length, 6)
    for (const [i, check] of row.checks.entries()) {
      const name = mission10Controls[Math.floor(i / 3)], modifier = mission10Modifiers[i % 3]
      assert.equal(check.name, name); assert.equal(check.modifier, modifier); assert.equal(check.preserved, true)
      const label = `${row.phase}: ${name} ${modifier}`
      const cleared = observation(`${label} cleared`), after = observation(`${label} selected`)
      assert.deepEqual(check.cleared, []); assert.deepEqual(cleared.selected, [])
      const query = mission10SelectionQuery(cleared.selectionState)
      assert.deepEqual(row.query, query, 'Raw M10 query omitted or changed observed people')
      mission10SelectionPreserved(before.selectionState, cleared.selectionState)
      mission10SelectionPreserved(cleared.selectionState, after.selectionState)
      const expected = mission10ExpectedSelection(query, name, modifier)
      assert.deepEqual(check.selected, expected.selected, 'Raw M10 exact selected set differs')
      assert.deepEqual([...after.selected].sort((a, b) => a - b), expected.selected)
      assert.deepEqual(check.primary, expected.primary)
      for (const key of ['turn', 'orders', 'randomState', 'boat', 'party']) assert.deepEqual(after[key], before[key])
    }
  }
  return result.selection
}
