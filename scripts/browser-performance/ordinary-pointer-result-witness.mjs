// Passive projection of supplied post-callback data. Does not read a browser,
// call a picker, or establish that an adapter captured truthful/fresh data.
import assert from 'node:assert/strict'

export function ordinaryPointerResultWitness(snapshot, expectedPoint) {
  const coordinate = value => typeof value === 'number' && Number.isFinite(value)
  assert.ok(Array.isArray(expectedPoint) && expectedPoint.length === 2 && expectedPoint.every(coordinate), 'Invalid expected point')
  assert.equal(snapshot.mode, 0, 'Only ordinary mode is admitted')
  // The production mouse tracker is populated even for ordinary center hover.
  // Its existence is not camera navigation; retain and validate actual values.
  const navigation = snapshot.navigationPointer
  assert.ok(navigation && coordinate(navigation.x) && coordinate(navigation.y), 'Missing navigation tracker')
  assert.deepEqual([navigation.x, navigation.y], expectedPoint, 'Stale navigation tracker')
  assert.equal(navigation.buttons, 0, 'Pointer buttons are active')
  assert.equal(snapshot.navigationButtons, 0, 'Effective camera navigation is active')
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
