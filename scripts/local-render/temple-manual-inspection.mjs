import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import templeTrainingAuto from './temple-training-auto.mjs'
import { templeManualBounds } from './temple-manual-witness.mjs'
import { assertTempleManualObservation } from './temple-manual-contract.mjs'
import { createMission1VaultInput } from './mission1-vault-input.mjs'

export function createTempleManualSteps({ output }) {
  let remainingMs = templeManualBounds.totalMs
  const run = async (mode, context, action) => {
    const { page, signal, report, save, deadlineAt, shamanId } = context,
      started = Date.now(),
      end = Math.min(deadlineAt, started + templeManualBounds.segmentMs, started + remainingMs)
    const input = createMission1VaultInput({
      page,
      signal,
      report,
      save,
      originalShamanId: shamanId,
      deadlineAt: end,
    })
    let installed = false,
      evidence,
      failure,
      failed = false,
      rightDown = false
    const entry = { mode, status: 'running', bounds: templeManualBounds, actions: [] }
    ;(report.manual ??= {})[mode] = entry
    const wait = async predicate => {
      for (;;) {
        signal.throwIfAborted()
        assert(Date.now() < end, `Manual ${mode} segment exceeded its shared finite budget`)
        const status = await page.evaluate(() => window.templeManual.status())
        assert.deepEqual(status.errors, [])
        entry.latest = status
        if (predicate(status)) return status
        assert(!status.closed, 'Manual observer closed before the required endpoint')
        await page.waitForTimeout(25)
      }
    }
    const act = (label, callback) => input.action(`manual-${mode}-${label}`, callback)
    const down = async () => {
      await page.evaluate(() => window.templeManual.armInput())
      rightDown = true
      await act('right-down', () => page.mouse.down({ button: 'right' }))
    }
    const up = async () => {
      await act('right-up', () => page.mouse.up({ button: 'right' }))
      rightDown = false
      await page.evaluate(() => window.templeManual.finishInput())
    }
    try {
      await page.evaluate(
        async ({ mode }) => {
          if (window.templeManual) throw Error('Previous manual observer still owns the Scene')
          const { createTempleManualObservation } =
            await import('/scripts/local-render/temple-manual-witness.mjs')
          window.templeManual = createTempleManualObservation({
            scene: window.testSceneRef.current,
            snapshot: () => window.templeTraining.snapshot(),
            mode,
          })
        },
        { mode }
      )
      installed = true
      await action({ ...context, input, wait, act, down, up, end, entry })
      await wait(status => status.complete === mode)
    } catch (error) {
      failed = true
      failure = error
      entry.failure = String(error?.stack ?? error)
    } finally {
      entry.cleanupErrors = []
      if (rightDown)
        try {
          await up()
        } catch (error) {
          entry.cleanupErrors.push(String(error?.stack ?? error))
        }
      if (installed)
        try {
          evidence = await page.evaluate(() => {
            const owner = window.templeManual
            try {
              return owner.take()
            } finally {
              if (window.templeManual === owner) delete window.templeManual
            }
          })
          entry.observation = evidence
        } catch (error) {
          entry.cleanupErrors.push(String(error?.stack ?? error))
        }
      remainingMs -= Date.now() - started
      entry.elapsedMs = Date.now() - started
      entry.remainingMs = remainingMs
      entry.status = failed || entry.cleanupErrors.length ? 'failed' : 'observed'
      save()
    }
    if (failed) throw failure
    assert.deepEqual(entry.cleanupErrors, [])
    assertTempleManualObservation(evidence)
    if (mode === 'approach') {
      assert(evidence.initial.turn <= entry.dispatch.before.turn)
      assert(evidence.creation.before.turn >= entry.dispatch.after.turn)
      assert.deepEqual(
        [evidence.input.events[0].x, evidence.input.events[0].y],
        [entry.hit.x, entry.hit.y]
      )
    }
    entry.status = 'passed'
    if (evidence.firstFrame) {
      writeFileSync(
        resolve(output, 'temple-manual-first-panel.png'),
        Buffer.from(evidence.firstFrame.panel.split(',')[1], 'base64')
      )
    }
    save()
    return evidence
  }
  return {
    budgetMs: templeManualBounds.totalMs,
    async idle(context) {
      return run(
        'expiry',
        context,
        async ({ page, input, targetId, wait, act, down, up, end, entry }) => {
          await input.view(context.target)
          await input.button('spells 1–3')
          // An actual supported HUD visit changes category; Escape alone does not.
          await act('hover-Blast', () =>
            page
              .locator('[data-tooltip-hud="blast"]')
              .hover({ timeout: Math.max(1, end - Date.now()) })
          )
          await wait(status => status.category === 'hud')
          const hit = await input.entityPoint('buildings', targetId, null)
          entry.hit = hit
          assert.equal(hit.rejection, null)
          await act('hover-Temple', () => page.mouse.move(hit.x, hit.y))
          await wait(status => status.frame)
          // Preserve naturally rendered first presentation before product assertions.
          await page.screenshot({ path: resolve(output, 'temple-manual-first.png') })
          await down()
          await wait(status => status.reused)
          const away = await page.evaluate(
            ({ x, y, targetId }) => {
              const scene = window.testSceneRef.current,
                canvas = scene.renderer.domElement,
                rect = canvas.getBoundingClientRect()
              // Vertical right-drag keeps the existing camera rotation unchanged.
              for (const candidate of [rect.bottom - 120, rect.top + 120, y + 220, y - 220]) {
                const point = { clientX: x, clientY: Math.round(candidate) }
                if (
                  Math.abs(point.clientY - y) < 100 ||
                  point.clientY <= rect.top ||
                  point.clientY >= rect.bottom
                )
                  continue
                if (
                  document.elementFromPoint(point.clientX, point.clientY) === canvas &&
                  scene.picking.pick(point) !== targetId
                )
                  return { x: point.clientX, y: point.clientY }
              }
              throw Error('No owned vertical off-target point for ordinary held input')
            },
            { x: hit.x, y: hit.y, targetId }
          )
          entry.away = away
          await act('held-departure', () => page.mouse.move(away.x, away.y))
          await wait(status => status.heldVisits >= 4)
          await page.screenshot({ path: resolve(output, 'temple-manual-held.png') })
          await up()
          await wait(status => status.complete === 'expiry')
          await page.screenshot({ path: resolve(output, 'temple-manual-released.png') })
        }
      )
    },
    async approach(context) {
      return run(
        'approach',
        context,
        async ({ page, targetId, hit, dispatch, wait, act, down, up, entry }) => {
          // Attach before the real command. The validated training click leaves
          // the pointer at this target; the actual right event proves its pick.
          assert.equal(hit.id, targetId)
          assert.equal(hit.rejection, null)
          entry.hit = hit
          entry.dispatch = await dispatch()
          await act('clear-selection', () => page.keyboard.press('Escape'))
          await wait(status => status.selectedCount === 0)
          await down()
          await wait(status => status.created)
          await up()
          // Actual approach/entry produces the terminal callback. Pointer stays on
          // this Temple so ordinary controller renewals retain the manual record.
          await wait(status => status.complete === 'approach')
        }
      )
    },
  }
}

export default function templeManualInspection(context) {
  return templeTrainingAuto(context, null, createTempleManualSteps(context))
}
