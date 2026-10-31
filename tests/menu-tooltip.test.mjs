import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { menuTooltipPosition } from '../app/menu-tooltip-layout.ts'
import provenance from '../public/original/world-selector/text/provenance.json' with { type: 'json' }
const source = readFileSync(new URL('../app/menu-tooltip.tsx', import.meta.url), 'utf8')
const main = readFileSync(new URL('../app/original-main-menu.tsx', import.meta.url), 'utf8')
const selector = readFileSync(new URL('../app/world-selector-text.tsx', import.meta.url), 'utf8')

// Exercise the production hook with deterministic React-effect and DOM-event
// boundaries. This is lifecycle logic evidence, not a rendered browser claim.
function fixture() {
  const states = [], effects = [], timers = new Map()
  let cursor = 0, now = 0, timerId = 0
  class Target {
    listeners = new Map()
    addEventListener(name, fn) { if (!this.listeners.has(name)) this.listeners.set(name, new Set()); this.listeners.get(name).add(fn) }
    removeEventListener(name, fn) { this.listeners.get(name)?.delete(fn) }
    emit(name, detail = {}) { for (const fn of this.listeners.get(name) ?? []) fn({target: this, ...detail}) }
  }
  class Element extends Target {
    isConnected = true
    constructor(value) { super(); this.value = value }
    closest() { return this.value ? this : null }
    contains(owner) { return owner.isConnected }
    getAttribute() { return this.value }
    getBoundingClientRect() { return { left: 100, top: 200, width: 100, height: 20 } }
  }
  const root = new Element(), win = new Target(), doc = new Target()
  function useState(initial) { const i = cursor++; if (!(i in states)) states[i] = initial; return [states[i], next => { states[i] = typeof next === 'function' ? next(states[i]) : next }] }
  function useEffect(fn, deps) { const i = cursor++; const previous = effects[i]; if (!previous || deps.some((v, n) => !Object.is(v, previous.deps[n]))) { previous?.cleanup?.(); effects[i] = { deps, cleanup: fn() } } }
  const hookSource = source.slice(source.indexOf('export function useMenuTooltip'), source.indexOf('const glyphs'))
  const js = ts.transpileModule(hookSource.replace('export function', 'function'), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText
  const hook = Function('useState', 'useEffect', 'Element', 'window', 'document', 'performance', 'setTimeout', 'clearTimeout', js + '\nreturn useMenuTooltip')(
    useState, useEffect, Element, win, doc, { now: () => now },
    (fn, ms) => { timers.set(++timerId, { fn, due: now + ms }); return timerId }, id => timers.delete(id))
  const container = { current: root }
  function render() { cursor = 0; return hook(container, 'data-menu-tooltip') }
  render()
  return { root, win, doc, Element, render, timers,
    advance(ms) { now += ms; for (const [id, timer] of timers) if (timer.due <= now) { timers.delete(id); timer.fn() } },
    unmount() { effects.forEach(effect => effect?.cleanup?.()) },
  }
}

test('shared selector geometry stays inside native frame at viewport edges, widescreen and DPR', () => {
  for (const [vw, vh] of [[640,480],[1920,1080],[3440,1440],[3840,2160]]) for (const dpr of [1,2,3]) {
    const scale = Math.min(vw/640, vh/480)
    for (const [x,y] of [[0,0],[640,480],[-100,-100],[900,600],[320,240]]) {
      const pos = menuTooltipPosition(x,y,298,10)
      assert.ok(pos.left >= 0 && pos.left + 298 <= 640)
      assert.ok(pos.top >= 0 && pos.top + 10 <= 480)
      assert.ok((pos.left + 298)*scale*dpr <= vw*dpr)
    }
  }
  assert.deepEqual(menuTooltipPosition(320,240,109,10), {left:266,top:213})
})

test('native tooltip font covers every main-menu reason without widening the frame', () => {
  const reasons = [...main.slice(main.indexOf('  const checkpointDescriptions = {'), main.indexOf('  return (\n    <dialog')).replace(/  const checkpointRecoveryNotices = \{[\s\S]*?\n  \}/, '').matchAll(/(?:unavailable: |\? |: )'([^'\n]*(?:available|restored|storage|checkpoint)[^'\n]*)'/gi)].map(match => match[1])
  assert.ok(reasons.length >= 7)
  for (const reason of reasons) {
    const glyphs = [...reason].map(c => provenance.fonts.tooltip.glyphs[c.charCodeAt(0)-32])
    assert.ok(glyphs.every(Boolean))
    assert.ok(glyphs.reduce((sum, glyph) => sum + glyph.advance,0) < 620)
  }
  assert.match(selector,/useMenuTooltip/)
  assert.match(selector,/menuTooltipPosition/)
  assert.match(main,/aria-description=\{row.unavailable\}/)
  assert.match(main,/if \(row.unavailable\) return/)
  assert.doesNotMatch(main,/styles.reason|title=\{row.unavailable\}/)
  assert.match(main,/key=\{`\$\{hasCheckpoint\}:\$\{checkpointReadStatus\}`\}/)
  assert.match(main,/Browser checkpoint recovery/)
  assert.match(main,/frontend-quit-guidance/)
})

test('hover waits strictly over 500ms; same owner preserves epoch, another owner restarts it', () => {
  const f=fixture(), a=new f.Element('Unavailable'), b=new f.Element('Unavailable')
  f.root.emit('pointermove',{target:a,clientX:20,clientY:30}); f.render()
  f.advance(500); assert.equal(f.render(),undefined)
  f.root.emit('pointermove',{target:a,clientX:21,clientY:31}); f.render()
  f.advance(1); assert.equal(f.render().x,21)
  f.root.emit('pointermove',{target:b,clientX:21,clientY:31}); assert.equal(f.render(),undefined)
  f.advance(501); assert.equal(f.render().target,b)
  f.unmount(); assert.equal(f.timers.size,0)
})

test('keyboard tooltip and leave, blur, Escape, scrolling, resize and visibility cleanup', () => {
  for (const [owner,event,detail] of [['root','pointerleave'],['root','pointerdown'],['root','focusout'],['root','keydown',{key:'Escape'}],['win','resize'],['win','scroll'],['win','blur'],['doc','visibilitychange']]) {
    const f=fixture(), a=new f.Element('Unavailable')
    f.root.emit('focusin',{target:a}); f.render(); f.advance(501)
    assert.equal(f.render().x,150)
    f[owner].emit(event,detail); assert.equal(f.render(),undefined)
    f.unmount(); assert.equal(f.timers.size,0)
    for (const target of [f.root,f.win,f.doc]) for (const listeners of target.listeners.values()) assert.equal(listeners.size,0)
  }
})

test('pending dwell cancellation removes the timer before it can reveal a tooltip', () => {
  for (const [owner,event,detail] of [['root','pointerleave'],['root','pointerdown'],['root','focusout'],['root','keydown',{key:'Escape'}],['win','resize'],['win','scroll'],['win','blur'],['doc','visibilitychange']]) {
    const f=fixture(), a=new f.Element('Unavailable')
    f.root.emit('focusin',{target:a}); f.render()
    f.advance(250); assert.equal(f.render(),undefined)
    assert.equal(f.timers.size,1)
    f[owner].emit(event,detail); assert.equal(f.render(),undefined)
    assert.equal(f.timers.size,0, `${event} cancels the pending dwell timer`)
    f.advance(1000); assert.equal(f.render(),undefined)
    f.unmount()
  }
})

test('switching pending owners with identical text requires the new full dwell', () => {
  const f=fixture(), a=new f.Element('Unavailable'), b=new f.Element('Unavailable')
  f.root.emit('pointermove',{target:a,clientX:20,clientY:30}); f.render()
  f.advance(400)
  f.root.emit('pointermove',{target:b,clientX:40,clientY:50}); assert.equal(f.render(),undefined)
  assert.equal(f.timers.size,1, 'old owner timer is replaced, not accumulated')
  f.advance(101); assert.equal(f.render(),undefined, 'old owner deadline cannot reveal new owner')
  f.advance(399); assert.equal(f.render(),undefined)
  f.advance(1); assert.equal(f.render().target,b)
  f.unmount(); assert.equal(f.timers.size,0)
})

test('pending tooltip unmount cancels its timer and removes every listener', () => {
  const f=fixture(), a=new f.Element('Unavailable')
  f.root.emit('focusin',{target:a}); f.render()
  assert.equal(f.timers.size,1)
  f.unmount(); assert.equal(f.timers.size,0)
  for (const target of [f.root,f.win,f.doc]) for (const listeners of target.listeners.values()) assert.equal(listeners.size,0)
  f.advance(1000); assert.equal(f.timers.size,0)
})

test('changed availability and detached owner cannot leave a stale tooltip', () => {
  for (const change of [a=>{a.value=undefined},a=>{a.isConnected=false}]) {
    const f=fixture(), a=new f.Element('Checking browser storage')
    f.root.emit('focusin',{target:a}); f.render(); f.advance(501); assert.ok(f.render())
    change(a); assert.equal(f.render(),undefined); f.unmount()
  }
})

test('visible tooltip typography is settled across late decode success and failure', () => {
  const component = source.slice(source.indexOf('function MenuTooltipText'), source.indexOf('export function MenuTooltip({'))
  const js = ts.transpileModule(component, { compilerOptions: { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React } }).outputText
  const React = { Fragment: 'fragment', createElement: (type, props, ...children) => ({ type, props, children }) }
  function mount(initialReady) {
    let settled
    const useState = value => { if (settled === undefined) settled = value; return [settled] }
    const render = Function('useState', 'React', 'glyphs', 'atlas', js + '\nreturn MenuTooltipText')(useState,React,provenance.fonts.tooltip.glyphs,'atlas')
    return { initial: render({ text: 'Unavailable', ready: initialReady }), render }
  }
  const pending = mount(false)
  assert.deepEqual(pending.initial.children, ['Unavailable'])
  assert.deepEqual(pending.render({ text: 'Unavailable', ready: true }), pending.initial, 'late successful decode cannot swap a visible tooltip')
  assert.deepEqual(pending.render({ text: 'Unavailable', ready: false }), pending.initial, 'failed decode keeps fallback available')
  const nextHover = mount(true)
  assert.equal(nextHover.initial.children[0].length, 'Unavailable'.length)
  assert.ok(nextHover.initial.children[0].every(glyph => glyph.type === 'i'))
  assert.deepEqual(nextHover.render({ text: 'Unavailable', ready: false }), nextHover.initial, 'visible native tooltip remains settled')
  assert.match(source,/MenuTooltipText key=\{state.started\}/, 'new hover owns a fresh typography decision')
})

test('rendered native glyph widths equal advances and longest unavailable reason fits with padding', () => {
  for (const glyph of provenance.fonts.tooltip.glyphs) assert.equal(glyph.width, glyph.advance)
  const rows = main.slice(main.indexOf('  const checkpointDescriptions = {'), main.indexOf('  return (\n    <dialog'))
  const reasons = [...rows.replace(/  const checkpointRecoveryNotices = \{[\s\S]*?\n  \}/, '').matchAll(/(?:unavailable: |\? |: )'([^'\n]*(?:available|restored|storage|checkpoint)[^'\n]*)'/gi)].map(match => match[1])
  const measured = reasons.map(text => ({ text, width: [...text].reduce((sum,c)=>sum+provenance.fonts.tooltip.glyphs[c.charCodeAt(0)-32].width,0) }))
  const longest = measured.sort((a,b)=>b.width-a.width)[0]
  assert.deepEqual(longest, { text:'Checkpoint is incompatible with this development version', width:300 })
  assert.equal(4*(Math.floor(longest.width/4)+3),312)
  assert.ok(312 < 640)
})

test('prepared tooltip rendering never decodes again on category changes or reopen', () => {
  const component = source.slice(source.indexOf('export function MenuTooltip({')).replace('export function','function')
  const js = ts.transpileModule(component, { compilerOptions: { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React } }).outputText
  const React = { createElement: (type, props, ...children) => ({ type, props, children }) }
  const state = { value:'Unavailable', x:320, y:240, started:1 }
  const render = Function('useMenuTooltip','React','glyphs','menuTooltipPosition','styles','MenuTooltipText','Image','useEffect',js+'\nreturn MenuTooltip')(
    ()=>state, React, provenance.fonts.tooltip.glyphs, menuTooltipPosition, {}, 'MenuTooltipText',
    class { constructor() { assert.fail('visible menus must never restart image loading') } },
    ()=>assert.fail('tooltip rendering must not own loading effects'))
  const container={current:{getBoundingClientRect:()=>({left:0,top:0,width:640,height:480})}}
  for (const ready of [true,false,undefined]) for (const visit of ['main','Game','Sound','Graphics','Direct3D','back','reopen']) {
    const result=render({container,ready})
    assert.equal(result.children[0].props.ready, ready ?? false, `${visit} uses settled preparation or explicit fallback`)
  }
})
