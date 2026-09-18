import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import * as THREE from 'three'
import { findStoneHeadHeading, stoneHeadAngle } from '../app/stone-head-orientation.ts'
import { modelMatrix, modelPoint } from '../app/projection.ts'
import { createWorld } from '../app/world-initialization.ts'
import { migrateCheckpoint } from '../app/game-store.ts'

const scenery = (heading, index = 1, x = -5, z = 25) => ({
  index, type: 5, model: 9, x, z, heading,
})

test('heading comes from the decorative scenery word, never trigger settings or model selection', () => {
  const point = { x: -5, z: 25 }
  const trigger = { ...point, index: 30, type: 6, model: 6, angle: 0x01000103 }
  assert.deepEqual(findStoneHeadHeading([trigger, scenery(1536)], point), { sceneryIndex: 1, heading: 1536 })
  assert.deepEqual(findStoneHeadHeading([scenery(0)], point), { sceneryIndex: 1, heading: 0 })
  for (const mode of [0, 3, 5])
    assert.deepEqual(findStoneHeadHeading([{ ...trigger, mode }, scenery(1024)], point), { sceneryIndex: 1, heading: 1024 })
})

test('all16bits reach the angle-table mask and a missing producer is not treated as north', () => {
  for (const word of [0, 1, 255, 256, 257, 512, 1024, 1536, 2047, 65535])
    assert.equal(findStoneHeadHeading([scenery(word)], scenery(word)).heading, word & 2047)
  const absent = scenery(undefined)
  absent.angle = 0 // The previous +7 dword loses the actual heading high byte.
  assert.equal(findStoneHeadHeading([absent], absent), null)
  for (const bad of [null, NaN, 0.5]) assert.equal(findStoneHeadHeading([scenery(bad)], absent), null)
})

test('linking uses the native512-unit cell, first scenery match and toroidal coordinate identity', () => {
  const first = scenery(1024, 10), second = scenery(1536, 20)
  assert.deepEqual(findStoneHeadHeading([first, second], first), { sceneryIndex: 10, heading: 1024 })
  assert.equal(findStoneHeadHeading([scenery(undefined, 10), second], first), null)
  assert.deepEqual(findStoneHeadHeading([first], { x: first.x + 256, z: first.z - 256 }), { sceneryIndex: 10, heading: 1024 })
  assert.equal(findStoneHeadHeading([first], { x: first.x + 2, z: first.z }), null)
  assert.equal(findStoneHeadHeading([{ ...first, model: 8 }], first), null)
})

test('existing negative-Y scene rotation agrees with native heading basis; no camera or global offset is required', () => {
  const raw = [100, 37, -250]
  for (const heading of [0, 512, 1024, 1536]) {
    const angle = heading * Math.PI / 1024
    const group = new THREE.Group()
    // The existing GameScene.orientModel convention is retained, not changed.
    group.rotation.y = -angle
    const projected = new THREE.Vector3(raw[0], raw[1], -raw[2]).applyQuaternion(group.quaternion)
    const native = modelPoint(raw, 256, modelMatrix(heading), { x: 0, y: 0, z: 0 })
    assert.ok(Math.abs(projected.x - native.x) < 1e-9)
    assert.ok(Math.abs(projected.y - native.y) < 1e-9)
    assert.ok(Math.abs(projected.z + native.z) < 1e-9)
    assert.equal(Math.round(angle * 1024 / Math.PI) & 2047, heading)
  }
})

test('Vault and unknown scenery keep their original angle; orientation lookup does not mutate saved gameplay', () => {
  const world = createWorld(1), vault = world.shrines.find(s => s.kind === 'vault')
  assert.equal(stoneHeadAngle(vault, 1), vault.angle)
  assert.equal(stoneHeadAngle({ kind: 'bridge', angle: 1.23, x: 0, z: 0 }, 1), 1.23)
  const loaded = migrateCheckpoint(structuredClone(world)), snapshot = structuredClone(loaded)
  for (const head of loaded.shrines) stoneHeadAngle(head, loaded.outcome.level)
  assert.deepEqual(loaded, snapshot)
})

test('both ordinary scene orientation consumers use the same helper; no other angle consumer changes', () => {
  const source = readFileSync(new URL('../app/scene-entities.ts', import.meta.url), 'utf8')
  assert.equal(source.split('stoneHeadAngle(shrine, scene.world.outcome.level)').length - 1, 2)
  assert.ok(source.includes('scene.orientModel(g, v.heading)'))
  assert.ok(source.includes('scene.orientModel(g, b.angle)'))
})

test('real authored zero and high-byte headings survive the producer while saved trigger fields stay unchanged', () => {
  for (const [mission, kind, expected] of [[1, 'bridge', 0], [3, 'erosionEffect', 1536], [5, 'convertWild', 1024], [22, 'inert', 0]]) {
    const w = createWorld(mission), h = w.shrines.find(s => s.kind === kind), before = structuredClone(h)
    assert.ok(h)
    assert.equal(Math.round(stoneHeadAngle(h, mission) * 1024 / Math.PI) & 2047, expected)
    assert.deepEqual(h, before)
    const restored = migrateCheckpoint(structuredClone(w)), saved = restored.shrines.find(s => s.id === h.id)
    assert.equal(stoneHeadAngle(saved, mission), stoneHeadAngle(h, mission))
    assert.equal(saved.model, before.model)
    assert.deepEqual(saved.stoneHead, before.stoneHead)
  }
})
