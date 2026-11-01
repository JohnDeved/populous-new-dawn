// Passive projection of supplied post-callback data. Does not read a browser,
// call a picker, or establish that an adapter captured truthful/fresh data.
import assert from 'node:assert/strict'

export function ordinaryPointerResultWitness(snapshot, expectedPoint) {
  const coordinate = value => typeof value === 'number' && Number.isFinite(value)
  assert.ok(Array.isArray(expectedPoint) && expectedPoint.length === 2 && expectedPoint.every(coordinate), 'Invalid expected point')
  assert.equal(snapshot.mode, 0, 'Only ordinary mode is admitted')
  assert.equal(snapshot.navigationPointer, null, 'Navigation pointer is not ordinary input')
  const pointer = value => {
    assert.ok(value && coordinate(value.clientX) && coordinate(value.clientY), 'Missing pointer coordinates')
    assert.deepEqual([value.clientX, value.clientY], expectedPoint, 'Stale or mismatched tooltip pointer')
  }
  pointer(snapshot.pointerScreen)
  const sample = snapshot.tooltipInput
  assert.ok(sample, 'Missing tooltip sample')
  pointer(sample.pointer)
  assert.ok(['world', 'unmapped-cell', 'unmapped-object'].includes(sample.route), 'Non-world tooltip route')
  const result = { route: sample.route }
  for (const key of ['picked', 'cell', 'inspectionTarget', 'hoveredObject']) {
    const value = key === 'hoveredObject' ? snapshot.hoveredObject : sample[key]
    assert.ok(value === null || (Number.isSafeInteger(value) && value >= 0), `Invalid ${key}`)
    result[key] = value
  }
  // Packed cell and object IDs deliberately remain separate. They are not an
  // exact terrain return point or accepted-hit/allocation witness.
  return Object.freeze(result)
}
