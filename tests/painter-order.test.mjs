import assert from 'node:assert/strict'
import { test } from 'node:test'
import fixture from './fixtures/painter-order.json' with { type: 'json' }
import camera from '../app/original-camera.json' with { type: 'json' }
import {
  comparePolygons,
  modelTriangleVisible,
  painterDepth,
  polygonBucket,
} from '../app/painter-order.ts'
import faces from './fixtures/model-facing.json' with { type: 'json' }
import cells from './fixtures/cell-render-order.json' with { type: 'json' }
import { modelTextureModes } from '../app/model-faces.ts'
import {
  cellObjectOrder,
  insertObjectIntoCell,
  moveObjectInCells,
  objectsInCell,
} from '../app/object-cells.ts'

test('construction caps replace face modes and hidden picking faces emit no material', () => {
  const model = { faces: [3, 17, 4, 1, 3, 2], modes: [32, 6, 0] }
  assert.deepEqual(modelTextureModes(model, 0), [7, 7, 7, 6, 6, 6, 6, 6, 6])
  assert.deepEqual(modelTextureModes(model, 1), [])
  assert.deepEqual(modelTextureModes(model, 4), [32, 32, 32, 6, 6, 6, 6, 6, 6])
})

test('cell render order matches native mixed passes and retained arrival order', () => {
  assert.equal(cells.executableSha256, camera.executableSha256)
  let world
  for (const c of cells.cases) {
    if (c.movement === 'initial') {
      world = { heads: new Uint16Array(16384), objects: new Map() }
      for (const id of c.insertion) {
        const object = {
          id,
          x: 256,
          y: 256,
          h: 0,
          flags2: 0,
          flags3: 0,
          cellNext: 0,
          cellPrevious: 0,
        }
        world.objects.set(id, object)
        insertObjectIntoCell(world, object, object)
      }
    } else
      moveObjectInCells(world, world.objects.get(c.insertion[0]), {
        x: c.movement === 'leave' ? 768 : 257,
        y: 256,
        h: 0,
      })
    const chain = [...objectsInCell(world, 0)].map(p => p.id),
      order = cellObjectOrder(world)
    assert.deepEqual(chain, c.chain)
    const submitted = [...chain]
      .reverse()
      .sort((a, b) => cells.phases[a - 1] - cells.phases[b - 1] || order.get(a) - order.get(b))
    assert.deepEqual(submitted, c.submitted)
  }
})
test('cell traversal preserves live ordering when a stale chain entry is encountered', () => {
  const world = { heads: new Uint16Array(16384), objects: new Map() },
    object = {
      id: 1,
      x: 256,
      y: 256,
      h: 0,
      flags2: 0,
      flags3: 0,
      cellNext: 2,
      cellPrevious: 0,
    }
  world.heads[0] = object.id
  world.objects.set(object.id, object)
  assert.deepEqual([...objectsInCell(world, 0)].map(candidate => candidate.id), [1])
  assert.deepEqual([...cellObjectOrder(world)], [[1, 0]])
})
test('mixed polygon buckets, reverse insertion ties and raster depths match native captures', () => {
  assert.equal(fixture.executableSha256, camera.executableSha256)
  for (const c of fixture.cases) {
    const commands = c.triangles.map((t, order) => ({
      order,
      bucket: polygonBucket(t.depths, t.bias, !!t.flags),
    }))
    assert.deepEqual(
      commands.map(p => p.bucket),
      c.buckets
    )
    commands.sort(comparePolygons)
    assert.deepEqual(
      commands.map(p => p.order),
      c.order
    )
    assert.deepEqual(
      commands.filter((_, i) => i % 4).map(p => p.order),
      c.alphaOrder
    )
    commands.forEach((p, i) => assert.equal(painterDepth(i), c.rasterDepths[p.order]))
  }
})

test('completed models reject native rear faces and shared side/bottom outcodes', () => {
  assert.equal(faces.executableSha256, camera.executableSha256)
  for (const c of faces.cases.filter(c => c.stage === 4)) {
    const points = c.projected.map(([screenX, screenY]) => ({ screenX, screenY }))
    assert.equal(modelTriangleVisible(points, 1240, 1000), !!c.submitted)
  }
  const triangle = (x, y) =>
    [
      [x, y],
      [x + 10, y],
      [x, y + 10],
    ].map(([screenX, screenY]) => ({ screenX, screenY }))
  for (const [x, y, expected] of [
    [-11, 0, false],
    [1240, 0, false],
    [0, 1000, false],
    [-5, 0, true],
    [0, -20, true],
  ])
    assert.equal(modelTriangleVisible(triangle(x, y), 1240, 1000), expected)
})
