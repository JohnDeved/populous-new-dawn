import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { effectPixels, openGame } from './browser-game.mjs'

const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser, 1)

  const target = await page.evaluate(() => {
    const scene = window.testScene,
      world = scene.world,
      head = world.shrines.find(shrine => shrine.kind === 'bridge')
    world.speed = 0
    world.manaWorld.gameFlags = 32
    world.units = world.units.filter(unit => unit.team === 'blue')
    world.selected = world.units.map(unit => unit.id)
    scene.focus(head)
    scene.onChange()
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
    const point = scene.screen(head),
      rect = scene.container.getBoundingClientRect()
    return {
      x: rect.left + ((point.x + 1) * rect.width) / 2,
      y: rect.top + ((1 - point.y) * rect.height) / 2,
      head: head.id,
    }
  })

  await page.mouse.click(target.x, target.y)
  assert.equal(
    await page.evaluate(() => window.testScene.world.units[0].native?.commandStatus),
    27
  )

  const acquisition = await page.evaluate(async headId => {
    const scene = window.testScene,
      world = scene.world,
      { advanceGame } = await import('/app/game-clock.ts'),
      { nativePosition } = await import('/app/model.ts'),
      { terrainPointHeight } = await import('/app/native-terrain.ts')
    cancelAnimationFrame(scene.frame)
    world.speed = 1
    let gift
    for (let frame = 0; frame < 2400 && !gift; frame++) {
      advanceGame(world, scene.gameClock, 1 / 24)
      gift = world.gifts.find(candidate => candidate.reward === 'bridge')
    }
    if (!gift) throw new Error('Normal Bridge worship did not produce its acquisition reward')
    world.speed = 0
    world.paused = true
    scene.focus(gift)
    scene.onChange()
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
    const head = world.shrines.find(shrine => shrine.id === headId),
      group = scene.fxMeshes.get(gift.id),
      glow = group?.userData.glow,
      ground = terrainPointHeight(world.land, nativePosition(world, head))
    if (!group || !glow) throw new Error('Acquisition body/glow renderer was not created')
    return {
      giftId: gift.id,
      head: {
        x: head.x,
        z: head.z,
        uses: head.uses,
        work: head.work,
      },
      gift: {
        x: gift.x,
        z: gift.z,
        reward: gift.reward,
        frame: gift.frame,
        phase: gift.phase,
        remaining: gift.remaining,
        heightOffset: Math.round(gift.height * 45) - ground,
      },
      stock: world.shots.bridge,
      giftCount: world.giftCounts.bridge,
      render: {
        name: group.name,
        visible: group.visible,
        frame: group.userData.frame,
        glowName: glow.name,
        glowFrame: glow.userData.frame,
        glowOffset: Math.round(glow.position.y * 128),
      },
    }
  }, target.head)

  assert.deepEqual(acquisition.gift, {
    x: acquisition.head.x,
    z: acquisition.head.z,
    reward: 'bridge',
    frame: 1068,
    phase: 6,
    remaining: 82,
    heightOffset: 800,
  })
  assert.deepEqual(
    { uses: acquisition.head.uses, work: acquisition.head.work, stock: acquisition.stock, giftCount: acquisition.giftCount },
    { uses: 1, work: 0, stock: 0, giftCount: 0 }
  )
  assert.deepEqual(acquisition.render, {
    name: 'worship-reward',
    visible: true,
    frame: 1068,
    glowName: 'worship-reward-glow',
    glowFrame: 1417,
    glowOffset: -80,
  })

  const pixels = await effectPixels(page, [acquisition.giftId])
  assert.ok(pixels > 20, `worship acquisition body/glow must reach GPU pixels (${pixels})`)

  const lifecycle = await page.evaluate(async giftId => {
    const scene = window.testScene,
      world = scene.world,
      { advanceGame } = await import('/app/game-clock.ts'),
      phases = []
    world.paused = false
    world.speed = 1
    for (let visit = 0; visit < 6; visit++) {
      advanceGame(world, scene.gameClock, 1 / 12)
      const gift = world.gifts.find(candidate => candidate.id === giftId)
      phases.push([gift.phase, gift.remaining, world.shots.bridge, world.giftCounts.bridge])
    }
    world.speed = 0
    world.paused = true
    scene.onChange()
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
    const hidden = scene.fxMeshes.get(giftId)?.visible === false
    world.paused = false
    world.speed = 1
    for (let visit = 0; visit < 76; visit++) advanceGame(world, scene.gameClock, 1 / 12)
    world.speed = 0
    return {
      phases,
      hidden,
      pending: world.gifts.some(candidate => candidate.id === giftId),
      shots: world.shots.bridge,
      giftCount: world.giftCounts.bridge,
    }
  }, acquisition.giftId)

  assert.deepEqual(lifecycle.phases, [
    [5, 81, 0, 0],
    [4, 80, 0, 0],
    [3, 79, 0, 0],
    [2, 78, 0, 0],
    [1, 77, 0, 0],
    [0, 76, 0, 0],
  ])
  assert.equal(lifecycle.hidden, true)
  assert.deepEqual(
    { pending: lifecycle.pending, shots: lifecycle.shots, giftCount: lifecycle.giftCount },
    { pending: false, shots: 1, giftCount: 1 }
  )
  assert.deepEqual(errors, [])
  console.log(
    `PASS: normal Mission 1 Bridge worship renders original acquisition body/glow (${pixels} GPU pixels), hides after six visits, and grants only on visit 82`
  )
} finally {
  await browser.close()
}
