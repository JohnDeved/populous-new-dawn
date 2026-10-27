import assert from 'node:assert/strict'
import test from 'node:test'
import { createIndexedSearch, startIndexedSearch, endIndexedSearch } from '../app/indexed-search.ts'
import { acquireQueuedResource, searchQueuedResource } from '../app/queued-resource-search.ts'

// Directed static-contract cases, not original-executable comparisons.
// Retained exports: 004340a0 be7dd1bf9140db1def83489270671a56f2a1d9c4c0ab02498d5566147720a8ca;
// 004a74e0 fdd073e4015325dded969b08a4d63bdad8bdf51ac7f3a9101d2fef3238e67f7f.
// Their phase-1 selector and descriptor branches, plus 0049a2f0/0049a3f0,
// supply the literal expectations below. The native search-data binding has
// rings 0..8 counts [1,8,16,20,24,40,36,48,56]; type 2 repeats a ring's
// starting point except when the terminal call ends the final ring.
// Resource descriptors: models 1..6 = 0x020c817f; model 11 = 0x01419464.
const center = { x: 0x8100, y: 0x8100 }
const centerCell = 64 * 128 + 64
const treeModel = 1
const logModel = 11
const unexpected = () => assert.fail('Unexpected resource consumer')

function resource(id, model = logModel, cell = centerCell, extra = {}) {
  return {
    id,
    class: 5,
    model,
    x: (cell % 128) * 512 + 256,
    y: Math.floor(cell / 128) * 512 + 256,
    ...extra,
  }
}

function activeSlots(pool) {
  return Array.from({ length: 15 }, (_, i) => i + 1).filter(id => pool[id * 12])
}

for (const [flags, expectedModel] of [
  [0, logModel],
  [4, treeModel],
  [8, logModel],
  [12, logModel],
  [0x84, treeModel],
  [0x88, logModel],
  [0x8c, logModel],
]) {
  test(`queued resource selector ${flags} respects preference or head order`, () => {
    const pool = createIndexedSearch()
    const log = resource(91)
    const tree = resource(2, treeModel)
    const approached = []
    const chosen = acquireQueuedResource(
      pool,
      center,
      0,
      flags,
      cell => (cell === centerCell ? [log, tree] : []),
      object => approached.push(object)
    )
    assert.equal(chosen, expectedModel === treeModel ? tree : log)
    assert.deepEqual(approached, [chosen])
    assert.deepEqual(activeSlots(pool), [])
  })
}

test('mode 2 rejects every tree even though its descriptor also has bit 4', () => {
  const pool = createIndexedSearch()
  const trees = Array.from({ length: 6 }, (_, i) => resource(i + 1, i + 1))
  const log = resource(71)
  const approached = []
  assert.equal(
    searchQueuedResource(
      pool,
      center,
      0,
      2,
      () => [...trees, log],
      object => approached.push(object)
    ),
    log
  )
  assert.deepEqual(approached, [log])
  for (const tree of trees) {
    assert.equal(
      searchQueuedResource(
        pool,
        center,
        0,
        1,
        () => [log, tree],
        () => {}
      ),
      tree
    )
  }
  assert.deepEqual(activeSlots(pool), [])
})

for (const [flags, preferredModel, fallbackModel] of [
  [4, treeModel, logModel],
  [8, logModel, treeModel],
]) {
  test(`selector ${flags} finishes its preferred search before taking nearer fallback stock`, () => {
    const pool = createIndexedSearch()
    const nearer = resource(1, fallbackModel)
    const preferred = resource(2, preferredModel, centerCell + 128)
    const visits = []
    const chosen = acquireQueuedResource(
      pool,
      center,
      0,
      flags,
      cell => {
        visits.push(cell)
        return cell === centerCell ? [nearer] : cell === centerCell + 128 ? [preferred] : []
      },
      () => {}
    )
    assert.equal(chosen, preferred)
    assert.deepEqual(visits, [centerCell, centerCell, centerCell + 128])
    assert.deepEqual(activeSlots(pool), [])
  })

  test(`selector ${flags} restarts at the center in mode 0 after preferred exhaustion`, () => {
    const pool = createIndexedSearch()
    const fallback = resource(9, fallbackModel)
    const visits = []
    const approached = []
    const chosen = acquireQueuedResource(
      pool,
      center,
      0,
      flags,
      cell => {
        visits.push(cell)
        return cell === centerCell ? [fallback] : []
      },
      object => approached.push(object)
    )
    assert.equal(chosen, fallback)
    assert.equal(visits.length, 258, '257 preferred cell visits, then the first fallback cell')
    assert.deepEqual(visits.slice(0, 3), [centerCell, centerCell, centerCell + 128])
    assert.equal(visits[257], centerCell)
    assert.deepEqual(approached, [fallback])
    assert.deepEqual(activeSlots(pool), [])
  })
}

test('class and descriptor eligibility preserve supplied head/next order, not IDs or model priority', () => {
  const pool = createIndexedSearch()
  const excluded = [
    resource(1, treeModel, centerCell, { class: 0 }),
    resource(2, logModel, centerCell, { class: 1 }),
    resource(3, logModel, centerCell, { class: 4 }),
    resource(4, treeModel, centerCell, { class: 7 }),
    resource(5, 0),
    resource(6, 7),
    resource(7, 9),
    resource(8, 999),
  ]
  const first = resource(900, treeModel)
  const second = resource(10)
  const approached = []
  assert.equal(
    acquireQueuedResource(
      pool,
      center,
      0,
      12,
      () => [...excluded, first, second],
      object => approached.push(object)
    ),
    first
  )
  assert.deepEqual(approached, [first])
  assert.equal(
    acquireQueuedResource(
      pool,
      center,
      0,
      0,
      () => [second, first],
      () => {}
    ),
    second
  )
  assert.deepEqual(activeSlots(pool), [])
})

for (const logs of [0, 0.25]) {
  test(`the native leaf trusts live class 5, not a wood predicate (${logs} supplied logs)`, () => {
    // Deliberately supplied class-5 data. The live adapter, not this leaf, owns
    // completed-retirement projection; positive fractional live stock stays live.
    const chosen = resource(1, logModel, centerCell, { logs, visible: false, reachable: false })
    const pool = createIndexedSearch()
    const approached = []
    assert.equal(
      acquireQueuedResource(
        pool,
        center,
        0,
        8,
        () => [chosen],
        object => approached.push(object)
      ),
      chosen
    )
    assert.deepEqual(approached, [chosen])
    assert.equal(chosen.logs, logs)
    assert.deepEqual(activeSlots(pool), [])
  })
}

test('type-2 ring traversal keeps repeated cells, original order and the inclusive ring-8 limit', () => {
  const pool = createIndexedSearch()
  const visits = []
  assert.equal(
    acquireQueuedResource(
      pool,
      center,
      0,
      12,
      cell => {
        visits.push(cell)
        return []
      },
      unexpected
    ),
    undefined
  )
  assert.equal(visits.length, 257)
  assert.deepEqual(visits.slice(0, 12), [
    centerCell,
    centerCell,
    centerCell + 128,
    centerCell + 129,
    centerCell + 1,
    centerCell - 127,
    centerCell - 128,
    centerCell - 129,
    centerCell - 1,
    centerCell + 127,
    centerCell + 128,
    centerCell + 256,
  ])
  const ringStarts = [0, 2, 11, 28, 49, 74, 115, 152, 201]
  assert.deepEqual(
    ringStarts.map(index => visits[index]),
    [
      centerCell,
      centerCell + 128,
      centerCell + 256,
      centerCell + 384,
      centerCell + 512,
      centerCell + 640,
      centerCell + 768,
      centerCell + 896,
      centerCell + 1024,
    ]
  )
  assert.equal(visits.at(-1), centerCell + 1023, 'ring 8 ends at (-1,+8), not its repeated start')
  assert.deepEqual(activeSlots(pool), [])
})

test('a resource appearing on the repeated center visit is eligible', () => {
  const pool = createIndexedSearch()
  const chosen = resource(1)
  let visits = 0
  assert.equal(
    acquireQueuedResource(
      pool,
      center,
      0,
      0,
      cell => {
        assert.equal(cell, centerCell)
        visits++
        return visits === 2 ? [chosen] : []
      },
      () => {}
    ),
    chosen
  )
  assert.equal(visits, 2, 'no deduplication of the native type-2 sequence')
})

for (const [angle, offset] of [
  [0, 128],
  [255, 128],
  [256, 129],
  [512, 1],
  [1024, -128],
  [1536, -1],
  [2047, 127],
  [2048, 128],
  [-512, -1],
]) {
  test(`person angle ${angle} chooses the original ring-1 start`, () => {
    const pool = createIndexedSearch()
    const visits = []
    const chosen = resource(1, logModel, centerCell + offset)
    assert.equal(
      acquireQueuedResource(
        pool,
        center,
        angle,
        0,
        cell => {
          visits.push(cell)
          return cell === centerCell ? [] : [chosen]
        },
        () => {}
      ),
      chosen
    )
    assert.deepEqual(visits, [centerCell, centerCell, centerCell + offset])
    assert.deepEqual(activeSlots(pool), [])
  })
}

for (const [origin, angle, firstCell, nextCell] of [
  [{ x: 0xfff1, y: 0x01ab }, 512, 127, 0],
  [{ x: 0x0000, y: 0x0000 }, 1536, 0, 127],
  [{ x: 0xffff, y: 0xffff }, 0, 16383, 127],
  [{ x: 0x01ff, y: 0x01ff }, 1024, 0, 16256],
]) {
  test(`doubled byte offsets wrap independently at ${origin.x},${origin.y} angle ${angle}`, () => {
    const pool = createIndexedSearch()
    const chosen = resource(1, logModel, nextCell)
    const visits = []
    assert.equal(
      acquireQueuedResource(
        pool,
        origin,
        angle,
        0,
        cell => {
          visits.push(cell)
          return cell === nextCell ? [chosen] : []
        },
        () => {}
      ),
      chosen
    )
    assert.deepEqual(visits, [firstCell, firstCell, nextCell])
    assert.deepEqual(activeSlots(pool), [])
  })
}

test('ring 8 is searchable but ring 9 is outside the queued acquisition radius', () => {
  const pool = createIndexedSearch()
  const atEight = resource(8, logModel, centerCell + 8)
  const atNine = resource(9, logModel, centerCell + 9)
  assert.equal(
    acquireQueuedResource(
      pool,
      center,
      512,
      8,
      cell => (cell === centerCell + 8 ? [atEight] : []),
      () => {}
    ),
    atEight
  )
  let calls = 0
  assert.equal(
    acquireQueuedResource(
      pool,
      center,
      512,
      8,
      cell => {
        calls++
        return cell === centerCell + 9 ? [atNine] : []
      },
      unexpected
    ),
    undefined
  )
  assert.equal(calls, 514, 'both preferred and fallback searches stop after ring 8')
  assert.deepEqual(activeSlots(pool), [])
})

test('acquisition reserves its slot through approach and only releases its own handle', () => {
  const storage = new Uint8Array(224).fill(0xa5)
  const pool = storage.subarray(16, 208)
  pool.fill(0)
  pool.subarray(1, 12).fill(0x6d)
  assert.equal(startIndexedSearch(pool, 1, 0, 2, 3), 1)
  assert.equal(startIndexedSearch(pool, 2, 1024, 4, 6), 2)
  const retained = pool.slice(0, 36)
  const chosen = resource(1)
  const events = []
  assert.equal(
    acquireQueuedResource(
      pool,
      center,
      512,
      8,
      cell => {
        events.push(['objects', cell])
        assert.deepEqual(activeSlots(pool), [1, 2, 3])
        return [chosen]
      },
      object => {
        events.push(['approach', object.id])
        assert.deepEqual(activeSlots(pool), [1, 2, 3])
        const nested = startIndexedSearch(pool, 1, 0, 0, 0)
        assert.equal(nested, 4, 'the selected search is still reserved during raw approach')
        endIndexedSearch(pool, nested)
      }
    ),
    chosen
  )
  assert.deepEqual(events, [
    ['objects', centerCell],
    ['approach', chosen.id],
  ])
  assert.deepEqual(activeSlots(pool), [1, 2])
  assert.deepEqual(
    pool.slice(0, 36),
    retained,
    'reserved slot zero and unrelated searches are unchanged'
  )
  assert.ok(storage.subarray(0, 16).every(value => value === 0xa5))
  assert.ok(storage.subarray(208).every(value => value === 0xa5))
  assert.equal(startIndexedSearch(pool, 2, 0, 0, 8), 3, 'released handle is reusable')
})

// On a completely occupied pool, each startIndexedSearch attempt constructs one
// view and emits no points. This read-only observation seam counts the otherwise
// invisible preferred-allocation failure followed by the required fallback try.
class ObservedFullPool extends Uint8Array {
  bufferReads = 0

  get buffer() {
    this.bufferReads++
    return super.buffer
  }
}

for (const [flags, attempts] of [
  [0, 1],
  [4, 2],
  [8, 2],
  [12, 1],
]) {
  test(`full pool preserves every record and performs ${attempts} allocation attempts for selector ${flags}`, () => {
    const pool = new ObservedFullPool(192)
    for (let id = 1; id < 16; id++) {
      assert.equal(startIndexedSearch(pool, 2, id * 64, 0, 8), id)
    }
    const before = Array.from(pool)
    pool.bufferReads = 0
    assert.equal(acquireQueuedResource(pool, center, 0, flags, unexpected, unexpected), undefined)
    assert.equal(pool.bufferReads, attempts)
    assert.deepEqual(Array.from(pool), before)
  })
}

// Supplied callback results and side effects only: these cases do not verify
// the live raw-route adapter, which has separate integration coverage.
for (const routeResult of [0, 17]) {
  test(`raw approach result ${routeResult} cannot reject the chosen resource or trigger fallback`, () => {
    const pool = createIndexedSearch()
    const chosen = resource(1)
    const other = resource(2, treeModel)
    const state = { flags4: 0x10000000, destinationX: 0, routeResult: null }
    const events = []
    assert.equal(
      acquireQueuedResource(
        pool,
        center,
        0,
        8,
        cell => {
          events.push(['objects', cell])
          return [chosen, other]
        },
        object => {
          events.push(['approach', object.id])
          state.destinationX = object.x
          state.routeResult = routeResult
          if (!routeResult) state.flags4 &= ~0x10000000
          return routeResult
        }
      ),
      chosen
    )
    assert.deepEqual(events, [
      ['objects', centerCell],
      ['approach', chosen.id],
    ])
    assert.deepEqual(state, {
      flags4: routeResult ? 0x10000000 : 0,
      destinationX: chosen.x,
      routeResult,
    })
    assert.deepEqual(activeSlots(pool), [])
  })
}

test('a throwing JavaScript approach releases ownership without swallowing the failure or retrying', () => {
  // Exception cleanup is a JavaScript API safety property, not native-exception parity.
  const pool = createIndexedSearch()
  const chosen = resource(1)
  const failure = new Error('supplied raw approach failure')
  let visits = 0
  let approaches = 0
  assert.throws(
    () =>
      acquireQueuedResource(
        pool,
        center,
        0,
        8,
        () => {
          visits++
          return [chosen]
        },
        () => {
          approaches++
          throw failure
        }
      ),
    error => error === failure
  )
  assert.equal(visits, 1)
  assert.equal(approaches, 1)
  assert.deepEqual(activeSlots(pool), [])
})
