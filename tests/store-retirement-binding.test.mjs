// Ad-hoc composition of exact store closures with supplied resource/update leaves.
// This does not instantiate the real store/World/Scene or import application code.
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

const source = ts.createSourceFile('game-store.ts',
  readFileSync(new URL('../app/game-store.ts', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true)
const factory = source.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === 'createGameStore')
assert.ok(factory)
function initializer(name, predicate) {
  const found = []
  function visit(node) {
    if (predicate(node) && node.name?.getText(source) === name) found.push(node.initializer)
    ts.forEachChild(node, visit)
  }
  visit(factory)
  assert.equal(found.length, 1, 'one actual ' + name)
  assert.ok(ts.isArrowFunction(found[0]))
  return found[0].getText(source)
}
const code = ts.transpileModule([
  'const change = ' + initializer('change', ts.isPropertyAssignment),
  'const bindPresentation = ' + initializer('bindPresentation', ts.isPropertyAssignment),
  'const replaceWorld = ' + initializer('replaceWorld', ts.isVariableDeclaration),
].join('\n'), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText

function setup() {
  const original = { label: 'old', outcome: { completedLevel: null }, paused: false }, events = []
  const instantiate = new Function('original', 'events', `
    let world = original, presentationToken = null, inputClock = null,
      cheatsUsed = false, observedCompletion = null
    const presentation = { snapshot() { return null }, advance() {},
      transition(landscape, retain) { events.push(['transition', landscape, retain]) } }
    const worldEnvironment = w => ({ landscape: w.label })
    const update = () => events.push('update')
    ${code}
    return { change, bindPresentation, replaceWorld, getWorld: () => world }
  `)
  return { store: instantiate(original, events), original, events }
}

for (const operation of ['release', 'replaceWorld', 'rebind']) {
  test('real binding lifecycle retires pending HUD action: ' + operation, () => {
    const { store, original, events } = setup(), binding = store.bindPresentation(original)
    const replacement = { label: 'next', outcome: { completedLevel: null }, paused: false }
    let drains = 0, actions = 0, nextBinding
    binding.bindInputClock(() => {
      drains++
      if (operation === 'release') binding.release()
      if (operation === 'replaceWorld') store.replaceWorld(replacement)
      if (operation === 'rebind') nextBinding = store.bindPresentation(original)
    })
    assert.equal(store.change(world => { actions++; world.paused = true }), undefined)
    assert.equal(drains, 1)
    assert.equal(actions, 0)
    assert.equal(original.paused, false)
    assert.equal(replacement.paused, false)
    assert.equal(binding.isCurrent(), false)
    if (nextBinding) assert.equal(nextBinding.isCurrent(), true)
    assert.deepEqual(events, operation === 'replaceWorld' ? [['transition', 'next', false], 'update'] : [])
  })
}

test('unchanged real binding drains then applies one action to its original world', () => {
  const { store, original, events } = setup(), binding = store.bindPresentation(original)
  binding.bindInputClock(() => events.push('drain'))
  store.change(world => { assert.equal(world, original); world.paused = true; events.push('action') })
  assert.equal(binding.isCurrent(), true)
  assert.deepEqual(events, ['drain', 'action', 'update'])
  assert.equal(original.paused, true)
})
