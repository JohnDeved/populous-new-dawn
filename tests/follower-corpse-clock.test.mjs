import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  followerCorpseAttackTurn,
  followerCorpseClock,
} from '../scripts/tutorial-browser/follower-corpse-clock.mjs'

function testPage(initialTurn) {
  let turn = initialTurn, elapsed = 0, frozen = false, worldPaused = true, startupVisible = true
  const pageTimeMs = 9_000
  const calls = [], waiters = []
  return {
    calls,
    read: () => ({ turn, elapsed, frozen }),
    onNextAdvance: () => new Promise(resolve => waiters.push(resolve)),
    evaluate: async (predicate, input) => predicate?.name === 'readMissionSelector' ?
      { pageTimeMs, startupVisible, readyWorld: !startupVisible && turn !== null } : predicate?.name === 'readPacingBoundary' ?
      { pageTimeMs, turn, paused: worldPaused, readyScene: turn !== null, pendingTime: .015, inputMask: 0, selected: [1235] } :
      input === undefined ? (startupVisible ? null : turn) : predicate(input),
    enter: () => { startupVisible = false },
    publicResume: () => { worldPaused = false },
    crossNextTurn: () => waiters.push(() => { turn++ }),
    clock: {
      install: async ({ time }) => { calls.push(['install', time]) },
      pauseAt: async at => { frozen = true; calls.push(['pauseAt', at]) },
      runFor: async delta => {
        assert.equal(frozen, true)
        calls.push(['runFor', delta])
        elapsed += delta
        if (turn !== null && !worldPaused) turn = initialTurn + Math.floor(elapsed * 12 / 1000)
        for (const ready of waiters.splice(0)) ready()
      },
      resume: async () => { frozen = false; calls.push(['resume']) },
    },
  }
}

async function hold(page, pacing) {
  await pacing.holdAtMissionSelector()
  page.enter()
  return pacing.holdPaused({ turn: page.read().turn, actorId: 1235 })
}

test('controlled setup delivers frame callbacks and freezes at exact turn through test round trips', async () => {
  const page = testPage(110), pacing = followerCorpseClock(page)
  await pacing.install()
  assert.deepEqual(page.calls.map(([op]) => op), ['install'])
  assert.equal(await pacing.drive(async () => 'real opening and selection'), 'real opening and selection')
  assert.deepEqual(page.calls.map(([op]) => op), ['install'], 'leave public menus wall-synchronized')
  const boundary = await hold(page, pacing)
  assert.equal(boundary.slackTurns, 4)
  assert.equal(boundary.before.turn, boundary.after.turn)
  assert.deepEqual(page.calls[1], ['pauseAt', 11_000])
  page.publicResume()
  assert.equal(await pacing.drive(() => page.onNextAdvance().then(() => 'real action complete')), 'real action complete')
  assert.ok(page.read().turn < followerCorpseAttackTurn)
  await pacing.advanceToAttack()
  const attack = page.read()
  assert.deepEqual(await page.evaluate(), followerCorpseAttackTurn)
  assert.deepEqual(page.read(), attack, 'unpaced input/inspection cannot consume a virtual frame')
  assert.equal(attack.frozen, true)
  assert.ok(page.calls.slice(2).every(([op, duration]) => op === 'runFor' && duration === 16))
  const previous = page.calls.length
  await pacing.release()
  assert.equal(page.read().frozen, false)
  await pacing.drive(async () => 'live wall clock')
  assert.deepEqual(page.calls.slice(previous), [['resume']])
})

test('holding before mission input prevents wall transport from spending startup turns', async () => {
  const page = testPage(104), pacing = followerCorpseClock(page)
  await pacing.install()
  const selector = await pacing.holdAtMissionSelector()
  assert.equal(selector.before.startupVisible, true)
  assert.equal(selector.after.readyWorld, false)
  await pacing.drive(() => page.onNextAdvance().then(() => { page.enter(); page.publicResume() }))
  assert.deepEqual(page.calls.slice(0, 2).map(([op]) => op), ['install', 'pauseAt'])
  assert.ok(page.calls.slice(2).length > 0 && page.calls.slice(2).every(([op, delta]) => op === 'runFor' && delta === 16))
  assert.equal(page.read().turn, 104)
  await assert.rejects(pacing.holdAtMissionSelector(), /AssertionError/)
})

test('a hold attempted after mission entry cannot fast-forward the running World', async () => {
  const page = testPage(120), pacing = followerCorpseClock(page)
  await pacing.install()
  page.enter()
  await assert.rejects(pacing.holdAtMissionSelector(), /public mission selector/)
  assert.deepEqual(page.calls.map(([op]) => op), ['install'])
})

test('setup may not pass the combat turn or hang if the public action stalls', async () => {
  const page = testPage(113), pacing = followerCorpseClock(page)
  await pacing.install()
  assert.equal((await hold(page, pacing)).slackTurns, 1)
  page.publicResume()
  await assert.rejects(pacing.drive(() => new Promise(() => {})), /reached the exact attack turn/)
  assert.equal(page.read().turn, 114)
  await assert.rejects(pacing.advanceToAttack(), /finish before the attack turn/)
})

test('held resume is bounded; errors and missing or late public pause fail closed', async () => {
  for (const turn of [null, 114, 115]) {
    const page = testPage(turn), pacing = followerCorpseClock(page)
    await pacing.install()
    await assert.rejects(hold(page, pacing), /ready paused World|no slack/)
    assert.deepEqual(page.calls.map(([op]) => op), ['install', 'pauseAt'])
  }
  const running = testPage(104), runningPacing = followerCorpseClock(running)
  await runningPacing.install()
  running.publicResume()
  await assert.rejects(hold(running, runningPacing), /ready paused World/)
  const page = testPage(104), pacing = followerCorpseClock(page)
  await pacing.install()
  await hold(page, pacing)
  const error = new Error('public UI failed')
  await assert.rejects(pacing.drive(() => { throw error }), error)
  await assert.rejects(pacing.drive(() => new Promise(() => {})), /virtual-time bound/)
  assert.ok(page.calls.slice(2).every(([op, duration]) => op === 'runFor' && duration === 16))
})

test('fresh hover sampling drives an ordinary frame after arrival and holds the exact same turn', async () => {
  const page = testPage(113), pacing = followerCorpseClock(page)
  await pacing.install()
  await hold(page, pacing)
  page.publicResume()
  await pacing.advanceToAttack()
  const arrived = page.read()
  let observed = 0
  await pacing.waitForAttackHover(input => {
    observed++
    assert.equal(input.id, 20)
    assert.equal(page.read().turn, 114)
    assert.ok(page.read().elapsed > arrived.elapsed, 'hover predicate is evaluated after fresh render time')
    return true
  }, { id: 20 })
  assert.equal(observed, 1)
  assert.equal(page.read().elapsed - arrived.elapsed, 16)
  assert.equal(await page.evaluate(), 114)
})

test('hover fails on an overrun or an exhausted four-frame budget', async () => {
  const page = testPage(113), pacing = followerCorpseClock(page)
  await pacing.install()
  await hold(page, pacing)
  page.publicResume()
  await pacing.advanceToAttack()
  const arrived = page.read().elapsed
  await assert.rejects(pacing.waitForAttackHover(() => false, {}), /exact-turn hover budget/)
  assert.equal(page.read().elapsed - arrived, 64)
  assert.equal(page.read().turn, 114)
  const otherPage = testPage(113), other = followerCorpseClock(otherPage)
  await other.install()
  await hold(otherPage, other)
  otherPage.publicResume()
  await other.advanceToAttack()
  otherPage.crossNextTurn()
  await assert.rejects(other.waitForAttackHover(() => assert.fail('Cannot validate stale t114 pointer'), {}),
    /Hover rendering must not advance/)
})

test('scenario binds both pointer and pacing source hashes, after exact-turn rendering and before live combat', () => {
  const source = readFileSync(new URL('../scripts/tutorial-browser/follower-corpse.mjs', import.meta.url), 'utf8')
  const manifest = source.slice(source.indexOf('source: Object.fromEntries'), source.indexOf('  const save ='))
  assert.match(manifest, /'scripts\/tutorial-browser\/follower-corpse-clock\.mjs'/)
  assert.match(manifest, /'scripts\/tutorial-browser\/melee-attack\.mjs'/)
  const setup = source.slice(source.indexOf("    phase('startup')"), source.indexOf("    phase('ordinary-combat')"))
  let boundary = -1
  for (const step of ['await pacing.install()', "await page.goto", 'await pacing.holdAtMissionSelector()', 'await pacing.drive(() => page.waitForFunction(m2StartupReady))',
    "await button('Pause game')", "await button('Select brave')", 'await page.evaluate(installFollowerCorpseObserver',
    'await pacing.holdPaused', "await button('Resume game')"]) {
    const found = setup.indexOf(step)
    assert.ok(found > boundary, step)
    boundary = found
  }
  const route = setup.slice(boundary)
  const oneOf = ['await pacing.advanceToAttack()', 'await page.evaluate(readMeleeRouteState,',
    's.picking.personBounds(20, r)', 'await meleeTargetPoint(page, bounds,',
    'const attackHover', 'await page.evaluate(readMeleePointerState, point)', '() => shiftClickMeleeTarget(page, point), false)',
    'await page.evaluate(installCorpseCameraFollow,', 'await pacing.release()']
  let last = -1
  for (const piece of oneOf) {
    const offset = route.indexOf(piece)
    assert.ok(offset > last, piece)
    last = offset
  }
})
