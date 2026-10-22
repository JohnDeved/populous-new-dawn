import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { campaignPopupSnapshot, prepareWorldInput, pressWorldSpace, setCampaignPopupOpen, setWorldPaused } from '../scripts/browser-world-input.mjs'
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
        assert.equal(selector, '.campaign-messages details')
        return [...details].map(([serial, open]) => ({ open,
          getAttribute: name => { assert.equal(name, 'data-message-serial'); return serial },
        }))
      },
    },
  }
  const read = (fn, arg) => runInNewContext(`(${fn.toString()})(arg)`, { ...context, arg })
  const page = {
    evaluate: async (fn, arg) => { if ([beginSpaceOwnership, endSpaceOwnership].includes(fn)) return []; calls.push(fn === campaignPopupSnapshot ? 'observe-popups' : 'observe-intro'); return read(fn, arg) },
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
  assert.deepEqual(f.calls, ['observe-popups', 'summary:7', 'panel:hidden', 'observe-popups', 'focus-world', 'observe-popups', 'Space'])
  assert.equal(f.world.paused, true)
  assert.deepEqual(f.world.messages, original, 'No acknowledgement or queue deletion is permitted')
  await setCampaignPopupOpen(f.page, '7', true)
  assert.equal(f.details.get('7'), true)
  assert.deepEqual(f.world.messages, original, 'Reopening restores the same retained notification')
})

test('M2 collects a late popup closed inside introduction and restores that exact record after pause', async () => {
  const { setM2CampaignPopupOpen } = await import('../scripts/tutorial-browser/m2-pointer-f8.mjs')
  const f = fixture({ intro: true }), original = structuredClone(f.world.messages)
  f.details.set('7', false)
  f.details.set('99', false) // Unrelated retained record must not become the restored subject.
  const closedPopups = await prepareWorldInput(f.page)
  assert.deepEqual(closedPopups, [])
  const wait = f.page.waitForFunction
  f.page.waitForFunction = async (...args) => {
    f.details.set('7', true) // The authored popup arrives after outer preparation.
    return wait(...args)
  }
  assert.equal(await skipIntroductionWithSpace(f.page, { timeout: 10000, closedPopups }), 'skip',
    'The helper retains its original return contract')
  assert.deepEqual(closedPopups, [{ serial: '7' }])
  assert.deepEqual(await setWorldPaused(f.page, true), [], 'The later pause preparation also sees no open owner')
  assert.equal(f.world.paused, true)
  await setM2CampaignPopupOpen(f.page, closedPopups.at(-1).serial, true)
  assert.equal(f.details.get('7'), true)
  assert.equal(f.details.get('99'), false)
  assert.deepEqual(f.world.messages, original, 'Actual summary close/reopen retains the complete authored message and queue')
  assert.equal(f.calls.filter(call => call === 'summary:7').length, 2)
  assert.equal(f.calls.includes('summary:99'), false)
  f.details.delete('7')
  await assert.rejects(setM2CampaignPopupOpen(f.page, closedPopups.at(-1).serial, true), /same campaign notification/)
  assert.equal(f.calls.includes('summary:99'), false, 'Missing intended record cannot fall back to an unrelated retained record')
})

test('introduction evidence collection rejects a malformed sink without polling or input', async () => {
  await assert.rejects(skipIntroductionWithSpace({ waitForFunction: () => assert.fail('No polling') }, { closedPopups: {} }), /evidence must be an array/)
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

test('pointer-only preparation batches retained identity and final owners without keyboard focus', async () => {
  const f = fixture(), before = structuredClone(f.world.messages), trace = {}
  assert.deepEqual(await prepareWorldInput(f.page, { keyboardFocus: false, trace }), [{ serial: '7' }])
  assert.deepEqual(f.calls, ['observe-popups', 'summary:7', 'panel:hidden', 'observe-popups'])
  assert.equal(f.focus, 'summary', 'Pointer callers do not claim keyboard preparation')
  assert.deepEqual(f.world.messages, before)
  assert.equal(trace.pending, false)
  assert.equal(trace.phase, 'verify-retained-popup-and-owners')
  assert.deepEqual(trace.owners, [])
  assert.equal(trace.observedOpen, false)
  assert.equal(trace.completed.length, 4)
  for (const phase of trace.completed) assert.ok(phase.finishedMs >= phase.startedMs)
})

test('pointer-only preparation observes and closes a new owner during the prior close', async () => {
  const f = fixture({ onClose({ details, serial }) { if (serial === '7') details.set('8', true) } })
  assert.deepEqual(await prepareWorldInput(f.page, { keyboardFocus: false }), [{ serial: '7' }, { serial: '8' }])
  assert.equal(f.calls.filter(call => call === 'observe-popups').length, 3)
  assert.equal(f.calls.includes('focus-world'), false)
  assert.equal(f.calls.includes('Space'), false)
})

test('batched post-close observation still rejects a removed retained serial', async () => {
  const f = fixture({ onClose({ details, serial }) { details.delete(serial) } })
  await assert.rejects(prepareWorldInput(f.page), /same campaign notification remains present/)
  assert.equal(f.calls.includes('Space'), false)
})

test('batched post-close observation still rejects an incorrectly open retained serial', async () => {
  const f = fixture(), evaluate = f.page.evaluate
  let samples = 0
  f.page.evaluate = async (fn, arg) => {
    if (fn === campaignPopupSnapshot && ++samples === 2) f.details.set('7', true)
    return evaluate(fn, arg)
  }
  await assert.rejects(prepareWorldInput(f.page), /true !== false/)
  assert.equal(f.calls.includes('Space'), false)
})

test('timeout trace distinguishes completed close from pending final owner observation', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const f = fixture(), evaluate = f.page.evaluate, trace = {}
  let samples = 0, entered, release
  const pending = new Promise(resolve => { entered = resolve }), blocked = new Promise(resolve => { release = resolve })
  f.page.evaluate = async (fn, arg) => {
    if (fn === campaignPopupSnapshot && ++samples === 3) { entered(); await blocked }
    return evaluate(fn, arg)
  }
  const rejected = assert.rejects(prepareWorldInput(f.page, { timeout: 500, trace }), error => {
    const record = JSON.parse(error.message.slice(error.message.indexOf('{')))
    assert.equal(record.phase, 'reobserve-popup-owners')
    assert.equal(record.pending, true)
    assert.equal(record.observedOpen, false)
    assert.deepEqual(record.owners, [])
    assert.ok(record.completed.some(item => item.phase === 'wait-body-hidden'))
    assert.ok(record.completed.some(item => item.phase === 'focus-world-viewport'))
    assert.ok(record.phaseStartedMs >= record.ownersObservedMs)
    return true
  })
  await pending; t.mock.timers.tick(500); await rejected; release()
  for (let i = 0; i < 12; i++) await Promise.resolve()
  assert.equal(f.calls.includes('Space'), false)
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
    'tutorial-browser/shaman-casting.mjs', 'local-render/campaign-profile-recovery.mjs',
    'tutorial-browser/building-panel-identity.mjs', 'tutorial-browser/follower-corpse.mjs',
    'tutorial-browser/scenery-placement.mjs', 'tutorial-browser/spell-hypnotise.mjs',
    'tutorial-browser/spell-projection.mjs', 'tutorial-browser/spy-source.mjs', 'local-render/mission1-vault-input.mjs']) {
    const source = read(file)
    assert.match(source, /setWorldPaused\(page, (true|false|paused)/)
    assert.doesNotMatch(source, /locator\('\.world-viewport'\)\.press\('Space'\)/)
  }
  const selector = read('tutorial-browser/selector-inspection.mjs'), spell = read('tutorial-browser/spell-test-menu.mjs')
  assert.match(selector, /for \(const paused of \[true, false\]\)[\s\S]*?assert.equal\(\(await read\(\)\).paused, paused[\s\S]*?await openMenu\(paused\)/)
  assert.match(spell, /assert.deepEqual\(await snapshot\(\), beforeOpen, 'opening is read-only for the world'\)/)
  assert.match(spell, /assert.deepEqual\(await storage\(\), saved, 'existing save\/profile are unchanged'\)/)
  const m2 = read('tutorial-browser/m2-pointer-f8.mjs')
  assert.match(m2, /report.inputPopups = await prepareWorldInput[\s\S]*?skipIntroductionWithSpace/)
  assert.match(m2, /skipIntroductionWithSpace\(page, \{ timeout: 10000, closedPopups: report.inputPopups \}\)/)
  assert.match(m2, /report.inputPopups.push\(\.\.\.await setWorldPaused\(page, true\)\)[\s\S]*?setM2CampaignPopupOpen\(page, retainedPopup.serial, true\)[\s\S]*?if \(pickingPaths\)/)
  const spy = read('tutorial-browser/spy-source-readiness.mjs')
  assert.match(spy, /skipIntroductionWithSpace\(page, \{ timeout: remaining\(\) \}\)/)
  assert.doesNotMatch(spy, /keyboard.press\('Space'\)/)
  const frames = read('tutorial-browser/gameplay-frames.mjs')
  assert.match(frames, /for \(const \{ phase, measured \} of schedule\)[\s\S]*?await prepareWorldInput\(page\)[\s\S]*?const point[\s\S]*?const before = await observe\(\)/)
  const helper = read('browser-world-input.mjs')
  assert.doesNotMatch(helper, /\.open\s*=|store\.change|\.paused\s*=(?!=)|keyboard\.press\('(Delete|Escape)'\)|getByRole\('button'/)
})


for (const [blockedOperation, outerPhase, innerPhase, accepted] of [
  ['read-before', 'read-before-pause', 'start', false],
  ['install', 'observed-space-dispatch', 'install-space-witness', false],
  ['key', 'observed-space-dispatch', 'public-space-key', true],
  ['finalize', 'observed-space-dispatch', 'finalize-space-witness', true],
  ['read-after', 'read-after-pause', 'finalize-space-witness', true],
]) test(`pause timeout identifies pending ${blockedOperation} without replaying accepted input`, async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  let now = 0, entered, release, stateReads = 0, presses = 0
  t.mock.method(performance, 'now', () => now)
  const blocked = new Promise(resolve => { release = resolve }), pending = new Promise(resolve => { entered = resolve })
  const f = fixture(), trace = {}, evaluate = f.page.evaluate, press = f.page.keyboard.press
  f.world.paused = true
  const stall = async () => { entered(); await blocked }
  f.page.evaluate = async (fn, arg) => {
    if (fn.name === 'worldPauseState') {
      stateReads++
      if (blockedOperation === (stateReads === 1 ? 'read-before' : 'read-after')) await stall()
    }
    if (blockedOperation === 'install' && fn === beginSpaceOwnership) await stall()
    if (blockedOperation === 'finalize' && fn === endSpaceOwnership) await stall()
    return evaluate(fn, arg)
  }
  f.page.keyboard.press = async key => { presses++; await press(key); if (blockedOperation === 'key') await stall() }
  const rejected = assert.rejects(setWorldPaused(f.page, false, { timeout: 500, trace }), error => {
    assert.match(error.message, /timed out/)
    const record = JSON.parse(error.message.slice(error.message.indexOf('{')))
    assert.equal(record.phase, outerPhase)
    assert.equal(record.pending, true)
    if (blockedOperation !== 'read-before') {
      assert.equal(record.attempts[0].delivery.phase, innerPhase)
      assert.equal(record.attempts[0].delivery.pending, blockedOperation !== 'read-after')
    }
    return true
  })
  await pending
  assert.equal(f.world.paused, !accepted, 'Accepted native effect alone must not certify an unsettled input/observation')
  now = 500; t.mock.timers.tick(500); await rejected
  release()
  for (let i = 0; i < 20; i++) await Promise.resolve()
  assert.equal(presses, Number(accepted), 'No late or compensating Space is permitted')
  assert.equal(stateReads, blockedOperation === 'read-after' ? 2 : 1)
})

test('pause input aborted during preparation cannot send late Space', async () => {
  const f = fixture(), locator = f.page.locator, cancellation = new AbortController(), failure = Error('Owning episode ended')
  let entered, release
  const pending = new Promise(resolve => { entered = resolve }), blocked = new Promise(resolve => { release = resolve })
  f.page.locator = selector => selector === '.world-viewport'
    ? { focus: async () => { entered(); await blocked } } : locator(selector)
  const rejected = assert.rejects(setWorldPaused(f.page, true, { signal: cancellation.signal }), error => error === failure)
  await pending; cancellation.abort(failure); await rejected; release()
  for (let i = 0; i < 20; i++) await Promise.resolve()
  assert.equal(f.calls.includes('Space'), false)
})


for (const [rejectedOperation, outerPhase, innerPhase] of [
  ['install', 'observed-space-dispatch', 'install-space-witness'],
  ['finalize', 'observed-space-dispatch', 'finalize-space-witness'],
  ['read-after', 'read-after-pause', null],
]) test(`pause trace identifies settled ${rejectedOperation} rejection without changing its error`, async () => {
  const f = fixture(), trace = {}, failure = Error(`Rejected ${rejectedOperation}`), evaluate = f.page.evaluate
  let stateReads = 0
  f.world.paused = true
  f.page.evaluate = async (fn, arg) => {
    if (fn.name === 'worldPauseState' && ++stateReads === 2 && rejectedOperation === 'read-after') throw failure
    if (rejectedOperation === 'install' && fn === beginSpaceOwnership) throw failure
    if (rejectedOperation === 'finalize' && fn === endSpaceOwnership) throw failure
    return evaluate(fn, arg)
  }
  await assert.rejects(setWorldPaused(f.page, false, { trace }), error => error === failure)
  assert.equal(trace.phase, outerPhase)
  assert.equal(trace.pending, false, 'A settled failure is not a pending browser operation')
  assert.equal(trace.phaseError, String(failure))
  assert.equal(trace.completed.at(-1).status, 'rejected')
  if (innerPhase) {
    const record = trace.attempts[0].delivery.completed.find(row => row.phase === innerPhase)
    assert.equal(record.status, 'rejected')
  }
  assert.equal(f.calls.filter(call => call === 'Space').length, rejectedOperation === 'install' ? 0 : 1)
})
