// Actual placement followed by native harvesting and bystander clearance.
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'
import { buildingFootprintCells } from '../app/building-shapes.ts'
import { buildingPose, browserPosition } from '../app/model.ts'
import { spriteDirection } from '../app/projection.ts'
import sprites from '../app/original-units.json' with { type: 'json' }
const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  await page.getByRole('button', { name: 'Enable sound', exact: true }).click()
  await page.evaluate(() => {
    const s = window.testScene,
      w = s.world,
      play = s.onSound,
      start = AudioBufferSourceNode.prototype.start
    s.onSound = (cue, ...args) => {
      window.playingCue = cue
      try {
        return play(cue, ...args)
      } finally {
        window.playingCue = null
      }
    }
    AudioBufferSourceNode.prototype.start = function (...args) {
      if (window.playingCue === 1 && this.buffer?.getChannelData(0).some(v => v !== 0))
        window.heardHarvest = true
      return start.apply(this, args)
    }
    w.speed = 0
    w.manaWorld.gameFlags = 32
    w.selected = w.units.filter(u => u.team === 'blue' && u.kind === 'brave').map(u => u.id)
    s.focus({ x: -2, z: 32 })
    s.onChange()
  })
  await page.waitForFunction(() => !window.testScene.cameraMotion.active)
  await page.getByRole('button', { name: 'buildings B', exact: true }).click()
  await page.getByRole('button', { name: 'Hut, 3 wood', exact: true }).click()
  const point = await page.evaluate(() => {
    const s = window.testScene,
      p = { x: -1.7, z: 32.3 },
      q = s.screen(p, s.y(p)),
      r = s.container.getBoundingClientRect()
    return { x: r.left + ((q.x + 1) * r.width) / 2, y: r.top + ((1 - q.y) * r.height) / 2 }
  })
  await page.mouse.move(point.x, point.y)
  await page.waitForFunction(
    () => window.testScene.cursor.visible && !window.testScene.cursor.userData.invalid
  )
  await page.mouse.click(point.x, point.y)
  await page.waitForFunction(() => window.testScene.world.buildings.some(b => b.progress === 0))
  const b = await page.evaluate(() => {
    window.clearingPlan = window.testScene.world.buildings.at(-1)
    return window.clearingPlan
  })
  const cells = buildingFootprintCells(buildingPose(b)),
    center = i => browserPosition({ x: (i & 127) * 512 + 256, y: (i >> 7) * 512 + 256 })
  await page.evaluate(
    ({ tree, person }) => {
      const s = window.testScene,
        w = s.world
      window.clearingTree = w.trees.find(t => t.model === 1 && t.logs === 4)
      Object.assign(window.clearingTree, tree)
      window.bystander = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
      Object.assign(window.bystander, person, {
        path: [],
        work: null,
        target: null,
        native: null,
        casting: null,
      })
      window.originalBystander = person
      s.focus(window.clearingPlan)
      s.startGroundView(2)
    },
    { tree: center(cells[0]), person: center(cells.at(-1)) }
  )
  await page.mouse.move(1300, 950)
  await page.waitForFunction(() => !window.testScene.cameraMotion.active)
  await page.evaluate(() => {
    window.testScene.world.speed = 4
  })
  await page.waitForFunction(
    () => {
      const w = window.testScene.world,
        u = w.units.find(
          u =>
            u.builder?.task === 3 &&
            u.builder.phase === 51 &&
            u.builder.person?.speed === 0 &&
            u.builder.person.object === 88
        )
      if (!u) return false
      window.harvester = u
      w.speed = 0
      w.paused = true
      return true
    },
    null,
    { timeout: 60000 }
  )
  await page.waitForFunction(
    () => window.testScene.unitMeshes.get(window.harvester.id)?.userData.state === 'work'
  )
  const pose = await page.evaluate(() => {
    const s = window.testScene,
      u = window.harvester,
      p = u.builder.person,
      g = s.unitMeshes.get(u.id),
      gl = s.renderer.getContext()
    const read = () => {
      s.renderer.render(s.scene, s.camera)
      const a = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4)
      gl.readPixels(
        0,
        0,
        gl.drawingBufferWidth,
        gl.drawingBufferHeight,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        a
      )
      return a
    }
    const before = read()
    g.visible = false
    const after = read()
    g.visible = true
    let pixels = 0
    for (let i = 0; i < before.length; i += 4)
      if (
        before[i] !== after[i] ||
        before[i + 1] !== after[i + 1] ||
        before[i + 2] !== after[i + 2]
      )
        pixels++
    return {
      object: p.object,
      step: p.f2,
      heading: u.heading,
      bearing: s.cameraBearing,
      frame: g.userData.frame,
      flip: g.userData.frameFlip,
      pixels,
      heard: !!window.heardHarvest,
      preparing: !!window.clearingPlan.preparation,
    }
  })
  const directions = sprites.animations['blue-brave'].work,
    direction = spriteDirection(
      Math.round((pose.bearing * 1024) / Math.PI),
      Math.round(((Math.PI - pose.heading) * 1024) / Math.PI)
    )
  assert.equal(pose.object, directions[0].source)
  assert.equal(
    pose.frame,
    directions[direction].frames[pose.step % directions[direction].frames.length]
  )
  assert.equal(pose.flip, directions[direction].flip)
  assert.ok(pose.pixels > 0 && pose.heard && pose.preparing)
  await page.locator('.paused-badge').evaluate(el => {
    el.style.visibility = 'hidden'
  })
  await page.screenshot({ path: '/private/tmp/populous-clearing-harvest.png' })
  await page.evaluate(() => {
    window.testScene.world.paused = false
    window.testScene.world.speed = 1
  })
  await page.waitForFunction(
    () => {
      const w = window.testScene.world
      if (!w.units.some(u => u.builder?.task === 4 && u.builder.phase === 16)) return false
      w.speed = 0
      return true
    },
    null,
    { timeout: 60000 }
  )
  assert.deepEqual(
    await page.evaluate(() => ({ x: window.bystander.x, z: window.bystander.z })),
    center(cells.at(-1))
  )
  await page.evaluate(() => {
    window.testScene.world.speed = 1
  })
  await page.waitForFunction(() => window.bystander.path.length > 0)
  assert.ok(
    await page.evaluate(
      () =>
        Math.hypot(
          window.bystander.x - window.originalBystander.x,
          window.bystander.z - window.originalBystander.z
        ) < 1
    )
  )
  await page.evaluate(() => {
    window.testScene.world.speed = 4
  })
  await page.waitForFunction(() => !window.clearingPlan.preparation, null, { timeout: 60000 })
  assert.equal(await page.evaluate(() => window.clearingTree.logs), 0)
  await page.waitForFunction(
    () => window.clearingPlan.progress === 1 && window.clearingPlan.builders.every(id => !id),
    null,
    { timeout: 60000 }
  )
  assert.deepEqual(errors, [])
  console.log(
    'PASS: actual placement, native harvesting frame/direction/flip, visible GPU sprite and PCM cue 1; bystanders wait then walk out; delayed allocation, completion and departure',
    pose
  )
} finally {
  await browser.close()
}
