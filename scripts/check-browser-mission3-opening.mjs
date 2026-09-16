import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

const browser = await chromium.launch({ headless: !process.argv.includes('--headed') })
try {
  const { page, errors } = await openGame(browser)
  await page.evaluate(() => {
    const world = globalThis.testStore.getWorld()
    world.status = 'won'
    world.outcome.cameraPlaying = false
    globalThis.testStore.update()
  })
  await page.getByRole('button', { name: 'Continue to Mission 2', exact: false }).click()
  await page.waitForFunction(() => globalThis.testStore.getWorld().outcome.level === 2)
  await page.waitForFunction(
    () => globalThis.testSceneRef.current?.world === globalThis.testStore.getWorld()
  )
  await page.evaluate(() => {
    const world = globalThis.testStore.getWorld()
    world.status = 'won'
    world.outcome.cameraPlaying = false
    globalThis.testStore.update()
  })
  await page.getByRole('button', { name: 'Continue to Mission 3', exact: false }).click()
  await page.waitForFunction(() => globalThis.testStore.getWorld().outcome.level === 3)
  await page.getByRole('button', { name: 'Swarm, 0 shots' }).waitFor()
  await page.getByLabel('Focus Chumara tribe').waitFor()
  await page.evaluate(
    () => (globalThis.mission3ProducerAttributes = [...globalThis.testStore.getWorld().ai.attributes])
  )
  assert.equal(await page.getByText('Reach the Chumara Vault').count(), 1)
  assert.equal(await page.getByText('Build a Temple and train a Preacher').count(), 1)
  await page.waitForFunction(() => {
    const world = globalThis.testStore.getWorld()
    return world.outcome.level === 3 && world.turn >= 16 && world.flyby.flags & 1
  })
  await page.waitForFunction(() => {
    const world = globalThis.testStore.getWorld()
    return world.spellCasts[2][17] === 1 && world.units.filter(unit => unit.team === 'wild').length < 44
  })
  await page.waitForFunction(() => {
    const world = globalThis.testStore.getWorld()
    return world.turn >= 122 && world.castingTribes[2].spells[17].interval === 8
  })
  const result = await page.evaluate(async () => {
    const world = globalThis.testStore.getWorld(),
      { tick } = await import('/app/model.ts'),
      complete = kind =>
        world.buildings.some(
          building => building.team === 'yellow' && building.kind === kind && building.progress === 1
        ),
      preacher = () =>
        world.units.some(unit => unit.team === 'yellow' && unit.kind === 'preacher' && unit.hp > 0)
    const initial = {
      level: world.outcome.level,
      blue: world.units.filter(unit => unit.team === 'blue').length,
      yellow: world.units.filter(unit => unit.team === 'yellow').length,
      wild: world.units.filter(unit => unit.team === 'wild').length,
      vault: world.shrines.some(shrine => shrine.kind === 'vault' && shrine.reward === 'temple'),
      erosion: world.shrines.some(shrine => shrine.kind === 'erosionEffect'),
      recurringFlyby: {
        events: world.flyby.events.length,
        end: world.flyby.end,
        inputLocked: !!(world.inputMask & 64),
      },
      convertWild: {
        casts: world.spellCasts[2][17],
        stock: world.manaWorld.spells[2].stocks[17],
      },
      spellIntervals: world.castingTribes[2].spells.map(spell => spell.interval),
      attributesUnchanged: world.ai.attributes.every(
        (value, index) => value === globalThis.mission3ProducerAttributes[index]
      ),
    }
    for (let turn = 0; turn < 6000 && !preacher(); turn++) tick(world, 1 / 12)
    if (!preacher()) throw new Error(`Mission 3 Chumara Preacher timed out at turn ${world.turn}`)
    initial.settlement = {
      tower: complete('tower'),
      camp: complete('camp'),
      temple: complete('temple'),
      preacher: preacher(),
      trainingLatch: world.ai.variables[23],
    }
    await globalThis.testStore.saveCheckpoint()
    world.unlockedTemple = true
    globalThis.testStore.startMission(1)
    if (!globalThis.testStore.loadCheckpoint()) throw new Error('Mission 3 checkpoint load failed')
    const restored = globalThis.testStore.getWorld(),
      checkpoint = {
        level: restored.outcome.level,
        unlockedTemple: restored.unlockedTemple,
        settlement: restored.buildings.filter(
          building => building.team === 'yellow' && building.progress === 1
        ).length,
        preacher: restored.units.filter(
          unit => unit.team === 'yellow' && unit.kind === 'preacher' && unit.hp > 0
        ).length,
        trainingLatch: restored.ai.variables[23],
        spellInterval: restored.castingTribes[2].spells[17].interval,
      }
    globalThis.testStore.restart()
    const restarted = globalThis.testStore.getWorld()
    return {
      initial,
      checkpoint,
      restart: {
        level: restarted.outcome.level,
        blue: restarted.units.filter(unit => unit.team === 'blue').length,
        yellow: restarted.units.filter(unit => unit.team === 'yellow').length,
        wild: restarted.units.filter(unit => unit.team === 'wild').length,
        settlement: restarted.buildings.filter(building => building.team === 'yellow').length,
        trainingLatch: restarted.ai.variables[23],
      },
    }
  })
  assert.deepEqual(result, {
    initial: {
      level: 3,
      blue: 2,
      yellow: 14,
      wild: 37,
      vault: true,
      erosion: true,
      recurringFlyby: {
        events: 22,
        end: { x: 42, y: 166, angle: 1144, zoom: 0 },
        inputLocked: true,
      },
      convertWild: { casts: 1, stock: 0 },
      spellIntervals: [1, 1, 8, 64, 72, 32, 40, 70, 64, 1, 168, 80, 66, 152, 140, 100, 128, 8, 1, 48, 1, 1],
      attributesUnchanged: true,
      settlement: { tower: true, camp: false, temple: true, preacher: true, trainingLatch: 1 },
    },
    checkpoint: {
      level: 3,
      unlockedTemple: false,
      settlement: 2,
      preacher: 1,
      trainingLatch: 1,
      spellInterval: 8,
    },
    restart: { level: 3, blue: 1, yellow: 7, wild: 44, settlement: 0, trainingLatch: 0 },
  })
  assert.deepEqual(errors, [])
  console.log('PASS: Mission 3 opens, builds Chumara settlement, trains Preacher and restores checkpoint')
} finally {
  await browser.close()
}
