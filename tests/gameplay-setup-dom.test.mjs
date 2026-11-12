import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { readFileSync } from 'node:fs'
import { worldCanvasFocusState, worldRendererSelector } from '../scripts/native-ui-evidence/setup-v2-proposal/browser-world-input.mjs'

function witness(change = {}) {
  const canvas = { isConnected: true }, world = {}
  const scene = { renderer: { domElement: canvas }, world }
  const context = { canvas, window: { testSceneRef: { current: scene }, testStore: { getWorld: () => world } },
    document: { activeElement: canvas, querySelector: () => null } }
  change.apply?.(context, scene, world)
  return JSON.parse(JSON.stringify(vm.runInNewContext('(' + worldCanvasFocusState.toString() + ')(canvas)', context)))
}
test('current connected focused renderer canvas is observed, not focused by witness', () => {
  assert.equal(witness().ready, true)
})
for (const [name, apply] of [
  ['outside focus', c => { c.document.activeElement = {} }],
  ['disconnected canvas', c => { c.canvas.isConnected = false }],
  ['replaced renderer', (c, scene) => { scene.renderer.domElement = {} }],
  ['replaced World', (c, scene) => { scene.world = {} }],
  ['loading overlay', c => { c.document.querySelector = () => ({}) }],
]) test('focus witness rejects ' + name, () => assert.equal(witness({ apply }).ready, false))
test('current-page popup uses retained structural body and canvas ownership checks', () => {
  const source = readFileSync(new URL('../scripts/native-ui-evidence/setup-v2-proposal/browser-world-input.mjs', import.meta.url), 'utf8')
  assert.ok(source.includes("detail.locator(':scope > div')"))
  assert.ok(source.includes("'count-retained-body'") && source.includes("'verify-retained-body-count'"))
  assert.equal(source.includes('[data-native-campaign-panel]'), false)
  assert.equal(source.includes("page.locator('.world-viewport').focus"), false)
  assert.ok(source.includes('canvas.evaluate(worldCanvasFocusState)'))
})

test('renderer selector excludes the nested hidden tooltip canvas', () => {
  // Supplied DOM-shaped locator boundary, not a real browser selector engine.
  const viewport = { className: 'world-viewport' }
  const tooltip = { parentElement: viewport, hidden: true }
  const renderer = { tagName: 'CANVAS', className: 'active battlefield', parentElement: viewport }
  const tooltipCanvas = { tagName: 'CANVAS', className: '', parentElement: tooltip }
  const canvases = [renderer, tooltipCanvas]
  const page = { locator(selector) {
    assert.equal(selector, '.world-viewport > canvas.battlefield')
    const matches = canvases.filter(node => node.tagName === 'CANVAS' &&
      node.className.split(/\s+/).includes('battlefield') && node.parentElement === viewport)
    return { count: () => matches.length, selected: matches }
  } }
  assert.equal(canvases.length, 2)
  assert.equal(tooltip.hidden, true)
  assert.equal(page.locator(worldRendererSelector).count(), 1)
  assert.equal(page.locator(worldRendererSelector).selected[0], renderer)
  const source = readFileSync(new URL('../scripts/native-ui-evidence/setup-v2-proposal/browser-world-input.mjs', import.meta.url), 'utf8')
  assert.ok(source.includes('page.locator(worldRendererSelector)'))
  assert.equal(source.includes("page.locator('.world-viewport canvas')"), false)
})
