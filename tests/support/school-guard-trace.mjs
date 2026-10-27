// Bounded Node-only call observations. Actual bodies/results are preserved;
// this is not browser/native-executable proof and never writes app/ or game state.
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { registerHooks } from 'node:module'
import { sceneFixtureSource } from './scene-fixture-source.mjs'

const functions = {
  'person-update.ts': [['preparePersonTurn', 'p', 'w', 'prepare']],
  'person-state.ts': [
    ['initializePersonState', 'p', 'w', 'initialize'],
    ['randomPersonSpeed', 'p', 'w', 'speed'],
  ],
  'person-order-start.ts': [['startPersonOrders', 'p', 'w', 'startup']],
  'person-physics.ts': [['stepPersonPhysics', 'p', 'w', 'physics']],
  'building-occupants.ts': [
    ['removeBuildingOccupant', 'person', 'w', 'remove-occupant'],
    ['restoreBuildingOccupant', 'p', 'undefined', 'restore-occupant'],
  ],
  'training.ts': [['stepTrainingPerson', 'p', 'w', 'training']],
  'live-movement.ts': [
    ['stepShamanGuard', 'p', 'undefined', 'guard'],
    ['adoptLiveOrders', 'p', 'w', 'adopt'],
  ],
  'live-building-entry.ts': [
    ['stepBuildingEntry', '(u.entry?.person ?? u.native)', 'w', 'entry'],
    ['leaveBuildingEntry', '(u.entry?.person ?? u.native)', 'w', 'departure'],
  ],
}
// preparePersonTurn takes gameFlags, not a world; don't invent a world argument.
functions['person-update.ts'][0][2] = 'undefined'
let trace, target
const observed = new Set()
export async function loadSchoolGuardFixture(app = new URL('../../app/', import.meta.url)) {
  globalThis.__schoolGuardTrace = (event, p, w) => {
    if (!trace || p?.id !== target) return
    trace.push({
      event,
      owner: p,
      id: p.id,
      state: p.state,
      status: p.commandStatus,
      counter: p.counter,
      flags2: p.flags2,
      randomState: w?.randomState,
    })
  }
  registerHooks({
    // Same unchanged Vite-style resolution as the existing bloodlust-scene fixture.
    resolve(specifier, context, next) {
      if (specifier.startsWith('.') && context.parentURL?.startsWith(app.href)) {
        const url = new URL(specifier, context.parentURL)
        if (!/\.[a-z]+$/i.test(url.pathname) && existsSync(fileURLToPath(url) + '.ts'))
          return next(url.href + '.ts', context)
      }
      return next(specifier, context)
    },
    load(url, context, next) {
      if (url.startsWith(app.href) && url.endsWith('.json'))
        return {
          format: 'module',
          source: 'export default ' + readFileSync(new URL(url), 'utf8'),
          shortCircuit: true,
        }
      if (!url.startsWith(app.href) || !url.endsWith('.ts')) return next(url, context)
      let source = sceneFixtureSource(readFileSync(new URL(url), 'utf8'))
      const name = url.slice(app.href.length)
      for (const [fn, person, world, event] of functions[name] ?? []) {
        const pattern = new RegExp(`((?:export )?function ${fn}\\([^)]*\\) \\{)`, 'g')
        assert.equal([...source.matchAll(pattern)].length, 1, `one actual ${fn} body`)
        source = source.replace(
          pattern,
          `$1\n globalThis.__schoolGuardTrace?.('${event}', ${person}, ${world});`
        )
        observed.add(event)
      }
      if (name === 'live-building-entry.ts') {
        const anchor = 'w.randomState = startup.randomState;'
        assert.equal(source.split(anchor).length, 2, 'one owner RNG commit')
        source = source.replace(
          anchor,
          `${anchor} globalThis.__schoolGuardTrace?.('owner-rng-commit', p, w);`
        )
      }
      return { format: 'module', source, shortCircuit: true }
    },
  })
  const model = await import(new URL('model.ts', app).href)
  const fixture = await import(new URL('../tests/level-start-fixture.mjs', app).href)
  const entry = await import(new URL('live-building-entry.ts', app).href)
  const orders = await import(new URL('person-orders.ts', app).href)
  const selection = await import(new URL('selection-runtime.ts', app).href)
  const store = await import(new URL('game-store.ts', app).href)
  const movement = await import(new URL('live-movement.ts', app).href)
  const camera = await import(new URL('scene-camera-runtime.ts', app).href)
  const math = await import(new URL('native-math.ts', app).href)
  assert.equal(observed.size, 12, 'all required real-call observation anchors loaded')
  return {
    ...model,
    ...fixture,
    ...entry,
    ...orders,
    ...selection,
    ...store,
    ...math,
    ...movement,
    ...camera,
  }
}
export function observeSchoolGuard(id, callback) {
  assert.equal(trace, undefined)
  target = id
  trace = []
  try {
    callback()
    return trace
  } finally {
    trace = undefined
    target = undefined
  }
}
