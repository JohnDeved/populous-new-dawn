// Ad-hoc exact production change-body regression; no World/Scene modules imported.
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

const source = ts.createSourceFile('game-store.ts',
  readFileSync(new URL('../app/game-store.ts', import.meta.url), 'utf8'),
  ts.ScriptTarget.Latest, true)
const factory = source.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === 'createGameStore')
assert.ok(factory)
const properties = []
function visit(node) {
  if (ts.isPropertyAssignment(node) && node.name.getText(source) === 'change') properties.push(node)
  ts.forEachChild(node, visit)
}
visit(factory)
assert.equal(properties.length, 1)
assert.ok(ts.isArrowFunction(properties[0].initializer))
const body = ts.transpileModule('const change = ' + properties[0].initializer.getText(source),
  { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText

function harness(drain, binding = 'current') {
  const events = [], original = { label: 'old', paused: false }, token = Symbol('owner')
  const clock = { token: binding === 'stale' ? Symbol('stale') : token,
    advance() { events.push('drain'); drain?.(h) } }
  const instantiate = new Function('initial', 'events', `
    let world = initial.world, inputClock = initial.clock, presentationToken = initial.token
    const update = () => events.push('update')
    ${body}
    return { change, getWorld: () => world,
      replaceWorld(next) { world = next },
      replaceClock() { inputClock = { token: presentationToken, advance() {} } },
      replaceOwner() { presentationToken = Symbol('replacement') },
      release() { inputClock = null; presentationToken = null }
    }
  `)
  const h = instantiate({ world: original, clock: binding === 'none' ? null : clock, token }, events)
  return Object.assign(h, { events, original })
}

for (const retirement of ['replaceWorld', 'replaceClock', 'replaceOwner', 'release']) {
  test('HUD action is discarded when input drain performs ' + retirement, () => {
    const next = { label: 'new', paused: false }
    const h = harness(owner => owner[retirement](next))
    let actions = 0
    assert.equal(h.change(world => { actions++; world.paused = true }), undefined)
    assert.equal(actions, 0)
    assert.equal(h.original.paused, false)
    assert.equal(next.paused, false)
    assert.deepEqual(h.events, ['drain'])
  })
}

for (const binding of ['current', 'none', 'stale']) {
  test('live/no-current-clock HUD action preserves callback and notification: ' + binding, () => {
    const h = harness(undefined, binding), worlds = []
    const result = h.change(world => { worlds.push(world); world.paused = true; return 42 })
    assert.equal(result, undefined)
    assert.deepEqual(worlds, [h.original])
    assert.equal(h.original.paused, true)
    assert.deepEqual(h.events, binding === 'current' ? ['drain', 'update'] : ['update'])
  })
}

test('drain failure propagates without action or update', () => {
  const error = Error('drain failed'), h = harness(() => { throw error })
  assert.throws(() => h.change(() => assert.fail('late action')), value => value === error)
  assert.deepEqual(h.events, ['drain'])
})

test('action failure preserves identity and suppresses update', () => {
  const h = harness(), error = Error('action failed')
  assert.throws(() => h.change(() => { throw error }), value => value === error)
  assert.deepEqual(h.events, ['drain'])
})
