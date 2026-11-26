import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, placeBuilding, select, tick } from '../app/model.ts'

function plan() {
  // Controlled model replay supplies selection/placement directly, not UI flyby gating.
  const world = createWorld(1, 'scalable')
  const advance = target => { while (world.turn < target && world.status === 'playing') tick(world, 1 / 12); assert.equal(world.turn, target) }
  advance(120)
  select(world, 'brave')
  assert.ok(placeBuilding(world, 'hut', { x: -2, z: 32 }))
  const site = world.buildings.at(-1)
  assert.equal(site.id, 1023)
  return { world, site, advance }
}

test('cold stock timber pool starts with the ordinary cadence and serves the first construction search', () => {
  const { world, site, advance } = plan()
  const pool = world.timberSearches
  assert.deepEqual([pool.active, pool.expanding, pool.candidates, pool.unchecked, pool.records.length],
    [0, 0, 0, 0, 120])
  assert.deepEqual([pool.expansionInterval, pool.routeInterval, pool.expansionBudget, pool.routeBudget],
    [1, 3, 2, 1])
  assert.ok(pool.records.every(r => r.stages === 5 && r.flags === 0 && r.candidates.length === 0))
  advance(152)
  assert.deepEqual([site.timberSearch, pool.active, pool.records[0].center], [0, 1, 54278])
  advance(161)
  assert.equal(world.units.find(unit => unit.id === 18).tree, 25)
})

test('grading a live plan makes its previously checked timber candidates unchecked again', () => {
  const { world, site, advance } = plan()
  advance(343)
  const pool = world.timberSearches, search = pool.records[site.timberSearch]
  const cells = search.candidates.map(node => node.cell)
  assert.deepEqual([site.progress, pool.active, search.unchecked, pool.unchecked, cells.length],
    [0, 1, 0, 0, 8])
  assert.ok(search.candidates.every(node => node.flags === 3))
  advance(344)
  assert.deepEqual([site.progress, pool.active, search.unchecked, pool.unchecked], [1 / 3, 1, 8, 8])
  assert.equal(pool.records[site.timberSearch], search)
  assert.deepEqual(search.candidates.map(node => node.cell), cells)
  assert.ok(search.candidates.every(node => node.flags === 1))
})

test('a live preparation order maps supplied tasks five and six back to work', () => {
  for (const phase of [5, 6]) {
    const { world, site, advance } = plan()
    advance(121)
    const worker = world.units.find(unit => unit.id === 18), assignment = worker.builder
    assert.deepEqual([worker.work, assignment.task, assignment.restart], [site.id, 1, false])
    // Only the subtask code is supplied, after normal placement/worker registration.
    assignment.task = phase
    advance(122)
    assert.equal(worker.builder, assignment)
    assert.equal(worker.work, site.id)
    assert.equal(assignment.task, 2)
  }
})
