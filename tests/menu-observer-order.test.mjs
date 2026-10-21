import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

const read = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8')
function declaration(file, name) {
  const source = ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true)
  const found = source.statements.filter(node => ts.isFunctionDeclaration(node) && node.name?.text === name)
  assert.equal(found.length, 1)
  return found[0].getText(source).replace(/^export /, '')
}
function sequence(file, begin, end, from = 0) {
  const source = read(file), start = source.indexOf(begin, from), finish = source.indexOf(end, start)
  assert.ok(start >= 0 && finish >= start)
  return source.slice(start, finish + end.length)
}

test('actual Save and Load callsites enter the final panel before binding its connected button', async () => {
  const cases = [
    ['scripts/local-render/mission3-building-screen.mjs', "await input.button('Save Game')", "await input.button('Save checkpoint')", 'save'],
    ['scripts/local-render/mission3-temple-checkpoint.mjs', "await input.button('Save Game')", "await input.button('Save checkpoint')", 'save'],
    ['scripts/local-render/mission1-hut-dismantle.mjs', "await input.button('Save Game')", "await input.button('Save checkpoint')", 'save'],
    ['scripts/local-render/temple-training-auto.mjs', "await input.button('Save Game')", "await input.button('Save checkpoint')", 'save'],
    ['scripts/local-render/mission1-hut-dismantle.mjs', "await input.button('Back')", "await input.button('Load checkpoint')", 'load'],
    ['scripts/local-render/temple-training-auto.mjs', "await input.button('Back')", "await input.button('Load checkpoint')", 'load'],
  ]
  for (const [file, begin, end, kind] of cases) {
    let panel = kind === 'save' ? 'root' : 'save', button = null, armedButton = null, clicks = 0
    const events = [], name = kind === 'save' ? 'Save checkpoint' : 'Load checkpoint'
    // A panel-sensitive DOM boundary: replacing a panel disconnects its old button.
    const enter = next => {
      if (button) button.isConnected = false
      panel = next
      button = ['save', 'load'].includes(next) ? { textContent: name, isConnected: true, disabled: false } : null
    }
    const arm = () => {
      assert.equal(panel, kind, file); assert.ok(button?.isConnected, file)
      armedButton = button; events.push('arm')
    }
    const input = { async button(label) {
      events.push(label)
      if (label === 'Save Game') enter('save')
      else if (label === 'Load Game') enter('load')
      else if (label === 'Back') enter('root')
      else { assert.equal(label, name); assert.equal(button, armedButton); assert.equal(button.isConnected, true); clicks++ }
    } }
    const context = { input, page: { evaluate: async callback => callback() }, armM3Save: arm, armTempleSave: arm,
      window: { templeTraining: { armSave: arm, armLoad: arm } }, runtime: async method => {
        assert.equal(method, kind === 'save' ? 'armSave' : 'armLoad'); arm()
      }, armed: false }
    await vm.runInNewContext(`(async () => {${sequence(file, begin, end)}})()`, context)
    assert.equal(clicks, 1, file); assert.equal(events.at(-2), 'arm', file)
  }
})

test('actual restart observer binds only the final open native confirmation and retains trusted/same-world checks', async () => {
  for (const scenario of ['valid', 'untrusted', 'changed-world', 'missing-dialog']) {
    let capture, removed = false, world = { turn: 20, outcome: { level: 3 } }, selector
    const button = { textContent: 'Yes', isConnected: true, disabled: false, getAttribute: () => 'Yes',
      contains: () => false, addEventListener(type, listener) { assert.equal(type, 'click'); capture = listener },
      removeEventListener() { removed = true } }
    const outsideYes = { ...button, addEventListener() { assert.fail('An unrelated Yes must never own the observer') } }
    const store = { getWorld: () => world, subscribe: () => () => {}, getPresentationSnapshot: () => ({}) }
    const context = { structuredClone, window: { testStore: store, m3CheckpointState: value => ({ turn: value.turn }) },
      document: { querySelector(value) {
        selector = value
        return scenario === 'missing-dialog' ? null : { querySelectorAll: () => [button] }
      }, querySelectorAll: () => [outsideYes, button] } }
    vm.runInNewContext(declaration('scripts/local-render/mission3-building-lifecycle.mjs', 'prepareM3Replacement'), context)
    const run = () => context.prepareM3Replacement({ kind: 'restart', shamanId: 1, birth: null })
    if (scenario === 'missing-dialog') { await assert.rejects(run(), /Public Yes unavailable/); continue }
    await run()
    assert.equal(selector, 'dialog[data-original-pause-menu][data-panel="restart"][open]')
    if (scenario === 'changed-world') world = { ...world }
    capture({ isTrusted: scenario !== 'untrusted', target: button })
    const evidence = context.window.m3Replacement.close()
    assert.equal(removed, true)
    if (scenario === 'valid') { assert.equal(evidence.trusted, true); assert.equal(evidence.before.snapshot.turn, 20); assert.equal(evidence.errors.length, 0) }
    else assert.match(evidence.errors.join('\n'), scenario === 'untrusted' ? /Trusted public Yes required/ : /World replaced before trusted input/)
  }
})

test('actual replacement callsite opens its final native panel before installing the observer', async () => {
  const source = read('scripts/local-render/mission3-building-screen.mjs')
  const start = source.indexOf('if (!startup)', source.indexOf('const replacement ='))
  const end = source.indexOf('      armed = true', start)
  const flow = source.slice(start, end)
  // Substitute only the module transport; the complete actual navigation and evaluate call remain.
  const executable = flow.replace("await import('/scripts/local-render/mission3-building-lifecycle.mjs')", 'await loadObserver()')
  for (const kind of ['load', 'restart']) {
    let panel = 'save', called = false
    const menu = { getAttribute: async () => panel, getByRole(role, { name }) {
      assert.equal(role, 'button')
      return { async click() {
        if (name === 'Back') panel = 'root'
        else { assert.equal(panel, 'root'); assert.equal(name, kind === 'load' ? 'Load Game' : 'Restart Level'); panel = kind }
      } }
    } }
    const context = { startup: false, kind, shamanId: 1, birth: null,
      page: { getByRole: () => menu, evaluate: async (callback, argument) => callback(argument) },
      loadObserver: async () => ({ prepareM3Replacement: async value => { assert.equal(value.kind, kind); assert.equal(panel, kind); called = true } }) }
    await vm.runInNewContext(`(async () => {${executable}})()`, context)
    assert.equal(called, true)
  }
})
