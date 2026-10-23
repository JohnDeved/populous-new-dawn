import { clearPortraitSelection } from '../browser-portrait-input.mjs'
import { readPortraitReadiness, waitForPortraitReadiness } from '../browser-portrait-readiness.mjs'
import { skipIntroductionWithSpace } from '../browser-introduction.mjs'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

// Short ordinary-control regression for #194. No victory fixture or game mutation
// is needed to test fresh-document and same-document scene binding lifetimes.
export default async function ({ page, root, output, receipt, signal }) {
  const { bindGame, showAllMissions } =
    await import(pathToFileURL(resolve(root, 'scripts/browser-game.mjs')).href)
  const { waitForCheckpointReadback } =
    await import(pathToFileURL(resolve(root, 'scripts/checkpoint-readback.mjs')).href)
  const report = {
    scenarioSha256: createHash('sha256').update(readFileSync(new URL(import.meta.url))).digest('hex'),
    portraitInputs: Object.fromEntries(['scripts/browser-portrait-input.mjs', 'scripts/browser-world-input.mjs',
      'scripts/browser-space-ownership.mjs', 'scripts/browser-portrait-readiness.mjs', 'scripts/campaign-portrait-readiness.mjs']
      .map(file => [file, createHash('sha256').update(readFileSync(resolve(root, file))).digest('hex')])),
    method: 'Ordinary buttons and real RAF; readonly scene/store and committed IDB observation.',
    limits: 'Checker lifecycle only; no mission victory, native parity or hardware-performance claim.',
    steps: [],
  }
  const save = () => writeFileSync(resolve(output, 'readiness-lifecycle.json'), JSON.stringify(report, null, 2) + '\n')
  const button = name => page.getByRole('button', { name, exact: true }).click()
  const snapshot = () => page.evaluate(() => {
    const scene = window.testSceneRef.current, world = scene.world
    return {
      level: world.outcome.level, turn: world.turn, status: world.status,
      paused: world.paused, inputMask: world.inputMask, selected: [...world.selected],
      sceneStoreMatch: world === window.testStore.getWorld(),
      blue: world.units.filter(u => u.team === 'blue' && u.hp > 0).map(u => [u.id, u.kind]),
      stats: structuredClone(world.stats), shots: structuredClone(world.shots),
      missionSpecificAlias: typeof window.missionTwoObserveReady,
      legacyAlias: typeof window.campaignObserveShaman,
    }
  })
  const stage = async (name, action) => {
    signal.throwIfAborted()
    const step = { name, startedAt: new Date().toISOString(), status: 'running' }
    report.steps.push(step); save()
    try {
      step.evidence = await action()
      step.status = 'passed'
      step.finishedAt = new Date().toISOString()
      await page.screenshot({ path: resolve(output, `${report.steps.length}-${name}.png`) })
      save()
    } catch (error) {
      step.status = 'failed'; step.error = error.stack; save(); throw error
    }
  }
  const readyAfterOrdinaryIntroduction = async expectedLevel => {
    await bindGame(page)
    await page.waitForFunction(() => !!(window.testSceneRef.current.world.flyby.flags & 1) || !window.testSceneRef.current.world.inputMask)
    await skipIntroductionWithSpace(page, { timeout: 45000 })
    const readiness = await waitForPortraitReadiness(page, { timeout: 60000, signal })
    assert.equal(readiness.after.level, expectedLevel)
    await clearPortraitSelection(page, { signal })
    await button('Select shaman')
    const observed = await snapshot()
    assert.equal(observed.sceneStoreMatch, true)
    assert.ok(observed.selected.includes(readiness.after.shaman.id))
    assert.equal(observed.missionSpecificAlias, 'undefined')
    assert.equal(observed.legacyAlias, 'undefined')
    return { readiness, observed }
  }

  await stage('first-document-ready', async () => {
    await showAllMissions(page)
    await button('Mission 3')
    return readyAfterOrdinaryIntroduction(3)
  })
  await stage('repeated-current-binding', async () => {
    const before = await snapshot(), first = await readPortraitReadiness(page), second = await readPortraitReadiness(page)
    assert.equal(first.ready, true); assert.equal(second.ready, true)
    assert.equal(first.level, 3); assert.equal(second.level, 3)
    const after = await snapshot()
    assert.deepEqual(after.selected, before.selected)
    assert.equal(after.sceneStoreMatch, true)
    return { before, first, second, after }
  })

  let saved
  await stage('committed-ordinary-save', async () => {
    await button('Menu')
    await page.locator('dialog[data-original-pause-menu]').waitFor({ state: 'visible' })
    saved = await snapshot()
    assert.equal(saved.paused, true)
    await button('Save Game')
    await button('Save checkpoint')
    const committed = await waitForCheckpointReadback(() => page.evaluate(async expected => {
      const request = indexedDB.open('populous-new-dawn', 1)
      const db = await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
      try {
        const read = db.transaction('checkpoints', 'readonly').objectStore('checkpoints').get('latest')
        const value = await new Promise((resolve, reject) => {
          read.onsuccess = () => resolve(read.result)
          read.onerror = () => reject(read.error)
        })
        return value?.world?.turn === expected.turn &&
          value.world.outcome.level === expected.level &&
          JSON.stringify(value.world.units.filter(u => u.team === 'blue' && u.hp > 0).map(u => [u.id, u.kind])) === JSON.stringify(expected.blue)
      } finally { db.close() }
    }, saved))
    assert.equal(committed, true)
    return { saved, committed }
  })
  await stage('fresh-page-load-ready', async () => {
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.getByRole('dialog', { name: 'Main menu', exact: true }).waitFor({ state: 'visible' })
    const emptyBindings = await page.evaluate(() => ({ scene: typeof window.testSceneRef, mission: typeof window.missionTwoObserveReady, legacy: typeof window.campaignObserveShaman }))
    assert.deepEqual(emptyBindings, { scene: 'undefined', mission: 'undefined', legacy: 'undefined' })
    await button('Load Game')
    // No prior bind or installed function is assumed after the real page reload.
    const readiness = await waitForPortraitReadiness(page, { timeout: 60000, signal })
    assert.equal(readiness.after.level, 3)
    await clearPortraitSelection(page, { signal })
    await button('Select shaman')
    const observed = await snapshot()
    assert.equal(observed.sceneStoreMatch, true)
    assert.ok(observed.selected.includes(readiness.after.shaman.id))
    assert.ok(observed.turn >= saved.turn)
    for (const [id, kind] of saved.blue) assert.ok(observed.blue.some(u => u[0] === id && u[1] === kind))
    // The normal post-load turns may charge stock or complete AI construction.
    // This lifecycle check records those values rather than requiring frozen time.
    assert.equal(observed.missionSpecificAlias, 'undefined')
    assert.equal(observed.legacyAlias, 'undefined')
    return { emptyBindings, savedTurn: saved.turn, readiness, observed }
  })
  await stage('same-document-scene-replacement', async () => {
    const previousScene = await page.evaluateHandle(() => window.testSceneRef.current)
    try {
      await button('Menu')
      await page.locator('dialog[data-original-pause-menu]').waitFor({ state: 'visible' })
      await button('Options')
      await button('Browser compatibility and help')
      await page.locator('dialog[data-original-pause-menu]').getByRole('button', { name: 'Select Level', exact: true }).click()
      await showAllMissions(page)
      await button('Mission 2')
      const evidence = await readyAfterOrdinaryIntroduction(2)
      const replaced = await page.evaluate(previous => ({ scene: previous !== window.testSceneRef.current, world: previous.world !== window.testSceneRef.current.world }), previousScene)
      assert.deepEqual(replaced, { scene: true, world: true })
      const repeated = await readPortraitReadiness(page)
      assert.equal(repeated.level, 2)
      assert.equal(repeated.ready, true)
      return { ...evidence, replaced, repeated }
    } finally { await previousScene.dispose() }
  })
  await page.locator('.world-viewport').press('Space')
  const final = await snapshot()
  assert.equal(final.paused, true)
  assert.equal(final.level, 2)
  assert.equal(receipt.errors.length, 0, 'No diagnostic alias or application browser errors')
  report.final = final; report.status = 'passed'; save()
  return report
}
