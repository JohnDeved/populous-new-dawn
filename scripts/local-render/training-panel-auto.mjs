import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import campInspection from './camp-inspection.mjs'
import { closeHutMenu, assertHutCheckpointRestore } from './hut-tooltip-input.mjs'
import { readCommittedCheckpoint } from './checkpoint-observer.mjs'
import { waitForCheckpointReadback } from '../checkpoint-readback.mjs'
import { trainingReadiness, assertSingleTrainingInput, assertAutomaticRequest, assertAutomaticLifecycle } from './training-panel-input.mjs'

// The existing finite camp driver owns startup, construction, errors and cleanup.
// This continuation is the only difference after actual construction departure.
export default function trainingPanelAuto(options) {
  return campInspection({ ...options, trainingTail })
}

export async function trainingTail({ page, root, output, report, witness, remaining, action, status, phase,
  clear, boundary, point, input, save, hut }) {
  report.declaration.training = { selectedBraves: 1, readinessMs: 12000, activeHoldVisits: 4,
    conservativeFundingSeconds: 25, tailMs: 60000, naturalClockOnly: true }
  report.limits = 'Ordinary Mission2 construction and one-Brave automatic-training panel ownership. '
    + 'Native wall time, physical secondary slots, full frontend ordering, audio and hardware performance remain unproved.'
  assert.equal(report.placement.recipients.length, 9, 'Reuse the accepted nine-Brave construction episode')
  await clear()
  await action('Spells tab', () => page.getByLabel('spells 1–3', { exact: true }).click({ timeout: remaining() }))
  const settings = page.getByRole('button', { name: 'Game settings', exact: true })
  const menu = page.locator('dialog.game-dialog')
  // Resolve the real public Save control before starting a short active window.
  await action('Check public Save control before training', () => settings.click({ timeout: remaining() }))
  await menu.waitFor({ state: 'visible', timeout: remaining() })
  assert.equal(await menu.getByRole('button', { name: 'Save checkpoint', exact: true }).isEnabled(), true)
  await closeHutMenu({ page, remaining, action })
  await input.view(hut)
  const target = await point(hut)
  const blast = await page.getByRole('button', { name: /^Blast, \d+ shots$/ }).boundingBox()
  assert.ok(blast)
  const away = { x: Math.round(blast.x + blast.width / 2), y: Math.round(blast.y + blast.height / 2) }
  await action('Move to named HUD away from camp', () => page.mouse.move(away.x, away.y))
  const wait = async (kind, epoch = 1, maximum = 12000) => {
    await page.waitForFunction(({ api, id, kind, epoch }) => {
      const value = api.status()
      if (value.errors.length) throw Error(value.errors.join('\n'))
      const state = value.epochs.find(row => row.id === epoch)?.state
      if (!state) return false
      const record = state.records.find(row => row.id === id)
      if (kind === 'empty') return !record && !state.training.latches.includes(id) &&
        !state.panels.some(panel => panel.id === id) && state.training.camps.find(b => b.id === id)?.reservationCount === 0
      if (kind === 'held') {
        const rows = api.read().records.filter(row => row.kind === 'tick' && row.epoch === epoch)
        return rows.filter(row => row.after.records.some(record => record.id === id && record.automatic &&
          record.phase === 1 && record.remaining === 15) && row.after.input?.object?.id !== id).length >= 4
      }
      if (kind === 'pixels') return value.captures['automatic-active'] === true
      if (kind === 'released') return state.training.trained > 0 &&
        !(state.training.camps.find(b => b.id === id)?.admission.activity & 128) && !record &&
        !state.training.latches.includes(id) && state.training.camps.find(b => b.id === id)?.reservationCount === 0 &&
        !state.panels.some(panel => panel.id === id)
      return false
    }, { api: witness, id: hut.id, kind, epoch }, { timeout: remaining(maximum), polling: 25 })
    return status()
  }
  await phase('before-training'); await wait('empty')
  await action('Select one ordinary Brave', () => page.getByLabel('Select brave', { exact: true }).click({ timeout: remaining() }))
  report.trainingReadiness = await page.evaluate(trainingReadiness, { id: hut.id }); save()
  const ready = report.trainingReadiness
  assert.equal(ready.level, 2); assert.equal(ready.speed, 1); assert.equal(ready.paused, false)
  assert.equal(ready.selected.length, 1); assert.ok(ready.braves.includes(ready.selected[0]))
  assert.ok(ready.braves.length >= 9); assert.equal(ready.warriors.length, 0); assert.equal(ready.shaman.length, 1)
  assert.equal(ready.singleCost, 3500); assert.ok(ready.generatedMana >= 82)
  await phase('train-one-brave')
  await action('Click completed camp once and leave to HUD', async () => {
    await page.mouse.click(target.x, target.y)
    await page.mouse.move(away.x, away.y)
  })
  report.trainingInput = assertSingleTrainingInput(await witness.evaluate(api => api.read().records), hut, target); save()
  await wait('held')
  const requests = await witness.evaluate(api => api.read().records.filter(row => row.kind === 'automatic-training-request'))
  report.initialAutomaticRecord = assertAutomaticRequest(requests[0], hut.id)
  await phase('automatic-active', 'training-panel')
  await wait('pixels')
  const frame = await witness.evaluate(api => api.read().frames['automatic-active'])
  assert.equal(frame.panel.id, hut.id); assert.equal(frame.panel.hidden, false)
  assert.match(frame.panel.label, /^Warrior training: 1 of 5 occupants;/); assert.ok(frame.panel.png)
  await page.screenshot({ path: resolve(output, 'automatic-active-composite.png'), timeout: remaining() })
  await action('Pause active training in Game settings', () => settings.click({ timeout: remaining() }))
  await menu.waitFor({ state: 'visible', timeout: remaining() })
  const paused = await status(), pausedState = paused.epochs[0].state
  assert.ok(pausedState.training.camps.find(b => b.id === hut.id).admission.activity & 128)
  assert.equal(pausedState.training.trained, ready.trained, 'Save must capture active pre-conversion training')
  const options = { trainingTargetId: hut.id }, saved = await boundary('save', options)
  let committed
  assert.equal(await waitForCheckpointReadback(async () => {
    remaining(); committed = await readCommittedCheckpoint(page, options)
    return committed?.checkpointSha256 === saved.typed.checkpointSha256
  }, { attempts: 100, pause: async () => { remaining(); await page.waitForTimeout(100) } }), true,
  'Typed committed checkpoint must exactly match the actual Save publication')
  const afterSave = await status()
  assert.equal(afterSave.epochs.length, 1)
  assert.equal(afterSave.epochs[0].state.records.find(row => row.id === hut.id).identity,
    report.initialAutomaticRecord.identity, 'Save preserves the current Scene record')
  report.committed = committed; save()
  await phase('public-load')
  const loaded = await boundary('load', options)
  assertHutCheckpointRestore(committed, loaded.typed)
  assert.equal(loaded.typed.trainingSha256, committed.trainingSha256, 'Typed active training gameplay survives public Load')
  assert.deepEqual(loaded.reservations, [])
  const { bindGame } = await import(pathToFileURL(resolve(root, 'scripts/browser-game.mjs')).href)
  await bindGame(page)
  const restored = await status()
  assert.equal(restored.epochs.length, 2); assert.equal(restored.epochs[0].disposed, true)
  assert.deepEqual(restored.epochs[1].initial.records, [])
  assert.deepEqual(restored.epochs[1].initial.training.latches, [])
  assert.deepEqual(restored.epochs[1].initial.training.reservations, [])
  assert.equal(restored.epochs[1].initial.sessionIdentity, restored.epochs[0].initial.sessionIdentity)
  assert.deepEqual(restored.epochs[1].initial.session, restored.epochs[0].state.session)
  await phase('restored-natural-training')
  await wait('released', 2, 35000)
  const observed = await witness.evaluate(api => api.read())
  report.lifecycle = assertAutomaticLifecycle(observed.records, hut.id, 2, ready.trained)
  report.finalCommitted = await readCommittedCheckpoint(page, options)
  assert.equal(report.finalCommitted.checkpointSha256, committed.checkpointSha256)
  await page.screenshot({ path: resolve(output, 'automatic-released-composite.png'), timeout: remaining() })
  save()
}
