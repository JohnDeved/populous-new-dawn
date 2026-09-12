import test from 'node:test'
import assert from 'node:assert/strict'
import fixture from './fixtures/timber-search.json' with { type: 'json' }
import manifest from '../decomp/exports.json' with { type: 'json' }
import { timberSearchCase, timberPoolCase } from '../scripts/compare-timber-search.mjs'
import {
  createTimberSearches,
  expandTimberSearch,
  invalidateTimberRoutes,
  refreshTimberSearch,
} from '../app/timber-search.ts'
import { createIndexedSearch, startIndexedSearch } from '../app/indexed-search.ts'

test('timber search matches native cell order, fog, protected stock and two-pass queries', () => {
  assert.equal(fixture.executableSha256, manifest.executableSha256)
  fixture.cases.forEach((c, i) => assert.deepEqual(timberSearchCase(c), fixture.expected[i], `native timber query ${i}`))
  for (const mode of ['ordered', 'loose', 'block', 'protect', 'pick', 'availability', 'query'])
    assert.ok(fixture.cases.some(c => c.mode === mode), `${mode} covered`)
  for (const status of [0, 1, 2, 3])
    assert.ok(fixture.expected.some(e => e.result?.status === status), `query status ${status} covered`)
  assert.ok(fixture.cases.some(c => (c.block & 255) === 254), 'cell scan crosses world seam')
  assert.ok(fixture.expected.some((e, i) => e.search.candidates.length < fixture.cases[i].search.candidates.length), 'stale blocks pruned')
})

test('shared timber caches match native allocation, expansion, routing, ownership and expiry', () => {
  fixture.poolCases.forEach((c, i) => assert.deepEqual(timberPoolCase(c), fixture.poolExpected[i], `native timber lifecycle ${i}`))
  const snapshots = fixture.poolExpected.flat()
  for (const action of ['expand', 'routes', 'step', 'keep', 'query', 'invalidate', 'refresh'])
    assert.ok(fixture.poolCases.some(c => c.ops.some(op => op.action === action)), `${action} covered`)
  assert.ok(snapshots.some(s => s.result === -1), '120-slot cache exhaustion')
  assert.ok(snapshots.some(s => s.globals.candidates === 7680), 'candidate allocation limit')
  for (const budget of [1, 2, 3])
    assert.ok(snapshots.some(s => s.globals.routeBudget === budget), `adaptive route budget ${budget}`)
  assert.ok(snapshots.some(s => s.records.some(r => r.idle < 0)), 'signed idle clock wraps')
  assert.ok(snapshots.some(s => s.records.some(r => r.idle === 321 && !(r.flags & 1))), 'unused searches expire at turn 321')
  assert.ok(snapshots.some(s => s.events.length), 'route cost consumer exercised')
})

test('an exhausted indexed-search pool postpones expansion without corrupting the cache', () => {
  const pool = createTimberSearches(), indexed = createIndexedSearch(), owner = { searchIndex: -1 }
  refreshTimberSearch(pool, owner, 0, 0, { id: 1, tribe: 0 })
  for (let i = 1; i < 16; i++) assert.equal(startIndexedSearch(indexed, 2, 0, 0, 1), i)
  const before = structuredClone(pool), bytes = indexed.slice()
  expandTimberSearch(pool, {}, indexed, pool.records[0])
  assert.deepEqual(pool, before)
  assert.deepEqual(indexed, bytes)
})

test('terrain changes recheck nearby timber routes and live Land Bridge reaches the cache', async () => {
  const pool = createTimberSearches()
  Object.assign(pool, { active: 3, unchecked: 1, candidates: 4 })
  Object.assign(pool.records[0], {
    flags: 1,
    stages: 5,
    center: 0x8080,
    unchecked: 1,
    candidates: [
      { cell: 0, cost: 1, flags: 7 },
      { cell: 2, cost: 2, flags: 5 },
    ],
  })
  Object.assign(pool.records[1], {
    flags: 1,
    stages: 5,
    center: 0x2020,
    candidates: [{ cell: 4, cost: 3, flags: 7 }],
  })
  Object.assign(pool.records[2], {
    flags: 1,
    stages: 5,
    center: 0xf0f0,
    candidates: [{ cell: 6, cost: 4, flags: 7 }],
  })
  const unchanged = structuredClone(pool)
  invalidateTimberRoutes(pool, 0x8080, 1)
  assert.deepEqual(pool, unchanged)
  invalidateTimberRoutes(pool, 0x8080, 2)
  assert.deepEqual(
    pool.records.slice(0, 2).map(search => search.candidates.map(candidate => candidate.flags)),
    [[1, 1], [7]]
  )
  assert.deepEqual([pool.records[0].unchecked, pool.unchecked], [2, 2])
  invalidateTimberRoutes(pool, 0x0404, 7)
  assert.deepEqual(pool.records[2].candidates.map(candidate => candidate.flags), [1])

  const { createWorld, addBuilding, cast, tick, nativePosition } = await import('../app/model.ts')
  const w = createWorld(),
    shaman = w.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman'),
    owner = { searchIndex: -1 }
  Object.assign(shaman, { x: 0, z: 20, path: [], casting: null })
  const p = nativePosition(w, shaman)
  refreshTimberSearch(
    w.timberSearches,
    owner,
    ((p.x >>> 8) & 0xfe) | (p.y & 0xfe00),
    0
  )
  const search = w.timberSearches.records[owner.searchIndex]
  Object.assign(search, {
    flags: 1,
    unchecked: 0,
    candidates: [{ cell: search.center, cost: 0, flags: 7 }],
  })
  Object.assign(w.timberSearches, { expanding: 0, unchecked: 0, candidates: 1 })
  w.shots.bridge = 1
  assert.ok(cast(w, 'bridge', { x: 0, z: 4 }))
  for (let i = 0; i < 200 && search.candidates[0].flags !== 1; i++) tick(w, 1 / 12)
  assert.deepEqual(
    [owner.searchIndex, search.candidates[0].flags, search.unchecked, w.timberSearches.unchecked],
    [0, 1, 1, 1]
  )
  Object.assign(search, { unchecked: 0, candidates: [{ cell: search.center, cost: 0, flags: 7 }] })
  Object.assign(w.timberSearches, { unchecked: 0, candidates: 1 })
  addBuilding(w, 'blue', 'hut', { x: shaman.x, z: shaman.z })
  assert.deepEqual([search.candidates[0].flags, search.unchecked, w.timberSearches.unchecked], [1, 1, 1])
})

test('live timber cost probes report routes and foreign territory without taking route ownership',async()=>{
 const {createWorld,nativePosition}=await import('../app/model.ts'),{createLivePerson}=await import('../app/live-people.ts'),{acceptLivePath,planLivePath,probeLivePathCost}=await import('../app/live-pathfinding.ts')
 const w=createWorld(),u=w.units.find(u=>u.team==='blue'&&u.kind==='brave'),source=createLivePerson(w,u),cell=p=>((p.x>>>8)&254)|(p.y&0xfe00),from=cell(nativePosition(w,u))
 assert.deepEqual(probeLivePathCost(w,u,source,from,from),{result:0,cost:0})
 const target=w.trees.find(tree=>{const route=probeLivePathCost(w,u,source,from,cell(nativePosition(w,tree)));return route.result===0&&route.cost>0});assert.ok(target)
 acceptLivePath(w,u,planLivePath(w,u,target));const person=w.pathfinding.people.get(u.id),to=cell(nativePosition(w,target))
 const ownership=()=>({cursor:w.motionRoutes.cursor,active:w.motionRoutes.active,records:w.motionRoutes.records.slice(),failed:w.motionRoutes.failedSearches.slice(),group:person.motionGroup,index:person.motionIndex,goal:[person.goalX,person.goalY]})
 const before=ownership(),route=probeLivePathCost(w,u,person,from,to);assert.equal(route.result,0);assert.ok(route.cost>0);assert.deepEqual(ownership(),before)
 w.land.regions.fill(0x20);assert.deepEqual(probeLivePathCost(w,u,person,from,to),{result:2,cost:route.cost});assert.deepEqual(ownership(),before)
 for(const mask of w.land.walkMasks)mask.fill(0);assert.deepEqual(probeLivePathCost(w,u,person,from,to),{result:1,cost:0});assert.deepEqual(ownership(),before)
})
