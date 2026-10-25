import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import { createGameStore } from '../app/game-store.ts'
import { createWorld, addUnit, command } from '../app/model.ts'
import { unitPosition } from '../app/unit-motion.ts'

// Execute the actual browser reset body without launching a profiler or browser.
const source = readFileSync(new URL('../scripts/profile-game.mjs', import.meta.url), 'utf8')
const start = source.indexOf('      window.resetMovingProfile = (smooth, crowd) => {')
const end = source.indexOf('\n    })', start)
assert.ok(start >= 0 && end > start)
const resetSource = source.slice(start, end)
function harness() {
  const store = createGameStore(), world = store.getWorld(), binding = store.bindPresentation(world)
  const s = { world, unitMotion: { frames: new WeakMap() }, gameClock: {},
    focus() { assert.equal(this.world, store.getWorld()) } }
  const position = () => {}, beforeTurn = () => {}, afterTurn = () => {}
  const window = { testStore: store }
  vm.runInNewContext(resetSource, { window, s, createWorld, addUnit, command, unitPosition,
    position, beforeTurn, afterTurn, WeakMap })
  return { store, world, binding, s, window, position, beforeTurn, afterTurn }
}

test('moving profile reset retains one world for Scene, store, presentation and subscribers', () => {
  const h = harness(), published = []
  h.store.subscribe(() => published.push({ world: h.store.getWorld(), selected: [...h.store.getWorld().selected] }))
  const openingCount = createWorld().units.length
  let terrainVersion = h.world.terrainVersion, landVersion = h.world.landVersion
  for (const [smooth, crowd] of [[false, false], [true, true], [false, true], [true, false]]) {
    h.window.resetMovingProfile(smooth, crowd)
    assert.equal(h.s.world, h.world)
    assert.equal(h.s.world, h.store.getWorld())
    assert.ok(h.binding.isCurrent())
    assert.equal(h.world.units.length, openingCount + (crowd ? 200 : 0))
    assert.equal(h.world.terrainVersion, ++terrainVersion)
    assert.equal(h.world.landVersion, ++landVersion)
    assert.equal(h.world.flyby.flags & 1, 0)
    assert.equal(h.world.inputMask, 0)
    assert.ok(h.world.selected.length)
    assert.equal(h.s.unitMotion.position, smooth ? h.position : unitPosition)
    assert.equal(h.s.gameClock.beforeTurn, smooth ? h.beforeTurn : undefined)
    assert.equal(h.s.gameClock.afterTurn, smooth ? h.afterTurn : undefined)
    assert.equal(published.at(-1)?.world, h.world)
    assert.deepEqual(published.at(-1)?.selected, h.world.selected)
  }
  assert.equal(published.length, 4)
})

test('moving profile rejects stale Scene ownership before changing either world', () => {
  const h = harness(), oldUnits = h.world.units
  h.store.restart()
  const current = h.store.getWorld(), currentUnits = current.units
  assert.throws(() => h.window.resetMovingProfile(true, true), /world.*match/i)
  assert.equal(h.s.world, h.world)
  assert.equal(h.world.units, oldUnits)
  assert.equal(current.units, currentUnits)
})
