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
