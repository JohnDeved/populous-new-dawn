import assert from 'node:assert/strict'
import test from 'node:test'
import { waveDeformationOffset } from '../app/model-lighting.ts'
import { addUnit, cast, createWorld, tick } from '../app/model.ts'

test('native model wave uses half, quarter, eighth strength then resets', () => {
  const points = [
      { x: 640, y: 356, z: 640 },
      { x: 700, y: 228, z: 640 },
      { x: 1664, y: 356, z: 640 },
    ],
    expected = [
      [
        [0, 10],
        [4, 0],
        [0, 0],
      ],
      [
        [0, 5],
        [2, 0],
        [0, 0],
      ],
      [
        [0, 2],
        [1, 0],
        [0, 0],
      ],
      [
        [0, 0],
        [0, 0],
        [0, 0],
      ],
    ]
  for (let phase = 1; phase <= 4; phase++)
    assert.deepEqual(
      points.map(point => waveDeformationOffset(point, 100, { x: 640, z: 640 }, phase)),
      expected[phase - 1]
    )
  assert.deepEqual(
    waveDeformationOffset({ x: 640, y: 100, z: 640 }, 100, { x: 640, z: 640 }, 1),
    [0, 0]
  )
})

test('live waves retain first-hit deformation on resource scenery', () => {
  const w = createWorld()
  w.manaWorld.gameFlags = 32
  w.units = []
  w.buildings = []
  w.trees = []
  w.shrines = []
  w.terrain.fill(3)
  addUnit(w, 'blue', 'shaman', { x: -4, z: 0 })
  const tree = { x: 0, z: 0, id: w.nextId++, model: 1, logs: 1 }
  w.trees.push(tree)
  assert.ok(cast(w, 'blast', tree))
  for (let i = 0; i < 100 && !tree.shake; i++) tick(w, 1 / 12)
  assert.equal(tree.shake, 1)
  const origin = tree.shakeOrigin
  tick(w, 1 / 12)
  assert.equal(tree.shakeOrigin, origin)
})
