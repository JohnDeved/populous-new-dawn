import assert from 'node:assert/strict'
import test from 'node:test'
import { withHypnotiseContext } from '../scripts/tutorial-browser/hypnotise-budget.mjs'
import {
  observeHypnotiseLoad,
  validateHypnotiseLoad,
} from '../scripts/tutorial-browser/hypnotise-checkpoint.mjs'
import { prepareEarnedHypnotise } from '../scripts/tutorial-browser/hypnotise-fixture.mjs'
import { createGameStore } from '../app/game-store.ts'

const flush = async () => {
  for (let n = 0; n < 12; n++) await Promise.resolve()
}
function clock() {
  let elapsed = 0,
    timeout
  return {
    now: () => elapsed,
    schedule: (callback, ms) => {
      assert.equal(ms, 75000)
      timeout = callback
      return 1
    },
    cancel: () => {
      timeout = undefined
    },
    set: value => {
      elapsed = value
    },
    expire: () => {
      elapsed = 75000
      timeout()
    },
  }
}

test('absolute75s context allowance starts before creation and owns late context cleanup', async () => {
  const timing = clock(),
    report = {},
    saves = [],
    state = { closes: 0, runs: 0 }
  let resolveContext
  const pending = withHypnotiseContext(
    {
      newContext: () =>
        new Promise(resolve => {
          resolveContext = resolve
        }),
    },
    report,
    () => saves.push(structuredClone(report)),
    () => {
      state.runs++
    },
    timing
  )
  await flush()
  timing.expire()
  await assert.rejects(pending, /75s/)
  assert.equal(report.status, 'failed')
  assert.equal(report.contextCreationPending, true)
  resolveContext({
    close: async () => {
      state.closes++
    },
  })
  await flush()
  assert.deepEqual(state, { closes: 1, runs: 0 })
  assert.equal(report.contextClosed, true)
  assert.equal(report.cleanupPending, false)
  assert.equal(saves.at(-1).status, 'failed')
})

test('context creation failures are recorded and never run the episode', async () => {
  const report = {},
    timing = clock()
  await assert.rejects(
    withHypnotiseContext(
      {
        newContext: async () => {
          throw Error('creation failed')
        },
      },
      report,
      () => {},
      () => assert.fail('must not run'),
      timing
    ),
    /creation failed/
  )
  assert.equal(report.status, 'failed')
  assert.equal(report.contextCreationPending, false)
  assert.match(report.failure, /creation failed/)
})

test('context cleanup shares the same75s deadline, including delayed timer dispatch', async () => {
  for (const delayedDispatch of [false, true]) {
    const report = {},
      timing = clock()
    let closes = 0
    const pending = withHypnotiseContext(
      {
        newContext: async () => ({
          close: async () => {
            closes++
            if (delayedDispatch) timing.set(75001)
            else await new Promise(() => {})
          },
        }),
      },
      report,
      () => {},
      async () => {},
      timing
    )
    await flush()
    if (!delayedDispatch) timing.expire()
    await assert.rejects(pending, /75s/)
    assert.equal(closes, 1)
    assert.equal(report.status, 'failed')
    assert.equal(report.timedOut, true)
  }
})

test('public checkpoint observer waits for normal resumed notification and preserves saved content', () => {
  const original = {},
    saved = { turn: 6172, stock: 1, randomState: 123, paused: true }
  let world = original,
    listener,
    removed = 0
  const previous = globalThis.window
  globalThis.window = {
    testStore: {
      getWorld: () => world,
      subscribe: fn => {
        listener = fn
        return () => {
          removed++
          listener = undefined
        }
      },
    },
  }
  try {
    observeHypnotiseLoad()
    listener()
    world = { turn: saved.turn, shots: { hypnotise: 1 }, randomState: 123, paused: true }
    listener()
    assert.equal(window.__hypnotiseLoaded, undefined)
    world.paused = false
    listener()
    validateHypnotiseLoad(saved, window.__hypnotiseLoaded)
    assert.equal(removed, 1)
    assert.throws(() => validateHypnotiseLoad(saved, saved))
    assert.throws(() => validateHypnotiseLoad(saved, { ...saved, paused: false, turn: 6173 }))
  } finally {
    globalThis.window = previous
  }
})

function preparationScene() {
  const store = createGameStore()
  assert.equal(store.startDebugMission(22), true)
  const world = store.getWorld()
  world.paused = true
  return { world, isCurrent: () => true, focus: () => {}, onChange: () => {} }
}

test('25s preparation checks after synchronous batches and yielded work', async () => {
  for (const boundary of ['batch', 'yield']) {
    const scene = preparationScene()
    let calls = 0,
      elapsed = 0,
      yields = 0
    await assert.rejects(
      prepareEarnedHypnotise(scene, {
        now: () => (boundary === 'batch' && ++calls >= 3 ? 25000 : elapsed),
        yieldBatch: async () => {
          yields++
          elapsed = 25000
        },
      }),
      /25s/
    )
    assert.equal(scene.world.paused, true)
    assert.equal(yields, boundary === 'batch' ? 0 : 1)
    assert.equal(scene.world.shots.hypnotise, 0)
  }
})

test('25s preparation cannot return success after the last consumer crosses its deadline', async () => {
  const scene = preparationScene()
  let elapsed = 0
  scene.onChange = () => {
    elapsed = 25000
  }
  await assert.rejects(
    prepareEarnedHypnotise(scene, { now: () => elapsed, yieldBatch: async () => {} }),
    /25s/
  )
  assert.equal(scene.world.paused, true)
  assert.equal(scene.world.shots.hypnotise, 1)
  assert.equal(scene.world.turn, 6172)
})

test('successful and failed operations both close their owned context exactly once', async () => {
  for (const fails of [false, true]) {
    const report = {},
      timing = clock()
    let closes = 0
    const pending = withHypnotiseContext(
      {
        newContext: async () => ({
          close: async () => {
            closes++
          },
        }),
      },
      report,
      () => {},
      async () => {
        if (fails) throw Error('operation failed')
      },
      timing
    )
    if (fails) await assert.rejects(pending, /operation failed/)
    else await pending
    assert.equal(closes, 1)
    assert.equal(report.contextClosed, true)
    assert.equal(report.status, fails ? 'failed' : 'passed')
  }
})

test('Hypnotise uses only the remaining outer budget and never starts after expiry', async () => {
  for (const remaining of [5000, 0]) {
    let time = 0,
      timer,
      created = 0,
      closes = 0
    const report = {},
      timing = {
        now: () => time,
        wallNow: () => 100000,
        schedule: (callback, ms) => {
          assert.equal(ms, remaining)
          timer = callback
          return 1
        },
        cancel: () => {},
      }
    const pending = withHypnotiseContext(
      {
        newContext: async () => {
          created++
          return {
            close: async () => {
              closes++
            },
          }
        },
      },
      report,
      () => {},
      () => new Promise(() => {}),
      timing,
      100000 + remaining
    )
    await flush()
    if (remaining) {
      time = remaining
      timer()
    }
    await assert.rejects(pending, /remaining outer deadline/)
    await flush()
    assert.equal(report.capMs, remaining)
    assert.equal(report.status, 'failed')
    assert.equal(created, remaining ? 1 : 0)
    assert.equal(closes, remaining ? 1 : 0)
  }
})
