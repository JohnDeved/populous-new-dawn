import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { campaignPopupState, prepareWorldInput, pressWorldSpace, setCampaignPopupOpen } from '../scripts/browser-world-input.mjs'
import { beginSpaceOwnership, endSpaceOwnership } from '../scripts/browser-space-ownership.mjs'
import { skipIntroductionWithSpace } from '../scripts/browser-introduction.mjs'
import { skipPauseIntroduction } from '../scripts/local-render/original-pause-checkpoint-recovery.mjs'

function fixture({ intro = false, onFocus, onClose, swallow = false } = {}) {
  const messages = { slots: [{ serial: 7, flags: 0, stringId: 641 }], queue: [{ serial: 8, flags: 2 }] }
  const world = { paused: false, inputMask: intro ? 64 : 0, flyby: { flags: intro ? 21 : 0 }, levelStart: [{ phase: 4 }], messages }
  const details = new Map([['7', true]]), calls = []
  let focus = 'summary', focusCount = 0
  const context = {
    window: { testStore: { getWorld: () => world } },
    document: {
      querySelector: selector => { assert.equal(selector, '.loading-world'); return null },
      querySelectorAll: selector => {
        assert.equal(selector, '.campaign-messages details[open]')
        return [...details].filter(([, open]) => open).map(([serial]) => ({
          getAttribute: name => { assert.equal(name, 'data-message-serial'); return serial },
        }))
      },
    },
  }
  const read = (fn, arg) => runInNewContext(`(${fn.toString()})(arg)`, { ...context, arg })
  const page = {
    evaluate: async (fn, arg) => { if ([beginSpaceOwnership, endSpaceOwnership].includes(fn)) return []; calls.push(fn === campaignPopupState ? 'observe-popups' : 'observe-intro'); return read(fn, arg) },
    waitForFunction: async (fn, arg) => ({ jsonValue: async () => read(fn, arg), dispose: async () => {} }),
    locator(selector) {
      if (selector === '.world-viewport') return { focus: async () => {
        calls.push('focus-world'); focus = 'world'; onFocus?.({ details, count: ++focusCount })
      } }
      if (selector === '.campaign-messages details[open]') return { count: async () => [...details.values()].filter(Boolean).length }
      const serial = /^\.campaign-messages details\[data-message-serial="(\d+)"\]$/.exec(selector)?.[1]
      assert.ok(serial, 'Only the retained serial locator is allowed')
      return {
        count: async () => Number(details.has(serial)),
        getAttribute: async name => { assert.equal(name, 'open'); return details.get(serial) ? '' : null },
        locator(child) {
          if (child === 'summary') return { click: async () => {
            calls.push(`summary:${serial}`); details.set(serial, !details.get(serial)); focus = 'summary'
            if (!details.get(serial)) onClose?.({ details, serial })
          } }
          assert.equal(child, '[data-native-campaign-panel]')
          return { waitFor: async ({ state }) => {
            calls.push(`panel:${state}`); assert.equal(state, details.get(serial) ? 'visible' : 'hidden')
          } }
        },
      }
    },
    keyboard: { press: async key => {
      assert.equal(key, 'Space'); calls.push('Space')
      if (swallow || [...details.values()].some(Boolean)) return
      if (focus === 'summary') { details.set('7', true); return }
      if (world.inputMask) { world.inputMask = 0; world.flyby.flags &= ~1 }
      else world.paused = !world.paused
    } },
  }
  return { page, world, details, calls, get focus() { return focus } }
}

test('public summary collapse waits for hidden body, focuses the world, and preserves notification queue', async () => {
  const f = fixture(), original = structuredClone(f.world.messages)
  assert.deepEqual(await pressWorldSpace(f.page), [{ serial: '7' }])
  assert.deepEqual(f.calls, ['observe-popups', 'summary:7', 'panel:hidden', 'focus-world', 'observe-popups', 'Space'])
  assert.equal(f.world.paused, true)
  assert.deepEqual(f.world.messages, original, 'No acknowledgement or queue deletion is permitted')
  await setCampaignPopupOpen(f.page, '7', true)
  assert.equal(f.details.get('7'), true)
  assert.deepEqual(f.world.messages, original, 'Reopening restores the same retained notification')
})

test('a popup auto-opened during focus is reobserved and collapsed before input', async () => {
  const f = fixture({ onFocus({ details, count }) { if (count === 1) details.set('8', true) } })
  assert.deepEqual(await pressWorldSpace(f.page), [{ serial: '7' }, { serial: '8' }])
  assert.equal(f.calls.filter(call => call === 'Space').length, 1)
  assert.equal(f.world.paused, true)
  assert.ok(f.calls.lastIndexOf('focus-world') > f.calls.indexOf('summary:8'))
})

test('a different notification auto-opened during the public close is collapsed, not rejected globally', async () => {
  const f = fixture({ onClose({ details, serial }) { if (serial === '7') details.set('8', true) } })
  assert.deepEqual(await pressWorldSpace(f.page), [{ serial: '7' }, { serial: '8' }])
  assert.equal(f.world.paused, true)
  assert.equal(f.calls.filter(call => call === 'Space').length, 1)
  assert.ok(f.calls.indexOf('summary:8') > f.calls.indexOf('summary:7'))
})

test('repeated close-time auto-open cannot reset the original preparation deadline', async t => {
  let now = 0
  t.mock.method(performance, 'now', () => now)
  const f = fixture({ onClose({ details, serial }) { now += 100; details.set(String(Number(serial) + 1), true) } })
  await assert.rejects(pressWorldSpace(f.page, { timeout: 500 }), /timed out/)
  assert.equal(now, 500)
  assert.equal(f.calls.includes('Space'), false)
  assert.equal(f.world.paused, false)
})

test('already closed notifications still require viewport focus, without a summary click', async () => {
  const f = fixture(); f.details.set('7', false)
  assert.deepEqual(await prepareWorldInput(f.page), [])
  assert.equal(f.focus, 'world')
  assert.deepEqual(f.calls, ['observe-popups', 'focus-world', 'observe-popups'])
})

for (const [name, skip] of [['shared', skipIntroductionWithSpace], ['recovery', skipPauseIntroduction]]) {
  test(`${name} introduction skips through public popup collapse and keeps pause and queue`, async () => {
    const f = fixture({ intro: true }), original = structuredClone(f.world.messages)
    await skip(f.page)
    assert.equal(f.world.inputMask, 0)
    assert.equal(f.world.paused, false)
    assert.deepEqual(f.world.messages, original)
    assert.equal(f.calls.filter(call => call === 'Space').length, 1)
    assert.ok(f.calls.indexOf('focus-world') < f.calls.indexOf('Space'))
  })
  test(`${name} introduction rejects input swallowed after preparation, never compensates`, async () => {
    const f = fixture({ intro: true, swallow: true })
    await assert.rejects(skip(f.page), /Space was not accepted/)
    assert.equal(f.world.inputMask, 64)
    assert.equal(f.calls.filter(call => call === 'Space').length, 1)
    assert.equal(f.world.paused, false)
  })
}

test('popup work shares the introduction deadline and cannot send late Space after stalled focus', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const f = fixture({ intro: true }), locator = f.page.locator
  let release, entered
  const blocked = new Promise(resolve => { release = resolve }), focusing = new Promise(resolve => { entered = resolve })
  f.page.locator = selector => selector === '.world-viewport' ? { focus: async () => { entered(); await blocked } } : locator(selector)
  const rejected = assert.rejects(skipIntroductionWithSpace(f.page, { timeout: 500 }), /timed out/)
  await focusing
  t.mock.timers.tick(500)
  await rejected
  release()
  for (let i = 0; i < 12; i++) await Promise.resolve()
  assert.equal(f.calls.includes('Space'), false)
})

test('failed public close leaves the episode failed, without input or a fallback acknowledgement', async () => {
  const f = fixture(), failure = Error('summary click failed'), locator = f.page.locator
  f.page.locator = selector => {
    const result = locator(selector)
    if (selector.includes('data-message-serial')) result.locator = () => ({ click: async () => { throw failure } })
    return result
  }
  await assert.rejects(pressWorldSpace(f.page), error => error === failure)
  assert.equal(f.calls.includes('Space'), false)
  assert.equal(f.details.get('7'), true)
})

test('invalid input budgets fail before observations, clicks, focus or keyboard delivery', async () => {
  for (const timeout of [0, -1, NaN, Infinity]) {
    const f = fixture()
    await assert.rejects(pressWorldSpace(f.page, { timeout }), RangeError)
    assert.deepEqual(f.calls, [])
  }
})

test('harness integration preserves strict state oracles and prepares each gameplay phase outside measurements', () => {
  const read = file => readFileSync(new URL(`../scripts/${file}`, import.meta.url), 'utf8')
  for (const file of ['tutorial-browser/selector-inspection.mjs', 'tutorial-browser/spell-test-menu.mjs',
    'tutorial-browser/shaman-casting.mjs', 'local-render/campaign-profile-recovery.mjs']) {
    const source = read(file)
    assert.match(source, /await pressWorldSpace\(page\)/)
    assert.doesNotMatch(source, /locator\('\.world-viewport'\)\.press\('Space'\)/)
  }
  const selector = read('tutorial-browser/selector-inspection.mjs'), spell = read('tutorial-browser/spell-test-menu.mjs')
  assert.match(selector, /for \(const paused of \[true, false\]\)[\s\S]*?assert.equal\(\(await read\(\)\).paused, paused[\s\S]*?await openMenu\(paused\)/)
  assert.match(spell, /assert.deepEqual\(await snapshot\(\), beforeOpen, 'opening is read-only for the world'\)/)
  assert.match(spell, /assert.deepEqual\(await storage\(\), saved, 'existing save\/profile are unchanged'\)/)
  const m2 = read('tutorial-browser/m2-pointer-f8.mjs')
  assert.match(m2, /report.inputPopups = await prepareWorldInput[\s\S]*?skipIntroductionWithSpace/)
  assert.match(m2, /report.inputPopups.push\(\.\.\.await pressWorldSpace\(page\)\)[\s\S]*?setM2CampaignPopupOpen\(page, retainedPopup.serial, true\)[\s\S]*?if \(pickingPaths\)/)
  const frames = read('tutorial-browser/gameplay-frames.mjs')
  assert.match(frames, /for \(const \{ phase, measured \} of schedule\)[\s\S]*?await prepareWorldInput\(page\)[\s\S]*?const point[\s\S]*?const before = await observe\(\)/)
  const helper = read('browser-world-input.mjs')
  assert.doesNotMatch(helper, /\.open\s*=|store\.change|\.paused\s*=(?!=)|keyboard\.press\('(Delete|Escape)'\)|getByRole\('button'/)
})
