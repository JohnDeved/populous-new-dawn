import assert from 'node:assert/strict'
import test from 'node:test'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'

for (const [mode, invalid, placed] of [
  ['valid preview (0x80 of 0x180)', false, false],
  ['invalid preview (0x180)', true, false],
  ['placed plan (0x400)', false, true],
]) {
  test('00474ba0 connected hut center writes the inner CPU atlas tile for ' + mode, async () => {
    const { createWorld, placeBuilding } = await loadSceneFixture()
    const { GameScene } = await import('../app/scene.ts')
    const { buildingPose } = await import('../app/building-shapes.ts')
    const world = createWorld(1)
    assert.equal(placeBuilding(world, 'hut', { x: -2, z: 32 }), true)
    const hut = world.buildings.find(b => b.kind === 'hut' && b.preparation)
    assert.ok(hut)
    const pose = buildingPose(hut)
    assert.deepEqual(pose, { object: 107, angle: 0, anchorX: 1536, anchorY: 55296 })
    const oldFlags = world.land.flags.slice()
    const { geometry, cells, entrance } = GameScene.prototype.planGeometry.call({ world }, pose, invalid, placed)
    try {
      const footprint = [13698, 13699, 13700, 13826, 13827, 13828, 13954, 13955, 13956]
      assert.deepEqual(cells, placed ? footprint : [...footprint, 13571])
      assert.equal(entrance, 13571)
      assert.equal(world.land.flags[13827] & 1, 1)
      const uv = geometry.getAttribute('uv').array
      const row = i => Array.from(uv.slice(12 * cells.indexOf(i), 12 * (cells.indexOf(i) + 1)))
      const atlas = (tile, corners) => corners.flatMap(([x, y]) => [
        ((tile % 8) * 32 + 0.5 + x * 31) / 256,
        1 - (Math.floor(tile / 8) * 32 + 0.5 + y * 31) / 1024,
      ])
      // Far corner is unaffected by the one-east-neighbor negative control.
      assert.deepEqual(row(13698), atlas(54, [[0, 0], [1, 0], [1, 1], [1, 1], [0, 1], [0, 0]]))
      // Native no missing cardinal/diagonal => tile 15, rotation 0.
      // Native mask/tint remap selects tile 63 in all three cases.
      // Split=1 rotates the two CPU triangle UV triplets to orientations 3/1.
      assert.deepEqual(row(13827), atlas(63, [[1, 1], [0, 1], [0, 0], [0, 0], [1, 0], [1, 1]]), 'connected center tile and rotation')
      assert.deepEqual(world.land.flags, oldFlags, 'presentation flags never persist in terrain')
    } finally {
      geometry.dispose()
    }
  })
}
