import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { installVaultWitness } from './witness.mjs'

export default async function vaultWorldRow({ page, root, output, openMission, receipt, signal }) {
  const baseline = process.env.PND_VAULT_BASELINE === '1', preflight = process.env.PND_VAULT_PREFLIGHT === '1',
    hash = path => createHash('sha256').update(readFileSync(path)).digest('hex'),
    report = { source: receipt.source, baseline, preflight, status: 'running', actions: [], captures: {},
      driverSha256: hash(new URL(import.meta.url)), witnessSha256: hash(new URL('./witness.mjs', import.meta.url)),
      clock: 'Unmodified requestAnimationFrame and full production Scene.animate at ordinary game speed 1',
      limits: 'Mission 3 bank-p Temple world marker/body/glow. Software/headless pixels; no native raster, allocation, absolute cadence, or class2 screen-sequence claim.' }
  const save = () => writeFileSync(resolve(output, 'vault-world-row.json'), JSON.stringify(report, null, 2) + '\n')
  const wait = async (predicate, timeout = 30000) => {
    signal.throwIfAborted()
    await page.waitForFunction(predicate, null, { polling: 100, timeout })
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
  try {
    await openMission(3)
    const { waitForShamanReadiness } = await import(pathToFileURL(resolve(root, 'scripts/browser-game.mjs')).href)
    report.readiness = await waitForShamanReadiness(page)
    await button('Pause game')
    await page.evaluate(installVaultWitness)
    installed = true
    await button('Resume game')
    await wait(() => !!window.vaultEvidence.stages.preflight?.postRender)
    const pilot = await page.evaluate(() => window.vaultEvidence.stages.preflight)
    assert.equal(pilot.afterTurn.turn, pilot.beforeTurn.turn + 1)
    assert.equal(pilot.postRender.state.turn, pilot.afterTurn.turn)
    assert.equal(pilot.postRender.state.paused, true)
    assert.equal(pilot.postRender.state.gift, undefined)
    report.preflightWitness = pilot
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
    await capture('marker-before')
    if (baseline || preflight) {
      report.status = 'passed'
      return report
    }
    assert.equal(report.captures['marker-before'].marker.family, 'hfx')
    assert.equal(report.captures['marker-before'].marker.body, 1079)
    assert.ok(report.captures['marker-before'].marker.glow.frame >= 1417)
    await button('Select and focus shaman')
    // Focus changes the camera; return using exactly the same public minimap path.
    // The selected Shaman is retained by minimap navigation.
    await wait(() => !window.testSceneRef.current.cameraMotion.active)
    // Use the same destination through a native minimap coordinate recomputation.
    const selected = await page.evaluate(() => [...window.testSceneRef.current.world.selected])
    assert.equal(selected.length, 1)
    const mapAgain = await page.evaluate(async target => {
      const s = window.testSceneRef.current, { minimapPick } = await import('/app/minimap.ts'), r = s.mini.getBoundingClientRect(),
        c = { x: Math.round((s.viewPoint.x + 8) * 256), y: Math.round((-s.viewPoint.z - 8) * 256) },
        heading = Math.round(s.cameraBearing * 1024 / Math.PI), short = n => n << 16 >> 16
      let best = null
      for (let y = 2; y < s.mini.height - 2; y++) for (let x = 2; x < s.mini.width - 2; x++) {
        const n = minimapPick(s.mini.width, s.mini.height, c, heading, { x, y }),
          distance = Math.hypot(short(n.x - target.x), short(n.y - target.y)),
          p = { x: r.x + x / s.mini.width * r.width, y: r.y + y / s.mini.height * r.height }
        if ((!best || distance < best.distance) && document.elementFromPoint(p.x, p.y) === s.mini) best = { ...p, distance }
      }
      if (!best || best.distance > 2048) throw Error('Second minimap target unavailable')
      return best
    }, map.native)
    await page.mouse.click(mapAgain.x, mapAgain.y)
    await page.mouse.move(500, 800)
    await wait(() => !window.testSceneRef.current.cameraMotion.active)
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
    await capture('collected-body-glow')
    let stages = await page.evaluate(() => window.vaultEvidence.stages)
    assert.deepEqual([stages.birth.afterTurn.gift.remaining, stages.birth.afterTurn.gift.phase], [82, 6])
    assert.equal(stages.birth.postRender.gift.body, 1079)
    assert.equal(stages.birth.postRender.gift.glow.frame, 1417)
    assert.equal(stages.birth.postRender.marker.visible, false)
    await page.evaluate(() => { window.vaultEvidence.arm = 'retirement' })
    await button('Resume game')
    await wait(() => !!window.vaultEvidence.stages.retirement?.postRender)
    await capture('world-body-glow-retired')
    stages = await page.evaluate(() => window.vaultEvidence.stages)
    assert.equal(stages.retirement.afterTurn.turn - stages.birth.afterTurn.turn, 6)
    assert.equal(stages.retirement.afterTurn.gift.remaining, 76)
    assert.equal(stages.retirement.postRender.gift.visible, false)
    assert.equal(stages.retirement.afterTurn.temple, false)
    await page.evaluate(() => { window.vaultEvidence.arm = 'payout' })
    await button('Resume game')
    await wait(() => !!window.vaultEvidence.stages.payout?.postRender)
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
      report.witness = await page.evaluate(() => window.restoreVaultWitness()).catch(error => ({ errors: [String(error)], restored: false }))
      if (report.witness.errors.length || !report.witness.restored) report.status = 'failed'
    }
    save()
    if (report.status === 'passed') assert.deepEqual(report.witness.errors, [])
  }
}
