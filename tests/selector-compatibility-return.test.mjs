import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import * as opening from '../app/world-selector-data.ts'

// Selected actual component setup, layout effect and switch callbacks. Hook
// commits, DOM removal/focus and artwork/selection records are supplied.
const source = readFileSync(new URL('../app/world-selector.tsx', import.meta.url), 'utf8')
const start = source.indexOf('export function WorldSelector(')
const end = source.indexOf('\n  return (\n    <section', start)
assert.equal(source.split('export function WorldSelector(').length, 2)
assert.ok(start >= 0 && end > start)
assert.ok(source.includes('autoFocus={mission === selected}'))
function switchBody(label) {
  const text = `\n              ${label}\n`
  assert.equal(source.split(text).length, 2)
  const finish = source.indexOf(text)
  const at = source.lastIndexOf('onClick={() => {', finish)
  assert.ok(at > end)
  return source.slice(at + 'onClick={() => {'.length, finish).split('\n              }}')[0]
}
const campaign = switchBody('Campaign worlds'), direct = switchBody('All missions')
const selected = stripTypeScriptTypes(source.slice(start, end).replace('export function', 'function') + `
  return { container, directHeading, selected, available, canStart, start, navigate,
    select: setSelected, open: () => setCompatibility(value => !value),
    campaign: () => {${campaign}}, direct: () => {${direct}} }
}
`) + '\nreturn WorldSelector\n'

function fixture({ completed = [], native = false } = {}) {
  const refs = [], states = [], focusCalls = [], launches = [], nativeSelections = []
  const glyphs = new Map(), body = { name: 'body' }, outside = { name: 'outside' }
  const campaignButton = { name: 'campaign switch' }, directButton = { name: 'direct switch' }
  let active = body, owner, refAt = 0, stateAt = 0, effect, dependencies, previous
  const heading = { name: 'direct heading', focus(options) { active = heading; focusCalls.push({ target: heading, options }) } }
  const container = { querySelector(query) {
    const match = query.match(/^\[data-selector-mission="(\d+)"\]$/)
    assert.ok(match)
    return glyphs.get(Number(match[1]))
  } }
  const nativeSelection = native ? { selected: 1, available: [1, 2], progressionMission: 1,
    onSelect(mission) { nativeSelections.push(mission); nativeSelection.selected = mission } } : undefined
  const values = { ...opening, nativeSelectorMissions: [1, 2, 3],
    selectorWorld: mission => ({ mission }), selectorArt: () => ({ panel: {}, cursor: '' }),
    useId: () => 'focus',
    useRef: initial => refs[refAt++] ?? (refs[refAt - 1] = { current: initial }),
    useState: initial => {
      const at = stateAt++
      if (!(at in states)) states[at] = typeof initial === 'function' ? initial() : initial
      return [states[at], value => { states[at] = typeof value === 'function' ? value(states[at]) : value }]
    },
    useLayoutEffect: (callback, deps) => { effect = callback; dependencies = deps },
  }
  const Component = new Function(...Object.keys(values), selected)(...Object.values(values))
  function commit() {
    refAt = 0; stateAt = 0
    owner = Component({ missions: [1, 2, 3], completed, hasCheckpoint: false,
      onStart: mission => launches.push(mission), onTutorial() {}, onLoad() {}, nativeSelection })
    owner.container.current = container
    owner.directHeading.current = states[1] ? heading : null
    if (states[1]) glyphs.clear()
    else for (const mission of [1, 2, 3]) {
      if (!glyphs.has(mission)) {
        const glyph = { mission, focus() { active = glyph; focusCalls.push({ target: glyph }) },
          hasAttribute(name) { return name === 'data-selector-mission' } }
        glyphs.set(mission, glyph)
        // Model the existing JSX autoFocus on a newly mounted selected glyph.
        // An already mounted same-view glyph does not receive it again.
        if (mission === owner.selected) active = glyph
      }
    }
    // Removed switches/headings/glyphs lose focus before layout effects run.
    if ((!states[2] && (active === campaignButton || active === directButton)) ||
        (!states[1] && active === heading) ||
        (active.mission && ![...glyphs.values()].includes(active))) active = body
    if (!previous || dependencies.some((value, at) => !Object.is(value, previous[at]))) effect()
    previous = [...dependencies]
  }
  commit()
  return {
    states, focusCalls, launches, glyphs, body, outside, heading, nativeSelections,
    get owner() { return owner }, get active() { return active },
    focus(node) { active = node }, commit,
    open() { owner.open(); commit() },
    campaign() { active = campaignButton; owner.campaign(); commit() },
    direct() { active = directButton; owner.direct(); commit() },
    select(mission) { owner.select(mission); commit() },
    clearFocusCalls() { focusCalls.length = 0 },
  }
}

for (const fromDirect of [false, true]) {
  for (const mission of [1, 2, 3]) {
    test(`Campaign worlds restores inspected ${mission} from ${fromDirect ? 'direct' : 'same'} view once`, () => {
      const f = fixture()
      f.select(mission)
      if (fromDirect) { f.open(); f.direct() }
      f.open()
      const prior = f.glyphs.get(mission)
      f.clearFocusCalls()
      f.campaign()
      const expected = f.glyphs.get(mission)
      assert.equal(f.active, expected)
      assert.equal(f.owner.selected, mission)
      assert.equal(f.owner.available, mission === 1)
      if (!fromDirect) assert.deepEqual(f.focusCalls, [{ target: expected }])
      else assert.ok(f.focusCalls.length <= 1, 'mount autofocus already owns the new glyph')
      if (!fromDirect) assert.equal(expected, prior, 'same-view glyph stays mounted')
      assert.deepEqual(f.launches, [])
      const initialFocusCalls = f.focusCalls.length
      f.focus(f.outside)
      f.select(mission === 1 ? 2 : 1)
      assert.equal(f.active, f.outside, 'consumed intent cannot steal later focus')
      assert.equal(f.focusCalls.length, initialFocusCalls)
      assert.deepEqual(f.launches, [])
    })
  }
}

test('All missions keeps the existing non-action heading focus', () => {
  const f = fixture()
  f.open(); f.direct()
  assert.equal(f.active, f.heading)
  assert.deepEqual(f.focusCalls, [{ target: f.heading, options: { preventScroll: true } }])
  assert.deepEqual(f.launches, [])
})

test('closed and open compatibility rerenders do not invent a Campaign focus request', () => {
  const f = fixture()
  f.focus(f.outside)
  f.select(2)
  f.open()
  f.select(3)
  f.open()
  assert.equal(f.active, f.outside)
  assert.deepEqual(f.focusCalls, [])
})

test('repeated explicit Campaign return consumes one focus request per switch', () => {
  const f = fixture({ completed: [1] })
  for (let index = 1; index <= 3; index++) {
    f.open(); f.campaign()
    assert.equal(f.active, f.glyphs.get(2))
    assert.equal(f.focusCalls.length, index)
  }
  assert.deepEqual(f.launches, [])
})

test('native selection changes do not invoke compatibility focus', () => {
  const f = fixture({ native: true })
  f.focus(f.outside)
  f.select(2)
  assert.equal(f.owner.selected, 2)
  assert.equal(f.active, f.outside)
  assert.deepEqual(f.nativeSelections, [2])
  assert.deepEqual(f.focusCalls, [])
  f.owner.start(); f.owner.start()
  assert.deepEqual(f.launches, [2], 'native launch remains one-shot')
})

test('returned glyph keeps actual arrow navigation without launching', () => {
  const f = fixture({ completed: [1] })
  f.select(3)
  f.open(); f.campaign()
  assert.equal(f.active, f.glyphs.get(3))
  let prevented = 0
  f.owner.navigate({ key: 'ArrowRight', currentTarget: f.active, preventDefault() { prevented++ } })
  f.commit()
  assert.equal(prevented, 1)
  assert.equal(f.owner.selected, 1)
  assert.equal(f.active, f.glyphs.get(1))
  assert.deepEqual(f.launches, [])
})
