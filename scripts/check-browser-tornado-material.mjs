// Independent selected-palette renderer evidence; never natural terrain coverage.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { originalTornadoPixels } from './lib/tornado-pixel-oracle.mjs'

export async function runTornadoMaterialCheck(browser, { url, output }) {
  const fixture = JSON.parse(readFileSync(new URL('../tests/fixtures/tornado-original.json', import.meta.url))),
    original = originalTornadoPixels(fixture, 0),
    art = JSON.parse(readFileSync(new URL('../app/original-tornado.json', import.meta.url))),
    report = { status: 'running', browserVersion: browser.version(), budgetMs: 45000, limits: 'Selected negative and positive palettes on original HFX1136 through production Tornado material; separate renderer fixture, not naturally reached gameplay.', palettes: [], errors: [] },
    start = performance.now(),
    save = () => writeFileSync(resolve(output, 'tornado-material.json'), JSON.stringify(report, null, 2) + '\n')
  let context, expired = false, failure
  const timer = setTimeout(() => {
    expired = true
    if (context) void context.close().catch(error => { report.watchdogCloseError = String(error) })
  }, report.budgetMs)
  save()
  try {
    context = await browser.newContext({ viewport: { width: 960, height: 720 }, deviceScaleFactor: 1 })
    assert.equal(expired, false, 'Context creation exceeded fixture bound')
    const page = await context.newPage()
    page.setDefaultTimeout(10000)
    page.on('pageerror', error => report.errors.push(String(error)))
    await page.goto(`${url}/?tornado-appearance=1`, { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => typeof globalThis.__pndTornadoFixture?.renderTornadoMaterialPalettes === 'function')
    const captured = await page.evaluate(palettes =>
      globalThis.__pndTornadoFixture.renderTornadoMaterialPalettes(palettes), fixture.paletteTints)
    report.graphics = captured.graphics
    report.sourceURL = captured.sourceURL
    report.loadedAtlasSHA256 = createHash('sha256').update(Buffer.from(captured.sourcePNG)).digest('hex')
    assert.equal(report.loadedAtlasSHA256, art.pngSHA256)
    assert.equal(captured.graphics.outputColorSpace, 'srgb')
    assert.equal(captured.graphics.textureColorSpace, 'srgb')
    assert.equal(captured.graphics.colorManagement, true)
    for (const sample of captured.results) {
      const tint = fixture.paletteTints[sample.palette],
        result = { palette: sample.palette, opaque: 0, fractional: 0, transparent: 0, mismatches: 0, counterexample: null, examples: [], screenshots: [] }
      for (const [background, png] of Object.entries(sample.pngs)) {
        assert.ok(sample.palette === -1 || sample.palette === -2)
        assert.ok(background === 'black' || background === 'white')
        const file = `tornado-material-palette${sample.palette}-${background}.png`,
          bytes = Buffer.from(png.split(',')[1], 'base64')
        writeFileSync(resolve(output, file), bytes, { flag: 'wx' })
        result.screenshots.push({ file, width: 80, height: 50, sha256: createHash('sha256').update(bytes).digest('hex') })
      }
      assert.equal(sample.black.length, original.length)
      assert.equal(sample.white.length, original.length)
      for (let at = 0; at < original.length; at += 4) {
        const alpha = original[at + 3], expected = [], actual = []
        if (alpha === 255) result.opaque++
        else if (alpha) result.fractional++
        else result.transparent++
        for (const [name, background] of [['black', 0], ['white', 255]]) {
          for (let channel = 0; channel < 3; channel++) {
            expected.push(Math.round(original[at + channel] * tint[channel] / 255 * alpha / 255 + background * (1 - alpha / 255)))
            actual.push(sample[name][at + channel])
          }
          assert.equal(sample[name][at + 3], 255, 'Opaque diagnostic background retains alpha')
        }
        if (expected.some((value, channel) => Math.abs(value - actual[channel]) > 1)) {
          result.mismatches++
          if (result.examples.length < 8) result.examples.push({ pixel: at / 4, expected, actual })
        }
        if ([...original.subarray(at, at + 4)].join(',') === '229,220,214,255')
          result.counterexample = { expected, actual }
      }
      report.palettes.push(result)
      save()
      assert.ok(result.opaque > 0 && result.fractional > 0 && result.transparent > 0)
      assert.ok(result.counterexample, 'Require the retained opaque pixel that distinguishes negative-palette math')
      assert.equal(result.mismatches, 0, `Per-pixel original encoded-byte mismatch for palette ${sample.palette}: ${JSON.stringify(result.examples)}`)
    }
    assert.deepEqual(report.palettes.map(sample => sample.palette).sort((a, b) => a - b), [-2, -1, 3, 4, 5])
    assert.deepEqual(report.errors, [])
  } catch (error) {
    failure = error
    report.failure = String(error)
  } finally {
    try {
      if (context) await context.close()
      report.cleanupVerified = true
    } catch (error) {
      failure ??= error
      report.cleanupFailure = String(error)
    }
    clearTimeout(timer)
    report.elapsedMs = performance.now() - start
    if (report.errors.length) {
      failure ??= Error('Page errors observed, including cleanup')
      report.failure ??= String(failure)
    }
    if (expired || report.elapsedMs >= report.budgetMs || report.watchdogCloseError) {
      failure ??= Error('Tornado material fixture deadline or watchdog cleanup failed')
      report.failure ??= String(failure)
    }
    report.status = failure ? 'failed' : 'passed'
    save()
  }
  if (failure) throw failure
  return report
}
