import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import hud from '../app/original-hud.json' with { type: 'json' }
import { pauseStatusLayout } from '../app/pause-status-layout.ts'
import { createWorldState } from '../app/world-state.ts'
import { createWorld, guardShaman } from '../app/model.ts'
import { missionNumbers, tutorialLevel } from '../app/mission-data.ts'
import { evaluatePage, pageNode, pageSource } from './support/follower-nearby-page.mjs'

test('pause status uses original raw glyphs and total-screen font threshold', () => {
  for (const [width, height, font] of [[640, 480, 3], [639, 480, 4], [1024, 300, 3]]) {
    const layout = pauseStatusLayout(width, height)
    assert.equal(layout.font, font)
    assert.equal(layout.height, hud.rects[`f00t${font}-33`].h)
    assert.deepEqual(layout.glyphs, [...'Paused'].map(c => hud.rects[`f00t${font}-${c.charCodeAt(0) - 32}`]))
    assert.ok(layout.glyphs.every(glyph => glyph.w > 0 && glyph.h > 0))
  }
})

test('new missions do not manufacture a coaching banner, including Tutorial', () => {
  for (const mission of new Set([...missionNumbers, tutorialLevel])) {
    const world = createWorldState(mission)
    assert.equal(world.message, '', `mission ${mission}`)
    assert.equal(world.messageUntil, 0, `mission ${mission}`)
    assert.ok(world.messages, 'authored message state remains available')
    assert.equal(world.paused, false)
  }
})

test('actual page pause status respects readiness, modal and play guards', () => {
  const owner = pageNode(node => ts.isJsxExpression(node) && node.expression?.getText(pageSource).includes('<OriginalPauseStatus />'))
  const defaults = {
    ready: true, startup: 'playing', menu: false, selectorOpen: false, cheatsOpen: false,
    world: { paused: true, status: 'playing' }, OriginalPauseStatus: 'OriginalPauseStatus',
  }
  const render = changes => evaluatePage(owner.expression.getText(pageSource), { ...defaults, ...changes })
  assert.equal(render({}).type, 'OriginalPauseStatus')
  for (const changes of [
    { ready: false }, { startup: 'loading' }, { menu: true }, { selectorOpen: true },
    { cheatsOpen: true }, { world: { paused: false, status: 'playing' } },
    { world: { paused: true, status: 'victory' } },
  ]) assert.equal(render(changes), false)
})

test('existing public Resume action remains connected to world pause state', () => {
  const owner = pageNode(node => ts.isJsxElement(node) && node.openingElement.tagName.getText(pageSource) === 'button' && node.openingElement.attributes.properties.some(p => p.name?.getText(pageSource) === 'aria-label' && p.initializer?.getText(pageSource).includes("'Resume game'")))
  const world = { paused: true }
  const button = evaluatePage(owner.getText(pageSource), { world, store: { change: action => action(world) } })
  assert.equal(button.props['aria-label'], 'Resume game')
  button.props.onClick()
  assert.equal(world.paused, false)
  button.props.onClick()
  assert.equal(world.paused, true)
})


test('native pause anchors to the full game shell, not the compact feedback grid', () => {
  const status = pageNode(node => ts.isJsxExpression(node) && node.expression?.getText(pageSource).includes('<OriginalPauseStatus />'))
  const parent = status.parent
  assert.ok(ts.isJsxElement(parent))
  assert.equal(parent.openingElement.tagName.getText(pageSource), 'main')
  assert.ok(parent.openingElement.attributes.properties.some(attribute =>
    attribute.name?.getText(pageSource) === 'className' && attribute.initializer?.text === 'game-shell'))
  const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8')
  assert.match(css, /\.game-status\{position:absolute;right:8px;bottom:var\(--status-bottom,8px\);/,
    'the positioned compact F8/campaign/feedback wrapper remains covered, not removed to pass')
  assert.match(css, /--status-bottom:calc\(var\(--pause-status-height,19px\) \+ 8px\)/)
  assert.match(css, /bottom:var\(--status-bottom,12px\)/)
  const statusCss = readFileSync(new URL('../app/original-pause-status.module.css', import.meta.url), 'utf8')
  assert.match(statusCss, /position: absolute;/)
  assert.match(statusCss, /right: 2px;/)
  assert.match(statusCss, /bottom: 0;/)
})


for (const mission of [1, 2]) {
  test(`ordinary Mission ${mission} default Shaman-selection G feedback does not manufacture follower orders`, () => {
    const world = createWorld(mission)
    world.paused = true
    const shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman' && !unit.ghost)
    assert.ok(shaman)
    assert.deepEqual(world.selected, [shaman.id], 'Use actual default selection, without clearing or replacing it')
    assert.equal(world.units.some(unit => unit.team === 'blue' && unit.native?.state === 10 && unit.native.commandStatus === 30), false)
    const before = structuredClone(world)
    guardShaman(world)
    assert.equal(world.message, 'Your followers stop guarding your shaman.')
    assert.equal(world.messageUntil, world.time + 9)
    assert.deepEqual({ ...world, message: before.message, messageUntil: before.messageUntil }, before,
      'only the actual transient feedback record changes, including unchanged default selection')
  })
}
