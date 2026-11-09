import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import sharp from 'sharp'

const [beforeDirectory, afterDirectory, outputFile] = process.argv.slice(2)
assert.ok(beforeDirectory && afterDirectory && outputFile, 'Usage: compare.mjs BEFORE AFTER OUTPUT.json')
const hash = path => createHash('sha256').update(readFileSync(path)).digest('hex')
const read = path => JSON.parse(readFileSync(path, 'utf8'))
const before = read(resolve(beforeDirectory, 'receipt.json'))
const after = read(resolve(afterDirectory, 'receipt.json'))
const result = {
  status: 'running', beforeReceiptSha256: hash(resolve(beforeDirectory, 'receipt.json')),
  afterReceiptSha256: hash(resolve(afterDirectory, 'receipt.json')),
  comparatorSha256: hash(import.meta.filename), observations: [],
}
// Never overwrite a prior acceptance result, including a failed comparison.
writeFileSync(outputFile, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' })
try {
  for (const [directory, report] of [[beforeDirectory, before], [afterDirectory, after]]) {
    assert.match(report.status, /^completed-(before|after)-observation$/)
    assert.equal(report.inputsUnchanged, true)
    assert.equal(report.browserClosed, true)
    assert.equal(report.serverClosed, true)
    assert.deepEqual(report.errors, [])
    assert.equal(hash(resolve(directory, 'inputs-before.json')), report.inputsBeforeSha256)
    assert.equal(hash(resolve(directory, 'inputs-after.json')), report.inputsAfterSha256)
    assert.equal(report.inputsBeforeSha256, report.inputsAfterSha256)
  }
  result.beforeHead = read(resolve(beforeDirectory, 'inputs-before.json')).head
  result.afterHead = read(resolve(afterDirectory, 'inputs-before.json')).head
  assert.deepEqual(after.cases, before.cases)
  assert.equal(after.browserVersion, before.browserVersion)
  assert.deepEqual(after.renderer, before.renderer)
  const key = o => `${o.status}/${o.level}/${o.viewport.width}x${o.viewport.height}/${o.stage}`
  const expected = []
  for (const status of ['won', 'lost']) for (const level of [1, 14]) {
    for (const size of ['640x480', '1920x1080']) {
      for (const stage of ['ready', 'failed', 'failed-reload-recovered', 'delayed', 'delay-recovered']) {
        expected.push(`${status}/${level}/${size}/${stage}`)
      }
    }
  }
  for (const report of [before, after]) assert.deepEqual(report.observations.map(key).sort(), expected.toSorted())
  const baseline = new Map(before.observations.map(o => [key(o), o]))
  let maximumFallbackOffset = 0
  for (const observation of after.observations) {
    const original = baseline.get(key(observation))
    assert.deepEqual(observation.viewport, original.viewport)
    assert.equal(observation.viewport.dpr, 1)
    assert.deepEqual(observation.panel, original.panel)
    assert.deepEqual(observation.screen, original.screen)
    assert.equal(observation.scale, original.scale)
    assert.equal(observation.fontReady, original.fontReady)
    assert.deepEqual(observation.headings.map(h => h.label), original.headings.map(h => h.label))
    const beforePath = resolve(beforeDirectory, original.screenshot)
    const afterPath = resolve(afterDirectory, observation.screenshot)
    const beforeHash = hash(beforePath), afterHash = hash(afterPath)
    assert.equal(beforeHash, before.screenshots[original.screenshot])
    assert.equal(afterHash, after.screenshots[observation.screenshot])
    const paired = { case: key(observation), beforePngSha256: beforeHash, afterPngSha256: afterHash }
    if (observation.fontReady === 'true') {
      assert.equal(afterHash, beforeHash, 'Ready image must remain byte-identical')
      assert.deepEqual(observation.headings, original.headings, 'Ready geometry must remain exact')
      paired.readyPngIdentical = true
    } else {
      for (const [i, heading] of observation.headings.entries()) {
        assert.ok(Math.abs(heading.offsetPx) < 0.02, 'Fallback heading must be centered')
        assert.ok(Math.abs(heading.content.y - original.headings[i].content.y) < 0.02)
        assert.ok(Math.abs(heading.content.width - original.headings[i].content.width) < 0.02)
        assert.ok(heading.content.x >= observation.panel.x)
        assert.ok(heading.content.x + heading.content.width <= observation.panel.x + observation.panel.width)
        assert.equal(heading.glyphs, 0)
        maximumFallbackOffset = Math.max(maximumFallbackOffset, Math.abs(heading.offsetPx))
      }
      const a = await sharp(beforePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
      const b = await sharp(afterPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
      assert.deepEqual(a.info, b.info)
      // Only heading bands may change. Compare all row/control/background pixels exactly.
      const top = Math.floor(Math.min(...original.headings.map(h => h.content.y))) - 2
      const bottom = Math.ceil(Math.max(...original.headings.map(h => h.content.y + h.content.height))) + 2
      const rowBytes = a.info.width * a.info.channels
      assert.deepEqual(b.data.subarray(0, top * rowBytes), a.data.subarray(0, top * rowBytes))
      assert.deepEqual(b.data.subarray(bottom * rowBytes), a.data.subarray(bottom * rowBytes))
      paired.pixelsOutsideHeadingBandIdentical = true
      paired.headingBand = { top, bottom }
      paired.offsets = observation.headings.map((h, i) => ({ label: h.label, before: original.headings[i].offsetPx, after: h.offsetPx }))
    }
    result.observations.push(paired)
  }
  for (const scenario of after.cases) {
    const group = after.observations.filter(o => o.status === scenario.status && o.level === scenario.level && o.viewport.width === scenario.viewport.width)
    const image = stage => after.screenshots[group.find(o => o.stage === stage).screenshot]
    assert.equal(image('failed'), image('delayed'))
    assert.equal(image('ready'), image('delay-recovered'))
    assert.equal(image('ready'), image('failed-reload-recovered'))
  }
  result.maximumFallbackOffsetPx = maximumFallbackOffset
  result.status = 'passed'
} catch (error) {
  result.status = 'failed'; result.error = error.stack ?? String(error); process.exitCode = 1
} finally {
  result.finishedAt = new Date().toISOString()
  writeFileSync(outputFile, JSON.stringify(result, null, 2) + '\n')
  console.log(JSON.stringify({ status: result.status, observations: result.observations.length, maximumFallbackOffsetPx: result.maximumFallbackOffsetPx, outputFile }))
}
