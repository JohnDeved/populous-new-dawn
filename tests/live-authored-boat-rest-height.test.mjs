import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, tick } from '../app/model.ts'
import { terrainPointHeight } from '../app/native-terrain.ts'

const dt = 1 / 12
const navigationStop = 0x10000
const point = { x: 1280, y: 256 }

function suppliedRestBoundary(offset) {
  const w = createWorld(5)
  for (let i = 0; i < 12; i++) tick(w, dt)
  const boat = w.vehicles.find(v => v.model === 1)
  const driver = w.units.find(u => u.native?.tribe === 0)
  assert.deepEqual([boat.id, driver.id], [97, 111])
  assert.equal(w.objectCells.objects.get(driver.id), driver.native)
  const height = terrainPointHeight(w.land, point)
  assert.equal(height, 0)
  // Install the exact stop boundary in authored water, not a claim of UI-earned boarding.
  // State 14 avoids the person-owned movement visit while retaining the registered driver.
  Object.assign(driver.native, { state: 14, vehicle: boat.id, speed: 0 })
  Object.assign(boat, {
    ...point, active: true, h: height + offset, speed: 1, life: 500, passengerCount: 1,
    navigationFlags: boat.navigationFlags | navigationStop,
  })
  boat.passengers[0] = driver.id
  return { w, boat, height }
}

for (const offset of [-7, 0, 7]) {
  test(`Mission 5 live vehicle visit raises low rest height and preserves higher height (${offset})`, () => {
    const { w, boat, height } = suppliedRestBoundary(offset)
    tick(w, dt)
    assert.equal(boat.h, height + Math.max(offset, 0), 'boat rest height')
    assert.equal(w.turn, 13)
  })
}

test('Mission 5 live centered Boat then stops and clears only the existing navigation stop bit', () => {
  const { w, boat } = suppliedRestBoundary(-7)
  const before = boat.navigationFlags
  assert.ok((before & ~navigationStop) !== 0, 'unrelated flags are present')
  tick(w, dt)
  assert.equal(boat.speed, 0, 'Boat enters ordinary stop')
  assert.equal(boat.navigationFlags, before & ~navigationStop, 'only the stop bit is cleared')
  assert.deepEqual([boat.x, boat.y, boat.passengers[0]], [point.x, point.y, 111])
  assert.equal(boat.active, true)
})
