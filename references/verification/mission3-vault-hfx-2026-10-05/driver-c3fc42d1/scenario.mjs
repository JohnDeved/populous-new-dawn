import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { installVaultWitness } from './witness.mjs'
import { readVaultCheckpoint, installVaultLoadWitness } from './checkpoint.mjs'

export default async function vaultWorldRow({ page, root, output, openMission, receipt, signal }) {
  const baseline = process.env.PND_VAULT_BASELINE === '1', preflight = process.env.PND_VAULT_PREFLIGHT === '1',
    hash = path => createHash('sha256').update(readFileSync(path)).digest('hex'),
    report = { source: receipt.source, baseline, preflight, status: 'running', actions: [], captures: {},
      driverSha256: hash(new URL(import.meta.url)), witnessSha256: hash(new URL('./witness.mjs', import.meta.url)),
      checkpointHelperSha256: hash(new URL('./checkpoint.mjs', import.meta.url)),
      clock: 'Unmodified requestAnimationFrame and full production Scene.animate at ordinary game speed 1',
      limits: 'Mission 3 bank-p Temple world marker/body/glow. Software/headless pixels; no native raster, allocation, absolute cadence, or class2 screen-sequence claim.' }
  const save = () => writeFileSync(resolve(output, 'vault-world-row.json'), JSON.stringify(report, null, 2) + '\n')
  const wait = async (predicate, timeout = 30000) => {
    signal.throwIfAborted()
    await page.waitForFunction(predicate, null, { polling: 25, timeout })
  }
  const button = async name => {
    signal.throwIfAborted()
    await page.getByRole('button', { name, exact: true }).click()
    report.actions.push({ control: name, at: new Date().toISOString() })
  }
  const capture = async name => {
    const data = await page.evaluate(() => {
      const s = window.testSceneRef.current, e = window.vaultEvidence,
        g = s.shrineMeshes.get(e.vaultId).g.userData.vaultKnowledgeMarker,
        rect = s.renderer.domElement.getBoundingClientRect(), p = s.view.screen(g.position, s.camera)
      return { ...window.readVaultWitness(), camera: { position: { ...s.cameraPosition }, bearing: s.cameraBearing },
        viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
        anchor: { x: rect.x + (p.x + 1) * rect.width / 2, y: rect.y + (1 - p.y) * rect.height / 2 },
        renderer: s.renderer.getContext().getParameter(s.renderer.getContext().RENDERER) }
    })
    assert.equal(data.state.paused, true)
    report.captures[name] = data
    await page.screenshot({ path: resolve(output, `${name}.png`) })
    const x = Math.max(0, Math.min(data.viewport.width - 320, Math.floor(data.anchor.x - 160))),
      y = Math.max(0, Math.min(data.viewport.height - 280, Math.floor(data.anchor.y - 200)))
    await page.screenshot({ path: resolve(output, `${name}-detail.png`), clip: { x, y, width: 320, height: 280 } })
    save()
  }
  let installed = false
  const finishWitness = async epoch => {
    const pixels = await page.evaluate(() => window.vaultRenderedPixels ?? {}).catch(() => ({}))
    report.firstRenderedPixels ??= {}
    for (const [stage, uri] of Object.entries(pixels)) {
      const bytes = Buffer.from(uri.slice('data:image/png;base64,'.length), 'base64'), filename = `${epoch}-${stage}-first-real-frame.png`
      writeFileSync(resolve(output, filename), bytes)
      report.firstRenderedPixels[`${epoch}-${stage}`] = { filename, sha256: createHash('sha256').update(bytes).digest('hex') }
    }
    const witness = await page.evaluate(() => window.restoreVaultWitness()).catch(error => ({ errors: [String(error)], restored: false }))
    if (witness.errors.length || !witness.restored) report.status = 'failed'
    report.witnesses ??= {}
    report.witnesses[epoch] = witness
    report.witness = witness
    installed = false
  }
  try {
    await openMission(3)
    const { bindGame, waitForShamanReadiness } = await import(pathToFileURL(resolve(root, 'scripts/browser-game.mjs')).href)
    report.readiness = await waitForShamanReadiness(page)
    await button('Pause game')
    await page.evaluate(installVaultWitness)
    installed = true
    await button('Resume game')
    await wait(() => !!window.vaultEvidence.stages.preflight?.postRender)
    const pilot = await page.evaluate(() => window.vaultEvidence.stages.preflight)
    assert.equal(pilot.afterTurn.turn, pilot.beforeTurn.turn + 1)
    assert.ok(pilot.postRender.state.turn >= pilot.afterTurn.turn)
    assert.equal(pilot.postRender.state.paused, false)
    await button('Pause game')
    assert.equal(pilot.postRender.state.gift, undefined)
    report.preflightWitness = pilot
    await button('Select and focus shaman')
    const navigateToVault = async () => {
      // Ordinary minimap click owns camera movement. Enumeration uses the existing
      // pure minimap inverse, never scene.screen/nativePosition/terrain syncing.
      await wait(() => {
        const s = window.testSceneRef.current
      return !s.cameraMotion.active && !s.resultCamera.active && !s.viewTransition
      })
      const map = await page.evaluate(async () => {
        const s = window.testSceneRef.current, vault = s.world.shrines.find(h => h.id === window.vaultEvidence.vaultId),
          { minimapPick } = await import('/app/minimap.ts'), rect = s.mini.getBoundingClientRect(),
          width = s.mini.width, height = s.mini.height,
          center = { x: Math.round((s.viewPoint.x + 8) * 256), y: Math.round((-s.viewPoint.z - 8) * 256) },
          target = { x: Math.round((vault.x + 8) * 256), y: Math.round((-vault.z - 8) * 256) },
          heading = Math.round(s.cameraBearing * 1024 / Math.PI), wrap = n => n << 16 >> 16
        let best = null
        for (let y = 2; y < height - 2; y++) for (let x = 2; x < width - 2; x++) {
          const native = minimapPick(width, height, center, heading, { x, y }),
            distance = Math.hypot(wrap(native.x - target.x), wrap(native.y - target.y)),
            point = { x: rect.x + x / width * rect.width, y: rect.y + y / height * rect.height }
          if ((!best || distance < best.distance) && document.elementFromPoint(point.x, point.y) === s.mini)
            best = { ...point, native, distance }
        }
        if (!best || best.distance > 2048) throw Error('No owned minimap target within eight world units')
      return best
      })
      await page.mouse.click(map.x, map.y)
      await page.mouse.move(500, 800)
      report.actions.push({ action: 'ordinary-minimap-click', ...map })
      await wait(() => !window.testSceneRef.current.cameraMotion.active)
      return map
    }
    await navigateToVault()
    await capture('marker-before')
    if (baseline || preflight) {
      report.status = 'passed'
      return report
    }
    assert.equal(report.captures['marker-before'].marker.family, 'hfx')
    assert.equal(report.captures['marker-before'].marker.body, 1079)
    assert.ok(report.captures['marker-before'].marker.glow.frame >= 1417)
    // Save a nonzero introduced cursor through shipped UI, then observe Load
    // synchronously before its normal auto-resume and later Scene rendering.
    for (let attempt = 0; attempt < 3; attempt++) {
      if (await page.evaluate(() => window.readVaultWitness().state.shrine.glow.f1 !== 0)) break
      await button('Resume game')
      await wait(() => window.readVaultWitness().state.shrine.glow.f1 !== 0)
      await button('Pause game')
    }
    const savedState = await page.evaluate(() => window.readVaultWitness().state)
    assert.notEqual(savedState.shrine.glow.f1, 0)
    await button('Game settings')
    await button('Save checkpoint')
    const { waitForCheckpointReadback } = await import(pathToFileURL(resolve(root, 'scripts/checkpoint-readback.mjs')).href)
    let saved
    assert.equal(await waitForCheckpointReadback(async () => {
      signal.throwIfAborted()
      saved = await page.evaluate(readVaultCheckpoint)
      return saved?.turn === savedState.turn && saved?.level === 3
    }), true)
    assert.deepEqual(saved.glow, savedState.shrine.glow)
    assert.equal(saved.active, true); assert.equal(saved.temple, false); assert.equal(saved.gifts, 0)
    await finishWitness('preload')
    assert.equal(report.status, 'running', 'Preload witness must restore cleanly')
    await page.reload({ waitUntil: 'domcontentloaded' })
    const startup = page.getByRole('dialog', { name: 'Start game', exact: true })
    await startup.waitFor({ state: 'visible' })
    await page.evaluate(installVaultLoadWitness)
    await startup.getByRole('button', { name: 'Load Game', exact: true }).click()
    const boundary = await page.evaluate(() => ({ loaded: window.vaultLoadedBoundary, error: window.vaultLoadedError }))
    assert.equal(boundary.error, null); assert.deepEqual(boundary.loaded, saved)
    await bindGame(page)
    await button('Pause game')
    await page.evaluate(installVaultWitness); installed = true
    await page.evaluate(() => { window.vaultEvidence.arm = null })
    report.checkpoint = { saved, preActivation: boundary.loaded,
      laterLiveState: await page.evaluate(() => window.readVaultWitness().state),
      scope: 'Same ephemeral browser context; ordinary page reload and public Load Game. No cross-process persistence claim.' }
    await button('Select and focus shaman')
    await navigateToVault()
    await capture('marker-after-load')
    assert.equal(report.captures['marker-after-load'].marker.visible, true)
    assert.equal(report.captures['marker-after-load'].marker.body, 1079)
    const selected = await page.evaluate(() => [...window.testSceneRef.current.world.selected])
    assert.equal(selected.length, 1)
    const hit = await page.evaluate(() => {
      const s = window.testSceneRef.current, id = window.vaultEvidence.vaultId,
        g = s.shrineMeshes.get(id).g, r = s.renderer.domElement.getBoundingClientRect(), p = s.view.screen(g.position, s.camera),
        x = r.x + (p.x + 1) * r.width / 2, y = r.y + (1 - p.y) * r.height / 2
      if (s.overviewActive) throw Error('Ground camera required')
      // Existing input picker caches geometry only. No simulation helpers run.
      for (let dy = -100; dy <= 48; dy += 4) for (let dx = -64; dx <= 64; dx += 4) {
        const point = { clientX: x + dx, clientY: y + dy }
        if (document.elementFromPoint(point.clientX, point.clientY) === s.renderer.domElement && s.picking.pick(point) === id)
          return { x: point.clientX, y: point.clientY, id }
      }
      throw Error('No actual visible Vault hit')
    })
    await page.evaluate(() => { window.vaultEvidence.arm = 'birth' })
    await button('Resume game')
    await page.mouse.click(hit.x, hit.y)
    await page.mouse.move(500, 800)
    report.actions.push({ action: 'ordinary-Vault-order', selected, hit })
    await wait(() => !!window.vaultEvidence.stages.birth?.postRender, 300000)
    await button('Pause game')
    await capture('host-paused-after-birth')
    let stages = await page.evaluate(() => window.vaultEvidence.stages)
    assert.deepEqual([stages.birth.afterTurn.gift.remaining, stages.birth.afterTurn.gift.phase], [82, 6])
    assert.equal(stages.birth.postRender.gift.body, 1079)
    assert.equal(stages.birth.postRender.gift.visible, true)
    assert.ok(stages.birth.postRender.gift.glow.frame >= 1417 && stages.birth.postRender.gift.glow.frame <= 1430)
    assert.equal(stages.birth.postRender.marker.visible, false)
    if (!(await page.evaluate(() => !!window.vaultEvidence.stages.retirement?.postRender))) {
      await button('Resume game')
      await wait(() => !!window.vaultEvidence.stages.retirement?.postRender)
      await button('Pause game')
    }
    await capture('world-body-glow-retired')
    stages = await page.evaluate(() => window.vaultEvidence.stages)
    assert.equal(stages.retirement.afterTurn.turn - stages.birth.afterTurn.turn, 6)
    assert.equal(stages.retirement.afterTurn.gift.remaining, 76)
    assert.equal(stages.retirement.postRender.gift.visible, false)
    assert.equal(stages.retirement.afterTurn.temple, false)
    if (!(await page.evaluate(() => !!window.vaultEvidence.stages.payout?.postRender))) {
      await button('Resume game')
      await wait(() => !!window.vaultEvidence.stages.payout?.postRender)
      await button('Pause game')
    }
    await capture('temple-knowledge-paid')
    stages = await page.evaluate(() => window.vaultEvidence.stages)
    assert.equal(stages.payout.beforeTurn.gift.remaining, 1)
    assert.equal(stages.payout.beforeTurn.temple, false)
    assert.equal(stages.payout.afterTurn.turn - stages.birth.afterTurn.turn, 82)
    assert.equal(stages.payout.afterTurn.temple, true)
    assert.equal(stages.payout.afterTurn.gift, undefined)
    report.status = 'passed'
    return report
  } catch (error) {
    report.status = 'failed'; report.failure = String(error.stack ?? error); throw error
  } finally {
    if (installed) {
      await finishWitness('acquisition')
    }
    await page.evaluate(() => window.restoreVaultLoadWitness?.()).catch(() => {})
    save()
    if (report.status === 'passed') assert.deepEqual(report.witness.errors, [])
    else if (!report.failure) throw Error('Witness cleanup failed; see retained report')
  }
}
