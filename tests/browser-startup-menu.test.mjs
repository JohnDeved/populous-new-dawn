import test from 'node:test'
import { readFileSync } from 'node:fs'
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

// Execute the actual entry-driver statements with the real public helper. The
// logo never finishes playback in this fixture: only its public Skip advances it.
function deliveryFixture(events) {
  return {
    delivery: { async preflight() {
      await Promise.resolve()
      assert.deepEqual(events, [['navigation']], 'preflight must finish before saving or menu entry')
      events.push(['preflight'])
    } },
    save() {
      assert.deepEqual(events, [['navigation'], ['preflight']], 'save follows awaited preflight')
      events.push(['save'])
    },
  }
}

for (const scenario of ['spy-source', 'spell-test-menu']) {
  const source = readFileSync(new URL(`../scripts/tutorial-browser/${scenario}.mjs`, import.meta.url), 'utf8'),
    spy = scenario === 'spy-source',
    start = spy ? "await page.reload({ waitUntil: 'domcontentloaded' })" : "await page.goto(url, { waitUntil: 'domcontentloaded' })",
    end = spy ? 'await page.waitForFunction(m2LoadReady)' : "await button('New Game').click()",
    from = source.indexOf(start), to = source.indexOf(end, from)
  assert.ok(from >= 0 && to > from, 'actual driver entry boundaries exist')
  const drive = new (Object.getPrototypeOf(async function () {}).constructor)(
    'page', 'waitForStartupMenu', 'm2LoadReady', 'button', 'url', 'delivery', 'save', source.slice(from, to + end.length))

  for (const initial of ['Opening logo', 'Main menu']) {
    test(`${scenario} observes public startup readiness before its next action (${initial})`, async () => {
      const f = fixture({ initial: 'loading', appears: initial }), ready = () => true,
        { delivery, save } = deliveryFixture(f.events)
      f.page.reload = f.page.goto = async () => { f.events.push(['navigation']) }
      const downstream = () => {
        assert.deepEqual(f.events.at(-1), ['wait', ['Main menu']], 'destination readiness precedes load/new game')
        f.events.push(['downstream'])
      }
      f.page.waitForFunction = async fn => { assert.equal(fn, ready); downstream() }
      const button = name => { assert.equal(name, 'New Game'); return { click: async () => downstream() } }
      await drive(f.page, waitForStartupMenu, ready, button, 'http://fixture.invalid', delivery, save)
      assert.deepEqual(f.events.slice(0, spy ? 3 : 1), spy
        ? [['navigation'], ['preflight'], ['save']] : [['navigation']])
      assert.equal(f.events.at(-1)[0], 'downstream')
      assert.equal(f.events.filter(e => e[0] === 'click').length, initial === 'Opening logo' ? 1 : 0)
    })
  }

  test(`${scenario} propagates failed logo Skip without starting load/new game`, async () => {
    const failure = Object.assign(new Error('Skip inaccessible'), { name: 'TimeoutError' }),
      f = fixture({ clickError: failure }), { delivery, save } = deliveryFixture(f.events)
    f.page.reload = f.page.goto = async () => { f.events.push(['navigation']) }
    f.page.waitForFunction = async () => assert.fail('load readiness must not begin')
    await assert.rejects(drive(f.page, waitForStartupMenu, () => true,
      () => assert.fail('New Game must not begin'), 'http://fixture.invalid', delivery, save), error => error === failure)
    assert.equal(f.events.filter(e => e[0] === 'click').length, 1)
  })

  if (spy) for (const stage of ['preflight', 'save']) {
    test(`${scenario} propagates failed ${stage} without entering the startup menu or load`, async () => {
      const failure = new Error(`${stage} failed`), events = [],
        page = {
          reload: async () => { events.push('navigation') },
          waitForFunction: async () => assert.fail('load readiness must not begin'),
        },
        delivery = { async preflight() {
          events.push('preflight')
          if (stage === 'preflight') throw failure
        } },
        save = () => {
          events.push('save')
          if (stage === 'save') throw failure
        }
      await assert.rejects(drive(page, () => assert.fail('startup menu must not begin'),
        () => true, () => assert.fail('New Game must not begin'), 'http://fixture.invalid', delivery, save),
      error => error === failure)
      assert.deepEqual(events, stage === 'preflight' ? ['navigation', 'preflight'] : ['navigation', 'preflight', 'save'])
    })
  }
}
