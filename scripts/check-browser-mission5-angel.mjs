import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from '@playwright/test'
import { bindGame, effectPixels, openGame } from './browser-game.mjs'

const artifactDir = resolve(process.env.POPULOUS_ARTIFACT_DIR ?? 'work/orchestration/worker5-22-static157-recovery/browser')
mkdirSync(artifactDir, { recursive: true })
const report = { stages: [] }
const stage = (name, data) => { report.stages.push({ name, data }); console.log(JSON.stringify({ name, data })) }

const MODEL157_SHA256 = 'b7504236b474eef4157b0cc7e4060f9a893d82ef632e3468df80f896c7f39070'
const ATLAS_SHA256 = 'fdb5c2af7ca43debb5d943036969df29949773b6b94c0b7ce99ffc5d946b27b0'

async function selectWarriors(page) {
  // Shift adds to the current selection; clear the initially selected Shaman
  // through the shipped UI before asserting exactly the four authored warriors.
  await page.locator('.world-viewport canvas.battlefield').focus()
  await page.keyboard.press('Escape')
  assert.equal(await page.evaluate(() => globalThis.testScene.world.selected.length), 0)
  await page
    .getByRole('button', { name: 'Select warrior', exact: true })
    .click({ modifiers: ['Shift'] })
  const selected = await page.evaluate(() => {
    const world = globalThis.testScene.world
    return world.units
      .filter(unit => world.selected.includes(unit.id))
      .map(unit => ({ id: unit.id, team: unit.team, kind: unit.kind }))
  })
  assert.equal(selected.length, 4)
  assert.ok(selected.every(unit => unit.team === 'blue' && unit.kind === 'warrior'))
}

async function headPoint(page, id) {
  return page.evaluate(headId => {
    const scene = globalThis.testScene,
      head = scene.world.shrines.find(shrine => shrine.id === headId)
    scene.focus(head)
    scene.onChange()
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
    const point = scene.screen(head),
      rect = scene.container.getBoundingClientRect(),
      x = rect.left + ((point.x + 1) * rect.width) / 2,
      y = rect.top + ((1 - point.y) * rect.height) / 2
    for (let dy = -160; dy <= 160; dy += 4)
      for (let dx = -160; dx <= 160; dx += 4) {
        const event = { clientX: x + dx, clientY: y + dy }
        if (!scene.pickUnit(event) && scene.pickWorldObject(event)?.id === head.id)
          return { x: event.clientX, y: event.clientY }
      }
    throw new Error(`No exposed worship geometry for head ${headId}`)
  }, id)
}

async function commandHead(page, id) {
  await selectWarriors(page)
  const point = await headPoint(page, id)
  await page.mouse.click(point.x, point.y)
  const result = await page.evaluate(headId => {
    const world = globalThis.testScene.world,
      head = world.shrines.find(shrine => shrine.id === headId),
      ordered = world.units
        .filter(unit => unit.team === 'blue' && unit.kind === 'warrior')
        .filter(unit => unit.native?.commandStatus === 27 && unit.work === headId)
        .map(unit => unit.id)
    return {
      message: world.message,
      ordered,
      head: { id: head.id, active: head.active, uses: head.uses },
    }
  }, id)
  assert.ok(result.ordered.length > 0, JSON.stringify(result))
  return result
}

async function finishHead(page, id, maxTurns, finishBridge = false) {
  const result = await page.evaluate(
    async ({ headId, max, bridge }) => {
      const scene = globalThis.testScene,
        world = scene.world,
        { advanceGame } = await import('/app/game-clock.ts'),
        head = world.shrines.find(shrine => shrine.id === headId)
      world.speed = 1
      let turns = 0
      for (; turns < max && head.active; turns++) advanceGame(world, scene.gameClock, 1 / 12)
      let bridgeTurns = 0
      if (bridge)
        for (; bridgeTurns < 96 && world.effects.some(effect => !!effect.bridge); bridgeTurns++)
          advanceGame(world, scene.gameClock, 1 / 12)
      world.speed = 0
      return {
        turns,
        bridgeTurns,
        active: head.active,
        uses: head.uses,
        bridges: world.effects.filter(effect => !!effect.bridge).length,
        turn: world.turn,
      }
    },
    { headId: id, max: maxTurns, bridge: finishBridge }
  )
  assert.equal(result.active, false, JSON.stringify(result))
  assert.equal(result.uses, 1, JSON.stringify(result))
  if (finishBridge) assert.equal(result.bridges, 0, JSON.stringify(result))
  return result
}

async function headFingerprint(page) {
  return page.evaluate(async () => {
    const scene = globalThis.testScene,
      world = scene.world,
      head = world.shrines.find(shrine => shrine.kind === 'angel')
    scene.focus(head)
    scene.onChange()
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
    const group = scene.shrineMeshes.get(head.id)?.g,
      mesh = group?.children.find(child => child.userData.nativeModel === head.model),
      { nativeModels } = await import('/app/scene-assets.ts'),
      model = nativeModels[157],
      digest = async value =>
        Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', value)))
          .map(byte => byte.toString(16).padStart(2, '0'))
          .join(''),
      modelSha = await digest(new TextEncoder().encode(JSON.stringify(model))),
      atlasResponse = await fetch('/original/atlas.png'),
      atlasBytes = await atlasResponse.arrayBuffer(),
      atlasSha = await digest(atlasBytes)
    return {
      head: {
        id: head.id,
        x: head.x,
        z: head.z,
        range: head.range,
        angle: head.angle,
        kind: head.kind,
        mode: head.mode,
        model: head.model,
        target: head.angelTarget,
        remaining: head.remaining,
        uses: head.uses,
        active: head.active,
      },
      mesh: mesh && {
        nativeModel: mesh.userData.nativeModel,
        nativeScale: mesh.userData.nativeScale,
        stage: mesh.userData.stage,
        vertices: mesh.geometry.getAttribute('position').count,
        visible: mesh.visible,
      },
      model: {
        sha256: modelSha,
        scale: model.scale,
        vertices: model.p.length / 3,
        faces: model.faces.length / 2,
        tiles: [...new Set(model.tiles)].sort((a, b) => a - b),
        panelHeight: model.panelHeight,
      },
      atlas: { sha256: atlasSha, bytes: atlasBytes.byteLength },
      randomState: world.randomState,
      cosmeticRandom: structuredClone(world.cosmeticRandom),
      warriors: world.units
        .filter(unit => unit.team === 'blue' && unit.kind === 'warrior')
        .map(unit => ({ id: unit.id, x: unit.x, z: unit.z, hp: unit.hp })),
    }
  })
}

const browser = await chromium.launch({ headless: !process.argv.includes('--headed') })
let page
try {
  const opened = await openGame(browser, 5)
  page = opened.page
  const { errors } = opened
  // Own pacing while asynchronous asset/checkpoint work and UI input run;
  // advancement still uses the unchanged chronological game clock.
  await page.evaluate(() => {
    const scene = globalThis.testScene
    cancelAnimationFrame(scene.frame)
    scene.world.speed = 0
  })

  const authored = await page.evaluate(() => {
    const world = globalThis.testScene.world,
      bridge1 = world.shrines.find(shrine => shrine.kind === 'bridgeEffect' && shrine.x === -53),
      bridge2 = world.shrines.find(shrine => shrine.kind === 'bridgeEffect' && shrine.x === -89),
      angel = world.shrines.find(shrine => shrine.kind === 'angel')
    return {
      bridge1: { id: bridge1.id, x: bridge1.x, z: bridge1.z, target: bridge1.bridgeTarget },
      bridge2: { id: bridge2.id, x: bridge2.x, z: bridge2.z, target: bridge2.bridgeTarget },
      angel: {
        id: angel.id,
        x: angel.x,
        z: angel.z,
        mode: angel.mode,
        model: angel.model,
        target: angel.angelTarget,
      },
    }
  })
  assert.deepEqual(authored.bridge1, { id: 109, x: -53, z: -5, target: { x: -67, z: -5 } })
  assert.deepEqual(authored.bridge2, { id: 94, x: -89, z: 15, target: { x: -89, z: 31 } })
  assert.deepEqual(authored.angel, {
    id: 95,
    x: -97,
    z: 117,
    mode: 5,
    model: 157,
    target: { x: -51, z: 15 },
  })

  await commandHead(page, authored.bridge1.id)
  const firstBridge = await finishHead(page, authored.bridge1.id, 6000, true)
  stage('first authored bridge', firstBridge)
  await commandHead(page, authored.bridge2.id)
  const secondBridge = await finishHead(page, authored.bridge2.id, 2000, true)
  stage('second authored bridge', secondBridge)

  const beforeCheckpoint = await headFingerprint(page)
  assert.equal(beforeCheckpoint.head.model, 157)
  assert.deepEqual(beforeCheckpoint.model, {
    sha256: MODEL157_SHA256,
    scale: 160,
    vertices: 525,
    faces: 120,
    tiles: [161, 182, 184, 221, 249],
    panelHeight: 706,
  })
  assert.deepEqual(beforeCheckpoint.mesh, {
    nativeModel: 157,
    nativeScale: 160,
    stage: 4,
    vertices: 525,
    visible: true,
  })
  assert.equal(beforeCheckpoint.atlas.sha256, ATLAS_SHA256)

  assert.equal(await page.evaluate(() => globalThis.testStore.saveCheckpoint()), true)
  assert.equal(await page.evaluate(() => globalThis.testStore.loadCheckpoint()), true)
  await bindGame(page)
  const afterCheckpoint = await headFingerprint(page)
  assert.deepEqual(afterCheckpoint, beforeCheckpoint)
  stage('static157 assets and checkpoint', afterCheckpoint)

  await commandHead(page, authored.angel.id)
  const reward = await page.evaluate(
    async ({ headId, maxTurns }) => {
      const scene = globalThis.testScene,
        world = scene.world,
        { advanceGame } = await import('/app/game-clock.ts')
      world.speed = 1
      let turns = 0
      for (; turns < maxTurns && !world.effects.some(effect => !!effect.angel); turns++)
        advanceGame(world, scene.gameClock, 1 / 12)
      const head = world.shrines.find(shrine => shrine.id === headId),
        angel = world.effects.find(effect => !!effect.angel)
      world.speed = 0
      if (angel) scene.focus(angel)
      scene.onChange()
      scene.animate(scene.previous)
      cancelAnimationFrame(scene.frame)
      return {
        turns,
        head: {
          active: head.active,
          uses: head.uses,
          mode: head.mode,
          model: head.model,
          x: head.x,
          z: head.z,
          target: head.angelTarget,
        },
        angel: angel && {
          id: angel.id,
          x: angel.x,
          z: angel.z,
          team: angel.team,
          phase: angel.angel.phase,
          lifetime: angel.angel.lifetime,
        },
        summonCues: [0xd9, 0xdb].every(cue => world.sounds.some(sound => sound.cue === cue)),
      }
    },
    { headId: authored.angel.id, maxTurns: 2500 }
  )
  assert.ok(reward.angel, JSON.stringify(reward))
  assert.deepEqual(reward.head, {
    active: false,
    uses: 1,
    mode: 5,
    model: 157,
    x: -97,
    z: 117,
    target: { x: -51, z: 15 },
  })
  assert.deepEqual(
    { ...reward.angel, id: undefined },
    { id: undefined, x: -51, z: 15, team: 'blue', phase: 'seeking', lifetime: 2500 }
  )
  assert.equal(reward.summonCues, true)
  const rewardMesh = await page.evaluate(id => {
    const mesh = globalThis.testScene.fxMeshes.get(id)
    return mesh && { visible: mesh.visible, layers: mesh.userData.layers.length, frame: mesh.userData.frame }
  }, reward.angel.id)
  assert.ok(rewardMesh?.visible && rewardMesh.layers > 0 && Number.isInteger(rewardMesh.frame))
  stage('normal authored Angel reward', reward)
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
    // Retain PR105's bounded expiry-only fixture after a natural chase/strike;
    // no travel, reward, target, damage or kill state is forced.
    angel.angel.lifetime = 1
    for (let frame = 0; frame < 64 && world.effects.includes(angel); frame++)
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
  stage('preserved autonomous combat and bounded expiry', combat)
  stage('Angel GPU contribution', { pixels })
  await page.screenshot({ path: resolve(artifactDir, 'mission5-static157.png') })
  assert.deepEqual(errors, [])
  console.log(
    `PASS: Mission 5 authored bridges ${firstBridge.turns}+${secondBridge.turns} turns, checkpointed model157 ${MODEL157_SHA256.slice(0, 12)}, normal warrior worship, linked Angel reward, ${pixels} Angel GPU pixels; no stock/reward/position injection; inherited bounded expiry fixture after natural combat`
  )
  report.status = 'PASS'
} catch (error) {
  report.status = 'FAIL'
  report.error = error.stack ?? String(error)
  if (page) await page.screenshot({ path: resolve(artifactDir, 'failure.png') }).catch(() => {})
  throw error
} finally {
  writeFileSync(resolve(artifactDir, 'report.json'), JSON.stringify(report, null, 2))
  await browser.close()
}
