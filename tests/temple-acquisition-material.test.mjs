import assert from 'node:assert/strict'
import test from 'node:test'
import models from '../app/original-models.json' with { type: 'json' }
import fire from '../app/original-fire.json' with { type: 'json' }
import { collectBuildingAcquisitionTriangles } from '../app/building-acquisition-triangles.ts'
import { templeTileOffset, templeWorldMaterial, templeSpriteMaterial } from '../app/temple-art.ts'
import { createSharedAniblResource } from '../app/shared-anibl.ts'

const { 95: model } = models,
  shell = { width: 640, height: 480, model: 95 }
const environment = bank => ({
  landscape: { bank, modelAtlas: bank === 'c' ? 'atlas' : `atlas-${bank}` },
})
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
  resource.transition(environment('p').landscape)
  const command = { whole: false, submissions: [projection(127)] },
    base = collectBuildingAcquisitionTriangles(command, { ...shell, templeTile: 92 }),
    blue = { kind: 'temple', team: 'blue' }
  for (const tile of fire.frames) {
    const snapshot = resource.snapshot()
    assert.equal(snapshot.tile, tile)
    const world = templeWorldMaterial(environment('p'), blue, 95, 4, snapshot),
      screen = collectBuildingAcquisitionTriangles(command, { ...shell, templeTile: snapshot.tile })
    assert.ok(world, 'completed Temple consumes the selected environment resource')
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
  for (const [team, object, stage] of [
    ['blue', 95, 3],
    ['blue', 103, 4],
  ])
    assert.equal(
      templeWorldMaterial(
        environment('p'),
        { kind: 'temple', team },
        object,
        stage,
        resource.snapshot()
      ),
      null
    )
  assert.throws(() => templeWorldMaterial(environment('p'), blue, 95, 4, null), /unavailable/)
})

test('explicit M3 resource palette owns p sparkle RGB while ghost trails retain their owner', () => {
  const resource = createSharedAniblResource()
  resource.transition(environment('p').landscape)
  for (const frame of Array.from({ length: 12 }, (_, i) => 1288 + i)) {
    const draw = templeSpriteMaterial(3, frame, 0, resource.snapshot())
    assert.ok(draw, 'M3 companion uses its qualified p material')
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
    assert.equal(templeSpriteMaterial(3, 1288, selector, resource.snapshot()).rgb, rgb)
  assert.equal(templeSpriteMaterial(3, 318, 'ghost', resource.snapshot()), null)
  assert.equal(templeSpriteMaterial(3, 1288, 0, null), null)
  for (const mission of [1, 2, 6, 10])
    assert.equal(
      templeSpriteMaterial(mission, 1288, 0, resource.snapshot()),
      null,
      `M${mission} cannot acquire M3 sprite eligibility from a p resource alone`
    )
})

test('all tribe Temple materials validate resource identity and preserve construction admission', () => {
  const teams = ['blue', 'red', 'yellow', 'green']
  for (const bank of ['c', 's', 'p']) {
    const selected = environment(bank),
      resource = createSharedAniblResource()
    resource.transition(selected.landscape)
    resource.advance()
    for (const [tribe, team] of teams.entries()) {
      const building = { kind: 'temple', team },
        snapshot = resource.snapshot(),
        material = templeWorldMaterial(selected, building, 95 + tribe, 4, snapshot)
      assert.ok(material, `${bank}/${team} completed Temple must have a shared animated material`)
      assert.equal(material.atlas, selected.landscape.modelAtlas)
      assert.deepEqual(material.offset, templeTileOffset(snapshot.tile))
      assert.equal(material.epoch, snapshot.epoch)
      assert.equal(resource.snapshot(), snapshot)
      for (let stage = 0; stage < 4; stage++)
        assert.equal(templeWorldMaterial(selected, building, 95 + tribe, stage, snapshot), null)
      assert.throws(() => templeWorldMaterial(selected, building, 95 + tribe, 4, null))
      for (const mismatched of [
        { ...snapshot, bank: bank === 'p' ? 'c' : 'p' },
        {
          ...snapshot,
          modelAtlas: selected.landscape.modelAtlas === 'atlas' ? 'atlas-p' : 'atlas',
        },
      ])
        assert.throws(
          () => templeWorldMaterial(selected, building, 95 + tribe, 4, mismatched),
          'an admitted world consumer must not silently use a different resource'
        )
    }
  }
})

test('resource retention compares both bank and model atlas identity', () => {
  const resource = createSharedAniblResource()
  resource.transition(environment('c').landscape)
  resource.advance()
  const retained = resource.snapshot()
  resource.transition(environment('c').landscape, true)
  assert.equal(resource.snapshot(), retained)
  resource.transition(environment('p').landscape, true)
  assert.equal(resource.snapshot().bank, 'p')
  assert.equal(resource.snapshot().modelAtlas, 'atlas-p')
  assert.equal(resource.snapshot().counter, 0, 'retain request cannot carry phase to a new bank')
  assert.ok(resource.snapshot().epoch > retained.epoch)
  resource.advance()
  const beforeAtlasChange = resource.snapshot()
  resource.transition({ bank: 'p', modelAtlas: 'atlas' }, true)
  assert.equal(resource.snapshot().modelAtlas, 'atlas')
  assert.equal(
    resource.snapshot().counter,
    0,
    'atlas identity also prevents incompatible retention'
  )
  assert.ok(resource.snapshot().epoch > beforeAtlasChange.epoch)
})
