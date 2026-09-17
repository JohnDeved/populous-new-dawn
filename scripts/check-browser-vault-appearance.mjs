import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

const output = process.env.PND_QUEUE_OUTPUT ?? '/private/tmp'
const evidence = { before: null, rotated: null, acquisition: null, restored: null }
const browser = await chromium.launch({ headless: !process.argv.includes('--headed') })
try {
  const { page, errors } = await openGame(browser)
  page.setDefaultTimeout(10_000)
  await page.evaluate(() => {
    const store = globalThis.testStore
    store.startMission(6)
    const world = store.getWorld()
    world.status = 'won'
    world.outcome.cameraPlaying = false
    store.update()
  })
  await page.getByRole('button', { name: 'Continue to Mission 7', exact: false }).click()
  await page.waitForFunction(() => globalThis.testStore.getWorld().outcome.level === 7)
  await page.waitForFunction(
    () => globalThis.testSceneRef.current?.world === globalThis.testStore.getWorld()
  )
  await page.evaluate(() => (globalThis.testScene = globalThis.testSceneRef.current))
  const skip = page.getByRole('button', { name: 'Skip introduction', exact: false })
  if (await skip.isVisible().catch(() => false)) await skip.click()
  await page.waitForFunction(() => !globalThis.testStore.getWorld().inputMask)

  evidence.before = await page.evaluate(() => {
    const scene = globalThis.testScene,
      vault = scene.world.shrines.find(shrine => shrine.kind === 'vault'),
      entry = scene.shrineMeshes.get(vault.id),
      marker = entry?.g.userData.vaultKnowledgeMarker
    if (!marker) throw new Error('Mission 7 Vault has no knowledge marker')
    scene.focus(vault)
    scene.onChange()
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
    return {
      reward: vault.reward,
      active: vault.active,
      frame: marker.userData.frame,
      configuredFrame: marker.userData.directions[0].frames[0],
      visible: marker.visible,
      visibleLayers: marker.userData.layers.filter(layer => layer.visible).length,
      nativeHeightOffset: Math.round((marker.position.y - entry.g.position.y) * 128),
      hasGlow: !!marker.userData.glow,
      markerCount: scene.objects.children.filter(child => child.name === 'vault-knowledge-reward')
        .length,
    }
  })
  assert.deepEqual(evidence.before, {
    reward: 'invisibility',
    active: true,
    frame: 1062,
    configuredFrame: 1062,
    visible: true,
    visibleLayers: evidence.before.visibleLayers,
    nativeHeightOffset: 800,
    hasGlow: false,
    markerCount: 1,
  })
  assert.ok(evidence.before.visibleLayers > 0)
  await page.screenshot({ path: path.join(output, 'vault-before-acquisition.png') })

  evidence.rotated = await page.evaluate(() => {
    const scene = globalThis.testScene,
      vault = scene.world.shrines.find(shrine => shrine.kind === 'vault'),
      marker = scene.shrineMeshes.get(vault.id).g.userData.vaultKnowledgeMarker
    scene.cameraBearing = (scene.cameraBearing + Math.PI / 2) % (Math.PI * 2)
    scene.updateView()
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
    return {
      frame: marker.userData.frame,
      visible: marker.visible,
      visibleLayers: marker.userData.layers.filter(layer => layer.visible).length,
      nativeHeightOffset: Math.round(
        (marker.position.y - scene.shrineMeshes.get(vault.id).g.position.y) * 128
      ),
    }
  })
  assert.equal(evidence.rotated.frame, 1062)
  assert.equal(evidence.rotated.visible, true)
  assert.ok(evidence.rotated.visibleLayers > 0)
  assert.equal(evidence.rotated.nativeHeightOffset, 800)

  await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { entrance } = await import('/app/live-command.ts'),
      { syncLivePersonCells } = await import('/app/live-people.ts'),
      shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman'),
      vault = world.shrines.find(shrine => shrine.kind === 'vault')
    Object.assign(shaman, entrance(world, vault, 2))
    syncLivePersonCells(world)
    world.selected = [shaman.id]
    world.paused = false
    world.speed = 0
    scene.focus(vault)
    scene.onChange()
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
  })
  const vaultPoint = await page.evaluate(() => {
    const scene = globalThis.testScene,
      vault = scene.world.shrines.find(shrine => shrine.kind === 'vault'),
      point = scene.screen(vault),
      bounds = scene.container.getBoundingClientRect(),
      x = bounds.left + ((point.x + 1) * bounds.width) / 2,
      y = bounds.top + ((1 - point.y) * bounds.height) / 2
    for (let dy = -75; dy <= 0; dy += 3)
      for (let dx = -20; dx <= 20; dx += 3) {
        const event = { clientX: x + dx, clientY: y + dy }
        if (
          document.elementFromPoint(event.clientX, event.clientY) === scene.renderer.domElement &&
          !scene.pickUnit(event) &&
          scene.pickWorldObject(event)?.id === vault.id
        )
          return { x: event.clientX, y: event.clientY }
      }
    throw new Error('No exposed Mission 7 Vault geometry for real input')
  })
  await page.mouse.click(vaultPoint.x, vaultPoint.y)

  evidence.acquisition = await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { advanceGame } = await import('/app/game-clock.ts'),
      shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman'),
      vault = world.shrines.find(shrine => shrine.kind === 'vault'),
      marker = scene.shrineMeshes.get(vault.id).g.userData.vaultKnowledgeMarker
    if (!shaman.vault) throw new Error('Real Vault input did not create command-33 work')
    cancelAnimationFrame(scene.frame)
    world.paused = true
    world.speed = 1
    scene.gameClock.animationTime = 0
    const observed = { opening: false, preTrigger: false }
    const step = () => {
      world.paused = false
      advanceGame(world, scene.gameClock, 1 / 12)
      world.paused = true
      scene.animate(scene.previous)
      cancelAnimationFrame(scene.frame)
    }
    for (let turn = 0; vault.active && turn < 2_000; turn++) {
      step()
      if (shaman.vault?.phase === 3) observed.opening ||= marker.visible
      if (shaman.vault?.phase === 5) observed.preTrigger ||= marker.visible
    }
    if (vault.active) throw new Error('Mission 7 Vault acquisition timed out')
    const gift = world.effects.find(effect => effect.kind === 'gift'),
      giftGroup = gift && scene.fxMeshes.get(gift.id)
    if (!gift || !giftGroup) throw new Error('Vault acquisition did not create delayed reward VFX')
    return {
      openingMarkerVisible: observed.opening,
      preTriggerMarkerVisible: observed.preTrigger,
      vaultActive: vault.active,
      vaultUses: vault.uses,
      markerVisible: marker.visible,
      giftCount: world.effects.filter(effect => effect.kind === 'gift').length,
      giftFrame: gift.frame,
      giftPhase: gift.phase,
      giftVisible: giftGroup.visible,
      giftName: giftGroup.name,
      giftGlow: giftGroup.userData.glow?.name,
      markerCount: scene.objects.children.filter(child => child.name === 'vault-knowledge-reward')
        .length,
    }
  })
  assert.equal(evidence.acquisition.openingMarkerVisible, true)
  assert.equal(evidence.acquisition.preTriggerMarkerVisible, true)
  assert.equal(evidence.acquisition.vaultActive, false)
  assert.equal(evidence.acquisition.vaultUses, 1)
  assert.equal(evidence.acquisition.markerVisible, false)
  assert.equal(evidence.acquisition.giftCount, 1)
  assert.equal(evidence.acquisition.giftFrame, 1062)
  assert.ok(evidence.acquisition.giftPhase > 0)
  assert.equal(evidence.acquisition.giftVisible, true)
  assert.equal(evidence.acquisition.giftName, 'worship-reward')
  assert.equal(evidence.acquisition.giftGlow, 'worship-reward-glow')
  assert.equal(evidence.acquisition.markerCount, 1)
  await page.screenshot({ path: path.join(output, 'vault-after-acquisition.png') })

  await page.evaluate(async () => {
    const store = globalThis.testStore
    await store.saveCheckpoint()
    store.startMission(1)
    if (!store.loadCheckpoint()) throw new Error('Vault checkpoint load failed')
  })
  await page.waitForFunction(
    () =>
      globalThis.testSceneRef.current?.world === globalThis.testStore.getWorld() &&
      globalThis.testStore.getWorld().outcome.level === 7
  )
  evidence.restored = await page.evaluate(() => {
    const scene = (globalThis.testScene = globalThis.testSceneRef.current),
      vault = scene.world.shrines.find(shrine => shrine.kind === 'vault')
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
    const marker = scene.shrineMeshes.get(vault.id)?.g.userData.vaultKnowledgeMarker
    return {
      active: vault.active,
      uses: vault.uses,
      markerExists: !!marker,
      markerVisible: marker?.visible ?? false,
      visibleMarkerCount: scene.objects.children.filter(
        child => child.name === 'vault-knowledge-reward' && child.visible
      ).length,
    }
  })
  assert.deepEqual(evidence.restored, {
    active: false,
    uses: 1,
    markerExists: true,
    markerVisible: false,
    visibleMarkerCount: 0,
  })
  assert.deepEqual(errors, [])
  await writeFile(path.join(output, 'vault-appearance.json'), JSON.stringify(evidence, null, 2) + '\n')
  console.log('PASS: Vault knowledge marker survives camera/opening and hands off once to reward VFX')
} finally {
  await browser.close()
}
