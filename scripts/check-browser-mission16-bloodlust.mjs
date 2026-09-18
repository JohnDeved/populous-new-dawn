import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { bindGame } from './browser-game.mjs'

const browser = await chromium.launch({ headless: !process.argv.includes('--headed') })
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } }),
    page = await context.newPage(),
    errors = []
  page.on('pageerror', error => errors.push(error.stack ?? error.message))
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto(process.env.POPULOUS_URL ?? 'http://localhost:3000', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Mission 16', exact: true }).click()
  await bindGame(page)
  await page.waitForFunction(() => !globalThis.testScene.world.inputMask)
  await page.getByText(/Find Bloodlust in the desert/).waitFor()

  const headPoint = await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { browserPosition, nativePosition } = await import('/app/model.ts'),
      { syncLivePersonCells } = await import('/app/live-people.ts'),
      { worshipPositions } = await import('/app/worship.ts'),
      head = world.shrines.find(shrine => shrine.reward === 'bloodlust'),
      followers = world.units.filter(unit => unit.team === 'blue' && unit.kind === 'brave'),
      slots = worshipPositions({
        ...nativePosition(world, head),
        angle: Math.round((head.angle * 1024) / Math.PI) & 2047,
      })
    followers.forEach((unit, index) =>
      Object.assign(unit, browserPosition(slots[index]), { native: null })
    )
    for (const unit of world.units) if (unit.team !== 'blue') unit.inside = 1
    syncLivePersonCells(world)
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
          return { ...event, head: head.id }
      }
    throw new Error('No exposed Bloodlust head geometry')
  })
  await page
    .getByRole('button', { name: 'Select brave', exact: true })
    .click({ modifiers: ['Shift'] })
  await page.mouse.click(headPoint.clientX, headPoint.clientY)
  const worship = await page.evaluate(async headId => {
    const scene = globalThis.testScene,
      world = scene.world,
      { tick } = await import('/app/model.ts'),
      head = world.shrines.find(shrine => shrine.id === headId)
    if (
      !world.selected.every(
        id => world.units.find(unit => unit.id === id)?.native?.commandStatus === 27
      )
    )
      throw new Error('Head click did not enter live worship')
    world.speed = 1
    for (let turn = 0; turn < 24; turn++) tick(world, 1 / 12)
    head.work = head.target * head.required ** 2 - 1
    for (let turn = 0; turn < 8 && !head.uses; turn++) tick(world, 1 / 12)
    for (let turn = 0; turn < 82 && world.gifts.length; turn++) tick(world, 1 / 12)
    world.speed = 0
    scene.onChange()
    return { uses: head.uses, stock: world.shots.bloodlust, gifts: world.giftCounts.bloodlust }
  }, headPoint.head)
  assert.deepEqual(worship, { uses: 1, stock: 1, gifts: 1 })

  const bloodlustButton = page.getByRole('button', { name: 'Bloodlust, 1 shots', exact: true })
  await bloodlustButton.waitFor()
  const castPoint = await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { addUnit, spellTargetError } = await import('/app/model.ts'),
      { syncLivePersonCells } = await import('/app/live-people.ts'),
      shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman'),
      target = { x: shaman.x + 1, z: shaman.z },
      kinds = ['brave', 'warrior', 'preacher', 'firewarrior', 'spy', 'brave', 'warrior']
    for (const unit of world.units) if (unit !== shaman) unit.inside = 1
    kinds.forEach((kind, index) =>
      addUnit(world, 'blue', kind, { x: target.x + index / 20, z: target.z })
    )
    syncLivePersonCells(world)
    scene.focus(shaman)
    scene.onChange()
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
    const point = scene.screen(target, Math.max(0, scene.y(target))),
      rect = scene.container.getBoundingClientRect(),
      center = {
        x: rect.left + ((point.x + 1) * rect.width) / 2,
        y: rect.top + ((1 - point.y) * rect.height) / 2,
      }
    for (let radius = 0; radius <= 40; radius += 2)
      for (let step = 0; step < 16; step++) {
        const event = {
            clientX: center.x + Math.cos((step * Math.PI) / 8) * radius,
            clientY: center.y + Math.sin((step * Math.PI) / 8) * radius,
          },
          picked = scene.pick(event)
        if (picked && !spellTargetError(world, 'bloodlust', picked)) return event
      }
    throw new Error('No exposed Bloodlust cast target')
  })
  await bloodlustButton.click()
  await page.mouse.click(castPoint.clientX, castPoint.clientY)
  const combat = await page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      { addUnit, tick } = await import('/app/model.ts'),
      { meleeDamage } = await import('/app/combat-runtime.ts'),
      { syncLivePersonCells } = await import('/app/live-people.ts')
    for (let turn = 0; turn < 120 && !world.units.some(unit => unit.bloodlust); turn++)
      tick(world, 1 / 12)
    const affected = world.units.filter(unit => unit.bloodlust),
      fighter = affected.find(unit => unit.kind === 'warrior')
    if (affected.length !== 6 || !fighter) throw new Error('HUD cast missed Bloodlust targets')
    for (const unit of world.units) if (unit !== fighter) unit.inside = 1
    const enemy = addUnit(world, 'red', 'brave', { x: 0.5, z: 0 })
    Object.assign(fighter, { x: 0, z: 0, native: null, fight: null, path: [], work: null })
    Object.assign(enemy, {
      x: 0.5,
      z: 0,
      inside: null,
      native: null,
      fight: null,
      path: [],
      work: null,
    })
    syncLivePersonCells(world)
    const hp = enemy.hp,
      expected = meleeDamage(fighter),
      ordinary = meleeDamage({ ...fighter, bloodlust: 0 })
    for (let turn = 0; turn < 360 && enemy.hp === hp; turn++) tick(world, 1 / 12)
    scene.focus(fighter)
    scene.onChange()
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
    const aura = scene.unitMeshes.get(fighter.id)?.userData.bloodlust,
      auraVisible = aura?.visible,
      status = fighter.bloodlust,
      turn = world.turn
    fighter.bloodlust = 15 * 8
    world.turn |= 2
    scene.onChange()
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
    const blinkOff = !aura?.visible
    fighter.bloodlust = status
    world.turn = turn
    return {
      fighter: fighter.id,
      affected: affected.length,
      stock: world.shots.bloodlust,
      damage: hp - enemy.hp,
      expected,
      ordinary,
      status: fighter.bloodlust,
      flags: fighter.fight?.motion?.flags3 ?? fighter.native?.flags3 ?? 0,
      aura: auraVisible,
      blinkOff,
    }
  })
  assert.equal(combat.affected, 6)
  assert.equal(combat.stock, 0)
  assert.ok(combat.damage > combat.ordinary * 2)
  assert.ok(combat.damage <= combat.expected)
  assert.ok(combat.status > 0)
  assert.ok(combat.flags & 0x80000)
  assert.equal(combat.aura, true)
  assert.equal(combat.blinkOff, true)
  assert.equal(await page.getByText(/Bloodlust! The world bends to your will/).count(), 0)

  assert.equal(await page.evaluate(() => globalThis.testStore.saveCheckpoint()), true)
  const restored = await page.evaluate(async fighterId => {
    const store = globalThis.testStore
    store.change(world => {
      world.units.find(unit => unit.id === fighterId).bloodlust = 0
      world.giftCounts.bloodlust = 0
    })
    if (!store.loadCheckpoint()) return null
    const world = store.getWorld(),
      fighter = world.units.find(unit => unit.id === fighterId),
      { stepUnitBloodlust } = await import('/app/spell-effects-runtime.ts')
    const active = fighter.bloodlust
    fighter.bloodlust = 1
    stepUnitBloodlust(world)
    return { active, expired: fighter.bloodlust, gifts: world.giftCounts.bloodlust }
  }, combat.fighter)
  assert.ok(restored.active > 0)
  assert.deepEqual({ expired: restored.expired, gifts: restored.gifts }, { expired: 0, gifts: 1 })
  assert.deepEqual(errors, [])
  console.log(
    'PASS: Mission 16 worship granted Bloodlust; HUD cast affected six followers, changed live melee, expired, and restored'
  )
} finally {
  await browser.close()
}
