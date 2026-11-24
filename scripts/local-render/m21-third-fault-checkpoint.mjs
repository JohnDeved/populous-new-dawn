import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { checkpointObservation } from './checkpoint-observer.mjs'
import { minimapPick } from '../../app/minimap.ts'

// Run twice with the same --profile/origin/source and separate output paths.
// First run saves via UI and exits; the third uses shipped Load Game.
export default async function ({ page, root, output, receipt, openMission, observeCheckpoint, signal }) {
  assert.ok(receipt.profile, 'This scenario requires --profile')
  const { bindGame, waitForShamanReadiness } = await import(pathToFileURL(resolve(root, 'scripts/browser-game.mjs')).href)
  const { waitForCheckpointReadback } = await import(pathToFileURL(resolve(root, 'scripts/checkpoint-readback.mjs')).href)
  const method = 'Ordinary UI and real RAF only. Committed IndexedDB and store subscription are read-only observations. No world/tick/storage injection.'
  if (receipt.profile.mode === 'created') {
    assert.equal(receipt.profile.checkpointAtStart, null)
    await openMission(21)
    const { collapseCampaignMessages } = await import(pathToFileURL(resolve(root, 'scripts/browser-game.mjs')).href)
    await collapseCampaignMessages(page)
    if (await page.getByRole('button', {name:'Resume game',exact:true}).isVisible()) await page.getByRole('button',{name:'Resume game',exact:true}).click()
    const readiness = await waitForShamanReadiness(page, {timeout:90000})
    receipt.scope = 'Mission 21 unsealed third fault on real RAF, public Save and persistent browser-restart Load. Not earned-Bridge UI or full mission acceptance.'
    await page.screenshot({path:resolve(output,'opening.png')})
    await page.waitForFunction(() => window.testStore.getWorld().turn >= 8060,null,{timeout:780000})
    receipt.before = await page.evaluate(() => {const w=window.testStore.getWorld();return {turn:w.turn,state:w.campaignAIs[1].variables[24],volcanoes:w.effects.filter(e=>e.volcano&&e.x===85&&e.z===53).map(e=>e.id)}})
    assert.ok(receipt.before.turn < 8127)
    assert.equal(receipt.before.state,0)
    assert.deepEqual(receipt.before.volcanoes,[])
    await page.getByRole('button',{name:'Pause game',exact:true}).click()
    await focusFault(page,receipt)
    await page.screenshot({path:resolve(output,'before-third-eruption.png')})
    await page.getByRole('button',{name:'Resume game',exact:true}).click()
    await page.waitForFunction(() => window.testStore.getWorld().campaignAIs[1].variables[24]===1,null,{timeout:15000})
    await page.getByRole('button',{name:'Pause game',exact:true}).click()
    receipt.eruption = await page.evaluate(() => {const w=window.testStore.getWorld();return {turn:w.turn,state:w.campaignAIs[1].variables[24],volcanoes:w.effects.filter(e=>e.volcano&&e.x===85&&e.z===53).map(e=>({id:e.id,remaining:e.volcano.remaining})),warnings:w.messages.slots.filter(m=>m?.view?.cell===49754).map(m=>({view:m.view,lifetime:m.lifetime}))}})
    assert.equal(receipt.eruption.state,1)
    assert.equal(receipt.eruption.volcanoes.length,1)
    assert.ok(receipt.eruption.volcanoes[0].remaining>0)
    assert.equal(receipt.eruption.warnings.length,1)
    await page.screenshot({path:resolve(output,'third-eruption.png')})
    await page.getByRole('button',{name:'Resume game',exact:true}).click()
    await page.waitForFunction(()=>window.testStore.getWorld().turn>=8176,null,{timeout:15000})
    await page.getByRole('button',{name:'Pause game',exact:true}).click()
    const continuing=await page.evaluate(()=>{const w=window.testStore.getWorld();return w.effects.filter(e=>e.volcano&&e.x===85&&e.z===53).map(e=>e.id)})
    assert.deepEqual(continuing,receipt.eruption.volcanoes.map(e=>e.id))
    await page.screenshot({path:resolve(output,'third-eruption-active.png')})
    await page.getByRole('button', { name: 'Game settings', exact: true }).click()
    const menu = page.locator('dialog[data-original-pause-menu]')
    await menu.waitFor({ state: 'visible' })
    const savedTurn = await page.evaluate(() => window.testStore.getWorld().turn)
    await menu.getByRole('button', { name: 'Save Game', exact: true }).click()
    await menu.getByRole('button', { name: 'Save checkpoint', exact: true }).click()
    let observed
    assert.equal(await waitForCheckpointReadback(async () => {
      signal.throwIfAborted()
      observed = await observeCheckpoint('UI save committed')
      return observed.checkpoint?.turn === savedTurn && observed.checkpoint?.level === 21
    }), true, 'Shipped Save must commit the paused checkpoint')
    await page.screenshot({ path: resolve(output, 'saved-settings.png') })
    return { phase: 'saved-before-browser-termination', method, readiness, saved: observed }
  }
  const saved = receipt.profile.checkpointAtStart
  assert.ok(saved && saved.level === 21, 'Restart proof needs the first run’s genuine Mission 21 save')
  assert.ok(receipt.profile.previousRun.cleanupVerified)
  // Capture the replacement synchronously, before normal Load auto-resume and
  // asynchronous scene readiness can advance real turns. Only observe, never pause
  // or replace the world through the model/store API.
  await page.evaluate(() => {
    const main = document.querySelector('main')
    let fiber = main[Object.keys(main).find(key => key.startsWith('__reactFiber'))], store
    for (; fiber && !store; fiber = fiber.return)
      for (let hook = fiber.memoizedState; hook; hook = hook.next)
        if (hook.memoizedState?.getWorld && hook.memoizedState?.subscribe) { store = hook.memoizedState; break }
    if (!store) throw Error('Store unavailable before public Load')
    const before = store.getWorld()
    window.restartCheckpointBoundary = null
    window.restartCheckpointObservationError = null
    const unsubscribe = store.subscribe(() => {
      const w = store.getWorld()
      if (w === before) return
      try { window.restartCheckpointBoundary = { version: 4, world: structuredClone(w) } }
      catch (error) { window.restartCheckpointObservationError = String(error) }
      finally { unsubscribe() }
    })
  })
  await page.getByRole('dialog', { name: 'Main menu', exact: true }).getByRole('button', { name: 'Load Game', exact: true }).click()
  assert.equal(await page.evaluate(() => window.restartCheckpointObservationError), null, 'Load-boundary observer must not interfere with shipped resume')
  const loaded = await page.evaluate(checkpointObservation, { observationName: 'restartCheckpointBoundary' })
  for (const key of ['level', 'turn', 'time', 'checkpointSha256', 'actorsSha256', 'terrainSha256', 'stockSha256']) assert.deepEqual(loaded[key], saved[key], `Load boundary ${key} must match the committed save`)
  await bindGame(page)
  const resumed = await page.evaluate(() => ({ turn: window.testStore.getWorld().turn, paused: window.testStore.getWorld().paused }))
  assert.equal(resumed.paused, false, 'Shipped Load resumes the normal clock')
  await page.waitForFunction(turn => window.testStore.getWorld().turn > turn, saved.turn)
  await page.getByRole('button', { name: 'Pause game', exact: true }).click()
  await page.screenshot({ path: resolve(output, 'loaded-paused.png') })
  receipt.loadedCameraClick=await focusFault(page,receipt)
  await page.screenshot({path:resolve(output,'loaded-third-eruption.png')})
  const active=await page.evaluate(()=>{const w=window.testStore.getWorld();return {turn:w.turn,ids:w.effects.filter(e=>e.volcano&&e.x===85&&e.z===53).map(e=>e.id)}})
  const savedIds=await page.evaluate(()=>window.restartCheckpointBoundary.world.effects.filter(e=>e.volcano&&e.x===85&&e.z===53).map(e=>e.id))
  assert.equal(savedIds.length,1,'Save retained exactly one third Volcano')
  assert.deepEqual(active.ids,savedIds,'Persistent Load must retain the same active third Volcano')
  receipt.loadedActive=active
  const savedMessageSerial=await page.evaluate(()=>window.restartCheckpointBoundary.world.messages.nextSerial)
  await page.getByRole('button',{name:'Resume game',exact:true}).click()
  await page.waitForFunction(()=>window.testStore.getWorld().turn>=8236,null,{timeout:15000})
  await page.getByRole('button',{name:'Pause game',exact:true}).click()
  assert.deepEqual(await page.evaluate(()=>window.testStore.getWorld().effects.filter(e=>e.volcano&&e.x===85&&e.z===53).map(e=>e.id)),savedIds)
  await page.screenshot({path:resolve(output,'third-eruption-peak.png')})
  await page.getByRole('button',{name:'Resume game',exact:true}).click()
  await page.waitForFunction(()=>window.testStore.getWorld().turn>=8316,null,{timeout:45000})
  await page.getByRole('button',{name:'Pause game',exact:true}).click()
  receipt.expired=await page.evaluate(()=>{const w=window.testStore.getWorld();return {turn:w.turn,state:w.campaignAIs[1].variables[24],ids:w.effects.filter(e=>e.volcano&&e.x===85&&e.z===53).map(e=>e.id),warnings:w.messages.slots.filter(m=>m?.view?.cell===49754).length,messageSerial:w.messages.nextSerial}})
  assert.equal(receipt.expired.state,2)
  assert.deepEqual(receipt.expired.ids,[])
  // Real RAF expires messages through stepMessages; direct tick tests do not.
  assert.equal(receipt.expired.warnings,0,'The real-time warning expires normally')
  assert.equal(receipt.expired.messageSerial,savedMessageSerial,'No warning or other message was replayed after Load')
  await page.screenshot({path:resolve(output,'after-third-eruption.png')})
  const observed = await observeCheckpoint('After shipped Load')
  assert.equal(observed.checkpoint.checkpointSha256, saved.checkpointSha256, 'Loading must not replace the committed save')
  return { phase: 'loaded-after-browser-restart', method, saved, loaded, resumed, normalAutoResume: true, priorRun: receipt.profile.previousRun.runId }
}

// Pure map projection finds a public minimap click; the camera changes only via UI.
async function focusFault(page, receipt, stage = 0) {
  const geometry = await page.evaluate(() => {
    const nativePoint = p => ({ x: Math.round((p.x + 8) * 256) & 65535, y: Math.round((-p.z - 8) * 256) & 65535 })
    const scene = window.testSceneRef.current, w = scene.world
    const u = {x:85,z:53}, id = 370
    return { id, goal: nativePoint(u), center: nativePoint(scene.viewPoint), width: scene.mini.width, height: scene.mini.height,
      heading: Math.round(scene.cameraBearing * 1024 / Math.PI),
      before: { viewPoint: { ...scene.viewPoint }, inputMask: w.inputMask, messageModal: !!scene.messageModal } }
  })
  // Production serves bundled application assets, not /app TypeScript URLs.
  // Run the same pure projection on the host, then hit-test its candidates in DOM.
  const delta = (a, b) => ((a - b + 32768) & 65535) - 32768
  const candidates = []
  for (let y = 1; y < geometry.height; y += 2) for (let x = 1; x < geometry.width; x += 2) {
    const p = minimapPick(geometry.width, geometry.height, geometry.center, geometry.heading, {x,y})
    candidates.push({distance:Math.hypot(delta(p.x,geometry.goal.x),delta(p.y,geometry.goal.y)),x:x/geometry.width,y:y/geometry.height,native:p})
  }
  const target = await page.evaluate(({geometry,candidates}) => {
    const canvas = document.querySelector('[aria-label="Minimap. Click to move the camera."]')
    const rect = canvas.getBoundingClientRect()
    let best = {distance:Infinity}, unrestricted = {distance:Infinity}, blocked = 0
    for (const point of candidates) {
      if (point.distance < unrestricted.distance) unrestricted = point
      if (document.elementFromPoint(rect.left + rect.width*point.x,rect.top + rect.height*point.y) !== canvas) { blocked++; continue }
      if (point.distance < best.distance) best = point
    }
    const hit = document.elementFromPoint(rect.left+rect.width*unrestricted.x,rect.top+rect.height*unrestricted.y)
    const delta = (a,b) => ((a-b+32768)&65535)-32768
    return {...best,id:geometry.id,goal:geometry.goal,currentDistance:Math.hypot(delta(geometry.center.x,geometry.goal.x),delta(geometry.center.y,geometry.goal.y)),
      unrestricted:{...unrestricted,hitTag:hit?.tagName,hitLabel:hit?.getAttribute('aria-label')},blocked,before:geometry.before}
  }, {geometry,candidates})
  receipt.cameraAttempts ??= []
  receipt.cameraAttempts.push(target)
  assert.equal(target.before.inputMask, 0, 'Camera input must be unmasked')
  assert.equal(target.before.messageModal, false, 'Camera input must not be blocked by a message')
  const intermediate = target.distance >= 2048
  // The third fault can lie outside the Blue-centered minimap.
  // At most two ordinary intermediate pans must make strict geometric progress;
  // each waits for actual arrival before recomputing the projection. Neither
  // an intermediate scene nor progress alone satisfies the final radius proof.
  if (intermediate) {
    assert.ok(stage < 2, 'At most two intermediate public minimap pans')
    assert.ok(target.distance + 512 < target.currentDistance, 'Intermediate pan must reduce remaining target distance by more than arrival tolerance')
  }
  target.stage = stage
  target.intermediate = intermediate
  const box = await page.getByLabel('Minimap. Click to move the camera.', { exact: true }).boundingBox()
  const click = { x: box.x + box.width * target.x, y: box.y + box.height * target.y }
  assert.equal(await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.getAttribute('aria-label') === 'Minimap. Click to move the camera.', click), true, 'Projected click must actually hit the minimap')
  await page.mouse.click(click.x, click.y)
  // The minimap can place the pointer on a screen edge. Move it away through
  // ordinary input so cameraEdgeButtons does not cancel the requested focus.
  const viewport = await page.locator('.world-viewport').boundingBox()
  await page.mouse.move(viewport.x + viewport.width / 2, viewport.y + viewport.height / 2)
  if (intermediate) {
    await page.waitForFunction(({ native }) => {
      const s = window.testSceneRef.current
      const short = n => ((n + 32768) & 65535) - 32768
      return !s.cameraMotion.active && Math.hypot(short(s.cameraPosition.x - native.x), short(s.cameraPosition.y - native.y)) < 512
    }, target, { timeout: 10000 })
    return focusFault(page, receipt, stage + 1)
  }
  assert.ok(target.distance < 2048, 'Final public minimap projection must reach the authored fault')
  await page.waitForFunction(({ id }) => {
    const s = window.testSceneRef.current, u = {x:85,z:53}
    const wrap = n => ((n + 384) % 256) - 128
    return Math.hypot(wrap(s.viewPoint.x - u.x), wrap(s.viewPoint.z - u.z)) < 10
  }, target, { timeout: 10000 })
  return target
}

