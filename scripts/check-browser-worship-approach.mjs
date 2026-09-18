import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

const browser = await chromium.launch({ headless: !process.argv.includes('--headed') })
try {
  const { page, errors } = await openGame(browser, 5)

  const target = await page.evaluate(() => {
    const scene = globalThis.testScene
    const world = scene.world
    const head = world.shrines.find(shrine => shrine.kind === 'convertWild')
    const shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
    if (!head || !shaman) throw new Error('Missing Mission 5 Convert Wild head or blue Shaman')
    world.speed = 0
    scene.focus(head)
    scene.onChange()
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
    const point = scene.screen(head)
    const rect = scene.container.getBoundingClientRect()
    const x = rect.left + ((point.x + 1) * rect.width) / 2
    const y = rect.top + ((1 - point.y) * rect.height) / 2
    for (let dy = -75; dy <= 15; dy += 3)
      for (let dx = -30; dx <= 30; dx += 3) {
        const event = { clientX: x + dx, clientY: y + dy }
        if (!scene.pickUnit(event) && scene.pickWorldObject(event)?.id === head.id)
          return { x: event.clientX, y: event.clientY, head: head.id, shaman: shaman.id }
      }
    throw new Error('No exposed Convert Wild head geometry for real input')
  })

  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Select shaman', exact: true }).click()
  assert.deepEqual(
    await page.evaluate(() => globalThis.testScene.world.selected),
    [target.shaman],
    'normal HUD selection must select only the Shaman'
  )
  await page.mouse.click(target.x, target.y)

  const route = await page.evaluate(async ({ headId, shamanId }) => {
    const scene = globalThis.testScene
    const world = scene.world
    const { advanceGame } = await import('/app/game-clock.ts')
    const { worshipHeadPose } = await import('/app/live-worship.ts')
    const { worshipApproach, worshipPositions } = await import('/app/worship.ts')
    const { stoneHeadAngle } = await import('/app/stone-head-orientation.ts')
    const head = world.shrines.find(shrine => shrine.id === headId)
    const shaman = world.units.find(unit => unit.id === shamanId)
    const canonical = Math.round((stoneHeadAngle(head, world.outcome.level) * 1024) / Math.PI) & 2047
    const pose = worshipHeadPose(world, head)
    const approach = worshipApproach(pose)

    world.speed = 1
    advanceGame(world, scene.gameClock, 1 / 12)
    world.speed = 0

    const person = shaman.native
    return {
      canonical,
      pose,
      approach,
      command: person?.commandStatus,
      work: shaman.work,
      goal: person && { x: person.goalX, y: person.goalY },
      rendered: scene.shrineMeshes.has(head.id),
      slots: worshipPositions(pose),
    }
  }, { headId: target.head, shamanId: target.shaman })

  assert.equal(route.rendered, true)
  assert.equal(route.canonical, 1024, 'retained canonical Mission 5 scenery heading')
  assert.equal(route.pose.angle, route.canonical, 'live worship pose must match the rendered head heading')
  assert.equal(route.command, 27)
  assert.equal(route.work, target.head)
  assert.deepEqual(route.goal, route.approach, 'normal command-27 route must target canonical approach')

  const standing = await page.evaluate(async ({ headId, shamanId }) => {
    const scene = globalThis.testScene
    const world = scene.world
    const { advanceGame } = await import('/app/game-clock.ts')
    const { worshipHeadPose } = await import('/app/live-worship.ts')
    const { worshipPositions } = await import('/app/worship.ts')
    const head = world.shrines.find(shrine => shrine.id === headId)
    const shaman = world.units.find(unit => unit.id === shamanId)
    world.speed = 1
    for (let i = 0; i < 1200 && ![2, 3].includes(shaman.native?.substate); i++)
      advanceGame(world, scene.gameClock, 1 / 24)
    world.speed = 0
    const person = shaman.native
    const slots = worshipPositions(worshipHeadPose(world, head))
    return {
      position: person && { x: person.x, y: person.y },
      substate: person?.substate,
      speed: person?.speed,
      motionGroup: person?.motionGroup,
      onSlot: !!person && slots.some(slot => slot.x === person.x && slot.y === person.y),
      command: person?.commandStatus,
      work: shaman.work,
    }
  }, { headId: target.head, shamanId: target.shaman })

  assert.ok([2, 3].includes(standing.substate), JSON.stringify(standing))
  assert.equal(standing.speed, 0)
  assert.equal(standing.motionGroup, 0)
  assert.equal(standing.onSlot, true)
  assert.equal(standing.command, 27)
  assert.equal(standing.work, target.head)
  assert.deepEqual(errors, [])
  console.log('PASS: Mission 5 real Shaman input routes to canonical stone-head approach and worship slot')
} finally {
  await browser.close()
}
