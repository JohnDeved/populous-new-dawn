// Repeatable render-loop baseline. Headless timings are diagnostic, not hardware fps certification.
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { cpus, platform, arch } from 'node:os'
import { chromium } from '@playwright/test'
import { openGame, originalSkyShaders } from './browser-game.mjs'
import {
  preparePainterBaseline,
  installPainterBaseline,
  painterBaselineCommit,
} from './painter-baseline.mjs'

import { prepareTerrainCopiesBaseline, installTerrainCopiesBaseline, terrainCopiesBaseline } from './terrain-copies-baseline.mjs'

const headed = process.argv.includes('--headed')
const compareTerrainCopies = process.argv.includes('--compare-terrain-copies')
const comparePainter = process.argv.includes('--compare-painter')
const compareUnitMotion = process.argv.includes('--compare-unit-motion')
const compareHealthBars = process.argv.includes('--compare-health-bars')
const movingOrders = process.argv.includes('--moving-orders')
const movingProfile = compareUnitMotion || compareHealthBars || movingOrders
assert.ok(!movingOrders || comparePainter || compareTerrainCopies, '--moving-orders requires a painter or terrain comparison')
if (compareTerrainCopies) prepareTerrainCopiesBaseline()
if (comparePainter) preparePainterBaseline()
const browser = await chromium.launch({ headless: !headed })
try {
  const { page, errors } = await openGame(browser),
    cdp = await page.context().newCDPSession(page)
  if (comparePainter) await installPainterBaseline(page)
  if (compareTerrainCopies) await installTerrainCopiesBaseline(page)
  if (movingProfile)
    await page.evaluate(async () => {
      const s = window.testScene,
        { createWorld, addUnit, command } = await import('/app/model.ts'),
        { unitPosition } = await import('/app/unit-motion.ts')
      const position = s.unitMotion.position,
        beforeTurn = s.gameClock.beforeTurn,
        afterTurn = s.gameClock.afterTurn
      window.resetMovingProfile = (smooth, crowd) => {
        s.world = createWorld()
        s.world.flyby.flags &= ~1
        s.world.inputMask = 0
        s.wasFlying = false
        s.previous = null
        s.gameClock.animationTime = s.gameClock.animationFrame = 0
        s.gameClock.beforeTurn = smooth ? beforeTurn : undefined
        s.gameClock.afterTurn = smooth ? afterTurn : undefined
        s.unitMotion.frames = new WeakMap()
        s.unitMotion.position = smooth ? position : unitPosition
        s.cameraPreviewButtons = null
        s.cameraBearing = 0
        s.cameraTime = 0
        s.focus({ x: 2, z: 30 })
        if (crowd)
          for (let i = 0; i < 200; i++)
            addUnit(s.world, 'blue', 'brave', { x: -8 + (i % 20), z: 23 + Math.floor(i / 20) })
        s.world.selected = s.world.units.filter(u => u.team === 'blue').map(u => u.id)
        command(s.world, { x: 10, z: 34 })
      }
    })
  await cdp.send('Profiler.enable')
  await cdp.send('Performance.enable')
  const fullTerrain = process.argv.includes('--full-terrain')
  const steppedCamera = process.argv.includes('--stepped-camera')
  const compareCamera = process.argv.includes('--compare-camera')
  const compareSky = process.argv.includes('--compare-sky')
  assert.ok(
    [compareSky, compareCamera, comparePainter, compareUnitMotion, compareHealthBars, compareTerrainCopies].filter(
      Boolean
    ).length <= 1,
    'Compare one presentation change at a time'
  )
  if (compareSky) {
    await page.setViewportSize({ width: 3440, height: 1440 })
    await page.waitForFunction(() => window.testScene.container.clientWidth === 3190)
    await page.evaluate(shaders => {
      const s = window.testScene,
        original = s.skyBackdrop.material.clone()
      Object.assign(original, shaders)
      window.skyMaterials = [original, s.skyBackdrop.material]
    }, originalSkyShaders)
  }
  await page.evaluate(() => {
    const s = window.testScene,
      navigation = s.navigationButtons
    // The camera workload uses held Q. Physical mouse movement must not pan
    // otherwise fixed runs while the headed browser is being profiled.
    s.navigationButtons = () => {
      s.navigationPointer = null
      return navigation.call(s)
    }
    window.originalCameraPreview = s.previewCamera
  })
  if (steppedCamera)
    await page.evaluate(() => {
      window.testScene.previewCamera = () => false
    })
  const environment = await page.evaluate(fullTerrain => {
    const s = window.testScene,
      gl = s.renderer.getContext(),
      info = gl.getExtension('WEBGL_debug_renderer_info')
    if (fullTerrain) {
      s.terrain.userData.terrainGrid = false
      s.terrain.geometry.setIndex(null)
      s.terrain.geometry.setDrawRange(0, Infinity)
    }
    const original = s.animate
    window.frameSamples = []
    s.animate = now => {
      const start = performance.now()
      original(now)
      window.frameSamples.push({
        time: now,
        cpu: performance.now() - start,
        calls: s.renderer.info.render.calls,
        triangles: s.renderer.info.render.triangles,
        landTriangles: (s.terrain.geometry.drawRange.count * s.terrain.count) / 3,
      })
    }
    return {
      userAgent: navigator.userAgent,
      viewport: [innerWidth, innerHeight],
      pixelRatio: devicePixelRatio,
      screen: {
        width: screen.width,
        height: screen.height,
        availableWidth: screen.availWidth,
        availableHeight: screen.availHeight,
      },
      renderer: info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
    }
  }, fullTerrain)
  const runs = []
  let crowdAdded = false
  const scenarios = movingProfile
    ? ['opening', 'crowd'].flatMap(s => Array(6).fill(s))
    : comparePainter || compareTerrainCopies
      ? ['opening', 'camera', 'crowd'].flatMap(s => Array(6).fill(s))
      : compareSky
        ? Array(6).fill('opening')
        : compareCamera
          ? Array(6).fill('camera')
          : ['opening', 'camera', 'crowd']
  for (const [index, scenario] of scenarios.entries()) {
    // Release the previous run before resetting its pose; RAF can run between awaits.
    await page.keyboard.up('q')
    await page.evaluate(() => {
      const s = window.testScene
      s.keys.clear()
      s.navigationPointer = null
      s.cameraVelocity = { turn: 0, forward: 0, side: 0 }
      s.cameraMotion.active = 0
      s.world.flyby.flags &= ~1
      s.wasFlying = false
      s.viewTransition = null
      s.viewPreset = 0
      s.viewZoom = 0
    })
    const smoothUnits = compareUnitMotion
      ? [false, true, true, false, false, true][index % 6]
      : true
    const batchedHealth = compareHealthBars
      ? [false, true, true, false, false, true][index % 6]
      : true
    if (movingProfile)
      await page.evaluate(
        ({ smooth, crowd, batched }) => {
          window.testScene.view.healthBars.enabled = batched
          window.resetMovingProfile(smooth, crowd)
        },
        { smooth: smoothUnits, crowd: scenario === 'crowd', batched: batchedHealth }
      )
    const optimizedPainter = comparePainter
      ? [false, true, true, false, false, true][index % 6]
      : true
    if (comparePainter)
      await page.evaluate(optimized => window.selectPainter(optimized), optimizedPainter)
    const compactTerrain = compareTerrainCopies
      ? [false, true, true, false, false, true][index % 6]
      : true
    if (compareTerrainCopies)
      await page.evaluate(optimized => window.selectTerrainCopies(optimized), compactTerrain)
    const coveredSky = compareSky ? [false, true, true, false, false, true][index] : true
    if (compareSky)
      await page.evaluate(covered => {
        const s = window.testScene
        s.skyBackdrop.material = window.skyMaterials[Number(covered)]
        s.world.speed = 0
        s.cameraBearing = 0
        s.focus({ x: 2, z: 30 })
      }, coveredSky)
    const smoothCamera = compareCamera
      ? [false, true, true, false, false, true][index]
      : !steppedCamera
    if (compareCamera || ((comparePainter || compareTerrainCopies) && !movingProfile))
      await page.evaluate(smooth => {
        const s = window.testScene
        s.previewCamera = smooth ? window.originalCameraPreview : () => false
        s.world.speed = 0
        s.cameraPreviewButtons = null
        s.cameraTime = 0
        s.cameraBearing = 0
        s.focus({ x: 2, z: 30 })
      }, smoothCamera)
    if (scenario === 'camera') await page.keyboard.down('q')
    if (scenario === 'crowd' && !crowdAdded && !movingProfile) {
      crowdAdded = true
      await page.evaluate(async () => {
        const s = window.testScene,
          { addUnit } = await import('/app/model.ts')
        s.world.speed = 0
        s.focus({ x: 2, z: 30 })
        for (let i = 0; i < 200; i++)
          addUnit(s.world, 'blue', 'brave', { x: -8 + (i % 20), z: 23 + Math.floor(i / 20) })
      })
    }
    await page.waitForTimeout(1000)
    const startPose = await page.evaluate(() => {
      const s = window.testScene
      window.frameSamples = []
      return {
        center: { ...s.view.rawCenter },
        basis: [...s.view.uniforms.nativeBasis.value],
        viewport: [innerWidth, innerHeight],
      }
    })
    await cdp.send('Profiler.start')
    await page.waitForTimeout(4000)
    const { profile } = await cdp.send('Profiler.stop'),
      metrics = await cdp.send('Performance.getMetrics'),
      data = await page.evaluate(() => ({
        frames: window.frameSamples,
        units: window.testScene.world.units.length,
        movingUnits: window.testScene.world.units.filter(u => u.path.length || u.flight || u.fight)
          .length,
        memory: window.testScene.renderer.info.memory,
        programs: window.testScene.renderer.info.programs.length,
        cameraState: {
          bearing: window.testScene.cameraBearing,
          position: { ...window.testScene.cameraPosition },
          buttons: window.testScene.navigationButtons(),
          velocity: { ...window.testScene.cameraVelocity },
          flyby: window.testScene.world.flyby.flags,
          wasFlying: window.testScene.wasFlying,
          result: window.testScene.resultCamera.active,
          focus: window.testScene.cameraMotion.active,
          transition: window.testScene.viewTransition,
          turn: window.testScene.world.turn,
        },
        endPose: {
          center: { ...window.testScene.view.rawCenter },
          basis: [...window.testScene.view.uniforms.nativeBasis.value],
          viewport: [innerWidth, innerHeight],
        },
      }))
    assert.ok(data.frames.length > 5, 'Render loop stopped')
    const landTriangles = [...new Set(data.frames.map(f => f.landTriangles))]
    if (scenario !== 'camera' && (comparePainter || compareTerrainCopies || movingProfile)) {
      assert.deepEqual(
        data.endPose,
        startPose,
        `Fixed camera drifted in ${scenario} run ${index}: ${JSON.stringify(data.cameraState)}`
      )
      assert.equal(landTriangles.length, 1, 'Fixed terrain submission changed during sample')
      const previous = runs.find(r => r.scenario === scenario)
      if (previous)
        assert.deepEqual(startPose, previous.startPose, 'Fixed camera differed between runs')
    }
    const quantile = (values, q) =>
        values.sort((a, b) => a - b)[Math.floor((values.length - 1) * q)],
      gaps = data.frames.slice(1).map((f, i) => f.time - data.frames[i].time),
      samples = new Map(),
      nodes = new Map(profile.nodes.map(n => [n.id, n.callFrame]))
    profile.samples.forEach((id, i) => {
      const f = nodes.get(id),
        key = `${f.functionName || '(anonymous)'} ${f.url.replace(/^.*\/app\//, 'app/').split('?')[0]}:${f.lineNumber + 1}`
      samples.set(key, (samples.get(key) ?? 0) + profile.timeDeltas[i])
    })
    runs.push({
      scenario,
      startPose,
      landTriangles,
      smoothCamera,
      coveredSky,
      optimizedPainter,
      compactTerrain,
      smoothUnits,
      batchedHealth,
      ...data,
      frames: undefined,
      frameCount: data.frames.length,
      frameGapMs: { p50: quantile(gaps, 0.5), p95: quantile(gaps, 0.95), max: Math.max(...gaps) },
      cpuFrameMs: {
        p50: quantile(
          data.frames.map(f => f.cpu),
          0.5
        ),
        p95: quantile(
          data.frames.map(f => f.cpu),
          0.95
        ),
      },
      drawCalls: quantile(
        data.frames.map(f => f.calls),
        0.5
      ),
      triangles: quantile(
        data.frames.map(f => f.triangles),
        0.5
      ),
      heapBytes: metrics.metrics.find(m => m.name === 'JSHeapUsedSize')?.value,
      topSelfMs: [...samples]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 16)
        .map(([name, us]) => ({ name, ms: us / 1000 })),
    })
  }
  if (compareSky) await page.evaluate(() => window.skyMaterials[0].dispose())
  assert.deepEqual(errors, [])
  const report = {
    date: new Date().toISOString(),
    headed,
    fullTerrain,
    steppedCamera,
    compareCamera,
    compareSky,
    comparePainter,
    compareTerrainCopies,
    terrainCopiesBaseline: compareTerrainCopies ? terrainCopiesBaseline : undefined,
    compareUnitMotion,
    compareHealthBars,
    movingOrders,
    painterBaselineCommit: comparePainter ? painterBaselineCommit : undefined,
    runtime: process.version,
    cpu: cpus()[0].model,
    os: platform(),
    arch: arch(),
    mode: `${headed ? 'Headed' : 'Headless'} Chromium, 1 second settling and 4 second CPU sample per scenario; ${movingProfile ? 'each run starts a fresh simulation and sends blue people to (10,34); crowd adds 200 braves' : 'crowd adds 200 stationary braves for renderer stress'}`,
    ...environment,
    runs,
  }
  const path =
    process.argv.slice(2).find(a => !a.startsWith('--')) ?? '/private/tmp/populous-performance.json'
  writeFileSync(path, JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify(report, null, 2))
} finally {
  await browser.close()
}
