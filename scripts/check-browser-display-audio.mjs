import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

const browser = await chromium.launch({
  headless: true,
  args: ['--autoplay-policy=no-user-gesture-required'],
})
try {
  const { page, errors } = await openGame(browser),
    cdp = await page.context().newCDPSession(page)
  await page.evaluate(() => {
    const s = window.testScene
    s.world.speed = 0
    cancelAnimationFrame(s.frame)
  })
  const displays = []
  for (const scale of [1, 1.5, 2, 3, 1]) {
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 1000,
      deviceScaleFactor: scale,
      mobile: false,
    })
    const result = await page.evaluate(() => {
      const s = window.testScene
      s.animate(s.previous)
      cancelAnimationFrame(s.frame)
      const r = s.container.getBoundingClientRect(),
        canvas = s.renderer.domElement
      return {
        dpr: devicePixelRatio,
        ratio: s.renderer.getPixelRatio(),
        width: canvas.width,
        height: canvas.height,
        cssWidth: r.width,
        cssHeight: r.height,
        stars: s.globe.stars.material.uniforms.pixelRatio.value,
        projection: [s.view.projection.width, s.view.projection.height],
      }
    })
    assert.equal(result.dpr, scale)
    assert.equal(result.ratio, Math.min(scale, 1.8))
    assert.equal(result.width, Math.floor(result.cssWidth * result.ratio))
    assert.equal(result.height, Math.floor(result.cssHeight * result.ratio))
    assert.equal(result.stars, result.ratio)
    assert.deepEqual(result.projection, [Math.round(result.cssWidth), Math.round(result.cssHeight)])
    displays.push(result)
  }
  const audio = await page.evaluate(async () => {
    const { Soundscape, cueVariant } = await import('/app/audio.ts'),
      sound = new Soundscape(),
      ctx = new AudioContext()
    sound.context = ctx
    sound.master = ctx.createGain()
    sound.master.connect(ctx.destination)
    sound.enabled = true
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.1), ctx.sampleRate)
    let state = 1,
      finished = 0
    for (let i = 0; i < 200; i++) {
      const v = cueVariant(0x26, state)
      state = v.state
      sound.buffers.set(v.key, buffer)
    }
    await ctx.resume()
    for (let i = 0; i < 200; i++) sound.cue(0x26, 1, 0, () => finished++)
    const burst = sound.active.size
    await new Promise(resolve => setTimeout(resolve, 500))
    const remaining = sound.active.size
    sound.dispose()
    await new Promise(resolve => setTimeout(resolve, 0))
    return { burst, remaining, finished, buffers: sound.buffers.size, state: ctx.state }
  })
  assert.deepEqual(audio, { burst: 64, remaining: 0, finished: 200, buffers: 0, state: 'closed' })
  assert.deepEqual(errors, [])
  console.log(
    'PASS: live DPR changes retain CSS projection and update GPU/star resolution; 200 same-frame WebAudio cues respect 64 voices and finish/clean up',
    JSON.stringify({ displays, audio })
  )
} finally {
  await browser.close()
}
