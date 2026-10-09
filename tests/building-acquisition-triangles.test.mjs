import assert from 'node:assert/strict'
import test from 'node:test'
import models from '../app/original-models.json' with { type: 'json' }
import {
  BUILDING_ACQUISITION_TRIANGLE_CAPACITY,
  buildingAcquisitionBucket,
  collectBuildingAcquisitionTriangles,
} from '../app/building-acquisition-triangles.ts'

const shell = { width: 640, height: 480 }
const face = (index = 0, depth = 0) => ({
  face: index,
  transformed: [
    [0, 0, depth],
    [100, 0, depth],
    [100, 100, depth],
    [0, 100, depth],
  ],
  projected: [
    [10, 10],
    [110, 10],
    [110, 110],
    [10, 110],
  ],
  flight: 0,
})
const collect = (submissions, whole = false, options = shell) =>
  collectBuildingAcquisitionTriangles({ submissions, whole }, options)
const freeze = value => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze)
    Object.freeze(value)
  }
  return value
}

test('M1 consumes the existing 107 face groups and only modes6/7', () => {
  assert.equal(models[103].modes.length, 107)
  assert.deepEqual(
    models[103].modes.reduce((count, mode) => ({ ...count, [mode]: (count[mode] ?? 0) + 1 }), {}),
    { 6: 36, 7: 71 }
  )
  assert.equal(BUILDING_ACQUISITION_TRIANGLE_CAPACITY, models[95].p.length / 9)
  const submissions = models[103].modes.map((_, index) => {
    const projection = face(index)
    if (models[103].faces[index * 2] === 3) {
      projection.projected.pop()
      projection.transformed.pop()
    }
    return projection
  })
  assert.equal(collect(submissions).length, models[103].p.length / 9)
  assert.throws(() => collect([face(107)]), /Invalid Mission 1/)
})

test('source depth arithmetic clamps before the bounded screen queue drain', () => {
  assert.equal(buildingAcquisitionBucket([0, 0, 0], -10), 53)
  assert.equal(buildingAcquisitionBucket([-1000, -1000, -1000], 100), 0, 'distance<64 ignores bias')
  assert.equal(buildingAcquisitionBucket([0, 0, 0], -100), 0)
  assert.equal(buildingAcquisitionBucket([100000, 100000, 100000], 0), 3584)
  assert.equal(buildingAcquisitionBucket([0x7fffffff, 0, 0], 0), 0, 'signed32 multiplication wraps')
  assert.deepEqual(collect([face(0, 4000)]), [], 'bucket beyond256 is not forced into256')
})

test('painter order is descending depth then reverse insertion, including quad023 before012', () => {
  const triangles = collect([face(0), face(1, 500), face(2)])
  assert.deepEqual(
    triangles.map(t => [t.face, t.triangle, t.order]),
    [
      [1, 1, 3],
      [1, 0, 2],
      [2, 1, 5],
      [2, 0, 4],
      [0, 1, 1],
      [0, 0, 0],
    ]
  )
  assert.deepEqual(
    triangles.at(-1).points.map(p => p.corner),
    [0, 2, 3]
  )
  assert.deepEqual(
    triangles.at(-2).points.map(p => p.corner),
    [0, 1, 2]
  )
  assert.ok(triangles[0].bucket > triangles[2].bucket)
})

test('whole culls negative winding; per-face reverses positions and corresponding UV corners', () => {
  const normal = face(),
    reverse = face()
  reverse.projected = normal.projected.map(([x, y]) => [120 - x, y])
  assert.equal(collect([normal], true).length, 2)
  assert.equal(collect([reverse], true).length, 0)
  const forward = collect([normal]),
    backward = collect([reverse])
  for (let i = 0; i < 2; i++) {
    assert.deepEqual(
      backward[i].points.map(p => p.corner),
      forward[i].points.map(p => p.corner).reverse()
    )
    assert.deepEqual(
      backward[i].points.map(p => [p.u, p.v]),
      forward[i].points.map(p => [p.u, p.v]).reverse()
    )
  }
})

test('source outcodes use the full shell and leave top and partial clipping downstream', () => {
  for (const offset of [
    [-200, 0],
    [640, 0],
    [0, 480],
  ]) {
    const projection = face()
    projection.projected = projection.projected.map(([x, y]) => [x + offset[0], y + offset[1]])
    assert.equal(collect([projection]).length, 0)
  }
  const top = face(),
    crossing = face(),
    inHud = face()
  top.projected = top.projected.map(([x, y]) => [x, y - 200])
  crossing.projected = crossing.projected.map(([x, y]) => [x - 50, y])
  inHud.projected = [
    [1, 20],
    [90, 20],
    [90, 100],
    [1, 100],
  ]
  assert.equal(collect([top]).length, 2, 'no source common top outcode')
  assert.equal(collect([crossing]).length, 2)
  assert.equal(collect([inHud]).length, 2, 'viewport x100 must not exclude the HUD')
})

test('screen lighting is flat per face, with screen depth adjustment and no world fade/highlight', () => {
  const middle = collect([face()])[0],
    front = collect([face(0, -400)])[0],
    back = collect([face(0, 400)])[0]
  assert.equal(front.shade, Math.min(63, middle.shade + 4))
  assert.equal(back.shade, Math.max(0, middle.shade - 20))
  assert.equal(collect([face(0, -399)])[0].shade, middle.shade)
  assert.equal(collect([face(0, 399)])[0].shade, middle.shade)
  const whole = collect([face()], true)
  assert.equal(whole[0].shade, whole[1].shade)
  assert.equal(whole[0].shade, collect([face(0, 400)], true)[0].shade)
  assert.equal(collect([face()], true, { ...shell, shadeOffset: -128 })[0].shade, 1)
  assert.equal(collect([face()], true, { ...shell, shadeOffset: 127 })[0].shade, 63)
  for (const t of [middle, front, back, ...whole])
    assert.equal(t.diffuse, t.shade < 32 ? t.shade * 8 : 255)
})

test('mode flags, bilinear texel-center inset and tile226-only tribe remap survive collection', () => {
  assert.deepEqual(
    collect([face(0), face(2)]).map(t => [t.mode, t.flags]),
    [
      [6, 0x80],
      [6, 0x80],
      [7, 0x82],
      [7, 0x82],
    ]
  )
  const first = collect([face()]).find(t => t.triangle === 1)
  assert.ok(Math.abs(first.points[0].u - 255.5 / 256) < 0.000001)
  assert.ok(Math.abs(first.points[0].v - (1 - 480.5 / 1024)) < 0.000001)
  const index = models[103].tiles.indexOf(226),
    source = face(index)
  if (models[103].faces[index * 2] === 3) {
    source.projected.pop()
    source.transformed.pop()
  }
  const blue = collect([source]),
    red = collect([source], false, { ...shell, tribe: 1 })
  assert.deepEqual(
    red.map(t => t.points.map(p => [p.u - 1 / 8, p.v])),
    blue.map(t => t.points.map(p => [p.u, p.v]))
  )
  assert.deepEqual(collect([face()], false, { ...shell, tribe: 1 }), collect([face()]))
})

test('repeated collection cannot modify logical visit state or its selected feedback', () => {
  const command = freeze({
      whole: false,
      selected: [0, 1],
      submissions: [face(), face(1)],
      randomState: 123,
      visits: 40,
    }),
    before = structuredClone(command),
    first = collectBuildingAcquisitionTriangles(command, shell)
  for (let i = 0; i < 20; i++)
    assert.deepEqual(collectBuildingAcquisitionTriangles(command, shell), first)
  assert.deepEqual(command, before)
})
