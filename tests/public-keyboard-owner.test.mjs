import assert from 'node:assert/strict'
import test from 'node:test'
import { runInNewContext } from 'node:vm'
import { collapseObservedCampaignMessages } from '../scripts/public-keyboard-owner.mjs'

// Execute the unchanged exported helper against supplied DOM/transport handles.
// No browser, trusted input, React, World simulation or native evidence is claimed.
function fixture({ serials = ['7', '8'], open = true, fault, failure,
  cleanupFailure, failDiagnostic = false } = {}) {
  const events = [], acquired = [], disposed = [], observations = []
  const world = { paused: true, status: 'playing', selected: [63, 111], turn: 267 }
  const window = { testStore: { getWorld: () => world }, testSceneRef: { current: { world } } }
  const messages = serials.map(serial => ({ serial, open, isConnected: true,
    getAttribute(name) { return name === 'data-message-serial' ? this.serial : null } }))
  let current = [...messages], ownerReads = 0, diagnosticReads = 0, elementReads = 0
  const document = {
    activeElement: { tagName: 'BUTTON', getAttribute: () => 'Resume game' },
    querySelectorAll(selector) {
      if (selector === '.campaign-messages details[open]') return current.filter(element => element.open)
      const serial = selector.match(/^\.campaign-messages details\[data-message-serial="(\d+)"\]$/)?.[1]
      assert.ok(serial, 'Fixture accepts only the helper’s exact public selectors')
      return current.filter(element => element.serial === serial)
    },
  }
  const evaluate = (callback, value, argument) => runInNewContext(
    `(${callback.toString()})(value, argument)`, { window, document, value, argument })
  const handle = (name, methods) => {
    acquired.push(name)
    return { ...methods, async dispose() {
      events.push(`dispose:${name}`); disposed.push(name)
      if (cleanupFailure !== undefined) throw cleanupFailure
    } }
  }
  const page = {
    async evaluateHandle(callback) {
      events.push('acquire:world')
      assert.equal(evaluate(callback), world)
      return handle('world', { async evaluate(callback) {
        events.push('read:world')
        ownerReads++
        if (fault === 'world-replacement' && ownerReads === 2)
          window.testSceneRef.current.world = { ...world }
        return evaluate(callback, world)
      } })
    },
    async evaluate(callback) {
      events.push('read:diagnostic'); diagnosticReads++
      if (failDiagnostic && diagnosticReads > 1) throw Error('secondary diagnostic failure')
      return evaluate(callback)
    },
    locator(selector) {
      assert.equal(selector, '.campaign-messages details[open]')
      return {
        async elementHandles() {
          events.push('acquire:messages')
          return current.filter(element => element.open).map((element, index) =>
            handle(`message:${index}`, {
              async getAttribute(name) {
                events.push(`serial:${index}`)
                if (fault === 'serial-read' && index === 1) throw failure
                return element.getAttribute(name)
              },
              async evaluate(callback, argument) {
                events.push(`read:message:${index}`); elementReads++
                if (elementReads === 1 && fault === 'same-serial-replacement')
                  current[index] = { ...element }
                if (elementReads === 1 && fault === 'disconnected') element.isConnected = false
                return evaluate(callback, element, argument)
              },
              async $(selector) {
                events.push(`acquire:summary:${index}`)
                assert.equal(selector, ':scope > summary[aria-label="Read campaign message"]')
                if (fault === 'summary-acquisition' && index === 1) throw failure
                return handle(`summary:${index}`, { async click(options) {
                  events.push(`click:${index}`)
                  assert.ok(options.timeout > 0 && options.timeout <= 25000)
                  if (fault === 'click' && index === 0) throw failure
                  element.open = false
                } })
              },
            }))
        },
        async count() { events.push('count:open'); return current.filter(element => element.open).length },
      }
    },
  }
  return { page, world, messages, observations, events, acquired, disposed,
    run(options = {}) { return collapseObservedCampaignMessages(page, {
      remainingMs: () => 25000,
      observe: value => observations.push(value), ...options,
    }) } }
}
function assertReleased(f) {
  assert.deepEqual([...f.disposed].sort(), [...f.acquired].sort(), 'Every acquired handle released exactly once')
  assert.equal(new Set(f.disposed).size, f.disposed.length)
}
async function rejection(perform) {
  try { await perform(); return { rejected: false } }
  catch (error) { return { rejected: true, error } }
}

test('multiple exact open owners close in order, retain data and report before/after focus', async () => {
  const f = fixture(), before = structuredClone(f.world)
  await f.run()
  assert.deepEqual(f.events.filter(event => event.startsWith('click:')), ['click:0', 'click:1'])
  assert.ok(f.messages.every(element => !element.open && element.isConnected))
  assert.deepEqual(f.world, before)
  assert.deepEqual(f.observations.map(value => value.phase), ['before-public-collapse', 'after-public-collapse'])
  assert.deepEqual(Array.from(f.observations[0].openMessageSerials), ['7', '8'])
  assert.deepEqual(Array.from(f.observations[1].openMessageSerials), [])
  assert.equal(f.observations[0].focus.label, 'Resume game')
  assertReleased(f)
})

test('no observed open message acquires no summaries and performs no click', async () => {
  const f = fixture({ open: false })
  await f.run()
  assert.deepEqual(f.acquired, ['world'])
  assert.ok(!f.events.some(event => event.startsWith('click:') || event.startsWith('acquire:summary:')))
  assertReleased(f)
})

for (const fault of ['same-serial-replacement', 'disconnected', 'world-replacement']) {
  test(`${fault} refuses all later clicks and releases observed owners`, async () => {
    const f = fixture({ fault })
    await assert.rejects(f.run(), fault === 'world-replacement' ? /exact paused World/ : /open and connected/)
    assert.ok(!f.events.some(event => event.startsWith('click:')))
    assert.equal(f.observations.at(-1).phase, 'public-collapse-failed')
    assertReleased(f)
  })
}

for (const failure of [Error('primary click failure'), undefined, null, false, 0, '']) {
  test(`click failure (${String(failure)}) survives diagnostic and cleanup failures`, async () => {
    const f = fixture({ fault: 'click', failure, cleanupFailure: Error('secondary cleanup'), failDiagnostic: true })
    const result = await rejection(() => f.run())
    assert.equal(result.rejected, true)
    assert.equal(result.error, failure)
    assert.deepEqual(f.events.filter(event => event.startsWith('click:')), ['click:0'])
    assertReleased(f)
  })
}

for (const fault of ['serial-read', 'summary-acquisition']) {
  test(`${fault} failure releases all partially acquired handles`, async () => {
    const failure = Error('primary acquisition failure'), f = fixture({ fault, failure })
    const result = await rejection(() => f.run())
    assert.equal(result.rejected, true)
    assert.equal(result.error, failure)
    assert.deepEqual(f.events.filter(event => event.startsWith('click:')),
      fault === 'summary-acquisition' ? ['click:0'] : [])
    assertReleased(f)
  })
}

test('cleanup failure after successful closures remains a failure and does not skip later cleanup', async () => {
  const failure = Error('cleanup failure'), f = fixture({ cleanupFailure: failure })
  const result = await rejection(() => f.run())
  assert.equal(result.rejected, true)
  assert.equal(result.error, failure)
  assertReleased(f)
})

test('already expired budget acquires no handle and performs no page operation', async () => {
  const f = fixture()
  await assert.rejects(f.run({ remainingMs: () => 0 }), /setup deadline exceeded/)
  assert.deepEqual(f.events, [])
  assertReleased(f)
})

test('expiration after summary acquisition rejects before click and releases all owners', async () => {
  const f = fixture()
  await assert.rejects(f.run({ remainingMs: () =>
    f.events.includes('acquire:summary:0') ? 0 : 25000 }), /setup deadline exceeded/)
  assert.ok(!f.events.some(event => event.startsWith('click:')))
  assert.ok(!f.events.includes('acquire:summary:1'))
  assertReleased(f)
})
