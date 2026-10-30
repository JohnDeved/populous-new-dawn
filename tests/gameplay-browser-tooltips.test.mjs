import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import ts from 'typescript'
import { commandCategory } from '../scripts/browser-command-categories.mjs'

const read = file => readFileSync(new URL(`../app/${file}`, import.meta.url), 'utf8')
const source = file => ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true)
const page = source('page.tsx'), tasks = source('follower-tasks-view.tsx'), panels = source('object-panels.ts')

function nodes(root, predicate) {
  const found = []
  function visit(node) {
    if (predicate(node)) found.push(node)
    ts.forEachChild(node, visit)
  }
  visit(root)
  return found
}

function attribute(button, name) {
  return button.attributes.properties.find(prop => prop.name?.text === name)
}

function button(root, name, contains) {
  const found = nodes(root, node =>
    (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
    node.tagName.getText(root) === 'button' &&
    attribute(node, name)?.initializer?.getText(root).includes(contains))
  assert.equal(found.length, 1, `one actual ${name}=${contains} control`)
  return found[0]
}

function evaluate(expression, bindings = {}) {
  return Function(...Object.keys(bindings), `return (${expression})`)(...Object.values(bindings))
}

function value(control, name, root, bindings = {}) {
  const initializer = attribute(control, name)?.initializer
  if (!initializer) return undefined
  return ts.isStringLiteral(initializer)
    ? initializer.text
    : evaluate(initializer.expression.getText(root), bindings)
}

// Structural/attribute regression only: no browser, accessibility-tree, or pixel claim.
test('normal gameplay owners do not emit browser title tooltips', () => {
  for (const root of [page, tasks, panels]) {
    const titles = nodes(root, node =>
      (ts.isJsxAttribute(node) && node.name.text === 'title') ||
      (ts.isPropertyAccessExpression(node) && node.name.text === 'title') ||
      (ts.isElementAccessExpression(node) && node.argumentExpression?.text === 'title') ||
      (ts.isCallExpression(node) && node.expression.name?.text === 'setAttribute' &&
        node.arguments[0]?.text === 'title'))
    assert.deepEqual(titles.map(node => node.getText(root)), [], root.fileName)
  }
})

test('HUD names, keyboard help and live counts remain nonvisual accessibility metadata', () => {
  const cases = [
    ['className', 'nearby-followers-button', {}, 'Nearby followers', 'Nearby followers · Limit counts and selection to the camera area'],
    ['className', 'portrait', {}, 'Select shaman', 'Shaman · Click: add to selection · Right-click: focus · H: select'],
    ['className', 'help-button', {}, 'Menu', 'Help and game menu'],
    ['className', 'population-button', {}, 'Select follower', 'Select follower · Shift: all · Ctrl: five · Right-click: focus next'],
    ['aria-label', 'Select ${u.kind}', { u: { kind: 'brave', label: 'Braves' } }, 'Select brave', 'Braves · Shift: all · Ctrl: five · Right-click: focus next'],
    ['className', 'building-card', { b: { name: 'Hut', cost: 5 } }, 'Hut, 5 wood', 'Hut · Space rotates the plan'],
    ['aria-label', 'Disguise selected spies', { enemy: { name: 'Dakini' } }, 'Disguise selected spies as Dakini', undefined],
  ]
  for (const [name, contains, bindings, label, description] of cases) {
    const control = button(page, name, contains)
    assert.equal(value(control, 'aria-label', page, bindings), label)
    assert.equal(value(control, 'aria-description', page, bindings), description)
  }
  const category = button(page, 'aria-label', "t === 'spells'")
  for (const [t, label] of [['buildings', 'buildings B'], ['spells', 'spells 1–3'], ['followers', 'followers ']]) {
    assert.equal(value(category, 'aria-label', page, { t }), label)
    assert.equal(value(category, 'aria-description', page, { t }), undefined)
  }
})

test('tribe indicators retain names and counts without button or activation semantics', () => {
  const indicators = nodes(page, node =>
    (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
    attribute(node, 'className')?.initializer?.getText(page).includes('tribe-flag'))
  assert.equal(indicators.length, 1)
  const indicator = indicators[0]
  assert.equal(indicator.tagName.getText(page), 'span')
  // Exact attributes forbid handlers, spreads, tabIndex and disabled-button semantics.
  assert.deepEqual(indicator.attributes.properties.map(prop => prop.name?.text).sort(),
    ['aria-description', 'aria-label', 'className', 'key', 'role'])
  assert.equal(value(indicator, 'role', page), 'img')
  for (const name of ['Dakini', 'Chumara', 'Matak']) {
    const bindings = { enemy: { name, units: [{}, {}, { ghost: true }] } }
    assert.equal(value(indicator, 'aria-label', page, bindings), `${name} tribe`)
    assert.equal(value(indicator, 'aria-description', page, bindings), `${name}: 2 followers`)
  }
})

test('browser category locators bind exact shipped accessible names without title tooltips', () => {
  const category = button(page, 'aria-label', "t === 'spells'"),
    navigation = nodes(page, node => ts.isJsxOpeningElement(node) &&
      node.tagName.getText(page) === 'nav' && value(node, 'className', page) === 'dock-tabs')
  assert.equal(navigation.length, 1)
  assert.equal(value(navigation[0], 'aria-label', page), 'Command categories')
  assert.equal(attribute(category, 'title'), undefined)
  for (const t of ['buildings', 'spells', 'followers']) {
    const calls = [], target = {}, stub = {
      getByRole(role, options) {
        calls.push({ role, options })
        return { getByRole(role, options) { calls.push({ role, options }); return target } }
      },
    }
    assert.equal(commandCategory(stub, t), target)
    assert.deepEqual(calls, [
      { role: 'navigation', options: { name: 'Command categories', exact: true } },
      { role: 'button', options: { name: value(category, 'aria-label', page, { t }).trim().replace(/\s+/g, ' '), exact: true } },
    ])
  }
  for (const invalid of ['unknown', 'toString', '__proto__', undefined])
    assert.throws(() => commandCategory({}, invalid), /Unknown command category/)
})

test('browser category consumers use accessible names, including interruptions and DPR pages', () => {
  for (const [file, expectedCalls] of [
    ['tutorial-browser/shaman-casting.mjs', 1],
    ['check-browser-follower-tasks.mjs', 9],
    ['check-browser-follower-transports.mjs', 6],
    ['check-browser-followers-tab.mjs', 2],
    ['check-browser-mission11.mjs', 1],
    ['check-browser-spy-combat-lifecycle.mjs', 1],
    ['check-browser-transport-idle.mjs', 1],
    ['tutorial-browser/spy-source.mjs', 1],
  ]) {
    const text = readFileSync(new URL(`../scripts/${file}`, import.meta.url), 'utf8'),
      script = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true)
    const titleCalls = nodes(script, node => ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === 'getByTitle')
    assert.equal(titleCalls.length, 0, `${file}: removed category titles cannot be selectors`)
    const categoryCalls = nodes(script, node => ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) && node.expression.text === 'commandCategory')
    assert.equal(categoryCalls.length, expectedCalls, `${file}: every category path uses the shared locator`)
  }
})

test('standalone casting and spy reports retain the category helper source hash', () => {
  for (const [file, helper] of [
    ['shaman-casting.mjs', 'scripts/browser-command-categories.mjs'],
    ['spy-source.mjs', '../browser-command-categories.mjs'],
  ]) {
    const text = readFileSync(new URL(`../scripts/tutorial-browser/${file}`, import.meta.url), 'utf8'),
      script = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true),
      manifests = nodes(script, node => ts.isCallExpression(node) && node.expression.getText(script) === 'Object.fromEntries')
    assert.ok(manifests.some(node => {
      const mapped = node.arguments[0]
      return ts.isCallExpression(mapped) && ts.isPropertyAccessExpression(mapped.expression) &&
        mapped.expression.name.text === 'map' && ts.isArrayLiteralExpression(mapped.expression.expression) &&
        mapped.expression.expression.elements.some(element => ts.isStringLiteral(element) && element.text === helper)
    }), `${file}: include the imported helper in the source-hash list`)
  }
})

test('spell descriptions retain charge help without exposing undiscovered names or changing Blast ownership', () => {
  const control = button(page, 'className', 'spell-card')
  for (const id of ['blast', 'lightning']) for (const undiscovered of [false, true]) for (const canCharge of [false, true]) {
    const name = id === 'blast' ? 'Blast' : 'Lightning',
      bindings = { s: { id, name }, undiscovered, canCharge, world: { shots: { [id]: 3 } } }
    assert.equal(value(control, 'aria-label', page, bindings), undiscovered ? 'Undiscovered spell' : `${name}, 3 shots`)
    assert.equal(value(control, 'aria-description', page, bindings), undiscovered ? 'Undiscovered spell' : `${name}${canCharge ? ' · Right-click to pause or resume charging' : ''}`)
    assert.equal(value(control, 'data-tooltip-hud', page, bindings), id === 'blast' && !undiscovered ? 'blast' : undefined)
  }
})

test('task and transport controls retain enabled action and modifier descriptions', () => {
  const control = button(tasks, 'aria-label', '${row.label} ${kind}')
  for (const [label, action, five] of [
    ['Currently selected', 'deselect', false],
    ['Idle', 'select', true],
    ['Housed', 'select', true],
    ['Busy', 'select', true],
    ['Boats occupied by', 'select passengers', true],
    ['Balloons occupied by', 'select passengers', true],
  ]) for (const kind of ['Followers', 'Braves', 'Warriors', 'Firewarriors', 'Preachers', 'Spies']) for (const enabled of [false, true]) {
    const bindings = { row: { label, action, five }, kind, enabled }
    assert.equal(value(control, 'aria-label', tasks, bindings), `${label} ${kind}`)
    assert.equal(value(control, 'aria-description', tasks, bindings), enabled
      ? `${label} ${kind}: Click to ${action}. ${five ? 'Ctrl: five. ' : ''}Shift: all. Right-click: focus next.`
      : undefined)
  }
})

test('object-panel DOM writers retain passenger, unload, worshipper and order descriptions', () => {
  const setters = name => nodes(panels, node => ts.isCallExpression(node) &&
    node.expression.getText(panels) === 'button.setAttribute' && node.arguments[0]?.text === name)
  const labels = setters('aria-label'), descriptions = setters('aria-description')
  assert.equal(labels.length, 2)
  assert.equal(descriptions.length, 2)
  for (const [index, bindings, label, description] of [
    [0, { isUnload: false, i: 1 }, 'Toggle passenger 2; Shift selects the group', 'Click to select; Shift-click for all passengers; right-click to inspect'],
    [0, { isUnload: true, i: 8 }, 'Unload all passengers', 'Unload all passengers'],
    [1, { head: {}, i: 1 }, 'Toggle worshipper 2; Shift selects the group', 'Click to select; Shift-click for all worshippers; right-click to focus'],
    [1, { head: null, i: 2 }, 'Focus order 3 destination', 'Right-click to view destination'],
  ]) {
    const attributes = {}, button = { setAttribute: (name, text) => { attributes[name] = text } }
    for (const call of [labels[index], descriptions[index]]) evaluate(call.getText(panels), { ...bindings, button })
    assert.deepEqual(attributes, { 'aria-label': label, 'aria-description': description })
  }
})

test('Blast still reaches the native string and mounted-control lifetime owner, not a new visual tooltip', () => {
  const runtime = source('scene-tooltip-runtime.ts'),
    bodies = ['hudOwner', 'publishTooltipInput'].map(name => {
      const found = nodes(runtime, node => ts.isFunctionDeclaration(node) && node.name?.text === name)
      assert.equal(found.length, 1)
      return found[0].getText(runtime).replace(/^export /, '')
    }).join('\n'),
    javascript = ts.transpileModule(bodies, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText,
    tooltipPalette = JSON.parse(read('original-tooltips.json')),
    makeHud = () => ({
      getAttribute: name => name === 'data-tooltip-hud' ? 'blast' : null,
      closest(selector) { return selector === '[data-tooltip-hud]' ? this : null },
    })
  let hit = makeHud()
  const publish = Function('document', 'tooltipPalette', `${javascript}; return publishTooltipInput`)(
    { elementFromPoint: () => hit }, tooltipPalette),
    scene = {
      pointerScreen: { clientX: 10, clientY: 20 },
      world: { manaWorld: { playerTribe: 0, spells: [{ available: 4 }] }, manaTribes: [{}], shots: { blast: 0 } },
    }
  publish(scene)
  const owner = scene.tooltipInput.hud.owner
  assert.deepEqual(scene.tooltipInput.hud, { owner, text: 'Blast: {}select. |}toggle on/off.', repeatable: true, enabled: true })
  assert.equal(scene.tooltipInput.route, 'hud')
  publish(scene)
  assert.equal(scene.tooltipInput.hud.owner, owner, 'same mounted control retains ownership')
  hit = makeHud()
  publish(scene)
  assert.notEqual(scene.tooltipInput.hud.owner, owner, 'a remounted control acquires a fresh owner')
  scene.world.manaWorld.spells[0].available = 0
  publish(scene)
  assert.equal(scene.tooltipInput.hud.text, '')
  scene.world.shots.blast = 1
  publish(scene)
  assert.equal(scene.tooltipInput.hud.text, tooltipPalette.strings[814])
  // Ordinary native HUD painting is intentionally outside this title-only slice.
  assert.match(runtime.text, /draw: modal \|\| \(!handled && owner\.category === 'hud'\) \? 0 : state\.draw/)
})
