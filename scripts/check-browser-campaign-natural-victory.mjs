import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

const browser = await chromium.launch({ headless: !process.argv.includes('--headed') })
const wrapped = value => ((value + 128) % 256 + 256) % 256 - 128

async function state(page) {
  return page.evaluate(() => {
    const world = globalThis.testScene.world
    return {
      level: world.outcome.level,
      status: world.status,
      turn: world.turn,
      shots: { ...world.shots },
      stats: { ...world.stats },
      units: world.units
        .filter(unit => unit.hp > 0)
        .map(unit => ({
          id: unit.id,
          team: unit.team,
          kind: unit.kind,
          x: unit.x,
          z: unit.z,
          hp: unit.hp,
          inside: unit.inside,
        })),
      buildings: world.buildings
        .filter(building => building.hp > 0)
        .map(building => ({
          id: building.id,
          team: building.team,
          kind: building.kind,
          x: building.x,
          z: building.z,
          hp: building.hp,
          progress: building.progress,
        })),
      shrines: world.shrines.map(shrine => ({
        id: shrine.id,
        kind: shrine.kind,
        x: shrine.x,
        z: shrine.z,
        uses: shrine.uses,
        remaining: shrine.remaining,
      })),
      unlockedTemple: world.unlockedTemple,
    }
  })
}

async function advance(page, turns) {
  return page.evaluate(async turns => {
    const world = globalThis.testScene.world,
      { tick } = await import('/app/model.ts')
    for (let turn = 0; turn < turns && world.status === 'playing'; turn++) tick(world, 1 / 12)
    globalThis.testStore.update()
    globalThis.testScene.animate(globalThis.testScene.previous)
    cancelAnimationFrame(globalThis.testScene.frame)
    return world.status
  }, turns)
}

async function advanceOutcome(page) {
  await page.evaluate(() => globalThis.testScene.animate(performance.now()))
  await page.waitForFunction(() => !globalThis.testScene.world.outcome.cameraPlaying)
  await page.evaluate(() => cancelAnimationFrame(globalThis.testScene.frame))
}

async function advanceUntil(page, condition, limit, label, required = true) {
  const result = await page.evaluate(
    async ({ condition, limit }) => {
      const world = globalThis.testScene.world,
        { tick } = await import('/app/model.ts'),
        ready = () => {
          if (condition.type === 'building')
            return world.buildings.some(
              building => building.id === condition.id && building.progress === 1
            )
          if (condition.type === 'unit-count')
            return (
              world.units.filter(
                unit =>
                  unit.team === condition.team &&
                  unit.kind === condition.kind &&
                  unit.hp > 0
              ).length >= condition.count
            )
          if (condition.type === 'shrine-uses')
            return world.shrines.some(
              shrine => shrine.id === condition.id && shrine.uses >= condition.uses
            )
          if (condition.type === 'shrine-empty')
            return world.shrines.some(
              shrine => shrine.id === condition.id && shrine.remaining === 0
            )
          if (condition.type === 'no-effect')
            return !world.effects.some(effect => effect.kind === condition.kind)
          if (condition.type === 'effect')
            return world.effects.some(effect => effect.kind === condition.kind)
          if (condition.type === 'unlocked-temple') return world.unlockedTemple
          if (condition.type === 'unit-dead')
            return !world.units.some(unit => unit.id === condition.id && unit.hp > 0)
          if (condition.type === 'unit-converted') {
            const unit = world.units.find(unit => unit.id === condition.id && unit.hp > 0)
            return !unit || unit.team !== condition.team
          }
          if (condition.type === 'unit-near') {
            const unit = world.units.find(
              unit =>
                unit.team === condition.team &&
                unit.kind === condition.kind &&
                unit.hp > 0
            )
            if (!unit) return false
            const wrapped = value => ((value + 128) % 256 + 256) % 256 - 128
            return (
              Math.hypot(wrapped(unit.x - condition.x), wrapped(unit.z - condition.z)) <=
              condition.distance
            )
          }
          if (condition.type === 'units-near') {
            const unit = world.units.find(
                unit =>
                  unit.team === condition.team &&
                  unit.kind === condition.kind &&
                  unit.hp > 0
              ),
              target = world.units.find(
                unit => unit.id === condition.target && unit.hp > 0 && unit.inside === null
              )
            if (!unit || !target) return false
            const wrapped = value => ((value + 128) % 256 + 256) % 256 - 128
            return (
              Math.hypot(wrapped(unit.x - target.x), wrapped(unit.z - target.z)) <
              condition.distance
            )
          }
          if (condition.type === 'message')
            return world.messages.slots.some(message => message?.stringId === condition.stringId)
          if (condition.type === 'status') return world.status === condition.status
          throw new Error(`Unknown condition ${condition.type}`)
        }
      for (let turn = 0; turn < limit && world.status === 'playing' && !ready(); turn++)
        tick(world, 1 / 12)
      globalThis.testStore.update()
      globalThis.testScene.animate(globalThis.testScene.previous)
      cancelAnimationFrame(globalThis.testScene.frame)
      return {
        ready: ready(),
        turn: world.turn,
        status: world.status,
        selected: world.selected,
        shaman: world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman'),
        messages: world.messages.slots.map(message => message?.stringId ?? null),
      }
    },
    { condition, limit }
  )
  if (required) assert.ok(result.ready, `${label} timed out: ${JSON.stringify(result)}`)
  return result
}

async function entityPoint(page, collection, id) {
  return page.evaluate(
    ({ collection, id }) => {
      const scene = globalThis.testScene,
        world = scene.world,
        object = world[collection].find(candidate => candidate.id === id),
        bounds = scene.container.getBoundingClientRect()
      if (!object) throw new Error(`Missing ${collection} object ${id}`)
      scene.focus(object)
      scene.onChange()
      scene.renderer.render(scene.scene, scene.camera)
      const mesh =
          collection === 'units'
            ? scene.unitMeshes.get(id)
            : collection === 'buildings'
              ? scene.buildingMeshes.get(id)
              : scene.shrineMeshes.get(id)?.g,
        projected = scene.screen(mesh?.position ?? object),
        center = {
          x: bounds.left + ((projected.x + 1) * bounds.width) / 2,
          y: bounds.top + ((1 - projected.y) * bounds.height) / 2,
        },
        unit = collection === 'units'
      for (let dy = unit ? -24 : -140; dy <= (unit ? 24 : 60); dy += 4)
        for (let dx = unit ? -36 : -100; dx <= (unit ? 36 : 100); dx += 4) {
          const event = { clientX: center.x + dx, clientY: center.y + dy },
            person = scene.picking.pickPerson(event),
            picked = unit
              ? person
              : person !== null
                ? undefined
                : scene.pickWorldObject(event)?.id
          if (
            picked === id &&
            document.elementFromPoint(event.clientX, event.clientY) === scene.renderer.domElement
          )
            return { x: event.clientX, y: event.clientY }
        }
      throw new Error(`No rendered hit point for ${collection} object ${id}`)
    },
    { collection, id }
  )
}

async function groundPoint(page, point, buildingKind, maxRadius = 12) {
  return page.evaluate(async ({ point, buildingKind, maxRadius }) => {
    const scene = globalThis.testScene,
      bounds = scene.container.getBoundingClientRect(),
      placementError = buildingKind
        ? (await import('/app/model.ts')).placementError
        : undefined
    scene.focus(point)
    scene.onChange()
    scene.renderer.render(scene.scene, scene.camera)
    for (let radius = 0; radius <= maxRadius; radius += 2)
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 12) {
        const candidate = {
            x: point.x + Math.cos(angle) * radius,
            z: point.z + Math.sin(angle) * radius,
          },
          projected = scene.screen(candidate),
          event = {
            clientX: bounds.left + ((projected.x + 1) * bounds.width) / 2,
            clientY: bounds.top + ((1 - projected.y) * bounds.height) / 2,
          },
          picked = scene.pick(event)
        if (
          document.elementFromPoint(event.clientX, event.clientY) === scene.renderer.domElement &&
          scene.picking.pick(event) === null &&
          picked &&
          (!placementError || !placementError(scene.world, buildingKind, picked)) &&
          Math.hypot(picked.x - candidate.x, picked.z - candidate.z) < 2
        )
          return {
            x: event.clientX,
            y: event.clientY,
            point: { x: picked.x, z: picked.z },
          }
      }
    throw new Error(`No rendered ground point near ${point.x},${point.z}`)
  }, { point, buildingKind, maxRadius })
}

async function clickEntity(page, collection, id) {
  const point = await entityPoint(page, collection, id)
  await page.mouse.click(point.x, point.y)
}

async function dismissFlyby(page) {
  if (await page.evaluate(() => !!(globalThis.testScene.world.inputMask & 64))) {
    await page.keyboard.press('Escape')
    await page.waitForFunction(() => !(globalThis.testScene.world.inputMask & 64))
  }
}

async function selectClass(page, kind) {
  await dismissFlyby(page)
  if (kind === 'shaman') await page.getByLabel('followers', { exact: true }).click()
  const button = page.getByLabel(`Select ${kind}`, { exact: true })
  if (kind === 'shaman') await button.click()
  else await button.click({ modifiers: ['Shift'] })
  return page.evaluate(kind => {
    const world = globalThis.testScene.world
    return world.selected.some(id =>
      world.units.some(unit => unit.id === id && unit.kind === kind && unit.hp > 0)
    )
  }, kind)
}

async function validBuildPoint(page, kind, preferred) {
  return page.evaluate(
    async ({ kind, preferred }) => {
      const world = globalThis.testScene.world,
        { placementError } = await import('/app/model.ts')
      for (let radius = 0; radius <= 24; radius += 2)
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 12) {
          const point = {
            x: preferred.x + Math.cos(angle) * radius,
            z: preferred.z + Math.sin(angle) * radius,
          }
          if (!placementError(world, kind, point)) return point
        }
      throw new Error(`No valid ${kind} placement near ${preferred.x},${preferred.z}`)
    },
    { kind, preferred }
  )
}

async function build(page, kind, label, point) {
  const before = new Set((await state(page)).buildings.map(building => building.id)),
    target = await groundPoint(page, await validBuildPoint(page, kind, point), kind)
  await selectClass(page, 'brave')
  await page.getByLabel('buildings B', { exact: true }).click()
  await page.getByRole('button', { name: label, exact: true }).click()
  await page.mouse.click(target.x, target.y)
  const building = (await state(page)).buildings.find(candidate => !before.has(candidate.id))
  if (!building) {
    const detail = await page.evaluate(() => ({
      inputMask: globalThis.testScene.world.inputMask,
      message: globalThis.testScene.world.message,
      mode: globalThis.testScene.world.mode,
      selected: globalThis.testScene.world.selected,
    }))
    assert.fail(`${kind} was not placed through the rendered building controls: ${JSON.stringify(detail)}`)
  }
  await advanceUntil(page, { type: 'building', id: building.id }, 20_000, `${kind} completion`)
  return building
}

async function train(page, building, turns = 2500) {
  const snapshot = await state(page),
    braves = snapshot.units.filter(unit => unit.team === 'blue' && unit.kind === 'brave')
  if (!snapshot.buildings.some(candidate => candidate.id === building.id) || !braves.length)
    return false
  await selectClass(page, 'brave')
  try {
    await clickEntity(page, 'buildings', building.id)
  } catch {
    await moveSelected(page, building, 600, 48)
    await selectClass(page, 'brave')
    await clickEntity(page, 'buildings', building.id)
  }
  await advance(page, turns)
  return true
}

async function worship(page, kind, follower) {
  const snapshot = await state(page),
    shrine = snapshot.shrines.find(candidate => candidate.kind === kind)
  assert.ok(shrine, `Missing ${kind} shrine`)
  await selectClass(page, follower)
  await clickEntity(page, 'shrines', shrine.id)
  const result = await page.evaluate(
    ({ shrineId, follower }) =>
      ({
        accepted: globalThis.testScene.world.units.some(
          unit => unit.team === 'blue' && unit.kind === follower && unit.work === shrineId
        ),
        inputMask: globalThis.testScene.world.inputMask,
        selected: globalThis.testScene.world.selected,
        message: globalThis.testScene.world.message,
      }),
    { shrineId: shrine.id, follower }
  )
  assert.ok(result.accepted, `${follower} worship order for ${kind} was not accepted: ${JSON.stringify(result)}`)
  return shrine
}

async function moveSelected(page, point, turns, maxRadius) {
  const before = await page.evaluate(() => ({
      turn: globalThis.testScene.world.turn,
      lastOrderTurn: globalThis.testScene.world.lastOrderTurn,
    })),
    target = await groundPoint(page, point, undefined, maxRadius)
  await page.mouse.click(target.x, target.y)
  const result = await page.evaluate(() => ({
    lastOrderTurn: globalThis.testScene.world.lastOrderTurn,
    inputMask: globalThis.testScene.world.inputMask,
    mode: globalThis.testScene.world.mode,
    selected: globalThis.testScene.world.selected,
    message: globalThis.testScene.world.message,
  }))
  assert.ok(
    result.lastOrderTurn > before.lastOrderTurn && result.lastOrderTurn >= before.turn,
    `movement click was not accepted: ${JSON.stringify({ before, result })}`
  )
  if (turns) await advance(page, turns)
}

async function reachableApproach(page, target, radius = 12, choice = 0) {
  return page.evaluate(
    async ({ target, radius, choice }) => {
      const world = globalThis.testScene.world,
        { findPath, supportsFollower } = await import('/app/model.ts'),
        shaman = world.units.find(
          unit => unit.team === 'blue' && unit.kind === 'shaman' && unit.hp > 0
        ),
        wrapped = value => ((value + 128) % 256 + 256) % 256 - 128
      if (!shaman) throw new Error('Missing shaman for approach')
      const probe = structuredClone(world),
        probeShaman = probe.units.find(unit => unit.id === shaman?.id),
        candidates = []
      if (!probeShaman) throw new Error('Missing shaman for approach')
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
        const candidate = {
          x: wrapped(target.x + Math.cos(angle) * radius),
          z: wrapped(target.z + Math.sin(angle) * radius),
        }
        if (!supportsFollower(world, candidate)) continue
        const path = findPath(probe, probeShaman, candidate)
        if (path.length) candidates.push({ ...candidate, path: path.length })
      }
      candidates.sort((a, b) => a.path - b.path)
      if (!candidates.length) throw new Error(`No reachable approach to ${target.x},${target.z}`)
      const { x, z } = candidates[choice % candidates.length]
      return { x, z }
    },
    { target, radius, choice }
  )
}

async function castAt(page, spell, collection, id, required = true) {
  let target
  try {
    target = await entityPoint(page, collection, id)
  } catch {
    const object = (await state(page))[collection].find(candidate => candidate.id === id)
    assert.ok(object, `Missing ${collection} spell target ${id}`)
    target = await groundPoint(page, object)
  }
  const shot = spell.toLowerCase(),
    before = (await state(page)).shots[shot]
  await page.getByLabel(/spells/).click()
  await page.getByRole('button', { name: new RegExp(`^${spell}, `) }).click()
  await page.mouse.click(target.x, target.y)
  await advance(page, 1)
  const accepted = (await state(page)).shots[shot] === before - 1
  if (required) assert.ok(accepted, `${spell} cast was accepted`)
  return accepted
}

function nearest(units, point, priority = () => 0) {
  return units.toSorted(
    (a, b) =>
      priority(a) - priority(b) ||
      Math.hypot(wrapped(a.x - point.x), wrapped(a.z - point.z)) -
        Math.hypot(wrapped(b.x - point.x), wrapped(b.z - point.z))
  )[0]
}

async function missionTwo(page) {
  const camp = await build(page, 'camp', 'Warrior Training Hut, 8 wood', {
    x: -99,
    z: -105,
  })
  await build(page, 'hut', 'Hut, 3 wood', { x: -96, z: -124 })
  await build(page, 'hut', 'Hut, 3 wood', { x: -92, z: -116 })
  await train(page, camp, 5000)

  const bridge = await worship(page, 'bridgeEffect', 'shaman')
  await advanceUntil(page, { type: 'shrine-uses', id: bridge.id, uses: 1 }, 10_000, 'Mission 2 bridge')
  await advanceUntil(page, { type: 'effect', kind: 'bridge' }, 2000, 'Mission 2 bridge start')
  await advanceUntil(page, { type: 'no-effect', kind: 'bridge' }, 5000, 'Mission 2 bridge effect')
  await advance(page, 240)
  const tornado = await worship(page, 'tornado', 'shaman')
  await advanceUntil(page, { type: 'message', stringId: 644 }, 10_000, 'shaman enters Tornado shrine')
  await worship(page, 'tornado', 'brave')
  await advanceUntil(page, { type: 'message', stringId: 642 }, 10_000, 'followers enter Tornado shrine')
  await advanceUntil(page, { type: 'shrine-empty', id: tornado.id }, 20_000, 'Mission 2 Tornado worship')

  for (let group = 0; group < 8; group++) {
    await train(page, camp)
    const warriors = (await state(page)).units.filter(
      unit => unit.team === 'blue' && unit.kind === 'warrior'
    ).length
    if (warriors >= 24) break
  }

  for (const target of [
    { x: 55, z: 107 },
    { x: 72, z: 104 },
    { x: 100, z: 118 },
  ]) {
    let cast = false,
      rejection
    for (let attempt = 0; attempt < 5 && !cast; attempt++) {
      const reincarnated = await advanceUntil(
        page,
        { type: 'unit-count', team: 'blue', kind: 'shaman', count: 1 },
        5000,
        'Mission 2 shaman reincarnation',
        false
      )
      if (!reincarnated.ready) continue
      const spellTarget = await groundPoint(page, target),
        approach = await reachableApproach(page, spellTarget.point, 8, attempt)
      if (!(await selectClass(page, 'shaman'))) continue
      await moveSelected(page, approach)
      const inRange = await advanceUntil(
        page,
        { type: 'unit-near', team: 'blue', kind: 'shaman', ...approach, distance: 2 },
        3000,
        'shaman Tornado range',
        false
      )
      if (!inRange.ready) {
        rejection = await page.evaluate(
          ({ spellTarget, approach }) => {
            const world = globalThis.testScene.world,
              shaman = world.units.find(
                unit => unit.team === 'blue' && unit.kind === 'shaman' && unit.hp > 0
              )
            return {
              phase: 'approach',
              spellTarget,
              approach,
              selected: world.selected,
              status: world.status,
              shaman: shaman && {
                id: shaman.id,
                x: shaman.x,
                z: shaman.z,
                hp: shaman.hp,
                state: shaman.state,
                flags2: shaman.flags2,
                flags4: shaman.flags4,
                inside: shaman.inside,
              },
            }
          },
          { spellTarget: spellTarget.point, approach }
        )
        if (
          attempt === 0 &&
          (await state(page)).units.some(
            unit => unit.team === 'blue' && unit.kind === 'warrior' && unit.inside === null
          )
        ) {
          await selectClass(page, 'warrior')
          await moveSelected(page, approach)
          await advance(page, 600)
        }
        continue
      }
      const before = (await state(page)).shots.tornado,
        point = await groundPoint(page, spellTarget.point)
      await page.getByLabel(/spells/).click()
      await page.getByRole('button', { name: /^Tornado, / }).click()
      await page.mouse.click(point.x, point.y)
      await advance(page, 1)
      cast = (await state(page)).shots.tornado === before - 1
      if (!cast) {
        rejection = await page.evaluate(
          ({ spellTarget, approach }) => {
            const world = globalThis.testScene.world,
              shaman = world.units.find(
                unit => unit.team === 'blue' && unit.kind === 'shaman' && unit.hp > 0
              )
            return {
              spellTarget,
              approach,
              shots: world.shots.tornado,
              stock: world.manaWorld.spells[0].stocks[4],
              selected: world.selected,
              mode: world.mode,
              inputMask: world.inputMask,
              casting: world.castingTribes[0],
              shaman: shaman && {
                id: shaman.id,
                x: shaman.x,
                z: shaman.z,
                state: shaman.state,
                flags2: shaman.flags2,
                flags4: shaman.flags4,
                inside: shaman.inside,
              },
            }
          },
          { spellTarget: spellTarget.point, approach }
        )
        await page.keyboard.press('Escape')
      }
    }
    assert.ok(
      cast,
      `Tornado cast at ${target.x},${target.z} was accepted: ${JSON.stringify(rejection)}`
    )
    await advance(page, 800)
  }

  const stalled = new Set()
  for (let round = 0; round < 140; round++) {
    const snapshot = await state(page)
    if (snapshot.status !== 'playing') break
    if (!snapshot.units.some(unit => unit.team === 'blue' && unit.kind === 'warrior')) {
      await train(page, camp)
      await advance(page, 1200)
      continue
    }
    let candidates = [
      ...snapshot.units
        .filter(unit => unit.team === 'green' && unit.inside === null)
        .map(object => ({ ...object, object, collection: 'units' })),
      ...snapshot.buildings
        .filter(building => building.team === 'green' && building.progress === 1)
        .map(object => ({ ...object, object, collection: 'buildings' })),
    ].filter(candidate => !stalled.has(`${candidate.collection}-${candidate.object.id}`))
    if (!candidates.length) {
      stalled.clear()
      candidates = [
        ...snapshot.units
          .filter(unit => unit.team === 'green' && unit.inside === null)
          .map(object => ({ ...object, object, collection: 'units' })),
        ...snapshot.buildings
          .filter(building => building.team === 'green' && building.progress === 1)
          .map(object => ({ ...object, object, collection: 'buildings' })),
      ]
    }
    const candidate = nearest(candidates, { x: -99, z: -105 }, candidate =>
      candidate.object.kind === 'shaman' ? 1 : 0
    )
    if (!candidate) {
      await advance(page, 300)
      continue
    }
    const { object: target, collection } = candidate
    await selectClass(page, 'warrior')
    try {
      await clickEntity(page, collection, target.id)
    } catch {
      await moveSelected(page, { x: target.x, z: target.z })
    }
    await advance(page, 600)
    const next = await state(page)
    if (next[collection].some(object => object.id === target.id))
      stalled.add(`${collection}-${target.id}`)
  }
  await advanceUntil(page, { type: 'status', status: 'won' }, 5000, 'natural Mission 2 victory')
}

async function missionThree(page) {
  const vault = await worship(page, 'vault', 'shaman')
  await advanceUntil(page, { type: 'unlocked-temple' }, 10_000, 'Mission 3 Temple knowledge')
  let snapshot = await state(page)
  const swarmTarget = nearest(
    snapshot.units.filter(unit => unit.team === 'yellow' && unit.kind !== 'shaman'),
    snapshot.shrines.find(shrine => shrine.id === vault.id)
  )
  await castAt(page, 'Swarm', 'units', swarmTarget.id)

  const temple = await build(page, 'temple', 'Temple, 8 wood', { x: 24, z: 70 })
  await advanceUntil(
    page,
    { type: 'unit-count', team: 'blue', kind: 'brave', count: 3 },
    10_000,
    'Mission 3 Braves'
  )
  await train(page, temple, 5000)
  await advanceUntil(
    page,
    { type: 'unit-count', team: 'blue', kind: 'preacher', count: 3 },
    15_000,
    'Mission 3 Preachers'
  )

  snapshot = await state(page)
  let enemyPreacher = snapshot.units.find(
    unit => unit.team === 'yellow' && unit.kind === 'preacher' && unit.inside === null
  )
  for (let attempt = 0; attempt < 16 && enemyPreacher; attempt++) {
    const reincarnated = await advanceUntil(
      page,
      { type: 'unit-count', team: 'blue', kind: 'shaman', count: 1 },
      5000,
      'Mission 3 shaman reincarnation',
      false
    )
    if (!reincarnated.ready) continue
    enemyPreacher = (await state(page)).units.find(
      unit => unit.team === 'yellow' && unit.kind === 'preacher' && unit.inside === null
    )
    if (!enemyPreacher) break
    if (!(await selectClass(page, 'shaman'))) continue
    await moveSelected(page, { x: enemyPreacher.x + 4, z: enemyPreacher.z })
    const inRange = await advanceUntil(
      page,
      {
        type: 'units-near',
        team: 'blue',
        kind: 'shaman',
        target: enemyPreacher.id,
        distance: 7,
      },
      3000,
      'shaman Blast range',
      false
    )
    snapshot = await state(page)
    enemyPreacher = snapshot.units.find(
      unit => unit.team === 'yellow' && unit.kind === 'preacher' && unit.inside === null
    )
    if (!enemyPreacher) {
      await advance(page, 300)
      enemyPreacher = (await state(page)).units.find(
        unit => unit.team === 'yellow' && unit.kind === 'preacher' && unit.inside === null
      )
      if (!enemyPreacher) continue
    }
    if (!inRange.ready) continue
    if (!(await castAt(page, 'Blast', 'units', enemyPreacher.id, false))) {
      await page.keyboard.press('Escape')
      await advance(page, 24)
      continue
    }
    await advance(page, 180)
    enemyPreacher = (await state(page)).units.find(
      unit => unit.team === 'yellow' && unit.kind === 'preacher'
    )
  }
  assert.equal(enemyPreacher, undefined, 'ordinary Blast casts remove the Chumara Preacher')

  const erosion = await worship(page, 'erosionEffect', 'preacher')
  await advanceUntil(page, { type: 'shrine-uses', id: erosion.id, uses: 1 }, 10_000, 'Mission 3 Erosion')
  await advanceUntil(page, { type: 'effect', kind: 'erosion' }, 2000, 'Mission 3 Erosion start')
  await advanceUntil(page, { type: 'no-effect', kind: 'erosion' }, 10_000, 'Mission 3 Erosion effect')
  await selectClass(page, 'preacher')
  await moveSelected(page, { x: -19, z: 117 }, 3000)

  await build(page, 'hut', 'Hut, 3 wood', { x: 40, z: 72 })
  await build(page, 'hut', 'Hut, 3 wood', { x: 20, z: 100 })
  snapshot = await state(page)
  const returningPreacher = snapshot.units.find(
    unit => unit.team === 'yellow' && unit.kind === 'preacher' && unit.inside === null
  )
  if (returningPreacher) {
    await selectClass(page, 'preacher')
    await moveSelected(page, { x: returningPreacher.x + 1, z: returningPreacher.z })
    await advanceUntil(
      page,
      { type: 'unit-converted', id: returningPreacher.id, team: 'yellow' },
      3000,
      'counter-preaching foothold',
      false
    )
  }
  let camp = await build(page, 'camp', 'Warrior Training Hut, 8 wood', { x: 45, z: 90 })
  const stalledBuildings = new Set()
  for (let wave = 0; wave < 10; wave++) {
    if (!(await state(page)).buildings.some(building => building.id === camp.id))
      camp = await build(page, 'camp', 'Warrior Training Hut, 8 wood', { x: 45, z: 90 })
    for (let group = 0; group < 4; group++) {
      if (
        (await state(page)).units.filter(
          unit => unit.team === 'blue' && unit.kind === 'warrior'
        ).length >= 9
      )
        break
      await train(page, camp)
    }
    snapshot = await state(page)
    if (snapshot.status !== 'playing') break
    if (wave > 0) {
      const hut = nearest(
        snapshot.buildings.filter(
          building =>
            building.team === 'yellow' &&
            building.kind === 'hut' &&
            building.progress === 1 &&
            !stalledBuildings.has(building.id)
        ),
        { x: -19, z: 117 }
      )
      if (hut) {
        await selectClass(page, 'warrior')
        try {
          await clickEntity(page, 'buildings', hut.id)
        } catch {
          stalledBuildings.add(hut.id)
        }
        await advance(page, 2400)
        if ((await state(page)).buildings.some(building => building.id === hut.id))
          stalledBuildings.add(hut.id)
      }
    }
    const stalled = new Set()
    for (let round = 0; round < 80; round++) {
      snapshot = await state(page)
      if (snapshot.status !== 'playing') break
      const warriors = snapshot.units.filter(
        unit => unit.team === 'blue' && unit.kind === 'warrior' && unit.inside === null
      )
      if (!warriors.length) break
      let candidates = snapshot.units.filter(
        unit => unit.team === 'yellow' && unit.inside === null && !stalled.has(unit.id)
      )
      if (!candidates.length) {
        stalled.clear()
        candidates = snapshot.units.filter(
          unit => unit.team === 'yellow' && unit.inside === null
        )
      }
      const target = nearest(candidates, { x: -19, z: 117 }, unit =>
        unit.kind === 'preacher' ? -2 : unit.kind === 'shaman' ? 1 : 0
      )
      if (!target) {
        await advance(page, 300)
        continue
      }
      await selectClass(page, 'warrior')
      try {
        await clickEntity(page, 'units', target.id)
      } catch {
        await moveSelected(page, { x: target.x, z: target.z })
      }
      await advance(page, target.kind === 'preacher' ? 2400 : 600)
      if ((await state(page)).units.some(unit => unit.id === target.id)) stalled.add(target.id)
    }
  }
  await advanceUntil(page, { type: 'status', status: 'won' }, 5000, 'natural Mission 3 victory')
}

try {
  const { page, errors } = await openGame(browser, 2)
  page.setDefaultTimeout(20_000)
  await missionTwo(page)
  await advanceOutcome(page)
  assert.equal(
    await page.evaluate(() => globalThis.testStore.getCompletedMissions().includes(2)),
    true,
    'Mission 2 victory is recorded in the campaign profile'
  )
  await page.getByRole('button', { name: 'Continue to Mission 3', exact: false }).click()
  await page.waitForFunction(() => globalThis.testStore.getWorld().outcome.level === 3)
  await page.waitForFunction(
    () => globalThis.testSceneRef.current?.world === globalThis.testStore.getWorld()
  )
  await page.evaluate(() => {
    globalThis.testScene = globalThis.testSceneRef.current
  })
  await page.waitForFunction(() => globalThis.testScene.world.flyby.flags & 1)
  await page.keyboard.press('Escape')
  await page.waitForFunction(() => !globalThis.testScene.world.inputMask)
  await missionThree(page)
  await advanceOutcome(page)
  assert.equal(
    await page.evaluate(() => globalThis.testStore.getCompletedMissions().includes(3)),
    true,
    'Mission 3 victory is recorded in the campaign profile'
  )
  await page.getByRole('button', { name: 'Continue to Mission 4', exact: false }).waitFor()
  assert.deepEqual(errors, [])
  console.log('PASS: rendered player actions win Mission 2, continue, and naturally win Mission 3')
} finally {
  await browser.close()
}
