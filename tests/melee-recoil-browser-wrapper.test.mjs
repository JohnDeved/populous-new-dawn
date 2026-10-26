import assert from 'node:assert/strict'
import test from 'node:test'
import { closeUnusedLocalPreflight } from '../scripts/tutorial-browser/melee-recoil.mjs'

function fixture() {
  const browser = {}, receipt = {}
  const context = { browser: () => browser }
  let closes = 0
  const page = { context: () => context, close: async () => { closes++ } }
  return { options: { browser, context, page, receipt }, closes: () => closes }
}

test('recoil closes only its supplied unused local preflight page and records completion', async () => {
  const f = fixture()
  await closeUnusedLocalPreflight(f.options)
  assert.equal(f.closes(), 1)
  assert.equal(f.options.receipt.recoilPreflightPageClosed, true)
})
test('static recoil without a preflight page needs no closure', async () => {
  const receipt = {}
  await closeUnusedLocalPreflight({ receipt })
  assert.deepEqual(receipt, {})
})
test('persistent profile is rejected before any preflight mutation', async () => {
  const f = fixture(); f.options.receipt.profile = { id: 'owned' }
  await assert.rejects(closeUnusedLocalPreflight(f.options), /persistent profile/)
  assert.equal(f.closes(), 0)
})
test('foreign preflight context is rejected without closing', async () => {
  const f = fixture(); f.options.context = {}
  await assert.rejects(closeUnusedLocalPreflight(f.options), /supplied context/)
  assert.equal(f.closes(), 0)
})
test('foreign preflight browser is rejected without closing', async () => {
  const f = fixture(); f.options.browser = {}
  await assert.rejects(closeUnusedLocalPreflight(f.options), /supplied browser/)
  assert.equal(f.closes(), 0)
})
test('preflight close failure propagates without a success disclosure', async () => {
  const f = fixture(); f.options.page.close = async () => { throw Error('close failed') }
  await assert.rejects(closeUnusedLocalPreflight(f.options), /close failed/)
  assert.equal(f.options.receipt.recoilPreflightPageClosed, undefined)
})


test('recoil camera uses exactly two declared public right drags', async () => {
  const { rotateRecoilCamera } = await import('../scripts/tutorial-browser/melee-attack.mjs')
  const calls = []
  const mouse = Object.fromEntries(['move', 'down', 'up'].map(name =>
    [name, async (...args) => { calls.push([name, ...args]) }]))
  await rotateRecoilCamera({ mouse })
  assert.deepEqual(calls, Array.from({ length: 2 }, () => [
    ['move', 200, 200], ['down', { button: 'right' }], ['move', 712, 200], ['up', { button: 'right' }],
  ]).flat())
})
test('recoil camera releases its owned button when movement fails', async () => {
  const { rotateRecoilCamera } = await import('../scripts/tutorial-browser/melee-attack.mjs')
  let moves = 0, ups = 0
  await assert.rejects(rotateRecoilCamera({ mouse: {
    move: async () => { if (++moves === 2) throw Error('move failed') },
    down: async () => {}, up: async () => { ups++ },
  } }), /move failed/)
  assert.equal(ups, 1)
})
