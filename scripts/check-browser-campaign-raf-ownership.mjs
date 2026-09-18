import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

const source = readFileSync(new URL('./check-browser-campaign-natural-victory.mjs', import.meta.url), 'utf8')
const between = (start, end) => {
  const a = source.indexOf(start)
  const b = source.indexOf(end, a + start.length)
  assert.ok(a >= 0 && b > a, `missing source range ${start}..${end}`)
  return source.slice(a, b)
}
const advanceSource = between('async function advance(page, turns)', 'async function advanceOutcome(page)')
assert.ok(
  advanceSource.indexOf('cancelAnimationFrame(scene.frame)') <
    advanceSource.indexOf("await import('/app/model.ts')"),
  'advance cancels its previously owned RAF before awaited import/tick work'
)
assert.ok(
  advanceSource.lastIndexOf('cancelAnimationFrame(scene.frame)') >
    advanceSource.indexOf('scene.animate(scene.previous)'),
  'advance cancels the replacement RAF after its zero-dt render'
)
const untilSource = between(
  'async function advanceUntil(page, condition, limit, label, required = true)',
  'async function entityPoint'
)
assert.ok(
  untilSource.indexOf('cancelAnimationFrame(scene.frame)') <
    untilSource.indexOf("await import('/app/model.ts')"),
  'advanceUntil cancels its previously owned RAF before awaited import/tick work'
)
assert.ok(
  untilSource.lastIndexOf('cancelAnimationFrame(scene.frame)') >
    untilSource.indexOf('scene.animate(scene.previous)'),
  'advanceUntil cancels the replacement RAF after its zero-dt render'
)
const outcomeSource = between('async function advanceOutcome(page)', 'async function advanceUntil')
assert.ok(
  outcomeSource.indexOf('cancelAnimationFrame(scene.frame)') <
    outcomeSource.indexOf('scene.animate(performance.now())'),
  'advanceOutcome cancels the old RAF before starting intentional real-RAF camera progression'
)
assert.ok(
  outcomeSource.indexOf('waitForFunction') <
    outcomeSource.lastIndexOf('cancelAnimationFrame(globalThis.testScene.frame)'),
  'advanceOutcome leaves its replacement RAF alive until the outcome camera completes'
)
assert.match(source, /await suspendOwnedFrame\(page\)\s*\n\s*await missionTwo\(page\)/)
assert.match(source, /await suspendOwnedFrame\(page\)\s*\n\s*await missionThree\(page\)/)

const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser, 2)
  page.setDefaultTimeout(20_000)
  const witness = await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      owned = scene.frame,
      before = world.turn
    cancelAnimationFrame(owned)
    const { tick } = await import('/app/model.ts')
    for (let turn = 0; turn < 12; turn++) tick(world, 1 / 12)
    globalThis.testStore.update()
    scene.animate(scene.previous)
    const replacement = scene.frame
    cancelAnimationFrame(replacement)
    return {
      before,
      after: world.turn,
      owned,
      replacement,
      sameWorld: scene.world === globalThis.testStore.getWorld(),
    }
  })
  assert.equal(witness.after, witness.before + 12)
  assert.equal(witness.sameWorld, true)
  assert.notEqual(witness.owned, witness.replacement)

  await page.waitForTimeout(200)
  const stable = await page.evaluate(() => ({
    turn: globalThis.testScene.world.turn,
    sameWorld: globalThis.testScene.world === globalThis.testStore.getWorld(),
  }))
  assert.deepEqual(stable, { turn: witness.after, sameWorld: true })

  const live = await page.evaluate(() => {
    const scene = globalThis.testScene,
      before = scene.world.turn
    cancelAnimationFrame(scene.frame)
    scene.animate(performance.now())
    return { before, replacement: scene.frame }
  })
  await page.waitForFunction(turn => globalThis.testScene.world.turn > turn, live.before)
  const progressed = await page.evaluate(() => {
    const scene = globalThis.testScene,
      turn = scene.world.turn,
      frame = scene.frame
    cancelAnimationFrame(frame)
    return { turn, frame, sameWorld: scene.world === globalThis.testStore.getWorld() }
  })
  assert.ok(progressed.turn > live.before)
  assert.equal(progressed.sameWorld, true)
  assert.deepEqual(errors, [])
  console.log(
    'PASS: campaign checker cancels owned RAFs across awaited/manual page work and intentionally resumes real RAF progression'
  )
} finally {
  await browser.close()
}
