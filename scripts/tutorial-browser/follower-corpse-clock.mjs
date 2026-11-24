import assert from 'node:assert/strict'

export const followerCorpseAttackTurn = 114
const frameStepMs = 16
const setupAdvanceLimit = 24_000
const maxAttackHoverFrames = 4
const readTurn = () => window.testStore?.getWorld()?.turn ?? null

// External test pacing via Playwright 1.63's public Clock. RunFor delivers
// ordinary RAFs/timers; never change scene/world time fields or inject an input.
export function followerCorpseClock(page) {
  let controlled = false, driving = false, setupElapsed = 0, attackHoverFrames = 0
  return {
    async install() {
      const epoch = Date.now()
      await page.clock.install({ time: epoch })
      await page.clock.pauseAt(epoch + 10_000)
      controlled = true
    },
    async drive(action) {
      if (!controlled || driving) return action()
      driving = true
      try {
        let settled = false
        const result = Promise.resolve().then(action)
        const signal = result.then(() => { settled = true }, () => { settled = true })
        while (!settled) {
          const turn = await page.evaluate(readTurn)
          if (settled) break
          if (turn !== null && turn >= followerCorpseAttackTurn)
            throw new Error('Combat setup reached the exact attack turn before finishing')
          // Larger batches before the scene binds; once bound, at most one RAF.
          const span = turn === null ? 48 : frameStepMs
          setupElapsed += span
          assert.ok(setupElapsed <= setupAdvanceLimit, 'Controlled public combat setup exceeded its virtual-time bound')
          await page.clock.runFor(span)
        }
        await signal
        return result
      } finally {
        driving = false
      }
    },
    async advanceToAttack() {
      assert.ok(controlled, 'Attack turn requires a stopped external clock')
      let turn = await page.evaluate(readTurn)
      assert.ok(Number.isInteger(turn) && turn < followerCorpseAttackTurn, 'Public setup must finish before the attack turn')
      for (let frame = 0; frame < 640 && turn < followerCorpseAttackTurn; frame++) {
        await page.clock.runFor(frameStepMs)
        turn = await page.evaluate(readTurn)
      }
      assert.equal(turn, followerCorpseAttackTurn, 'External pacing must reach the exact logical turn')
    },
    async waitForAttackHover(predicate, input) {
      assert.ok(controlled && !driving, 'Exact-turn hover requires a held, idle external clock')
      while (attackHoverFrames < maxAttackHoverFrames) {
        assert.equal(await page.evaluate(readTurn), followerCorpseAttackTurn)
        attackHoverFrames++
        await page.clock.runFor(frameStepMs)
        assert.equal(await page.evaluate(readTurn), followerCorpseAttackTurn,
          'Hover rendering must not advance the exact logical attack turn')
        if (await page.evaluate(predicate, input)) return
      }
      throw new Error('No fresh pointer render within the exact-turn hover budget')
    },
    async release() {
      assert.ok(controlled)
      await page.clock.resume()
      controlled = false
    },
  }
}
