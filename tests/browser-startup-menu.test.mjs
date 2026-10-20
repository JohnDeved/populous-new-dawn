import test from 'node:test'
import assert from 'node:assert/strict'
import { waitForStartupMenu } from '../scripts/browser-new-game.mjs'

function fixture({ initial = 'Opening logo', appears = 'Opening logo', clickError, completesNaturally = false, destination = 'Main menu' } = {}) {
  let visible = initial
  const events = []
  function locator(names, visibleOnly = false, firstOnly = false) {
    const matches = () => names.includes(visible)
    return {
      or(other) { return locator([...names, ...other.names]) },
      names,
      filter(options) {
        assert.deepEqual(options, { visible: true })
        return locator(names, true)
      },
      first() { return locator(names, visibleOnly, true) },
      async waitFor(options) {
        assert.deepEqual(options, { state: 'visible' })
        events.push(['wait', [...names]])
        // Loading and a completed click both require a fresh readiness wait.
        if (visible === 'loading') visible = appears
        if (visible === 'transition') visible = 'Main menu'
        assert.ok(matches(), 'the actual requested destination must become visible')
        if (firstOnly) assert.equal(visibleOnly, true, 'a hidden earlier dialog must not mask the logo')
      },
      async isVisible() { return matches() },
      getByRole(role, options) {
        assert.equal(role, 'button')
        assert.deepEqual(options, { name: 'Skip logo', exact: true })
        assert.deepEqual(names, ['Opening logo'], 'Skip must be scoped to the observed logo')
        return {
          async click(options) {
            events.push(['click', options])
            assert.equal(visible, 'Opening logo')
            if (completesNaturally) visible = destination
            if (clickError) throw clickError
            visible = 'transition'
          },
        }
      },
    }
  }
  return {
    events,
    page: {
      getByRole(role, { name, exact }) {
        assert.equal(role, 'dialog')
        assert.equal(exact, true)
        return locator(['Main menu', 'Start game', 'Opening logo'].filter(
          value => name instanceof RegExp ? name.test(value) : name === value))
      },
    },
    reload() { visible = 'loading' },
  }
}

test('delayed logo uses one public click and then waits for actual Main menu', async () => {
  const f = fixture({ initial: 'loading' })
  await waitForStartupMenu(f.page)
  assert.deepEqual(f.events, [
    ['wait', ['Main menu', 'Opening logo']],
    ['click', { timeout: 2500, noWaitAfter: true }],
    ['wait', ['Main menu']],
  ])
})

test('already visible menu needs no Skip and still receives a readiness wait', async () => {
  const f = fixture({ initial: 'Main menu' })
  await waitForStartupMenu(f.page)
  assert.deepEqual(f.events.map(e => e[0]), ['wait', 'wait'])
})

test('mission setup may accept an existing selector, but recovery requires Main menu', async () => {
  await waitForStartupMenu(fixture({ initial: 'Start game' }).page, { allowSelector: true })
  await assert.rejects(waitForStartupMenu(fixture({ initial: 'Start game' }).page),
    /actual requested destination/)
})

test('natural completion race is accepted only with the actual menu visible', async () => {
  const error = Object.assign(new Error('Skip disappeared'), { name: 'TimeoutError' })
  const f = fixture({ clickError: error, completesNaturally: true })
  await waitForStartupMenu(f.page)
  assert.deepEqual(f.events.at(-1), ['wait', ['Main menu']])
  assert.equal(f.events.filter(e => e[0] === 'click').length, 1)
})

test('Skip timeout while logo remains visible propagates without retry', async () => {
  const error = Object.assign(new Error('Skip inaccessible'), { name: 'TimeoutError' })
  const f = fixture({ clickError: error })
  await assert.rejects(waitForStartupMenu(f.page), e => e === error)
  assert.equal(f.events.filter(e => e[0] === 'click').length, 1)
})

test('non-timeout browser failures propagate even if a menu appears', async () => {
  const error = new Error('Browser closed')
  await assert.rejects(waitForStartupMenu(fixture({ clickError: error, completesNaturally: true }).page),
    e => e === error)
})

test('a disappeared logo alone cannot turn a click timeout into readiness', async () => {
  const error = Object.assign(new Error('Skip disappeared'), { name: 'TimeoutError' })
  await assert.rejects(waitForStartupMenu(fixture({
    clickError: error, completesNaturally: true, destination: 'loading',
  }).page), e => e === error)
})

test('each reload observes the new logo and reacquires actual menu readiness', async () => {
  const f = fixture()
  await waitForStartupMenu(f.page)
  f.reload()
  await waitForStartupMenu(f.page)
  assert.equal(f.events.filter(e => e[0] === 'click').length, 2)
  assert.deepEqual(f.events.at(-1), ['wait', ['Main menu']])
})
