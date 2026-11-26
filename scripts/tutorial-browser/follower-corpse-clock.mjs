import assert from 'node:assert/strict'

export const followerCorpseAttackTurn = 114
const frameStepMs = 16
const setupAdvanceLimit = 24_000
const maxAttackHoverFrames = 4
// A future wall-clock value absorbs transport latency; Playwright fast-forwards
// to it at the public mission selector, before the World is entered.
const holdLeadMs = 2_000
const readTurn = () => window.testStore?.getWorld()?.turn ?? null
const readMissionSelector = () => ({ pageTimeMs: Date.now(), readyWorld: !!window.testStore?.getWorld(),
  startupVisible: [...document.querySelectorAll('dialog')].some(dialog => dialog.open &&
    dialog.getAttribute('aria-label') === 'Start game') })
const readPacingBoundary = () => {
  const world = window.testStore?.getWorld(), scene = window.testSceneRef?.current
  const skip = document.querySelector('button.skip-introduction')
  return { pageTimeMs: Date.now(), turn: world?.turn ?? null, paused: world?.paused ?? null,
    pendingTime: world?.pendingTime ?? null, inputMask: world?.inputMask ?? null,
    flybyFlags: world?.flyby?.flags ?? null,
    skipExists: !!skip, skipVisible: !!skip && skip.getClientRects().length > 0 &&
      getComputedStyle(skip).visibility !== 'hidden' && !skip.disabled,
    readyScene: !!scene && !!world && scene.world === world && scene.renderer?.domElement?.isConnected,
    stamp: scene?.renderer?.info?.render?.frame ?? null, selected: world ? [...world.selected] : [] }
}

// A direct evaluation is intentionally used instead of an autonomous RAF poll:
// virtual time only advances when the driver explicitly runs a bounded frame.
export function readFollowerCorpseOpening() {
  const w = window.testStore.getWorld(), s = window.testSceneRef.current
  if (!s || s.world !== w || !s.renderer.domElement.isConnected || w.outcome.level !== 2)
    throw Error('Opening requires the ready authentic Mission 2 Scene')
  const skip = document.querySelector('button.skip-introduction')
  const skipVisible = !!skip && !skip.disabled && skip.getClientRects().length > 0 &&
    getComputedStyle(skip).visibility !== 'hidden'
  const summary = document.querySelector('.campaign-messages details[open] > summary[aria-label="Read campaign message"]')
  return { level: w.outcome.level, turn: w.turn, lastOrderTurn: w.lastOrderTurn,
    inputMask: w.inputMask, flybyFlags: w.flyby.flags, paused: w.paused, skipVisible,
    messageModal: !!s.messageModal, summarySerial: summary?.parentElement?.getAttribute('data-message-serial') ?? null,
    pendingMessage: w.messages.slots.some(m => !!(m && (m.flags & 0x20002))) }
}

export async function settleFollowerCorpseOpening({ observe, advance, clickSummary, clickSkip, remaining }) {
  const publicActions = [], maxFrames = 600
  let authoredOpeningSeen = false, lastAction
  for (let frames = 0; frames <= maxFrames; frames++) {
    assert.ok(remaining() > 0, 'Mission 2 opening wall deadline exceeded')
    const state = await observe()
    assert.equal(state.level, 2)
    assert.ok(Number.isInteger(state.turn) && state.turn < followerCorpseAttackTurn,
      'Mission 2 opening exhausted exact-turn setup slack')
    authoredOpeningSeen ||= !!(state.inputMask || state.flybyFlags || state.messageModal ||
      state.summarySerial !== null || state.pendingMessage)
    if (authoredOpeningSeen && !state.inputMask && !state.paused && !state.messageModal &&
        state.summarySerial === null && !state.pendingMessage && state.turn > state.lastOrderTurn) {
      return { ...state, advancedFrames: frames, publicActions }
    }
    // A real message takes precedence over Skip; its overlay can own input
    // while the World is still locked and cannot progress until it is closed.
    const action = state.summarySerial !== null ? 'summary' :
      !state.messageModal && state.skipVisible && (state.flybyFlags & 1) && state.inputMask ? 'skip' : null
    const actionKey = action === 'summary' ? `summary:${state.summarySerial}` : action
    const clickedPublicControl = !!action && actionKey !== lastAction
    if (clickedPublicControl) {
      assert.ok(publicActions.length < 12, 'Mission 2 opening exceeded public action bound')
      publicActions.push({ action, turn: state.turn, inputMask: state.inputMask, flybyFlags: state.flybyFlags })
      await (action === 'summary' ? clickSummary(state.summarySerial) : clickSkip())
    }
    lastAction = actionKey
    // No browser event can advance the held Playwright clock between this
    // observation and the next bounded frame, except a real public click
    // under pacing.drive. A click therefore requires a new browser turn read.
    if (frames < maxFrames) await advance(clickedPublicControl ? undefined : state.turn)
  }
  throw Error('Mission 2 opening did not resolve within 600 virtual frames')
}

// External test pacing via Playwright 1.63's public Clock. RunFor delivers
// ordinary RAFs/timers; never change scene/world time fields or inject an input.
export function followerCorpseClock(page) {
  let installed = false, controlled = false, driving = false, setupElapsed = 0, attackAdvanceFrames = 0, attackHoverFrames = 0
  const advanceSetupFrame = async (finished = () => false, heldTurn) => {
    const turn = heldTurn === undefined ? await page.evaluate(readTurn) : heldTurn
    if (finished()) return
    if (turn !== null && (!Number.isInteger(turn) || turn >= followerCorpseAttackTurn))
      throw new Error('Combat setup reached the exact attack turn before finishing')
    setupElapsed += frameStepMs
    assert.ok(setupElapsed <= setupAdvanceLimit, 'Controlled public combat setup exceeded its virtual-time bound')
    await page.clock.runFor(frameStepMs)
  }
  return {
    async advanceOpeningFrame(heldTurn) {
      assert.ok(controlled && !driving, 'Opening observation must own the controlled clock')
      if (heldTurn !== undefined) assert.ok(Number.isInteger(heldTurn), 'Opening requires a directly observed held turn')
      await advanceSetupFrame(undefined, heldTurn)
    },
    async install() {
      assert.equal(installed, false)
      await page.clock.install({ time: Date.now() })
      installed = true
      // Leave real-time synchronization active through the public menus.
    },
    async observe() {
      return { installed, controlled, setupElapsed, attackAdvanceFrames, attackHoverFrames,
        boundary: await page.evaluate(readPacingBoundary) }
    },
    async holdAtMissionSelector() {
      assert.ok(installed && !controlled && !driving)
      const check = state => {
        assert.ok(state.startupVisible && !state.readyWorld,
          'Clock setup must start in the public mission selector, before the World')
      }
      const before = await page.evaluate(readMissionSelector)
      check(before)
      await page.clock.pauseAt(before.pageTimeMs + holdLeadMs)
      controlled = true
      const after = await page.evaluate(readMissionSelector)
      check(after)
      return { before, after }
    },
    async holdPaused({ turn, actorId }) {
      assert.ok(installed && controlled && !driving)
      const before = await page.evaluate(readPacingBoundary)
      const check = observed => {
        assert.ok(observed.readyScene && observed.paused, 'Clock hold requires the real ready paused World')
        assert.equal(observed.turn, turn, 'Clock hold may not move the public paused turn')
        assert.deepEqual(observed.selected, [actorId], 'Clock hold may not change the public selection')
        assert.equal(observed.inputMask, 0, 'Clock hold may not inherit a startup input lock')
      }
      check(before)
      const slackTurns = followerCorpseAttackTurn - before.turn
      assert.ok(Number.isInteger(slackTurns) && slackTurns > 0,
        `Public pause at turn ${before.turn} left no slack before attack turn ${followerCorpseAttackTurn}`)
      const after = await page.evaluate(readPacingBoundary)
      check(after)
      assert.equal(after.pendingTime, before.pendingTime, 'Paused presentation cannot change pending World time')
      return { before, after, slackTurns }
    },
    async drive(action) {
      if (!controlled || driving) return action()
      driving = true
      try {
        let settled = false
        const result = Promise.resolve().then(action)
        const signal = result.then(() => { settled = true }, () => { settled = true })
        while (!settled) await advanceSetupFrame(() => settled)
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
        attackAdvanceFrames++
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
