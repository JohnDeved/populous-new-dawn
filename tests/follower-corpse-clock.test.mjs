import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  followerCorpseAttackTurn,
  followerCorpseClock,
} from '../scripts/tutorial-browser/follower-corpse-clock.mjs'

function testPage(initialTurn) {
  let turn = initialTurn, elapsed = 0, frozen = false
  const calls = []
  const waiters = []
  return {
    calls,
    read: () => ({ turn, elapsed, frozen }),
    onNextAdvance: () => new Promise(resolve => waiters.push(resolve)),
    evaluate: async (predicate, input) => input === undefined ? turn : predicate(input),
    crossNextTurn: () => waiters.push(() => { turn++ }),
    clock: {
      install: async ({ time }) => { calls.push(['install', time]) },
      pauseAt: async at => { frozen = true; calls.push(['pauseAt', at]) },
      runFor: async delta => {
        assert.equal(frozen, true)
        calls.push(['runFor', delta])
        elapsed += delta
        if (turn !== null) turn = initialTurn + Math.floor(elapsed * 12 / 1000)
        for (const ready of waiters.splice(0)) ready()
      },
      resume: async () => { frozen = false; calls.push(['resume']) },
    },
  }
}

test('controlled setup delivers frame callbacks and freezes at exact turn through test round trips', async () => {
  const page = testPage(110), pacing = followerCorpseClock(page)
  await pacing.install()
  assert.deepEqual(page.calls.map(([op]) => op), ['install', 'pauseAt'])
  assert.equal(page.calls[1][1] - page.calls[0][1], 10_000)
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

test('setup may not pass the combat turn or hang if the public action stalls', async () => {
  const page = testPage(113), pacing = followerCorpseClock(page)
  await pacing.install()
  await assert.rejects(pacing.drive(() => new Promise(() => {})), /reached the exact attack turn/)
  assert.equal(page.read().turn, 114)
  await assert.rejects(pacing.advanceToAttack(), /finish before the attack turn/)
})

test('unbound setup usages are bounded; operation errors remain visible', async () => {
  const page = testPage(null), pacing = followerCorpseClock(page)
  await pacing.install()
  const error = new Error('public UI failed')
  await assert.rejects(pacing.drive(() => { throw error }), error)
  await assert.rejects(pacing.drive(() => new Promise(() => {})), /virtual-time bound/)
  assert.ok(page.calls.slice(2).every(([op, duration]) => op === 'runFor' && duration === 48))
})

test('fresh hover sampling drives an ordinary frame after arrival and holds the exact same turn', async () => {
  const page = testPage(113), pacing = followerCorpseClock(page)
  await pacing.install()
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
  await pacing.advanceToAttack()
  const arrived = page.read().elapsed
  await assert.rejects(pacing.waitForAttackHover(() => false, {}), /exact-turn hover budget/)
  assert.equal(page.read().elapsed - arrived, 64)
  assert.equal(page.read().turn, 114)
  const otherPage = testPage(113), other = followerCorpseClock(otherPage)
  await other.install()
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
  const route = source.slice(source.indexOf("    await button('Resume game')"), source.indexOf("    phase('ordinary-combat')"))
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
