import assert from 'node:assert/strict'
import test from 'node:test'
import { liveCommandContext } from '../app/live-command.ts'
import { chooseContextCommand, CommandContext } from '../app/command-context.ts'
import { createWorld } from '../app/world-initialization.ts'
import { addUnit } from '../app/world-state.ts'

function scenario(mode = 'scalable') {
  const world = createWorld(1, mode)
  world.units = []
  world.buildings = []
  world.shrines = []
  world.vehicles = []
  world.land.flags.fill(0)
  world.land.categories.fill(2)
  const tree = { id: 9000000, x: 0, z: 0, model: 1, logs: 4 }
  world.trees = [tree]
  const brave = addUnit(world, 'blue', 'brave', { x: -20, z: 8 })
  const spy = addUnit(world, 'blue', 'spy', { x: -16, z: 8 })
  const warrior = addUnit(world, 'blue', 'warrior', { x: -12, z: 8 })
  return { world, tree, brave, spy, warrior }
}

test('live context keeps selected model masks for every small selection, duplicates and missing handles', () => {
  const { world, tree, brave, spy, warrior } = scenario()
  const handles = [brave.id, spy.id, warrior.id, -999, NaN]
  let compared = 0
  const check = selected => {
    world.selected = Object.freeze(selected)
    const models = new Map([[brave, 2], [spy, 5], [warrior, 3]])
    const mask = world.units.reduce((mask, unit) =>
      mask | (selected.includes(unit.id) ? 1 << models.get(unit) : 0), 0)
    const result = liveCommandContext(world, tree)
    assert.equal(result.model, chooseContextCommand(CommandContext.Ground | CommandContext.Tree, mask))
    assert.equal(result.tree, tree)
    assert.equal(result.person, undefined)
    compared++
  }
  check([])
  for (const a of handles) {
    check([a])
    for (const b of handles) {
      check([a, b])
      for (const c of handles) check([a, b, c])
    }
  }
  assert.equal(compared, 156)
})

test('current roster order, not selection order, determines the context tribe', () => {
  const { world, brave } = scenario()
  const red = addUnit(world, 'red', 'brave', { x: 20, z: 20 })
  world.units = [red, brave]
  world.selected = [brave.id, red.id]
  const enemy = liveCommandContext(world, brave)
  assert.equal(enemy.model, 28)
  assert.equal(enemy.person, brave)
  world.selected.reverse()
  assert.deepEqual(liveCommandContext(world, brave), enemy)
  world.units.reverse()
  const friendly = liveCommandContext(world, brave)
  assert.equal(friendly.model, 3)
  assert.equal(friendly.person, undefined)
})

test('each call observes in-place selection changes, replacement arrays and the current unit roster', () => {
  const { world, tree, brave, spy } = scenario()
  world.selected = [spy.id]
  assert.equal(liveCommandContext(world, tree).model, 13)
  world.selected[0] = brave.id
  assert.equal(liveCommandContext(world, tree).model, 7)
  world.selected = [spy.id]
  assert.equal(liveCommandContext(world, tree).model, 13)
  world.units = world.units.filter(unit => unit !== spy)
  assert.equal(liveCommandContext(world, tree).model, 3)
  world.units.push(spy)
  assert.equal(liveCommandContext(world, tree).model, 13)
})

test('membership retains includes SameValueZero behavior and sparse selection slots', () => {
  const { world, tree, brave, spy } = scenario()
  brave.id = NaN
  spy.id = -0
  world.selected = [NaN]
  assert.equal(liveCommandContext(world, tree).model, 7)
  world.selected = [0]
  assert.equal(liveCommandContext(world, tree).model, 13)
  world.selected = [, 0, NaN, 0]
  assert.equal(liveCommandContext(world, tree).model, 7)
  world.selected = [, -999]
  assert.equal(liveCommandContext(world, tree).model, 3)
})

test('selected handles are read once per call rather than once per roster comparison', () => {
  const { world, tree, brave } = scenario()
  world.units = Array.from({ length: 256 }, (_, i) => ({ ...brave, id: i + 1 }))
  const selected = Array.from({ length: 256 }, (_, i) => i + 1)
  const original = Object.getOwnPropertyDescriptors(selected)
  let reads = 0
  for (let i = 0; i < selected.length; i++) {
    const value = selected[i]
    Object.defineProperty(selected, i, { configurable: true, enumerable: true, get: () => { reads++; return value } })
  }
  world.selected = selected
  let result
  try {
    result = liveCommandContext(world, tree)
  } finally {
    Object.defineProperties(selected, original)
  }
  assert.equal(result.model, 7)
  assert.deepEqual(Object.getOwnPropertyDescriptors(selected), original)
  assert.equal(reads, 256)
})

test('classic and scalable context queries preserve the complete World and returned owner identities', () => {
  for (const mode of ['classic', 'scalable']) {
    const { world, tree, brave, spy } = scenario(mode)
    world.selected = [spy.id, brave.id, spy.id, -99]
    const before = structuredClone(world)
    const result = liveCommandContext(world, tree)
    assert.equal(result.model, 7)
    assert.equal(result.tree, tree)
    assert.deepEqual(world, before)
    assert.equal(liveCommandContext(world, { ...tree, id: -123456 }), null)
    assert.deepEqual(world, before)
  }
})
