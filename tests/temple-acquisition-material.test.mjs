import assert from 'node:assert/strict'
import test from 'node:test'
import models from '../app/original-models.json' with { type: 'json' }
import fire from '../app/original-fire.json' with { type: 'json' }
import { collectBuildingAcquisitionTriangles } from '../app/building-acquisition-triangles.ts'
import { templeTileOffset, templeWorldMaterial, templeSpriteMaterial } from '../app/temple-art.ts'
import { createSharedAniblResource } from '../app/shared-anibl.ts'

const { 95: model } = models,
  shell = { width: 640, height: 480, model: 95 }
const projection = face => {
  const { [face * 2]: n } = model.faces
  return {
    face,
    flight: 0,
    transformed: [
      [0, 0, 500],
      [100, 0, 500],
      [100, 100, 500],
      [0, 100, 500],
    ].slice(0, n),
    projected: [
      [10, 10],
      [110, 10],
      [110, 110],
      [10, 110],
    ].slice(0, n),
  }
}
test('Temple collector preserves all147 faces/222 triangles and mode32 fullbright cutout', () => {
  const command = { whole: false, submissions: model.modes.map((_, face) => projection(face)) },
    before = structuredClone(command),
    triangles = collectBuildingAcquisitionTriangles(command, { ...shell, templeTile: 92 })
  assert.equal(triangles.length, 222)
  assert.equal(new Set(triangles.map(t => t.face)).size, 147)
  const flame = triangles.filter(t => t.mode === 32)
  assert.equal(flame.length, 32)
  for (const t of flame) {
    assert.ok(t.face >= 127 && t.face <= 142)
    assert.equal(t.flags, 0x92)
    assert.equal(t.diffuse, 255)
  }
  for (let i = 0; i < 3; i++)
    assert.deepEqual(
      collectBuildingAcquisitionTriangles(command, { ...shell, templeTile: 92 }),
      triangles
    )
  assert.deepEqual(command, before)
  assert.throws(() => collectBuildingAcquisitionTriangles(command, shell), /qualified shared tile/)
  assert.throws(() => templeTileOffset(96), /qualified shared tile/)
})

test('all nine shared selections map world and acquisition UVs without advancing either consumer', () => {
  const resource = createSharedAniblResource()
  resource.transition(true)
  const command = { whole: false, submissions: [projection(127)] },
    base = collectBuildingAcquisitionTriangles(command, { ...shell, templeTile: 92 }),
    blue = { kind: 'temple', team: 'blue' }
  for (const tile of fire.frames) {
    const snapshot = resource.snapshot()
    assert.equal(snapshot.tile, tile)
    const world = templeWorldMaterial(3, blue, 95, 4, snapshot),
      screen = collectBuildingAcquisitionTriangles(command, { ...shell, templeTile: snapshot.tile })
    for (let triangle = 0; triangle < 2; triangle++)
      for (let corner = 0; corner < 3; corner++) {
        const a = base[triangle].points[corner],
          b = screen[triangle].points[corner]
        assert.ok(Math.abs(b.u - a.u - world.offset[0]) < 1e-12)
        assert.ok(Math.abs(b.v - a.v - world.offset[1]) < 1e-12)
        assert.deepEqual([b.corner, b.x, b.y], [a.corner, a.x, a.y])
      }
    assert.equal(resource.snapshot(), snapshot)
    resource.advance()
  }
  assert.equal(resource.snapshot().tile, 92)
  for (const [mission, team, object, stage] of [
    [1, 'blue', 95, 4],
    [3, 'yellow', 97, 4],
    [3, 'blue', 95, 3],
    [3, 'blue', 103, 4],
  ])
    assert.equal(
      templeWorldMaterial(mission, { kind: 'temple', team }, object, stage, resource.snapshot()),
      null
    )
  assert.throws(() => templeWorldMaterial(3, blue, 95, 4, null), /unavailable/)
})

test('resource palette owns actual p sparkle RGB while ghost trails retain their independent owner', () => {
  const resource = createSharedAniblResource()
  resource.transition(true)
  for (const frame of Array.from({ length: 12 }, (_, i) => 1288 + i)) {
    const draw = templeSpriteMaterial(frame, 0, resource.snapshot())
    assert.equal(draw.atlas, 'temple-sparkles-p')
    assert.equal(draw.crop.source, frame)
    assert.equal(draw.rgb, 0xf7ebc9)
  }
  for (const [selector, rgb] of [
    [-2, 0xff4b16],
    [-1, 0xdf9b1f],
    [1, 0x2fab63],
    [2, 0x333fcb],
  ])
    assert.equal(templeSpriteMaterial(1288, selector, resource.snapshot()).rgb, rgb)
  assert.equal(templeSpriteMaterial(318, 'ghost', resource.snapshot()), null)
  assert.equal(templeSpriteMaterial(1288, 0, null), null)
})
