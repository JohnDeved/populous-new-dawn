import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

const text = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8')
const source = ts.createSourceFile('page.tsx', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
const elements = []
const functions = new Map()
function visit(node) {
  if (ts.isJsxElement(node)) elements.push(node)
  if (ts.isFunctionDeclaration(node) && node.name) functions.set(node.name.text, node)
  ts.forEachChild(node, visit)
}
visit(source)
const attrs = node => new Map(node.openingElement.attributes.properties
  .filter(ts.isJsxAttribute).map(a => [a.name.getText(source), a.initializer]))
const literal = node => node && ts.isStringLiteral(node) ? node.text : undefined
const expression = node => {
  assert.ok(node && ts.isJsxExpression(node) && node.expression)
  return node.expression.getText(source)
}
const evaluate = (code, bindings) => new Function(...Object.keys(bindings), `return (${code})`)(...Object.values(bindings))
const footer = elements.find(node => literal(attrs(node).get('className')) === 'top-actions')

test('current footer retains Pause and Settings but no longer duplicates Options audio', () => {
  assert.ok(footer)
  const buttons = footer.children.filter(node => ts.isJsxElement(node) && node.openingElement.tagName.getText(source) === 'button')
  assert.equal(buttons.length, 2)
  assert.equal(expression(attrs(buttons[0]).get('aria-label')), "world.paused ? 'Resume game' : 'Pause game'")
  assert.match(expression(attrs(buttons[0]).get('onClick')), /w\.paused = !w\.paused/)
  assert.equal(literal(attrs(buttons[1]).get('aria-label')), 'Game settings')
  assert.equal(expression(attrs(buttons[1]).get('onClick')), 'openMenu')
  assert.doesNotMatch(footer.getText(source), /toggleSound|Enable sound|Mute sound/)
})

test('Options exposes the existing audio control with stable accessible state and pending ownership', () => {
  const button = elements.find(node => literal(attrs(node).get('data-option-key')) === 'audio')
  assert.ok(button, 'real Options audio control must remain discoverable')
  const a = attrs(button)
  assert.equal(expression(a.get('onClick')), 'toggleSound')
  for (const sound of [false, true])
    assert.equal(evaluate(expression(a.get('aria-label')), { sound }), sound ? '♪ Sound on' : '♫ Enable sound')
  for (const soundPending of [false, true]) {
    assert.equal(evaluate(expression(a.get('disabled')), { soundPending }), soundPending)
    assert.equal(evaluate(expression(a.get('aria-busy')), { soundPending }), soundPending)
  }
  assert.match(text, /<OriginalOptions[\s\S]*compatibility=/)
  assert.match(text, /audioStartNotice && <p role="status">\{audioStartNotice\}<\/p>/)
})

function toggleFixture({ sound = false, enable = async () => true } = {}) {
  let enables = 0
  const events = [], world = {}, environment = {}
  const engine = { current: { soundEnvironment: () => environment } }
  const audio = { current: { enable: () => { enables++; return enable() }, mute: () => events.push(['mute']) } }
  const code = ts.transpileModule(functions.get('toggleSound').getText(source), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText
  const bindings = { sound, audio, world, engine,
    setAudioStartNotice: value => events.push(['notice', value]),
    setSound: value => events.push(['sound', value]),
    setSoundPending: value => events.push(['pending', value]),
    tell: (owner, message) => { assert.equal(owner, world); events.push(['tell', message]) },
    update: () => events.push(['update']),
  }
  const toggle = new Function(...Object.keys(bindings), `${code}; return toggleSound`)(...Object.values(bindings))
  return { toggle, events, audio, environment, enables: () => enables }
}

test('actual audio retry reports the surviving Options route and clears pending after failure', async () => {
  const f = toggleFixture({ enable: async () => { throw Error('blocked') } })
  await f.toggle()
  assert.equal(f.enables(), 1)
  assert.equal(f.audio.current.environment, f.environment)
  assert.deepEqual(f.events.map(e => e[0]), ['notice', 'pending', 'mute', 'notice', 'tell', 'update', 'pending'])
  assert.match(f.events[3][1], /Menu > Options > Game > Browser compatibility and help/)
  assert.equal(f.events[3][1], f.events[4][1])
  assert.deepEqual(f.events.at(-1), ['pending', false])
})

test('actual enable and mute transitions retain existing behavior', async () => {
  const enabled = toggleFixture()
  await enabled.toggle()
  assert.equal(enabled.enables(), 1)
  assert.equal(enabled.audio.current.environment, enabled.environment)
  assert.deepEqual(enabled.events, [['notice', ''], ['pending', true], ['sound', true], ['pending', false]])
  const muted = toggleFixture({ sound: true })
  await muted.toggle()
  assert.deepEqual(muted.events, [['notice', ''], ['mute'], ['sound', false]])
})
