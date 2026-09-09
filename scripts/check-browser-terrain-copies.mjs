import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'
import { prepareTerrainCopiesBaseline, installTerrainCopiesBaseline, terrainCopiesBaseline } from './terrain-copies-baseline.mjs'

prepareTerrainCopiesBaseline()
const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  await installTerrainCopiesBaseline(page)
  const cases = await page.evaluate(async () => {
    const s = window.testScene, r = s.renderer, gl = r.getContext()
    const { cameraPreset, polygonMeshBounds } = await import('/app/projection.ts')
    cancelAnimationFrame(s.frame)
    s.world.speed = 0
    const cases = []
    const commands = () => {
      const entries = [], painter = s.view.painter, data = painter.texture.image.data
      s.scene.traverseVisible(object => {
        const range = painter.ranges.get(object)
        if (!range) return
        for (let instance = 0; instance < (object.isInstancedMesh ? object.count : 1); instance++) {
          const matrix = object.instanceMatrix?.array
          const x = matrix?.[instance * 16 + 12] ?? 0,
            z = matrix?.[instance * 16 + 14] ?? 0
          for (let face = 0; face < range[1]; face++) {
            const value = data[range[0] + instance * range[1] + face]
            if (value < 1) entries.push([object.id, x, z, face, value])
          }
        }
      })
      return entries.sort((a, b) => a[0]-b[0] || a[1]-b[1] || a[2]-b[2] || a[3]-b[3])
    }
    const capture = optimized => {
      window.selectTerrainCopies(optimized)
      r.render(s.scene, s.camera)
      const pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4)
      gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
      return { pixels, commands: s.view.overview ? [] : commands(),
        copies: s.terrain.count, calls: r.info.render.calls, triangles: r.info.render.triangles,
        terrainTriangles: s.terrain.count * s.terrain.geometry.drawRange.count / 3,
        painterBytes: s.view.painter.texture.image.data.byteLength,
        picks: [[0,0],[-.7,-.6],[.7,-.6]].map(([x,y]) => s.view.pick({x,y}, [s.terrain,s.objects], s.camera)?.point ?? null) }
    }
    const compare = name => {
      const before = capture(false), after = capture(true)
      let changedBytes = 0
      for (let i = 0; i < before.pixels.length; i++) changedBytes += Number(before.pixels[i] !== after.pixels[i])
      cases.push({name, changedBytes,
        sameCommands: JSON.stringify(before.commands) === JSON.stringify(after.commands),
        samePicks: JSON.stringify(before.picks) === JSON.stringify(after.picks),
        commands: before.commands.length,
        before: {...before,pixels:undefined,commands:undefined,picks:undefined},
        after: {...after,pixels:undefined,commands:undefined,picks:undefined} })
    }
    const view = (width,height,point,heading,preset=0) => {
      r.setPixelRatio(1)
      r.setSize(width,height,false)
      s.view.update(width,height,point,heading*Math.PI/1024,0,false,width,cameraPreset(3,preset))
    }
    for (const point of [{x:2,z:30},{x:127,z:-127},{x:-127,z:127}]) {
      for (const heading of [0,256,512,768,1024,1280,1536,2047]) {
        view(1240,1000,point,heading)
        compare(`${point.x}/${point.z} heading ${heading}`)
      }
    }
    for (const preset of [2,3]) {
      view(1240,1000,{x:127,z:-127},256,preset)
      compare(`preset ${preset} at seam`)
    }
    for (const [width,height,ratio] of [[1920,1080,1],[3440,1440,1],[3840,2160,1],[1920,1080,1.8]]) {
      view(width,height,{x:2,z:30},0)
      r.setPixelRatio(ratio)
      compare(`${width}x${height} DPR ${ratio}`)
    }
    for (const point of [{x:2,z:30},{x:127,z:-127}]) {
      for (const heading of [0,256,512,1024]) {
        view(3440,1440,point,heading)
        s.view.bounds = polygonMeshBounds(s.view.config.bounds.map((n,i) => i%2 ? n : n+Math.sign(n)*32), heading)
        s.view.bounds.forEach((row,i) => s.view.boundsTexture.image.data.set(row,i*2))
        s.view.boundsTexture.needsUpdate = true
        compare(`expanded ${point.x}/${point.z} heading ${heading}`)
      }
    }
    // Heights and flags can change without changing which wrapped copies exist.
    const position = s.terrain.geometry.getAttribute('position')
    for (let i=0;i<position.count;i++) position.setY(i, position.getY(i) + (i%6)*.02)
    position.needsUpdate = true
    s.world.land.flags.fill(0x200)
    view(1240,1000,{x:127,z:-127},256)
    compare('deformed terrain and raised flags')
    s.terrain.geometry.setAttribute('position',position.clone())
    compare('replacement geometry attribute')
    s.view.overview = true
    s.view.uniforms.nativeMode.value = 0
    compare('overview bypass restores original copies')
    return cases
  })
  for (const c of cases) {
    assert.equal(c.changedBytes,0,c.name)
    assert.ok(c.sameCommands,c.name+' changed active painter order/depth')
    assert.ok(c.samePicks,c.name+' changed picking')
    assert.equal(c.before.calls,c.after.calls,c.name)
    assert.ok(c.after.triangles<=c.before.triangles,c.name)
  }
  assert.equal(cases[0].after.copies,1,'Opening needs only the central terrain copy')
  assert.deepEqual(errors,[])
  writeFileSync(process.argv[2] ?? '/private/tmp/populous-terrain-copies.json',JSON.stringify({baseline:terrainCopiesBaseline,cases},null,2)+'\n')
  console.log(`PASS: ${cases.length} identical pixel, active painter and picking comparisons; opening uses ${cases[0].after.copies}/${cases[0].before.copies} terrain copies`)
} finally { await browser.close() }
