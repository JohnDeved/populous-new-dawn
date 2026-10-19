import assert from 'node:assert/strict'
import test from 'node:test'
import {readFileSync} from 'node:fs'
import ts from 'typescript'
import {selectorWorlds,selectorWorldPosition,openingMissionAvailable,openingRecommendedMission} from '../app/world-selector-data.ts'
import * as campaign from '../app/world-selector-data.ts'

test('native selector body hierarchy retains all 25 worlds and first-three moons', () => {
  assert.equal(selectorWorlds.length,25)
  assert.deepEqual(selectorWorlds.map(w=>w.mission).sort((a,b)=>a-b),Array.from({length:25},(_,i)=>i+1))
  for (const [mission,radius] of [[1,150],[2,110],[3,70]]) {
    const body=selectorWorlds.find(w=>w.mission===mission)
    assert.equal(body.parent,20)
    assert.equal(body.orbitRadius,radius)
    assert.equal(body.startAngle,90)
    const position=selectorWorldPosition(body.index)
    assert.ok(Math.abs(position.x)<1e-9)
    assert.equal(position.z,-1400+radius)
  }
  assert.throws(()=>selectorWorldPosition(25),RangeError)
})

test('opening campaign availability reflects completion without hiding replay access', () => {
  assert.deepEqual([1,2,3].map(n=>openingMissionAvailable(n,[])),[true,false,false])
  assert.deepEqual([1,2,3].map(n=>openingMissionAvailable(n,[1])),[true,true,false])
  assert.deepEqual([1,2,3].map(n=>openingMissionAvailable(n,[1,2])),[true,true,true])
  assert.equal(openingMissionAvailable(3,[3]),true)
  assert.equal(openingMissionAvailable(4,[1,2,3]),false)
  assert.equal(openingRecommendedMission([]),1)
  assert.equal(openingRecommendedMission([1]),2)
  assert.equal(openingRecommendedMission([1,2]),3)
  assert.equal(openingRecommendedMission([1,2,3]),3)
})

// Exercise the actual shipped selector's handlers and state. React/DOM focus are
// deterministic boundaries here; rendered keyboard acceptance is separate.
const selectorSource = ts.createSourceFile('world-selector.tsx',
  readFileSync(new URL('../app/world-selector.tsx', import.meta.url), 'utf8'),
  ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
const selectorFunction = selectorSource.statements.find(node =>
  ts.isFunctionDeclaration(node) && node.name?.text === 'WorldSelector')
const selectorCode = ts.transpileModule(selectorFunction.getText(selectorSource).replace(/^export /, ''), {
  compilerOptions: {target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React},
}).outputText
function selectorFixture(completed) {
  const states = [], buttons = new Map(), launches = []
  let hook = 0, active, tree
  const root = {
    querySelector(selector) {
      const mission = selector.match(/^\[data-selector-mission="(\d+)"\]$/)?.[1]
      assert.ok(mission, `known panel focus query: ${selector}`)
      return [...buttons.values()].find(button => String(button.props['data-selector-mission']) === mission)
    },
  }
  const container = {current: root}
  const React = {createElement: (type, props, ...children) => ({type, props: props ?? {}, children})}
  const bindings = {
    ...campaign, React, useRef: () => container, useId: () => 'selector-keyboard',
    useState(initial) {
      const index = hook++
      if (!(index in states)) states[index] = typeof initial === 'function' ? initial() : initial
      return [states[index], value => {states[index] = typeof value === 'function' ? value(states[index]) : value}]
    },
    styles: new Proxy({}, {get: (_, name) => name}),
    WorldSelectorScene: 'WorldSelectorScene', SelectorTitle: 'SelectorTitle', SelectorTooltip: 'SelectorTooltip',
  }
  const component = Function(...Object.keys(bindings), `${selectorCode}\nreturn WorldSelector`)(...Object.values(bindings))
  function visit(node) {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) return node.forEach(visit)
    if (node.type === 'button') {
      const name = node.props['aria-label']
      if (name) {
        const key = /^(?:Start|Replay) Mission/.test(name) ? 'start' : name
        if (!buttons.has(key)) buttons.set(key, {
          focus() {active = this},
          hasAttribute(attribute) {return this.props[attribute] !== undefined},
        })
        buttons.get(key).props = node.props
      }
    }
    node.children?.forEach(visit)
  }
  function render() {
    hook = 0
    tree = component({missions: [1, 2, 3], completed, hasCheckpoint: false,
      onStart: mission => launches.push(mission), onTutorial() {}, onLoad() {}, onBack() {}})
    visit(tree)
  }
  function button(name) {
    const found = [...buttons.values()].find(button => button.props['aria-label'] === name)
    assert.ok(found, `shipped selector button: ${name}`)
    return found
  }
  render()
  return {
    launches,
    get selected() {return states[0]},
    get focused() {return active?.props['aria-label']},
    focus(name) {button(name).focus()},
    click(name) {button(name).focus(); button(name).props.onClick(); render()},
    activate() {assert.ok(active); active.props.onClick(); render()},
    key(key) {
      assert.ok(active)
      let prevented = false
      active.props.onKeyDown({key, currentTarget: active, preventDefault() {prevented = true}})
      render()
      return prevented
    },
  }
}

test('campaign arrow selection moves glyph focus so activation cannot restore the stale world', () => {
  const f = selectorFixture([1])
  f.click('Panel Mission 1, completed')
  assert.equal(f.key('ArrowRight'), true)
  assert.equal(f.selected, 2)
  assert.equal(f.focused, 'Panel Mission 2')
  f.activate()
  assert.equal(f.selected, 2, 'Enter on the focused glyph preserves the arrow-selected world')
  assert.deepEqual(f.launches, [], 'panel inspection does not launch or replace the current world')
  f.click('Start Mission 2')
  assert.deepEqual(f.launches, [2])
})

test('arrows search from the inspected world, skip locked worlds and wrap in either direction', () => {
  for (const [completed, inspected, key, expected] of [
    [[1], 3, 'ArrowLeft', 2], [[1], 3, 'ArrowRight', 1],
    [[], 2, 'ArrowLeft', 1], [[], 2, 'ArrowRight', 1],
    [[3], 2, 'ArrowLeft', 1], [[3], 2, 'ArrowRight', 3],
    [[1, 2], 1, 'ArrowLeft', 3], [[1, 2], 3, 'ArrowRight', 1],
  ]) {
    const f = selectorFixture(completed)
    f.click(`Panel Mission ${inspected}${completed.includes(inspected) ? ', completed' : ''}`)
    f.key(key)
    assert.equal(f.selected, expected, `${completed}: ${key} from Mission ${inspected}`)
    assert.equal(f.focused, `Panel Mission ${expected}${completed.includes(expected) ? ', completed' : ''}`)
    f.activate()
    assert.equal(f.selected, expected, 'activation does not return to the inspected locked world')
    assert.deepEqual(f.launches, [])
  }
})

test('repeated panel arrows stay synchronized while Start keeps its launch focus', () => {
  const f = selectorFixture([1, 2])
  f.click('Panel Mission 1, completed')
  for (const expected of [2, 3, 1, 2]) {
    f.key('ArrowRight')
    assert.equal(f.selected, expected)
    assert.equal(f.focused, `Panel Mission ${expected}${expected < 3 ? ', completed' : ''}`)
  }
  f.focus('Replay Mission 2')
  f.key('ArrowLeft')
  assert.equal(f.selected, 1)
  assert.equal(f.focused, 'Replay Mission 1', 'arrows on Start must not move focus into the panel')
  assert.equal(f.key('Tab'), false, 'ordinary keyboard navigation remains native')
  f.activate()
  assert.deepEqual(f.launches, [1])
})
