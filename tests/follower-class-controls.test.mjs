import test from 'node:test'
import assert from 'node:assert/strict'
import { followerClassControls } from '../app/hud-population.ts'
import { createWorld } from '../app/model.ts'
import { nativeUnitModel } from '../app/unit-kinds.ts'

test('persistent follower controls retain native descriptor order and class HFX ownership', () => {
  const controls = followerClassControls([])
  assert.deepEqual(controls.map(({ kind, sprite }) => [nativeUnitModel(kind), sprite]), [
    [2, 666], [3, 668], [6, 670], [4, 672], [5, 674],
  ])
  assert.equal(controls.length, 5, 'zero classes keep their frame and location')
  assert.ok(controls.every(control => !control.enabled && control.count === 0))
})

test('live own class totals enable controls independently of training knowledge or occupancy', () => {
  const world = createWorld(3)
  const empty = followerClassControls(world.units)
  assert.equal(empty.find(control => control.kind === 'preacher').enabled, false)
  world.unlockedTemple = true
  assert.deepEqual(followerClassControls(world.units), empty, 'knowledge alone never enables a class')

  const preacher = { team: 'blue', kind: 'preacher', hp: 100, inside: 31 }
  world.units.push(preacher)
  let control = followerClassControls(world.units).find(control => control.kind === 'preacher')
  assert.deepEqual([control.count, control.enabled, control.sprite], [1, true, 672])
  world.units.push(
    { ...preacher, team: 'red' },
    { ...preacher, hp: 0 },
    { ...preacher, ghost: true },
  )
  assert.equal(followerClassControls(world.units).find(control => control.kind === 'preacher').count, 1)
  preacher.hp = 0
  control = followerClassControls(world.units).find(control => control.kind === 'preacher')
  assert.deepEqual([control.count, control.enabled], [0, false], 'returning to zero disables the existing class')
})

test('reading the follower strip does not mutate simulation or selection state', () => {
  for (const mission of [1, 2, 3]) {
    const world = createWorld(mission)
    const before = structuredClone(world)
    followerClassControls(world.units)
    assert.deepEqual(world, before)
  }
})
