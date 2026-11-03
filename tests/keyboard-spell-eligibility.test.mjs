import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
const tree = f => ts.createSourceFile(f, fs.readFileSync(new URL('../app/' + f, import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true, f.endsWith('tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
const compile = s => ts.transpileModule(s, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText
const page = tree('page.tsx'), handlers = []
function visit(n) {
  if (ts.isVariableDeclaration(n) && n.name.getText(page) === 'key' && n.initializer && ts.isArrowFunction(n.initializer) && n.initializer.getText(page).includes('spellHudVisibility')) handlers.push(n.initializer)
  ts.forEachChild(n, visit)
}
visit(page)
assert.equal(handlers.length, 1, 'Extract exactly the actual page keyboard handler')
const source = tree('spell-visibility.ts')
const visibility = source.statements.filter(n => ts.isFunctionDeclaration(n) && ['spellHudVisibility', 'spellHudPermanent'].includes(n.name?.text))
assert.equal(visibility.length, 2)
const spellHudVisibility = new Function('rules', 'undiscoveredSpellModels', compile(visibility.map(n => n.getText(source).replace(/^export /, '')).join('\n')) + ';return spellHudVisibility')(JSON.parse(fs.readFileSync(new URL('../app/original-rules.json', import.meta.url), 'utf8')), () => new Set())
const storeSource = tree('game-store.ts'), factory = storeSource.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === 'createGameStore')
const change = factory.body.statements.find(ts.isReturnStatement).expression.properties.find(n => n.name?.getText(storeSource) === 'change').initializer
function fixture(effect = 'live', mode = null) {
  const calls = [], s = { id: 'blast', model: 1, key: '1' }
  const world = { inputMask: 0, flyby: { flags: 0 }, manaWorld: { playerTribe: 0, gameFlags: 0, spells: [{ available: 2, disabled: 0 }] }, manaTribes: [{}], shots: { blast: 1 }, mode }
  const token = {}, update = () => calls.push('update')
  const store = new Function('world', 'update', 'inputClock', 'presentationToken', compile('const change = ' + change.getText(storeSource)) + ';return {change}')(world, update, { token, advance() {
    calls.push('drain')
    if (effect === 'blocked') world.manaWorld.gameFlags |= 32
    if (effect === 'unowned') { world.manaWorld.spells[0].available = 0; world.shots.blast = 0 }
    if (effect === 'stockOnly') world.manaWorld.spells[0].available = 0
    if (effect === 'ownerUnavailable') { world.manaWorld.playerTribe = 1; world.manaWorld.spells.push({ available: 0, disabled: 0 }); world.manaTribes.push({}); world.shots.blast = 0 }
  } }, token)
  const bindings = { ready: true, menu: false, cheatsOpen: false, world, store, SPELLS: [s], spellHudVisibility, update, setTab: tab => calls.push('tab:' + tab), engine: { current: null } }
  const run = new Function(...Object.keys(bindings), compile('const handler = ' + handlers[0].getText(page)) + ';return handler')(...Object.values(bindings))
  return { world, calls, run: overrides => run({ key: '1', code: 'Digit1', repeat: false, ctrlKey: false, metaKey: false, altKey: false, target: { closest: () => null }, ...overrides }) }
}
for (const effect of ['blocked', 'unowned', 'ownerUnavailable']) test(`shortcut refuses ${effect} after real store input drain`, () => {
  const f = fixture(effect); f.run(); assert.equal(f.world.mode, null); assert.deepEqual(f.calls, ['drain', 'update', 'tab:spells', 'update'])
})
test('live select and toggle-off preserve existing publication order', () => {
  for (const mode of [null, 'blast']) { const f = fixture('live', mode); f.run(); assert.equal(f.world.mode, mode ? null : 'blast'); assert.deepEqual(f.calls, ['drain', 'update', 'tab:spells', 'update']) }
})
test('stock-only remains visible and selectable', () => { const f = fixture('stockOnly'); f.run(); assert.equal(f.world.mode, 'blast') })
test('repeat and numpad do not select or drain', () => { for (const overrides of [{ repeat: true }, { code: 'Numpad1' }]) { const f = fixture(); f.run(overrides); assert.equal(f.world.mode, null); assert.deepEqual(f.calls, ['update']) } })
test('modified and input-target keys retain early refusal', () => { for (const overrides of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }, { target: { closest: () => ({}) } }]) { const f = fixture(); f.run(overrides); assert.equal(f.world.mode, null); assert.deepEqual(f.calls, []) } })
test('already unavailable and input-masked worlds do not drain', () => {
  const unavailable = fixture(); unavailable.world.manaWorld.gameFlags = 32; unavailable.run(); assert.equal(unavailable.world.mode, null); assert.deepEqual(unavailable.calls, ['update'])
  const masked = fixture(); masked.world.inputMask = 64; masked.run(); assert.equal(masked.world.mode, null); assert.deepEqual(masked.calls, [])
})
