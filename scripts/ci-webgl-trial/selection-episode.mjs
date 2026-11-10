import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'
export async function runSelectionEpisode({ browser, sourceRoot, output, expectedCommit }) {
  assert.equal(expectedCommit, 'cd967306e82d42d60f731e1d90e808e46b7fa00e')
  const { bindGame } = await import(pathToFileURL(resolve(sourceRoot, 'scripts/browser-game.mjs')))
  const { openCampaignFromMainMenu } = await import(pathToFileURL(resolve(sourceRoot, 'scripts/browser-new-game.mjs')))
  const { collapseObservedCampaignMessages } = await import(pathToFileURL(resolve(sourceRoot, 'scripts/public-keyboard-owner.mjs')))
  mkdirSync(output, { recursive: false })
  const report = { status: 'running', expectedCommit, cases: [], images: [], errors: [], warnings: [], cleanup: [] }
  const save = () => writeFileSync(resolve(output, 'receipt.json'), JSON.stringify(report, null, 2))
  let context, stage = 'setup', mode
  try {
    for (mode of ['held-release', 'failed']) {
      context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, serviceWorkers: 'block', acceptDownloads: false })
      let heldRoute, count = 0, aborted = false, failedRequest = false, assetError = false
      await context.route('**/*', async route => {
        const u = new URL(route.request().url())
        if (u.origin !== 'http://127.0.0.1:5198') { report.errors.push({ mode, stage, text: 'Unexpected external origin ' + u.origin }); await route.abort(); return }
        if (u.pathname === '/original/selection.png') {
          count++; assert.equal(count, 1)
          if (mode === 'failed') { await route.abort('failed'); aborted = true }
          else heldRoute = route
          return
        }
        await route.continue()
      })
      const page = await context.newPage()
      page.setDefaultTimeout(15000); page.setDefaultNavigationTimeout(25000)
      page.on('pageerror', e => report.errors.push({ kind: 'pageerror', mode, stage, text: String(e) }))
      page.on('requestfailed', request => {
        if (new URL(request.url()).pathname === '/original/selection.png') {
          failedRequest = true
          report.cases.push({ name: 'selection-request-failed', mode, stage, url: request.url(), failure: request.failure() })
        }
      })
      page.on('console', m => {
        const record = { kind: 'console', mode, stage, text: m.text(), location: m.location() }
        if (mode === 'failed' && m.type() === 'error' && /^Texture load failed: selection(?:\s|$)/.test(m.text())) assetError = true
        if (m.type() === 'error') report.errors.push(record)
        if (m.type() === 'warning') report.warnings.push(record)
      })
      const button = name => page.getByRole('button', { name, exact: true })
      const observe = () => page.evaluate(() => {
        const scene = window.testSceneRef.current, world = window.testStore.getWorld()
        const gl = scene.renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info')
        return { selected: [...world.selected], paused: world.paused, mode: world.mode, level: world.outcome.level,
          renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
          arrows: [...scene.unitMeshes].filter(([id]) => world.selected.includes(id)).map(([id, g]) => {
            const a = g.userData.selection
            return { id, visible: a.visible, image: !!a.material.map?.image, version: a.material.map?.version,
              scale: a.scale.toArray(), center: a.center.toArray() }
          }) }
      })
      const shot = async name => {
        const state = await observe(); assert.match(state.renderer, /SwiftShader/i)
        const bytes = await page.screenshot({ type: 'png', fullPage: false, timeout: 15000 })
        assert.ok(bytes.length < 12*1024*1024); assert.ok(report.images.length < 3)
        const file = name+'.png'; writeFileSync(resolve(output,file), bytes)
        report.images.push({ name:file, bytes:bytes.length, sha256:createHash('sha256').update(bytes).digest('hex'),state }); save()
      }
      stage = 'public-entry'
      const response = await page.goto('http://127.0.0.1:5198/', { waitUntil: 'domcontentloaded' }); assert.equal(response.status(),200)
      await openCampaignFromMainMenu(page); await button('Start Mission 1').click(); await bindGame(page)
      await page.waitForFunction(() => window.testStore.getWorld().flyby.flags & 1 || !window.testStore.getWorld().inputMask)
      if (await page.evaluate(() => !!window.testStore.getWorld().inputMask)) await page.getByRole('button',{name:/Skip introduction/}).click()
      await page.waitForFunction(() => !window.testStore.getWorld().inputMask)
      await button('Pause game').click(); await page.waitForFunction(() => window.testStore.getWorld().paused)
      await collapseObservedCampaignMessages(page)
      await page.getByLabel('Island battlefield. Click to select, right-click to move, drag to select a group.',{exact:true}).click({position:{x:250,y:200}})
      await page.waitForFunction(() => {
        const s=window.testSceneRef.current,w=window.testStore.getWorld()
        return w.selected.length && w.selected.every(id=>s.unitMeshes.get(id)?.userData.selection)
      })
      stage = mode+'-selected'
      assert.equal(count,1)
      if (mode === 'failed') {
        // Await actual transport failure and the application's loader-error callback.
        // A still-pending request is not failed-image acceptance.
        const deadline = Date.now() + 10000
        while (!(aborted && failedRequest && assetError) && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 25))
        assert.equal(aborted, true); assert.equal(failedRequest, true); assert.equal(assetError, true)
        report.cases.push({ name: 'confirmed-failure-witness', mode, aborted, failedRequest, assetError })
      }
      const before = await observe(); assert.ok(before.arrows.length)
      assert.ok(before.arrows.every(a=>!a.image && !a.visible))
      await shot(mode+'-hidden')
      if (mode === 'held-release') {
        assert.ok(heldRoute)
        await button('Game settings').click()
        const menu=page.getByRole('dialog',{name:'Game menu',exact:true}); await menu.waitFor({state:'visible'})
        stage='released-during-modal'; await heldRoute.continue(); heldRoute=null
        await page.waitForFunction(() => [...window.testSceneRef.current.unitMeshes.values()].some(g=>g.userData.selection?.material.map?.image))
        report.cases.push({ name:'loaded-during-modal-no-immediate-visibility-claim', state:await observe() })
        await menu.getByRole('button',{name:'Continue Game',exact:true}).click(); await menu.waitFor({state:'hidden'})
        stage='resumed-presentation'
        await page.waitForFunction(() => {
          const s=window.testSceneRef.current,w=window.testStore.getWorld()
          return w.selected.some(id=>s.unitMeshes.get(id)?.userData.selection?.visible)
        })
        const after=await observe(); assert.deepEqual(after.selected,before.selected); assert.equal(after.paused,true)
        assert.ok(after.arrows.every(a=>a.image)); assert.ok(after.arrows.some(a=>a.visible))
        report.cases.push({name:'held-to-loaded-after-modal-return',before,after}); await shot('released-visible')
      } else report.cases.push({name:'failed-image-selected-hidden',before})
      await context.close(); context=null; report.cleanup.push({mode,closed:true}); save()
    }
    // Failure scenario deliberately aborts only selection.png. Preserve every diagnostic;
    // accept only its resource-load and explicit asset-load console errors.
    const unexpected=report.errors.filter(e=>!(e.kind==='console' && e.mode==='failed' && (/^Texture load failed: selection(?:\s|$)/.test(e.text) || (/Failed to load resource/.test(e.text) && e.location?.url?.endsWith('/original/selection.png')))))
    assert.deepEqual(unexpected,[]); assert.equal(report.images.length,3)
    report.status='passed-awaiting-pixel-review'
  } catch(e) { report.status='failed'; report.failure=e.stack??String(e); throw e }
  finally { if(context) {await context.close();report.cleanup.push({mode,closed:true,failure:true})} save() }
  return report
}
