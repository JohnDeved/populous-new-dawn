import assert from 'node:assert/strict'
import test from 'node:test'
import { command, createWorld, select, tick } from '../app/model.ts'

test('ordinary M2 bridge-head reward caches its crossing before the first terrain dispatch', () => {
  const w = createWorld(2)
  const head = w.shrines.find(shrine => shrine.kind === 'bridgeEffect')
  const step = () => tick(w, 1 / 12)
  const terrainDiff = before =>
    Array.from(w.land.heights).flatMap((height, index) =>
      height === before[index] ? [] : [[index, before[index], height]]
    )
  while (w.turn < 122) step()
  assert.equal(head.id, 55)
  select(w, 'shaman')
  assert.ok(command(w, head))
  let before
  while (!head.uses && w.turn < 472) {
    before = w.land.heights.slice()
    step()
  }
  assert.equal(head.uses, 1)
  assert.equal(w.turn, 472)
  assert.equal(w.stats.bridges, 1)
  const crossing = w.effects.find(fx => !!fx.bridge)?.bridge
  assert.deepEqual(crossing, {
    start: { x: 47872, y: 24832 },
    target: { x: 51968, y: 24832 },
    turn: 1,
    alongY: false,
    startCell: 24762,
    endCell: 24778,
    direction: 2,
    crossStep: 0,
    heightStep: 2,
    raiseWater: true,
  })
  assert.deepEqual(terrainDiff(before), [])
  const firstVisit = w.land.heights.slice()
  step()
  assert.equal(w.turn, 473)
  assert.equal(crossing.turn, 2)
  const secondVisit = terrainDiff(firstVisit)
  assert.equal(secondVisit.length, 31)
  assert.deepEqual(secondVisit[0], [6110, 0, 1])
})
