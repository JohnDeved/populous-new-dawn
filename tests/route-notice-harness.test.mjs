import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { advanceRouteClock } from '../scripts/local-render/route-notice-modal.mjs'
import { tooltipCallerFixture } from './support/tooltip-scene.mjs'

async function fixture(t) {
  const f = await tooltipCallerFixture(t), { scene, world, api, hut } = f
  scene.view.painter.render = () => {} // supplied GPU leaf, not a controller stub
  const native = api.nativePosition(world, hut)
  world.lastOrderCell = ((native.x >>> 8) & 255) | (native.y & 0xff00)
  api.requestTutorial(world, 0x200000, 603)
  const saved = new Map(['window', 'cancelAnimationFrame'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]))
  Object.defineProperty(globalThis, 'window', { configurable: true, writable: true,
    value: { routeNoticeFixture: { scene, world, now: scene.previous } } })
  Object.defineProperty(globalThis, 'cancelAnimationFrame', { configurable: true, writable: true, value: () => {} })
  t.after(() => {
    for (const [key, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else delete globalThis[key]
    }
  })
  return f
}

for (const paused of [false, true]) test(`browser harness callback admits exactly 72 production visits, paused=${paused}`, async t => {
  const { scene, world } = await fixture(t)
  world.paused = paused // controlled unit fixture, browser uses the public pause button
  const turn = world.turn, time = world.time, notice = world.routeNotice
  assert.equal(advanceRouteClock({ count: 1 }).visits, 1)
  assert.equal(scene.tooltip.remaining, 71)
  assert.equal(advanceRouteClock({ count: 23 }).visits, 23)
  assert.equal(scene.tooltip.remaining, 48)
  for (const label of ['menu', 'selector', 'reopened menu', 'F9']) {
    scene.setModalSuspended(true) // actual modal boundary; browser uses public controls
    assert.equal(advanceRouteClock({ count: 96, mode: 'frames' }).visits, 0, label)
    assert.equal(scene.tooltip.remaining, 48); assert.equal(world.routeNotice, notice)
    scene.setModalSuspended(false)
    assert.equal(advanceRouteClock({ count: 0 }).visits, 0)
  }
  assert.equal(advanceRouteClock({ count: 47 }).visits, 47)
  assert.equal(scene.tooltip.remaining, 1); assert.equal(world.routeNotice, notice)
  assert.equal(advanceRouteClock({ count: 1 }).visits, 1)
  assert.equal(scene.tooltip.remaining, 0); assert.equal(world.routeNotice, null)
  if (paused) { assert.equal(world.turn, turn); assert.equal(world.time, time) }
})

test('retained stale Scene callback cannot visit or mutate a replacement publication', async t => {
  const { scene, world } = await fixture(t)
  advanceRouteClock({ count: 1 })
  const oldNotice = world.routeNotice, oldRemaining = scene.tooltip.remaining
  window.staleRouteNoticeFixture = window.routeNoticeFixture
  const replacement = structuredClone(world)
  replacement.routeNotice = { ...oldNotice } // same serial, different owner/world
  window.routeNoticeFixture = { world: replacement }
  scene.disposed = true // controlled owner disposal; browser performs public restart
  const before = structuredClone(replacement)
  assert.deepEqual(advanceRouteClock({ count: 96, mode: 'frames', stale: true }), { frames: 96, visits: 0 })
  assert.equal(scene.tooltip.remaining, oldRemaining); assert.equal(world.routeNotice, oldNotice)
  assert.deepEqual(replacement, before)
})

test('browser fixture ownership requests are bounded and never stamp countdowns', () => {
  for (const count of [-1, 1.5, NaN, Infinity, 1001]) assert.throws(() => advanceRouteClock({ count }))
  assert.throws(() => advanceRouteClock({ count: 1, mode: 'seconds' }))
  const modal = readFileSync(new URL('../scripts/local-render/route-notice-modal.mjs', import.meta.url), 'utf8'),
    replacement = readFileSync(new URL('../scripts/local-render/route-notice-replacement.mjs', import.meta.url), 'utf8')
  for (const source of [modal, replacement]) {
    assert.doesNotMatch(source, /getAnimations|onAnimationEnd|\.skip-introduction|locator\('\.route-notice'\)/)
    assert.doesNotMatch(source, /\.remaining\s*=|\.flybyTime\s*=|\.lastOrderCell\s*=|\.paused\s*=/)
  }
  assert.match(advanceRouteClock.toString(), /scene\.animate\(fixture\.now\)/)
  assert.doesNotMatch(advanceRouteClock.toString(), /updateTooltipController|stepTooltip/)
  assert.match(modal, /skipIntroductionWithSpace\(page, \{ timeout: 45000 \}\)/)
  assert.match(modal, /keyboard\.press\('h'\)/); assert.match(modal, /page\.mouse\.click/)
  assert.match(modal, /details\[open\]\[data-message-serial\] > summary/)
  assert.match(replacement, /button\('Restart Level'\)\.click\(\)/)
  assert.match(replacement, /stale: true/)
})
