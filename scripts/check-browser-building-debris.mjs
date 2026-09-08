// Start npm run dev, then node scripts/check-browser-building-debris.mjs.
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame, effectPixels } from './browser-game.mjs'
import rules from '../app/original-rules.json' with { type: 'json' }

const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  await page.evaluate(rules => {
    const scene = window.testScene, world = scene.world
    world.manaWorld.gameFlags = 32
    const building = world.buildings.find(b => b.team === 'blue' && b.kind === 'hut')
    const model = building.level
    building.collapse = {
      model, state: 2, flags2: 0, flags3: 0, buildingFlags: 64, counter: 0,
      damage: rules.buildingDamageThreshold[model], stage: 4, attacker: 255, occupants: 0,
      plan: { remaining: rules.buildingLife[model], repairDelay: 0, attacker: 255 },
    }
    scene.focus(building)
    world.speed = 0.25
  }, rules)
  await page.waitForFunction(() => window.testScene.world.effects.some(f => f.debris))
  const first = await page.evaluate(() => {
    const scene = window.testScene
    scene.world.speed = 0
    if (scene.world.effects.some(f => f.debris && f.duration <= 0)) throw new Error('Dead initial fragment retained')
    const fragments = scene.world.effects.filter(f => f.debris && f.duration > 0)
    window.debrisIds = fragments.map(f => f.id)
    return fragments.map(f => ({ id: f.id, h: f.debris.h, heading: f.debris.heading }))
  })
  assert.ok(first.length > 3)
  await page.waitForFunction(() => window.debrisIds.every(id => window.testScene.fxMeshes.has(id)))
  const displayed = await page.evaluate(() => {
    const scene = window.testScene
    const groups = window.debrisIds.map(id => scene.fxMeshes.get(id))
    for (const group of groups) {
      const mesh = group.children[0]
      if (!mesh.isMesh || !mesh.material.map.image.src.includes('atlas')) throw new Error('Missing original fragment texture')
      if (![3, 6].includes(mesh.geometry.attributes.position.count)) throw new Error('Invalid face topology')
      if (!Array.from(mesh.geometry.attributes.position.array).every(Number.isFinite)) throw new Error('Invalid fragment coordinates')
    }
    return { positions: groups.map(g => g.position.toArray()) }
  })
  const pixels = await effectPixels(page, first.map(f => f.id))
  assert.ok(pixels > 20, JSON.stringify(displayed))
  assert.ok(new Set(displayed.positions.map(p => p.join(','))).size > 3)
  await page.screenshot({ path: '/private/tmp/populous-building-debris.png' })
  await page.evaluate(() => { window.testScene.world.speed = 0.25 })
  await page.waitForFunction(first => first.some(previous => {
    const f = window.testScene.world.effects.find(f => f.id === previous.id)
    return f && f.debris.h !== previous.h && f.debris.heading !== previous.heading
  }), first)
  await page.evaluate(() => { window.testScene.world.speed = 0 })
  await page.locator('.world-viewport canvas').focus()
  const bearing = await page.evaluate(() => window.testScene.cameraBearing)
  await page.keyboard.down('q')
  await page.waitForTimeout(250)
  await page.keyboard.up('q')
  assert.notEqual(await page.evaluate(() => window.testScene.cameraBearing), bearing)
  await page.screenshot({ path: '/private/tmp/populous-building-debris-rotated.png' })
  await page.evaluate(() => { window.testScene.world.speed = 1 })
  await page.waitForFunction(() => window.debrisIds.every(id =>
    !window.testScene.world.effects.some(f => f.id === id) && !window.testScene.fxMeshes.has(id)))
  const impacts = await page.evaluate(() => window.testScene.world.sounds.filter(s => s.cue === 0x13 || s.cue === 0x2c).length)
  assert.ok(impacts > 0)
  assert.deepEqual(errors, [])
  console.log(`PASS: live collapse emits ${first.length} original textured faces (${pixels} GPU pixels), flight/spin, camera rotation, impact cues and mesh cleanup; no browser errors`)
} finally {
  await browser.close()
}
