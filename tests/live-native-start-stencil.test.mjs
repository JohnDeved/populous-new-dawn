import assert from 'node:assert/strict'
import test from 'node:test'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'

test('0049c7a0 authored Green opening wave writes snapped outer cells but excludes cells beyond its stencil', async () => {
  await loadSceneFixture()
  const { createWorld, tick } = await import('../app/model.ts')
  const world = createWorld(3)
  const site = world.levelStart.find(entry => entry.tribe === 2)
  assert.ok(site)
  assert.deepEqual(site.center, { x: 56064, y: 24832, h: 146 })
  const height = (x, y) => world.land.heights[(48 + y) * 128 + 109 + x]
  const inside = () => [height(-3, 1), height(3, 1)]
  const outside = () => [height(4, 0), height(3, -3)]
  assert.deepEqual(inside(), [115, 147], 'asymmetric authored terrain')
  assert.deepEqual(outside(), [182, 172], 'outside sentinels also differ from target')
  for (let turns = 0; turns < 60 && site.wave?.visits !== 17; turns++)
    tick(world, 1 / 12)
  assert.equal(site.wave?.visits, 17)
  assert.equal(site.wave.terrainRadius, 2560)
  assert.deepEqual(site.wave.center, { x: 56064, y: 24832, h: 192 })
  assert.deepEqual(inside(), [192, 192], 'ordinary wave reaches the emitted outer cells')
  assert.deepEqual(outside(), [182, 172], 'radially reachable but outside the emitted stencil')
})
