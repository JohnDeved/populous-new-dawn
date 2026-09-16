import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { effectPixels, openGame } from './browser-game.mjs'

const browser = await chromium.launch({ headless: !process.argv.includes('--headed') })
try {
  const { page, errors } = await openGame(browser, 5)

  const headPoint = await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { browserPosition, nativePosition } = await import('/app/model.ts'),
      { syncLivePersonCells } = await import('/app/live-people.ts'),
      { worshipPositions } = await import('/app/worship.ts'),
      head = world.shrines.find(shrine => shrine.kind === 'angel'),
      follower = world.units.find(unit => unit.team === 'blue' && unit.kind === 'warrior'),
      approach = worshipPositions({
        ...nativePosition(world, head),
        angle: Math.round((head.angle * 1024) / Math.PI) & 2047,
      })[0]
    // Keep the check bounded while preserving the real follower, pointer command,
    // live route, prayer controller, head completion, and hostile payload paths.
    Object.assign(follower, browserPosition(approach), { native: null })
    syncLivePersonCells(world)
    world.selected = []
    world.speed = 0
    scene.focus(head)
    scene.onChange()
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
    const point = scene.screen(head),
      rect = scene.container.getBoundingClientRect(),
      x = rect.left + ((point.x + 1) * rect.width) / 2,
      y = rect.top + ((1 - point.y) * rect.height) / 2
    for (let dy = -75; dy <= 0; dy += 3)
      for (let dx = -20; dx <= 20; dx += 3) {
        const event = { clientX: x + dx, clientY: y + dy }
        if (!scene.pickUnit(event) && scene.pickWorldObject(event)?.id === head.id)
          return { x: event.clientX, y: event.clientY, head: head.id, follower: follower.id }
      }
    throw new Error('No exposed Angel head geometry for real input')
  })
  await page.getByRole('button', { name: 'Select warrior', exact: true }).click({ modifiers: ['Control'] })
  assert.ok((await page.evaluate(() => globalThis.testScene.world.selected.length)) >= 1)
  await page.mouse.click(headPoint.x, headPoint.y)
  assert.equal(
    await page.evaluate(id => globalThis.testScene.world.units.find(unit => unit.id === id).native?.commandStatus, headPoint.follower),
    27
  )

  const reward = await page.evaluate(async ({ headId, followerId }) => {
    const scene = globalThis.testScene,
      world = scene.world,
      { advanceGame } = await import('/app/game-clock.ts')
    world.speed = 1
    for (let frame = 0; frame < 480 && !world.effects.some(effect => effect.angel); frame++)
      advanceGame(world, scene.gameClock, 1 / 24)
    world.speed = 0
    const angel = world.effects.find(effect => effect.angel)
    if (angel) scene.focus(angel)
    scene.onChange()
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
    const head = world.shrines.find(shrine => shrine.id === headId),
      mesh = angel && scene.fxMeshes.get(angel.id)
    const follower = world.units.find(unit => unit.id === followerId)
    return {
      angel: angel && { id: angel.id, x: angel.x, z: angel.z, team: angel.team, phase: angel.angel.phase },
      head: { active: head.active, uses: head.uses, model: head.model },
      debug: {
        turn: world.turn,
        paused: world.paused,
        work: head.work,
        followers: head.followers,
        follower: follower && {
          hp: follower.hp,
          x: follower.x,
          z: follower.z,
          state: follower.native?.state,
          command: follower.native?.commandStatus,
        },
      },
      mesh: mesh && { visible: mesh.visible, layers: mesh.userData.layers.length, frame: mesh.userData.frame },
      summonCues: [0xd9, 0xdb].every(cue => world.sounds.some(sound => sound.cue === cue)),
    }
  }, { headId: headPoint.head, followerId: headPoint.follower })
  assert.ok(reward.angel, JSON.stringify(reward))
  assert.deepEqual(
    { ...reward.angel, id: undefined },
    { id: undefined, x: -51, z: 15, team: 'blue', phase: 'seeking' }
  )
  assert.deepEqual(reward.head, { active: false, uses: 1, model: 45 })
  assert.ok(reward.mesh.visible && reward.mesh.layers > 0 && Number.isInteger(reward.mesh.frame))
  assert.equal(reward.summonCues, true)
  const pixels = await effectPixels(page, [reward.angel.id])
  assert.ok(pixels > 20, `Angel sprite must reach GPU pixels (${pixels})`)

  const combat = await page.evaluate(async angelId => {
    const scene = globalThis.testScene,
      world = scene.world,
      { advanceGame } = await import('/app/game-clock.ts'),
      angel = world.effects.find(effect => effect.id === angelId)
    world.speed = 1
    let target = null
    for (let frame = 0; frame < 1200; frame++) {
      advanceGame(world, scene.gameClock, 1 / 24)
      target ??= angel.angel.target
      if (target && !world.units.some(unit => unit.id === target)) break
    }
    const hit = world.effects.some(effect => effect.kind === 'hit'),
      strikeCue = world.sounds.some(sound => sound.cue === 0xdc)
    for (let frame = 0; frame < 1800 && world.effects.includes(angel); frame++)
      advanceGame(world, scene.gameClock, 1 / 24)
    world.speed = 0
    scene.onChange()
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
    return {
      target,
      removed: !!target && !world.units.some(unit => unit.id === target),
      advanced: angel.x !== -51 || angel.z !== 15,
      hit,
      strikeCue,
      cleaned: !world.effects.includes(angel),
      cleanupCue: world.sounds.some(sound => sound.cue === 0xb2),
      meshRemoved: !scene.fxMeshes.has(angel.id),
    }
  }, reward.angel.id)
  assert.ok(combat.target)
  assert.deepEqual(
    {
      removed: combat.removed,
      advanced: combat.advanced,
      hit: combat.hit,
      strikeCue: combat.strikeCue,
      cleaned: combat.cleaned,
      cleanupCue: combat.cleanupCue,
      meshRemoved: combat.meshRemoved,
    },
    {
      removed: true,
      advanced: true,
      hit: true,
      strikeCue: true,
      cleaned: true,
      cleanupCue: true,
      meshRemoved: true,
    }
  )
  await page.screenshot({ path: '/private/tmp/populous-mission5-angel.png' })
  assert.deepEqual(errors, [])
  console.log(`PASS: rendered Mission 5 warrior worship, linked Angel reward, ${pixels} Angel GPU pixels, autonomous chase, lethal strike and cleanup`)
} finally {
  await browser.close()
}
