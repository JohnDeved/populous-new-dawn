import './help-surface-loader.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { fixture } from './help-composition-fixture.mjs'
const { BrowserHelpArticleSurface } = await import('../app/help-browser-article-surface.tsx')

test('production React composition has one scale wrapper, full-frame preview slot and original navigation', async t => {
  const f = fixture(t, { width: 913, height: 701, scale: 1.3 }), owner = f.create()
  await owner.present({ topic: 1051, scrollPosition: 0,
    discovery: { status: 'provided', value: { spellBits: 0, buildingBits: 0,
      stock: [], levelFlags: 0, spellDefinitionByte: [] } },
    controls: { counter: 4, leftDown: false, leftUp: false },
    animation: { counter: 0, phase: { counter: 0, frame: 0 } },
    hoverPoint: null, vehiclePreview: 'disabled' })
  assert.equal(owner.getSnapshot().status, 'presented')
  const forbidden = () => { throw Error('SSR must not invoke input callbacks') }
  const render = () => renderToStaticMarkup(React.createElement(BrowserHelpArticleSurface,
    { owner, onNavigate: forbidden, onPosition: forbidden, nativeY: forbidden, onFailure: forbidden }))
  const html = render()
  assert.equal((html.match(/transform:scale\(1.3\)/g) ?? []).length, 1)
  assert.match(html, /data-native-help-article="1051"/)
  assert.match(html, /data-help-full-frame-preview="" style="position:absolute;left:0;top:0;width:702px;height:539px;pointer-events:none"/)
  assert.deepEqual([...html.matchAll(/data-help-navigation="([^"]+)"/g)].map(match => match[1]),
    ['back', 'forward', 'home', 'close'])
  assert.ok(html.includes('/original/help/font-10.png'))
  assert.ok(html.includes('/original/campaign-popup-tiles.png'))
  assert.doesNotMatch(html, /requestAnimationFrame|display:none/)
  owner.invalidate('test-host-hidden')
  assert.equal(render(), '')
  owner.dispose()
  assert.equal(render(), '')
})

test('actual production attachment effect reports placement/append failure and preserves original error identity', async t => {
  const { hookBoundary } = await import('./help-surface-hooks.mjs')
  const { BrowserHelpArticleSurface: EffectSurface } = await import('../app/help-browser-article-surface.tsx?mock-hooks')
  for (const kind of ['placement', 'append']) await t.test(kind, async t => {
    const f = fixture(t), owner = f.create()
    const state = await owner.present({ topic: 1051, scrollPosition: 0,
      discovery: { status: 'provided', value: { spellBits: 0, buildingBits: 0,
        stock: [], levelFlags: 0, spellDefinitionByte: [] } },
      controls: { counter: 4, leftDown: false, leftUp: false },
      animation: { counter: 0, phase: { counter: 0, frame: 0 } },
      hoverPoint: null, vehiclePreview: 'disabled' })
    assert.equal(state.status, 'presented')
    const error = new Error('original append error'), failures = []
    let appendCalls = 0
    const slot = { isConnected: true, ownerDocument: f.shell.ownerDocument,
      getBoundingClientRect: () => state.snapshot.frame.shell,
      append() { appendCalls++; throw error } }
    const surface = { isConnected: true, ownerDocument: f.shell.ownerDocument,
      parentElement: kind === 'placement' ? {} : f.shell,
      contains: node => node === slot, getBoundingClientRect: () => state.snapshot.frame.shell }
    hookBoundary.refs = []; hookBoundary.effects = []
    EffectSurface({ owner, nativeY: () => 0, onNavigate() {}, onPosition() {},
      onFailure: failure => failures.push(failure) })
    hookBoundary.refs[0].current = surface
    hookBoundary.refs[1].current = slot
    const unmount = hookBoundary.effects[0]()
    owner.subscribe(() => {
      if (owner.getSnapshot().status === 'unavailable') owner.dispose()
    })
    hookBoundary.effects[1]()
    assert.equal(failures.length, 1)
    if (kind === 'append') assert.equal(failures[0], error)
    else assert.equal(failures[0].message, 'help-article-placement-mismatch')
    assert.equal(appendCalls, kind === 'placement' ? 0 : 1)
    assert.equal(owner.getSnapshot().reason, 'help-article-disposed')
    unmount(); await Promise.resolve()
    hookBoundary.refs = []; hookBoundary.effects = []
  })
})
