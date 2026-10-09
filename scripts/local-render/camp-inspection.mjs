import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { hoverInput } from './tree-hover-input.mjs'
import { createMission1VaultInput } from './mission1-vault-input.mjs'
import { checkpointObservation, readCommittedCheckpoint } from './checkpoint-observer.mjs'
import { waitForCheckpointReadback } from '../checkpoint-readback.mjs'
import { installHutTooltipWitness } from './hut-tooltip-witness.mjs'
import { campStartup, assertCampStartup, campGround, selectCampPlan, assertCampPlacement, campCompletion, assertEmptyCampPanel } from './camp-inspection-input.mjs'
import { enterHutMission, closeHutMenu, assertHutAdmission, installHutCheckpointBoundary,
  installHutSelectionClear, assertHutCheckpointRestore, finishHutHandles, assertHutInspectionLifecycle, readHutPanelControl } from './hut-tooltip-input.mjs'

// No automatic replay: input, picking, startup and interrupted-flow failures are
// preserved as prerequisites, not converted into controller failures or passes.
export default async function campInspection({ page, root, output, receipt, signal }) {
  const startedAt = Date.now(), deadlineAt = startedAt + 300000
  let startup = true, tail = false, witness, checkpoint, selection, failed = false, failure
  const report = { status: 'running', declaration: { mission: 2, ground: { x: -99, z: -105 }, hud: 'Blast', startupMs: 60000, episodeMs: 300000,
    constructionMs: 180000, reservedTailMs: 60000,
    witnessPhaseMs: 12000, inheritedHelperWaitMs: 45000, panelHoverVisits: 24,
    maxRecords: 8192, maxCaptureGroups: 8, noRetries: true },
    actions: [], preparations: [], checkpoints: [], limits: 'Completed initially empty Mission 2 camp, ordinary current-browser behavior on the accepted existing flyby-tick mapping. Per-tick marker snapshots retain actual allocated feedback; direct onSound dispatch and audible output are unobserved. No native wall-time or full pool equivalence, textless positive HUD, unnamed-object coverage, forced/HUD-overlap guarantee, off-target held release, or hardware performance claim.' }
  const save = () => {
    for (const [label, group] of Object.entries(report.observation?.frames ?? {}))
      for (const [kind, frame] of Object.entries(group)) if (frame?.png?.startsWith('data:')) {
        const match = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(frame.png)
        assert.ok(match, 'Natural canvas PNG required')
        const file = `${label}-${kind}.png`
        writeFileSync(resolve(output, file), Buffer.from(match[1], 'base64')); frame.png = file
      }
    writeFileSync(resolve(output, 'camp-inspection.json'), JSON.stringify(report, null, 2) + '\n')
  }
  const remaining = (maximum = 12000) => {
    signal.throwIfAborted()
    const left = (startup ? Math.min(deadlineAt, startedAt + 60000) : tail ? deadlineAt : deadlineAt - report.declaration.reservedTailMs) - Date.now()
    assert.ok(left > 0, 'Ordinary camp episode deadline exhausted')
    return Math.min(maximum, left)
  }
  const action = async (label, run) => {
    remaining(); report.actions.push({ label, at: Date.now(), phase: 'before' }); save()
    await run(); remaining(); report.actions.push({ label, at: Date.now(), phase: 'after' }); save()
  }
  const status = async () => {
    const value = await witness.evaluate(api => api.status())
    assert.deepEqual(value.errors, []); report.latest = value; save(); return value
  }
  const wait = async (kind, arg) => {
    await page.waitForFunction(({ api, kind, arg }) => {
      const value = api.status()
      if (value.errors.length) throw Error(value.errors.join('\n'))
      const state = value.epochs.at(-1)?.state
      if (kind === 'capture') return value.captures[arg] === true
      if (kind === 'record') return state?.records.some(row => row.id === arg)
      if (kind === 'panel-held') {
        const record = state?.records.find(row => row.id === arg.id)
        if (!record || record.identity !== arg.identity) throw Error('Same-camp record expired/replaced during control hover')
        return state.panels.some(panel => panel.id === arg.id && !panel.hidden && panel.controlHovered) &&
          record.phase === 1 && record.remaining > 0 && value.phasePanelControlInput === arg.id &&
          value.phasePanelControlTicks[arg.id] >= arg.minimum
      }
      if (kind === 'record-expired') return state && !state.records.some(row => row.id === arg) && state.heldPointer === null
      if (kind === 'published-pick') return state?.input?.route === 'world' && state.input.object?.id === arg.id &&
        state.input.pointer?.clientX === arg.x && state.input.pointer?.clientY === arg.y
      if (kind === 'inspection') {
        const events = value.phaseInspections
        if (events.some(event => event === 'cancel-stale' || event.startsWith('explicit:rejected')))
          throw Error(`Actual camp inspection rejected: ${events.join(', ')}`)
        return events.includes('release') && events.some(event => event === 'explicit:created' || event === 'explicit:reused')
      }
      return false
    }, { api: witness, kind, arg }, { timeout: remaining(), polling: 25 })
    return status()
  }
  const phase = (label, capture = null) => witness.evaluate((api, { label, capture }) => api.phase(label, capture), { label, capture })
  const naturalBoundary = async prepared => {
    await page.waitForFunction(before => {
      const scene = window.testSceneRef.current
      return scene.frame !== before.sceneFrame && scene.renderer.info.render.frame > before.rendererFrame
    }, prepared, { timeout: remaining() })
    const boundary = await page.evaluate(() => {
      const scene = window.testSceneRef.current
      return { sceneFrame: scene.frame, rendererFrame: scene.renderer.info.render.frame, turn: scene.world.turn }
    })
    report.preparations.push({ kind: 'later-natural-render', prepared, boundary }); save()
  }
  const point = async target => {
    const prepared = await page.evaluate(hoverInput, { target })
    report.preparations.push({ kind: 'diagnostic-hover-pick', prepared }); save()
    assert.ok(prepared.point, 'No owned integer 5x5 target interior')
    await naturalBoundary(prepared)
    return prepared.point
  }
  const clear = async () => {
    selection = await page.evaluateHandle(installHutSelectionClear, { mission: 2 })
    await action('Escape clears selection', () => page.keyboard.press('Escape'))
    const result = await selection.evaluate(api => api.close()); await selection.dispose(); selection = null
    report.selectionClear = result; save()
    assert.ok(result.event?.trusted && result.event.modifiers.every(value => !value))
    assert.deepEqual(result.event.after.selected, []); assert.equal(result.event.after.mode, null)
    for (const key of ['turn', 'lastOrderTurn', 'randomState', 'orders']) assert.deepEqual(result.event.after[key], result.event.before[key])
  }
  const boundary = async kind => {
    checkpoint = await page.evaluateHandle(installHutCheckpointBoundary, { kind })
    const menu = page.locator('dialog.game-dialog')
    await action(kind === 'save' ? 'Save checkpoint' : 'Load checkpoint', () => menu.getByRole('button', {
      name: kind === 'save' ? 'Save checkpoint' : 'Load checkpoint', exact: true }).click({ timeout: remaining() }))
    const observed = await checkpoint.evaluate(api => api.read())
    assert.deepEqual(observed.errors, []); assert.ok(observed.admitted && observed.captured)
    const typed = await page.evaluate(checkpointObservation, { observationName: observed.observationName })
    report.checkpoints.push({ ...observed, typed }); save()
    const cleanup = await checkpoint.evaluate(api => api.close()); await checkpoint.dispose(); checkpoint = null
    assert.deepEqual(cleanup.errors, [])
    return { ...observed, typed }
  }
  try {
    assert.equal(receipt.profile, undefined, 'This finite one-page Save/Load episode uses an ephemeral context')
    page.setDefaultTimeout(60000)
    witness = await installHutTooltipWitness(page, { deadlineAt, maxRecords: report.declaration.maxRecords, buildingRecordPrefix: 'building', observeConstruction: true })
    report.readiness = await enterHutMission({ page, root, remaining: () => remaining(60000), action, mission: 2 })
    startup = false; page.setDefaultTimeout(12000)
    report.startup = await page.evaluate(campStartup); save(); assertCampStartup(report.startup)
    const preTailDeadline = deadlineAt - report.declaration.reservedTailMs
    let input = createMission1VaultInput({ page, signal, report, save, originalShamanId: report.startup.shaman[0].id, deadlineAt: preTailDeadline })
    await input.settle()
    await input.view(report.declaration.ground)
    const ground = await page.evaluate(campGround, { preferred: report.declaration.ground, deadlineAt: preTailDeadline })
    report.preparations.push({ kind: 'clone-safe-camp-placement', ground }); save()
    await naturalBoundary(ground)
    report.selectedWorkers = await selectCampPlan({ page, action, remaining }); save()
    await phase('place-camp')
    await action('Place camp once on rendered ground', () => page.mouse.click(ground.x, ground.y))
    report.placement = assertCampPlacement(await witness.evaluate(api => api.read().records.filter(row => row.phase === 'place-camp')), ground)
    const hut = { ...report.placement.camp, kind: 'building' }
    await witness.evaluate((api, id) => api.target(id), hut.id)
    save()
    await phase('natural-construction')
    const constructionDeadline = Math.min(preTailDeadline, Date.now() + report.declaration.constructionMs)
    const completionSource = campCompletion.toString()
    await page.waitForFunction(({ api, target, source }) => {
      const value = api.status()
      if (value.errors.length) throw Error(value.errors.join('\n'))
      return (0, eval)(`(${source})`)(value.epochs.at(-1)?.state, target)
    }, { api: witness, target: hut, source: completionSource }, { timeout: Math.max(1, constructionDeadline - Date.now()), polling: 100 })
    remaining()
    report.completed = (await status()).epochs.at(-1).state
    assert.ok(campCompletion(report.completed, hut)); save()
    assert.ok(Date.now() <= preTailDeadline, 'Construction must leave the declared 60-second tail reserve')
    tail = true
    input = createMission1VaultInput({ page, signal, report, save, originalShamanId: report.startup.shaman[0].id, deadlineAt })
    await clear()
    await action('Spells tab', () => page.getByLabel('spells 1–3', { exact: true }).click({ timeout: remaining() }))
    const palette = JSON.parse(readFileSync(resolve(root, 'app/original-tooltips.json'), 'utf8'))
    const stringId = palette.names[2][7][0], text = palette.strings[stringId]
    assert.equal(stringId, 912); assert.ok(text.startsWith('Warrior Training Hut:'))
    report.description = { type: 2, model: 7, stringId, text }; save()
    const named = { kind: 'named-object', id: hut.id, text }
    const blast = page.getByRole('button', { name: /^Blast, \d+ shots$/ })
    const hoverBlast = async label => {
      const rect = await blast.boundingBox(); assert.ok(rect, 'Actual named Blast HUD control unavailable')
      await phase(label, label === 'blast-history' ? 'blast' : null)
      await action('Hover named Blast HUD', () => page.mouse.move(Math.round(rect.x + rect.width / 2), Math.round(rect.y + rect.height / 2)))
    }
    await hoverBlast('blast-history'); await wait('capture', 'blast-history')
    await page.screenshot({ path: resolve(output, 'blast-history-composite.png'), timeout: remaining() })
    await input.view(hut)
    assertHutAdmission((await status()).epochs.at(-1).state, 2)
    const initial = await point(hut)
    await phase('camp-initial', named)
    await action('Acquire completed empty camp hover', () => page.mouse.move(initial.x, initial.y))
    await wait('capture', 'camp-initial'); await wait('record', hut.id)
    assertEmptyCampPanel(await witness.evaluate(api => api.read().frames['camp-initial']), hut.id)
    await page.screenshot({ path: resolve(output, 'camp-initial-composite.png'), timeout: remaining() })
    const inspection = await input.entityPoint('buildings', hut.id, null)
    report.preparations.push({ kind: 'explicit-inspection', inspection }); save()
    assert.equal(inspection.rejection, null)
    const before = await page.evaluate(() => { const s = window.testSceneRef.current; return { sceneFrame: s.frame, rendererFrame: s.renderer.info.render.frame } })
    await naturalBoundary(before); await phase('explicit-inspection')
    await action('Move to current constructed camp inspection point', () => page.mouse.move(inspection.x, inspection.y))
    await wait('published-pick', { id: hut.id, x: inspection.x, y: inspection.y })
    await action('Stationary right-button inspection', async () => {
      await page.mouse.down({ button: 'right' })
      try { remaining() } finally { await page.mouse.up({ button: 'right' }) }
    })
    const inspected = await wait('inspection'); assertHutInspectionLifecycle(inspected)
    const inspectedState = inspected.epochs.at(-1).state
    const inspectedRecord = inspectedState.records.find(record => record.id === hut.id)
    assert.ok(inspectedRecord); assert.equal(inspectedRecord.automatic, false, 'Initially empty camp uses observed manual record acquisition')
    const control = await page.evaluate(readHutPanelControl, hut.id)
    report.preparations.push({ kind: 'same-camp-control', control }); save()
    await phase('panel-control-hold')
    await action('Hover same-camp control without activating it', () => page.mouse.move(control.x, control.y))
    report.panelControlHold = await wait('panel-held', { id: hut.id, identity: inspectedRecord.identity,
      minimum: report.declaration.panelHoverVisits })
    await page.screenshot({ path: resolve(output, 'panel-control-held-composite.png'), timeout: remaining() })
    await hoverBlast('leave-to-blast')
    report.panelAfterLeave = await wait('record-expired', hut.id)
    await input.view(hut); const returned = await point(hut)
    await phase('camp-return', named)
    await action('Reacquire constructed camp', () => page.mouse.move(returned.x, returned.y))
    await wait('capture', 'camp-return')
    await phase('menu-hidden', 'modal-hidden')
    await action('Game settings', () => page.getByRole('button', { name: 'Game settings', exact: true }).click({ timeout: remaining() }))
    await page.locator('dialog.game-dialog').waitFor({ state: 'visible', timeout: remaining() })
    await wait('capture', 'menu-hidden')
    const saved = await boundary('save')
    let committed
    assert.equal(await waitForCheckpointReadback(async () => {
      remaining(); committed = await readCommittedCheckpoint(page)
      return committed?.checkpointSha256 === saved.typed.checkpointSha256
    }, { attempts: 100, pause: async () => { remaining(); await page.waitForTimeout(100) } }), true,
    'Raw typed committed Save must match the exact save publication')
    report.committed = committed; save()
    await closeHutMenu({ page, remaining, action })
    await input.view(hut); const resumed = await point(hut)
    await phase('after-close', named)
    await action('Hover constructed camp after close and resume', () => page.mouse.move(resumed.x, resumed.y))
    await wait('capture', 'after-close')
    await action('Game settings before Load', () => page.getByRole('button', { name: 'Game settings', exact: true }).click({ timeout: remaining() }))
    await page.locator('dialog.game-dialog').waitFor({ state: 'visible', timeout: remaining() })
    await phase('public-load')
    const loaded = await boundary('load')
    assertHutCheckpointRestore(committed, loaded.typed)
    assert.deepEqual(loaded.reservations, [], 'restoreSecondaryEffects clears transient saved reservations at migration')
    const { bindGame } = await import(pathToFileURL(resolve(root, 'scripts/browser-game.mjs')).href)
    await bindGame(page); await input.settle()
    report.loadedTarget = await page.evaluate(id => {
      const b = window.testSceneRef.current.world.buildings.find(b => b.id === id)
      return b && { id: b.id, x: b.x, z: b.z, anchor: b.anchor, kind: b.kind, hp: b.hp, progress: b.progress }
    }, hut.id)
    save(); assert.equal(report.loadedTarget?.kind, 'camp'); assert.deepEqual(report.loadedTarget.anchor, hut.anchor)
    const loadStatus = await status()
    assert.equal(loadStatus.epochs.length, 2); assert.equal(loadStatus.epochs[0].disposed, true)
    assert.equal(loadStatus.epochs[1].initial.sessionIdentity, loadStatus.epochs[0].initial.sessionIdentity)
    assert.deepEqual(loadStatus.epochs[1].initial.session, loadStatus.epochs[0].state.session,
      'Load retains the exact page-session sample/cache without advancing it between scenes')
    assert.deepEqual(loadStatus.epochs[1].initial.records, [])
    assert.equal(loadStatus.epochs[1].state.paused, false, 'Public Load automatically resumes')
    await input.view(report.loadedTarget); const loadedPoint = await point({ ...report.loadedTarget, kind: 'building' })
    await phase('after-load', named)
    await action('Hover constructed camp after public Load', () => page.mouse.move(loadedPoint.x, loadedPoint.y))
    await wait('capture', 'after-load')
    assertEmptyCampPanel(await witness.evaluate(api => api.read().frames['after-load']), hut.id)
    assert.equal((await status()).epochs.at(-1).state.heldPointer, null, 'Episode tail has no held inspection owner')
    report.unsupportedHistory = [...new Set(report.latest.epochs.flatMap(epoch => epoch.state?.controller?.unsupportedHistory ?? []))]
    report.finalCommitted = await readCommittedCheckpoint(page)
    assert.equal(report.finalCommitted.checkpointSha256, committed.checkpointSha256)
    await page.screenshot({ path: resolve(output, 'after-load-composite.png'), timeout: remaining() })
    assert.deepEqual(receipt.errors, [])
    report.status = 'observed-pending-controller-and-pixel-review'
  } catch (error) { failed = true; failure = error; report.status = 'failed'; report.failure = String(error?.stack ?? error) }
  finally { await finishHutHandles([['checkpointCleanup', checkpoint], ['selectionCleanup', selection], ['observation', witness]], report, save, { failed, failure }) }
  return report
}
