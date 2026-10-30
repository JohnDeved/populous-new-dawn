import assert from 'node:assert/strict'
import test from 'node:test'
import {readFileSync} from 'node:fs'
import ts from 'typescript'
import {selectorWorlds,selectorWorldPosition,openingMissionAvailable,openingRecommendedMission} from '../app/world-selector-data.ts'
import * as campaign from '../app/world-selector-data.ts'
import * as selectorArtwork from '../app/world-selector-art.ts'

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
function selectorFixture(completed, { nativeSelection, missions = [1, 2, 3] } = {}) {
  const states = [], refs = [], buttons = new Map(), launches = []
  let hook = 0, refHook = 0, active, tree, effects = [], mounted = new Set()
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
    ...campaign, ...selectorArtwork, React, useId: () => 'selector-keyboard',
    useRef(initial) {
      const index = refHook++
      return refs[index] ??= index === 0 ? container : {current: initial}
    },
    useLayoutEffect(effect) {effects.push(effect)},
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
    if (node.type === 'h3' && node.props.ref) {
      const heading = {props: node.props, name: node.children.join(''), focus(options) {
        assert.deepEqual(options, {preventScroll: true})
        active = this
      }}
      node.props.ref.current = heading
      mounted.add(heading)
    }
    if (node.type === 'button') {
      const name = node.props['aria-label'] ?? node.children.filter(child => typeof child === 'string').join('')
      if (name) {
        const key = /^(?:Start|Replay) Mission/.test(name) ? 'start' : name
        if (!buttons.has(key)) buttons.set(key, {
          focus() {active = buttons.get(key)},
          hasAttribute(attribute) {return this.props[attribute] !== undefined},
        })
        buttons.get(key).props = node.props
        buttons.get(key).name = name
        mounted.add(buttons.get(key))
      }
    }
    node.children?.forEach(visit)
  }
  function render() {
    hook = 0; refHook = 0; effects = []; mounted = new Set()
    tree = component({missions, completed, hasCheckpoint: false,
      nativeSelection: nativeSelection && {...nativeSelection, onSelect(mission) {nativeSelection = {...nativeSelection, selected: mission}}},
      onStart: mission => launches.push(mission), onTutorial() {}, onLoad() {}, onBack() {}})
    visit(tree)
    if (active && !mounted.has(active)) active = undefined
    for (const effect of effects) effect()
  }
  function button(name) {
    const found = [...buttons.values()].find(button => mounted.has(button) && button.name === name)
    assert.ok(found, `shipped selector button: ${name}`)
    return found
  }
  render()
  return {
    launches,
    get selected() {return nativeSelection?.selected ?? states[0]},
    get tree() {return tree},
    props(name) {return button(name).props},
    updateNative(value) {nativeSelection = {...nativeSelection, ...value}; render()},
    get focused() {return active?.name},
    get focusProps() {return active?.props},
    render,
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

test('All missions switch hands focus to its non-action heading before keyboard navigation', () => {
  const f = selectorFixture([])
  f.click('Browser controls')
  f.click('All missions')
  assert.equal(f.focused, 'Choose any playable mission')
  assert.equal(f.focusProps.tabIndex, -1)
  assert.equal(f.focusProps.onClick, undefined, 'the focus target cannot launch a mission')
  assert.equal(f.focusProps.onKeyDown, undefined, 'held activation has no mission handler')
  assert.deepEqual(f.launches, [])
  f.click('Mission 2')
  assert.deepEqual(f.launches, [2], 'ordinary direct launch remains available')
})

test('All missions focus transfer is explicit, single-use and works when reselecting the same view', () => {
  const f = selectorFixture([])
  f.click('Browser controls'); f.click('All missions')
  f.focus('Mission 2')
  f.render()
  assert.equal(f.focused, 'Mission 2', 'ordinary updates never steal grid focus')
  f.click('Browser controls')
  assert.equal(f.focused, 'Browser controls', 'opening controls does not move focus')
  f.click('Browser controls')
  assert.equal(f.focused, 'Browser controls', 'closing controls does not move focus')
  f.click('Browser controls'); f.click('All missions')
  assert.equal(f.focused, 'Choose any playable mission', 'same-view switch also removes its trigger')
  assert.deepEqual(f.launches, [])
})

function nodes(tree, predicate) {
  if (!tree || typeof tree !== 'object') return []
  if (Array.isArray(tree)) return tree.flatMap(node => nodes(node, predicate))
  return [...(predicate(tree) ? [tree] : []), ...(tree.children ?? []).flatMap(node => nodes(node, predicate))]
}

test('opt-in renderer consumes all 25 exact native sockets using the selected palette', () => {
  const available = Array.from({length: 25}, (_, index) => index + 1)
  const completed = [1, 4, 16, 21, 25]
  const f = selectorFixture(completed, {nativeSelection: {selected: 16, available, progressionMission: 20}})
  const buttons = nodes(f.tree, node => node.type === 'button' && node.props['data-selector-mission'])
  assert.equal(buttons.length, 25)
  for (const button of buttons) {
    const mission = button.props['data-selector-mission'], world = selectorArtwork.selectorWorld(mission)
    const socket = world.panel
    assert.deepEqual(button.props.style, {
      left: `calc(var(--panel-width) * ${socket.localXY[0]} / 640)`,
      top: `calc(var(--panel-width) * ${socket.localXY[1]} / 640)`,
      width: `calc(var(--panel-width) * ${socket.width} / 640)`,
      height: `calc(var(--panel-width) * ${socket.height} / 640)`,
    })
    const images = nodes(button, node => node.type === 'img')
    assert.equal(images.length, 1)
    assert.equal(images[0].props.src, selectorArtwork.selectorArt(16).panel[
      completed.includes(mission) ? socket.completedFrame : socket.availableFrame])
    assert.equal(button.props['aria-pressed'], mission === 16)
  }
  const scene = nodes(f.tree, node => node.type === 'WorldSelectorScene')[0]
  assert.deepEqual(scene.props, {mission: 16, progressionMission: 20})
  f.click('Panel Mission 25, completed')
  assert.equal(f.selected, 25)
  assert.equal(nodes(f.tree, node => node.type === 'SelectorTitle')[0].props.mission, 25)
  assert.deepEqual(f.launches, [], 'inspecting the sun never launches it')
})

test('explicit availability stays independent of completion, launch support and orbit anchor', () => {
  const f = selectorFixture([16, 25], {missions: [1, 2, 3, 4],
    nativeSelection: {selected: 16, available: [4, 25], progressionMission: 4}})
  const glyph = nodes(f.tree, node => node.props['data-selector-mission'] === 16)[0]
  assert.equal(nodes(glyph, node => node.type === 'img').length, 1, 'completed glyph draws even if unavailable')
  assert.equal(glyph.props['data-selector-tooltip'], undefined)
  assert.equal(f.props('Replay Mission 16').disabled, true)
  f.click('Replay Mission 16')
  assert.deepEqual(f.launches, [], 'disabled handler is also guarded')
  f.click('Panel Mission 25, completed')
  assert.equal(f.props('Replay Mission 25').disabled, true, 'available source record is not launch support')
  f.click('Replay Mission 25')
  assert.deepEqual(f.launches, [])
  f.click('Panel Mission 4')
  assert.equal(f.props('Start Mission 4').disabled, false)
  f.click('Start Mission 4')
  assert.deepEqual(f.launches, [4], 'only an existing caller-supported mission can start')
  f.updateNative({selected: 22, available: [], progressionMission: 4})
  f.focus('Panel Mission 22')
  f.key('ArrowRight')
  assert.equal(f.selected, 22, 'empty availability does not select undefined')
  assert.equal(nodes(f.tree, node => node.type === 'WorldSelectorScene')[0].props.progressionMission, 4)
})

test('opt-in keyboard selection skips unavailable branches, wraps and responds to caller changes', () => {
  const f = selectorFixture([], {nativeSelection: {selected: 16, available: [4, 19, 25], progressionMission: 1}})
  f.focus('Panel Mission 16')
  f.key('ArrowRight')
  assert.equal(f.selected, 19)
  assert.equal(f.focused, 'Panel Mission 19')
  f.key('ArrowRight')
  assert.equal(f.selected, 25)
  f.key('ArrowRight')
  assert.equal(f.selected, 4)
  f.key('ArrowLeft')
  assert.equal(f.selected, 25)
  f.updateNative({selected: 20, available: [1], progressionMission: 20})
  assert.equal(nodes(f.tree, node => node.type === 'SelectorTitle')[0].props.mission, 20)
  f.focus('Panel Mission 20')
  f.key('ArrowRight')
  assert.equal(f.selected, 1)
  assert.deepEqual(f.launches, [])
})

test('opening rendering and all-missions access remain unchanged without explicit state', () => {
  const f = selectorFixture([1], {missions: Array.from({length: 23}, (_, i) => i + 1)})
  assert.deepEqual(nodes(f.tree, node => node.props['data-selector-mission']).map(node => node.props['data-selector-mission']), [1, 2, 3])
  assert.equal(f.tree.props.style['--selector-cursor'], 'url("/original/world-selector/text/cursor-2.png") 0 0')
  for (const mission of [1, 2, 3]) {
    const button = nodes(f.tree, node => node.props['data-selector-mission'] === mission)[0]
    assert.deepEqual(button.props.style, {left: `calc(var(--panel-width) * ${28 + (mission - 1) * 20} / 640)`})
    assert.ok(!button.props.className.includes('nativeGlyph'))
  }
  f.click('Browser controls')
  f.click('All missions')
  f.click('Mission 23')
  assert.deepEqual(f.launches, [23], 'existing direct access is not stranded')
})

test('an asset failure remains scoped to its selected world even when banks reuse pixels', () => {
  const f = selectorFixture([], {nativeSelection: {selected: 4, available: [4, 6], progressionMission: 4}})
  const art = () => nodes(f.tree, node => node.type === 'img' && node.props.className === 'panelArt')
  assert.equal(art().length, 1)
  art()[0].props.onError()
  f.render()
  assert.equal(art().length, 0)
  f.click('Panel Mission 6')
  assert.equal(art().length, 1, 'another selected world gets its own load attempt')
  f.click('Panel Mission 4')
  assert.equal(art().length, 0, 'the failed world retains its accessible fallback')
})

// Run the real failure render/callback, but do not start a renderer or simulate
// browser default dispatch. The tests below supply that one button-click boundary.
function sceneRecoveryFixture(failed = true) {
  const source = ts.createSourceFile('world-selector-scene.tsx',
    readFileSync(new URL('../app/world-selector-scene.tsx', import.meta.url), 'utf8'),
    ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const component = source.statements.find(node =>
    ts.isFunctionDeclaration(node) && node.name?.text === 'WorldSelectorScene')
  assert.ok(component, 'actual scene recovery component exists')
  const code = ts.transpileModule(component.getText(source).replace(/^export /, ''), {
    compilerOptions: {target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React},
  }).outputText
  let state = 0, generation = 0, recoveryFonts = []
  const bindings = {
    React: {createElement: (type, props, ...children) => ({type, props: props ?? {}, children})},
    useRef: current => ({current}), useEffect() {},
    useState() {
      const index = state++
      return index === 0 ? [failed, () => assert.fail('render does not change failure state')]
        : index === 1 ? [generation, update => {generation = update(generation)}]
          : [recoveryFonts, update => {recoveryFonts = update(recoveryFonts)}]
    },
    SceneRecoveryText: 'SceneRecoveryText',
    styles: new Proxy({}, {get: (_, name) => name}),
  }
  const render = Function(...Object.keys(bindings), `${code}\nreturn WorldSelectorScene`)(...Object.values(bindings))
  const tree = () => {state = 0; return render({mission: 1, progressionMission: 1})}
  const buttons = nodes(tree(), node => node.type === 'button')
  assert.equal(buttons.length, failed ? 1 : 0)
  if (failed) {
    assert.equal(buttons[0].props['aria-label'], 'Retry scene')
    assert.equal(buttons[0].props.type, 'button')
    assert.equal(buttons[0].children[0].props.text, 'Retry scene')
  }
  return {button: buttons[0], tree, get generation() {return generation}}
}

test('scene recovery retains accessible disclosure and independent native font failure fallbacks', () => {
  const f = sceneRecoveryFixture()
  const text = label => nodes(f.tree(), node => node.type === 'SceneRecoveryText' && node.props.text === label)[0]
  const font = name => nodes(f.tree(), node => node.type === 'img' && node.props.src === `/original/frontend/${name}.png`)[0]
  const status = nodes(f.tree(), node => node.props.role === 'status')
  assert.equal(status.length, 1)
  assert.equal(status[0].children[0].children.join('').trim(),
    'Star-system image unavailable. Mission controls still work.')
  assert.equal(font('feft33we'), undefined, 'unused dark menu artwork is not a recovery dependency')
  for (const name of ['fehi33we', 'felo33we']) {
    assert.equal(font(name).props.hidden, true)
    assert.equal(font(name).props.alt, '')
  }
  assert.equal(text('Retry scene').props.ready, false)
  assert.equal(text('Star-system image unavailable.').props.ready, false)
  font('felo33we').props.onLoad()
  assert.equal(text('Retry scene').props.ready, false, 'gold-only decoding must not hide hover text')
  for (const label of ['Star-system image unavailable.', 'Mission controls still work.']) {
    assert.equal(text(label).props.ready, true)
    assert.equal(text(label).props.low, true)
  }
  font('fehi33we').props.onLoad()
  assert.equal(text('Retry scene').props.ready, true)
  font('fehi33we').props.onError()
  assert.equal(text('Retry scene').props.ready, false, 'failed artwork keeps the readable action fallback')
  assert.equal(text('Star-system image unavailable.').props.ready, true)
  font('fehi33we').props.onLoad()
  assert.equal(text('Retry scene').props.ready, true)
  font('felo33we').props.onError()
  assert.equal(text('Star-system image unavailable.').props.ready, false)
  assert.equal(text('Retry scene').props.ready, false, 'gold failure keeps normal Retry readable too')
  f.button.props.onClick()
  assert.equal(f.generation, 1, 'font failure does not disable Retry')
})

test('scene recovery draws the imported frontend glyph advances without a system-font substitute', () => {
  const source = ts.createSourceFile('world-selector-scene.tsx',
    readFileSync(new URL('../app/world-selector-scene.tsx', import.meta.url), 'utf8'),
    ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const component = source.statements.find(node =>
    ts.isFunctionDeclaration(node) && node.name?.text === 'SceneRecoveryText')
  const code = ts.transpileModule(component.getText(source), {
    compilerOptions: {target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React},
  }).outputText
  const frontend = JSON.parse(readFileSync(new URL('../app/original-frontend.json', import.meta.url), 'utf8'))
  const React = {createElement: (type, props, ...children) => ({type, props: props ?? {}, children})}
  const styles = new Proxy({}, {get: (_, name) => name})
  const text = Function('React', 'styles', 'frontend', `${code}\nreturn SceneRecoveryText`)(React, styles, frontend)
  const scaled = pixels => `calc(var(--panel-width) * ${pixels} / 640)`
  for (const [label, low] of [['Star-system image unavailable.', true], ['Mission controls still work.', true], ['Retry scene', false]]) {
    const fallback = text({text: label, ready: false, low})
    assert.equal(fallback.props['aria-hidden'], 'true')
    assert.equal(fallback.props.className, 'sceneRecoveryFallback')
    assert.deepEqual(fallback.children, [label])
    const bitmap = text({text: label, ready: true, low})
    assert.equal(bitmap.props['aria-hidden'], 'true')
    const glyphs = nodes(bitmap, node => node.type === 'i')
    const bank = frontend.banks.felo33we
    assert.equal(glyphs.length, label.length)
    assert.ok([...label].reduce((width, letter) => width + bank.rects[letter.charCodeAt(0) - 32].w, 0) <= 600,
      'each line fits the original frontend logical width')
    for (const [index, letter] of [...label].entries()) {
      const glyph = bank.rects[letter.charCodeAt(0) - 32]
      assert.deepEqual(glyphs[index].props.style, {
        width: scaled(glyph.w), height: scaled(glyph.h),
        backgroundPosition: `${scaled(-glyph.x)} ${scaled(-glyph.y)}`,
        backgroundSize: `${scaled(bank.width)} ${scaled(bank.height)}`,
        backgroundImage: low ? "url('/original/frontend/felo33we.png')" : 'var(--selector-recovery-font)',
      })
      if (!low) assert.deepEqual(frontend.banks.fehi33we.rects[letter.charCodeAt(0) - 32], glyph,
        'highlight changes native pixels without shifting the menu row')
    }
    assert.equal(frontend.banks.fehi33we.width, frontend.banks.felo33we.width)
    assert.equal(frontend.banks.fehi33we.height, frontend.banks.felo33we.height)
  }
})

test('unfocused scene Retry uses unmodified original gold artwork on the black failure clear', () => {
  const css = readFileSync(new URL('../app/world-selector.module.css', import.meta.url), 'utf8')
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  const rule = selector => {
    const found = rules.find(([, selectors]) => selectors.trim() === selector)
    assert.ok(found, `recovery rule exists: ${selector}`)
    return Object.fromEntries(found[2].split(';').filter(item => item.trim()).map(item => {
      const colon = item.indexOf(':')
      return [item.slice(0, colon).trim(), item.slice(colon + 1).trim()]
    }))
  }
  // Remove comments only for selector lookup, never change the live CSS.
  for (const entry of rules) entry[1] = entry[1].replace(/\/\*[\s\S]*?\*\//g, '')
  const normal = rule('.selector .sceneRetry')
  assert.equal(rule('.dialog').background, '#000')
  assert.equal(normal['--selector-recovery-font'], "url('/original/frontend/felo33we.png')")
  assert.equal(rule('.selector .sceneRetry:hover, .selector .sceneRetry:focus-visible')['--selector-recovery-font'],
    "url('/original/frontend/fehi33we.png')")
  for (const [name, expected] of Object.entries({background: 'transparent', border: '0',
    'border-radius': '0', 'min-height': '44px', 'pointer-events': 'auto',
    'min-width': 'calc(var(--panel-width) * 200 / 640)'})) assert.equal(normal[name], expected)
  assert.deepEqual(rule('.selector .sceneRetry:focus-visible'),
    {outline: '1px solid #fff1bb', 'outline-offset': '1px'})
  for (const [, selectors, declarations] of rules.filter(([, selectors]) => /sceneRetry|sceneRecovery/.test(selectors))) {
    assert.doesNotMatch(declarations, /(?:^|;)\s*(?:filter|opacity|mix-blend-mode)\s*:/,
      `original recovery pixels stay unmodified: ${selectors.trim()}`)
  }
  assert.equal(rule('.selector button:disabled').opacity, '.5', 'disabled controls retain existing treatment')
  const pending = sceneRecoveryFixture(false)
  assert.equal(nodes(pending.tree(), node => node.props.role === 'status').length, 0)
  assert.equal(nodes(pending.tree(), node => node.type === 'img').length, 0, 'no recovery art during loading/ready render')
  assert.equal(nodes(pending.tree(), node => node.type === 'canvas')[0].props.style.visibility, 'visible')
})

function keyTarget(tag, props = {}, parent = null) {
  return {tag, props, parent, closest(selector) {
    assert.equal(selector, 'button[data-selector-recovery]')
    for (let node = this; node; node = node.parent)
      if (node.tag === 'button' && node.props['data-selector-recovery'] !== undefined) return node
    return null
  }}
}
function captureSelectorKey(fixture, type, key, target, extra = {}) {
  const calls = {prevented: false, stopped: false}
  fixture.tree.props[type]({key, target, currentTarget: fixture.tree,
    repeat: false, ctrlKey: false, altKey: false, metaKey: false, shiftKey: false,
    preventDefault() {calls.prevented = true}, stopPropagation() {calls.stopped = true}, ...extra})
  return calls
}
const nativeKeyboardFixture = () => selectorFixture([], {
  nativeSelection: {selected: 1, available: [1, 2], progressionMission: 1},
})

for (const key of ['Enter', ' ']) for (const nested of [false, true]) {
  test(`native selector preserves focused Retry ${JSON.stringify(key)} activation (nested=${nested})`, () => {
    const f = nativeKeyboardFixture(), recovery = sceneRecoveryFixture()
    const button = keyTarget('button', recovery.button.props)
    const target = nested ? keyTarget('span', {}, keyTarget('svg', {}, button)) : button
    for (const repeat of [false, true]) {
      assert.deepEqual(captureSelectorKey(f, 'onKeyDownCapture', key, target, {repeat}),
        {prevented: false, stopped: false}, 'capture must not cancel the recovery button default')
      assert.deepEqual(captureSelectorKey(f, 'onKeyUpCapture', key, target),
        {prevented: false, stopped: false}, 'Space keyup must still reach the recovery button')
      assert.deepEqual(f.launches, [], 'fresh or held recovery input never starts a mission')
    }
    recovery.button.props.onClick() // Supplied ordinary button activation after uncancelled input.
    assert.equal(recovery.generation, 1, 'actual Retry callback requests a new scene generation')
    assert.deepEqual(f.launches, [])
  })
}

for (const owner of ['selector', 'panel', 'start', 'nested-start', 'non-button-marker']) {
  test(`native selector still owns Enter/Space from ${owner}`, () => {
    const f = nativeKeyboardFixture()
    const target = owner === 'selector' ? keyTarget('section')
      : owner === 'panel' ? keyTarget('button', f.props('Panel Mission 2'))
        : owner === 'start' ? keyTarget('button', f.props('Start Mission 1'))
          : owner === 'nested-start' ? keyTarget('span', {}, keyTarget('button', f.props('Start Mission 1')))
            : keyTarget('span', {'data-selector-recovery': 'true'})
    assert.deepEqual(captureSelectorKey(f, 'onKeyDownCapture', ' ', target), {prevented: true, stopped: true})
    assert.deepEqual(captureSelectorKey(f, 'onKeyUpCapture', ' ', target), {prevented: true, stopped: false})
    assert.deepEqual(f.launches, [], 'native Space remains ignored, not a button click')
    captureSelectorKey(f, 'onKeyDownCapture', 'Enter', target, {repeat: true})
    assert.deepEqual(f.launches, [], 'held Enter cannot start')
    assert.deepEqual(captureSelectorKey(f, 'onKeyDownCapture', 'Enter', target), {prevented: true, stopped: true})
    assert.deepEqual(captureSelectorKey(f, 'onKeyUpCapture', 'Enter', target), {prevented: true, stopped: false})
    assert.deepEqual(f.launches, [1], 'Enter starts the selected mission, not the focused panel world')
    captureSelectorKey(f, 'onKeyDownCapture', 'Enter', target)
    assert.deepEqual(f.launches, [1], 'launch latch still prevents duplicate starts')
  })
}

test('recovery exemption does not change non-native controls or modified native keydown', () => {
  const f = nativeKeyboardFixture(), target = keyTarget('button', f.props('Start Mission 1'))
  for (const modifier of ['ctrlKey', 'altKey', 'metaKey', 'shiftKey']) {
    assert.deepEqual(captureSelectorKey(f, 'onKeyDownCapture', 'Enter', target, {[modifier]: true}),
      {prevented: false, stopped: false})
    assert.deepEqual(f.launches, [])
  }
  const opening = selectorFixture([])
  for (const key of ['Enter', ' ']) for (const type of ['onKeyDownCapture', 'onKeyUpCapture'])
    assert.deepEqual(captureSelectorKey(opening, type, key, keyTarget('section')),
      {prevented: false, stopped: false})
  assert.deepEqual(opening.launches, [])
})
