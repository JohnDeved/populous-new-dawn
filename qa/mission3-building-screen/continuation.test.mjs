// Supplied transport/DOM boundaries; actual maintained replacement/input bodies.
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createMission1VaultInput } from '../../scripts/local-render/mission1-vault-input.mjs'
import {
  requireLoadBoundary,
  requireRestartBoundary,
} from '../../scripts/local-render/mission3-building-screen.mjs'
import { checkpointObservation } from '../../scripts/local-render/checkpoint-observer.mjs'
import { installTempleRouteObservation } from '../../scripts/local-render/mission3-temple-witness.mjs'
import { assertMission3SerializedCheckpoint } from '../../scripts/local-render/mission3-building-screen-continuation.mjs'

function replacementBody(dependencies) {
  const source = readFileSync(
    new URL('../../scripts/local-render/mission3-building-screen.mjs', import.meta.url),
    'utf8'
  )
  const start = source.indexOf('  const replacement = async '),
    end = source.indexOf('\n  const steps = {', start)
  assert.ok(start >= 0 && end > start)
  return Function(
    'dependencies',
    `const { page, shamanId, birth, evidence, retain, persist, observeCheckpoint, bindGame, requireLoadBoundary, requireRestartBoundary, checkpointObservation, installTempleRouteObservation, assert } = dependencies;\n${source.slice(start, end)}\nreturn replacement`
  )(dependencies)
}

for (const startup of [false, true])
  test(`actual ${startup ? 'startup' : 'in-session'} replacement pauses before any host evidence work`, async t => {
    const events = [],
      saved = {
        level: 3,
        turn: 1190,
        time: 99.16666666666667,
        actorsSha256: 'actors',
        terrainSha256: 'land',
        stockSha256: 'stock',
        checkpointSha256: 'checkpoint',
      }
    const snapshot = { turn: 1190, acquisition: { controllers: { building: { active: true } } } }
    const transition = {
      kind: 'load',
      startup,
      trusted: true,
      errors: [],
      before: { resource: startup ? null : { bank: 'p', epoch: 1 } },
      after: { snapshot, resource: { bank: 'p', epoch: startup ? 1 : 2, counter: 0, tile: 92 } },
      start: { calls: 1, attached: true, restored: true, errors: [] },
    }
    const evidence = {
      transitions: [],
      epochs: {},
      activeSave: { boundary: { snapshot }, digest: { checkpoint: saved } },
    }
    let clicked = false,
      paused = false
    const checkWork = name => {
      if (clicked) assert.equal(paused, true, `${name} was reached before the trusted Pause`)
      events.push(name)
    }
    globalThis.window = { testSceneRef: { current: { world: { units: [{ id: 46, hp: 100 }] } } } }
    t.after(() => {
      delete globalThis.window
    })
    const locator = name => ({
      getByRole: (_role, options) => locator(options.name),
      async click() {
        events.push(name)
        if (name === 'Pause game') {
          assert.equal(clicked, true)
          paused = true
        } else {
          assert.equal(name, startup ? 'Load Game' : 'Load checkpoint')
          clicked = true
        }
      },
    })
    const page = {
      getByRole: (_role, options) => locator(options.name),
      async evaluate(fn, argument) {
        if (fn.toString().includes('prepareM3Replacement')) {
          checkWork('arm')
          return
        }
        if (!clicked) {
          checkWork('health')
          return fn(argument)
        }
        checkWork('evaluate')
        if (fn.toString().includes('m3Replacement.close')) return transition
        if (fn === checkpointObservation) return saved
        if (fn === installTempleRouteObservation) return {}
      },
    }
    const input = createMission1VaultInput({
      page,
      signal: new AbortController().signal,
      report: { actions: [] },
      originalShamanId: 46,
      save: () => checkWork('input report'),
    })
    const replace = replacementBody({
      page,
      shamanId: 46,
      birth: { turn: 1133, gift: { id: 3141 } },
      evidence,
      retain: () => checkWork('PNG retention'),
      persist: () => checkWork('report'),
      observeCheckpoint: async () => {
        checkWork('committed digest')
        return { checkpoint: saved }
      },
      bindGame: async () => checkWork('bind'),
      requireLoadBoundary,
      requireRestartBoundary,
      checkpointObservation,
      installTempleRouteObservation,
      assert,
    })
    await replace('load', startup ? null : input, 'loaded', { startup, pauseImmediately: true })
    const at = events.indexOf(startup ? 'Load Game' : 'Load checkpoint')
    assert.deepEqual(events.slice(at, at + 2), [
      startup ? 'Load Game' : 'Load checkpoint',
      'Pause game',
    ])
    assert.equal(evidence.transitions[0].evidence.trusted, true)
    assert.deepEqual(evidence.transitions[0].committed.checkpoint, saved)
  })

test('historical saved1190 projection admits only the verified Infinity duration and preserves live data', () => {
  const actual = {
    level: 3,
    turn: 1190,
    paused: true,
    temple: false,
    gifts: [
      {
        id: 3141,
        kind: 'gift',
        reward: 'temple',
        remaining: 25,
        duration: Infinity,
        buildingAcquisition: {
          mission: 3,
          head: 91,
          reward: 92,
          slot: 0,
          rewardClass: 2,
          model: 5,
          completedTurn: 1133,
          serial: 3141,
        },
      },
    ],
    acquisition: {
      controllers: {
        building: { active: true, giftId: 3141, phase: 4, visits: 14, pending: false },
      },
    },
    actors: [{ id: 46, hp: 200 }],
  }
  const serialized = structuredClone(actual)
  serialized.gifts[0].duration = null
  assertMission3SerializedCheckpoint(actual, serialized)
  assert.equal(actual.gifts[0].duration, Infinity)
  for (const changed of [
    value => {
      value.actors[0].hp--
    },
    value => {
      value.gifts[0].id++
    },
    value => {
      value.acquisition.controllers.building.active = false
    },
    value => {
      value.gifts[0].duration = null
    },
  ]) {
    const invalid = structuredClone(actual)
    changed(invalid)
    assert.throws(() => assertMission3SerializedCheckpoint(invalid, serialized))
  }
})

test('actual continuation route skips startup/acquisition and enters its guarded existing construction tail', async t => {
  const { default: route, assertTempleRouteHealth } =
    await import('../../scripts/local-render/mission3-temple-checkpoint.mjs')
  const events = [],
    state = {
      level: 3,
      speed: 1,
      status: 'playing',
      inputMask: 0,
      sceneMatches: true,
      actorMatches: true,
      connected: true,
      started: true,
      loading: false,
      contextLost: false,
      units: [{ id: 46, kind: 'shaman', team: 'blue', hp: 100 }],
      stats: { cast: 0, bridges: 0, trained: 0 },
      temples: [],
      vault: [{ uses: 1 }],
      unlocked: true,
      turn: 1215,
      animationFrame: 1,
      paused: false,
      selected: [],
      mode: null,
    }
  globalThis.window = {
    m3TempleRoute: { read: () => state, close: () => events.push('route closed') },
  }
  t.after(() => {
    delete globalThis.window
  })
  const run = Function(
    'assert',
    'writeFileSync',
    'resolve',
    'createMission1VaultInput',
    'assertTempleRouteHealth',
    `return (${route.toString()})`
  )(
    assert,
    () => events.push('report'),
    (_root, name) => name,
    ({ originalShamanId }) => {
      assert.equal(originalShamanId, 46)
      return {
        button: async name => {
          events.push(name)
          throw new Error('existing construction tail reached')
        },
        pause: async () => {},
      }
    },
    assertTempleRouteHealth
  )
  await assert.rejects(
    run(
      {
        page: { evaluate: async fn => fn() },
        openMission: () => assert.fail('No repeated startup'),
        output: '/supplied',
        signal: new AbortController().signal,
        receipt: { profile: { mode: 'reused' }, errors: [] },
      },
      {
        restore: async () => {
          events.push('genuine restore')
          return { shamanId: 46 }
        },
      }
    ),
    /existing construction tail reached/
  )
  assert.ok(events.indexOf('genuine restore') < events.indexOf('Select and focus shaman'))
  assert.ok(events.includes('route closed'))
  assert.ok(!events.includes('Save checkpoint'))
})

test('continuation controls retain the literal startup and in-game public labels', () => {
  const selector = readFileSync(new URL('../../app/world-selector.tsx', import.meta.url), 'utf8')
  const page = readFileSync(new URL('../../app/page.tsx', import.meta.url), 'utf8')
  assert.match(selector, />\s*Load Game\s*</)
  assert.match(page, /aria-label="Start game"/)
  assert.match(page, />\s*Load checkpoint\s*</)
  assert.match(page, /world\.paused \? 'Resume game' : 'Pause game'/)
  assert.match(page, /aria-label="Game settings"/)
  assert.match(page, />\s*Restart world\s*</)
})
