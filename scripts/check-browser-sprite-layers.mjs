// Start npm run dev, then npm run test:sprites. Expected rectangles come from
// complete original x86 renderers, not from the TS renderer under test.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'
import units from '../app/original-units.json' with { type: 'json' }
import fixtures from '../tests/fixtures/unit-sprites.json' with { type: 'json' }

const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  const response = await page.request.get(`${process.env.POPULOUS_URL ?? 'http://localhost:3000'}/original/${units.atlas}.png`)
  assert.equal(createHash('sha256').update(await response.body()).digest('hex'), fixtures.atlasSha256, 'Served atlas is stale or changed')
  await page.waitForFunction(() => [...window.testScene.unitMeshes.values()].some(g => g.userData.layers?.[0]?.material.map.image?.complete))
  const result = await page.evaluate(({ units, cases }) => {
    const s = window.testScene, renderer = s.renderer, gl = renderer.getContext()
    s.world.speed = 0
    renderer.setPixelRatio(1)
    renderer.setSize(128, 128, false)
    renderer.setClearColor(0xff00ff, 1)
    s.view.update(128, 128, { x: 0, z: 0 }, 0, 0, false, 640)
    s.view.projection.centerX = 64; s.view.projection.centerY = 80
    s.view.uniforms.nativeScreen.value.set([128, 128, 64, 80])
    s.cameraBearing = 0
    const isolated = new s.scene.constructor()
    const g = new ([...s.unitMeshes.values()][0].constructor)()
    g.userData.layers = []
    isolated.add(g)
    const actual = document.createElement('canvas'), sheet = document.createElement('canvas')
    actual.width = actual.height = 128
    sheet.width = 16 * 64; sheet.height = Math.ceil(cases.length / 16) * 64
    const pixels = actual.getContext('2d'), contact = sheet.getContext('2d')
    const failures = [], frames = new Set(), atlas = [...s.unitMeshes.values()][0].userData.layers[0].material.map.image
    const source = document.createElement('canvas')
    source.width = units.width; source.height = units.height
    const sourceContext = source.getContext('2d')
    sourceContext.drawImage(atlas, 0, 0)
    const rgba = sourceContext.getImageData(0, 0, units.width, units.height).data
    let checkedPixels = 0
    for (const [index, c] of cases.entries()) {
      g.userData.signature = c.signature
      g.userData.owner = c.options.owner
      g.userData.draw = c.signature.endsWith('warrior') ? 15 : 14
      g.userData.drawFlags = c.options.flags & ~1
      s.view.config = { ...s.view.config, ...c.view, scaledSprites: 1 }
      const origin = s.view.project(g.position, 0)
      g.userData.depthBias = (2000 - 1) * 16 - origin.z - 0x7000
      const heading = Math.PI + (c.direction * 256 + 0x380) * Math.PI / 1024
      s.animatePerson(g, heading, units.animations[c.signature][c.state], 0, false, c.step)
      if (g.userData.frame !== c.frame) throw Error(`Wrong animation frame: ${c.signature}/${c.state}/${c.direction}`)
      if (g.userData.spriteBucket !== c.options.bucket) throw Error('Fixture depth bucket mismatch')
      frames.add(g.userData.frame)
      // Check actual live layer rectangles at the original scaled bucket, then
      // compare artwork at 1:1 pixels to avoid driver resampling ambiguity.
      const rectangles = g.userData.layers.filter(l => l.visible).map(l => ({
        piece: l.userData.piece, x: Math.round(-l.center.x * l.scale.x),
        y: Math.round((l.center.y - 1) * l.scale.y), w: l.scale.x, h: l.scale.y,
      }))
      const wanted = c.draws.filter(d => d.w > 0 && d.h > 0).map(d => ({piece:d.piece,x:d.x,y:d.y,w:d.w,h:d.h}))
      if (JSON.stringify(rectangles) !== JSON.stringify(wanted)) throw Error(`Wrong scaled rectangles: ${c.signature}/${c.state}/${c.direction}`)
      s.view.config.scaledSprites = 0; s.view.config.shamanScale = 256
      s.animatePerson(g, heading, units.animations[c.signature][c.state], 0, false, c.step)
      s.view.prepare(isolated)
      renderer.render(isolated, s.camera)
      const gpu = new Uint8Array(128 * 128 * 4), flipped = new Uint8ClampedArray(gpu.length)
      gl.readPixels(0, 0, 128, 128, gl.RGBA, gl.UNSIGNED_BYTE, gpu)
      for (let y = 0; y < 128; y++) flipped.set(gpu.subarray(y * 512, (y + 1) * 512), (127 - y) * 512)
      pixels.putImageData(new ImageData(flipped, 128, 128), 0, 0)
      contact.drawImage(actual, 32, 32, 64, 64, index % 16 * 64, Math.floor(index / 16) * 64, 64, 64)
      const reference = new Uint8ClampedArray(128 * 128 * 4)
      for (let i = 0; i < reference.length; i += 4) reference.set([255, 0, 255, 255], i)
      for (const d of c.pixels) {
        if (d.w <= 0 || d.h <= 0) continue
        const p = units.pieces[d.piece], x = origin.screenX + d.x, y = origin.screenY + d.y
        for (let dy = 0; dy < d.h; dy++) for (let dx = 0; dx < d.w; dx++) {
          const px = x + dx, py = y + dy
          if (px < 0 || px >= 128 || py < 0 || py >= 128) continue
          const sx = Math.floor((dx + .5) * p.w / d.w), sy = Math.floor((dy + .5) * p.h / d.h)
          const ax = d.piece % units.columns * units.cell + (d.flags & 1 ? p.w - 1 - sx : sx)
          const ay = Math.floor(d.piece / units.columns) * units.cell + sy
          const src = (ay * units.width + ax) * 4
          if (rgba[src + 3]) reference.set(rgba.subarray(src, src + 4), (py * 128 + px) * 4)
        }
      }
      let different = 0, painted = 0
      for (let i = 0; i < gpu.length; i += 4) {
        if (reference[i] !== 255 || reference[i + 1] !== 0 || reference[i + 2] !== 255) painted++
        if ([0, 1, 2].some(channel => Math.abs(reference[i + channel] - flipped[i + channel]) > 1)) different++
      }
      checkedPixels += painted
      if (!painted || different) failures.push({ signature: c.signature, state: c.state, direction: c.direction, different, painted })
    }
    return { failures, frames: frames.size, checkedPixels, sheet: sheet.toDataURL('image/png') }
  }, { units, cases: fixtures.cases })
  writeFileSync('/private/tmp/populous-unit-sprite-regression.png', Buffer.from(result.sheet.split(',')[1], 'base64'))
  assert.equal(result.failures.length, 0, JSON.stringify(result.failures.slice(0, 10)))
  assert.deepEqual(errors, [])
  console.log(`PASS: ${fixtures.cases.length} GPU sprite poses (${result.frames} frames, ${result.checkedPixels} coloured pixels), imported tribes/classes, 8 directions, walking/work/combat/airborne/death; served atlas hash; no browser errors`)
} finally { await browser.close() }
