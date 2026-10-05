// Keep every maintained Stone Head assertion; the sandboxed harness owns I/O.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

export function adaptStoneChecker(original, root, output) {
  const swaps = [
    ["import { chromium } from '@playwright/test'", '// Browser supplied by owned sandboxed harness.'],
    ["assert.ok(process.env.PND_QUEUE_JOB_ID && process.env.PND_QUEUE_DEADLINE, 'Use the canonical shared queue')", "assert.ok(globalThis.stoneHeadControlledQA?.signal, 'Use the owned local-render harness')"],
    ["const argument = process.argv.indexOf('--output-dir')\nassert.ok(argument >= 0 && process.argv[argument + 1])\nconst output = resolve(process.argv[argument + 1]), url = process.env.POPULOUS_URL ?? 'http://127.0.0.1:4318'", `const output = ${JSON.stringify(resolve(output, 'controlled-fixture'))}, url = globalThis.stoneHeadControlledQA.url`],
    ["jobId: process.env.PND_QUEUE_JOB_ID", "executionOwner: 'local-render-harness'"],
    ['const browser = await chromium.launch({ headless: true })', 'const browser = { version: () => globalThis.stoneHeadControlledQA.browser.version(), close: async () => {} }'],
    ["const timer = setTimeout(() => { report.expired = true; void browser.close() }, Math.max(1, Math.min(300000, Date.parse(process.env.PND_QUEUE_DEADLINE) - Date.now() - 30000)))", 'const timer = undefined // The outer harness owns the deadline and cleanup.'],
    ["process.on('SIGTERM', () => void browser.close())", '// Outer harness owns SIGTERM.'],
    ["process.on('SIGINT', () => void browser.close())", '// Outer harness owns SIGINT.'],
    ['const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 })', 'const context = globalThis.stoneHeadControlledQA.context'],
    ['const page = await context.newPage()', 'const page = globalThis.stoneHeadControlledQA.page'],
    ['report.browserClosed=true', 'report.browserCloseDelegated=true'],
    ['output,browserClosed:true', 'output,browserCloseDelegated:true'],
  ]
  let source = original
  const replacements = []
  for (const [before, after] of swaps) {
    assert.equal(source.split(before).length, 2, `Maintained checker scaffold changed: ${before}`)
    source = source.replace(before, after)
    replacements.push({ before, after, matches: 1 })
  }
  // Node-side relative imports follow the maintained checker, not this output file.
  const relativeImports = []
  source = source.replace(/from (['"])(\.\.?\/[^'"]+)\1/g, (before, quote, specifier) => {
    const after = `from ${JSON.stringify(pathToFileURL(resolve(root, 'scripts', specifier)).href)}`
    relativeImports.push({ before, after, specifier, matches: 1 })
    return after
  })
  assert.deepEqual(relativeImports.map(entry => entry.specifier), [
    './browser-game.mjs', './browser-game.mjs', '../app/projection.ts',
    '../app/model-lighting.ts', '../app/painter-order.ts', '../app/model-faces.ts',
    '../app/stone-head-animation.ts', '../app/original-models.json',
  ])
  return { source, replacements, relativeImports }
}

export default async function controlledStoneHead(args) {
  const { root, output, receipt, page, signal } = args
  signal.throwIfAborted()
  assert.deepEqual(page.viewportSize(), { width: 1440, height: 1000 })
  const original = readFileSync(resolve(root, 'scripts/check-browser-stone-head-animation.mjs'), 'utf8'),
    adaptation = adaptStoneChecker(original, root, output), adapted = adaptation.source,
    adapter = resolve(output, 'maintained-stone-checker.mjs'),
    hash = value => createHash('sha256').update(value).digest('hex')
  writeFileSync(adapter, adapted)
  writeFileSync(resolve(output, 'adapter-source.json'), JSON.stringify({
    checkerSha256: hash(original), adapterSha256: hash(adapted),
    wrapperSha256: hash(readFileSync(new URL(import.meta.url))), source: receipt.source,
    replacements: adaptation.replacements, relativeImports: adaptation.relativeImports,
    deadlineOwner: 'The actual outer harness AbortSignal owns the deadline; no invented legacy deadline/timer.',
    cleanupOwner: 'The final outer receipt owns actual browser/server cleanup. Inner browserCloseDelegated records only the no-op delegated close request.',
    scope: 'Only launch/queue/path/context scaffolding adapted; all maintained18-phase geometry, reward, restore, exhaustion and pause assertions retained. Controlled logical stepping/camera/Blue-only/final-use fixtures; not ordinary gameplay. Browser/server/deadline/cleanup are owned by the outer sandboxed harness.',
  }, null, 2) + '\n')
  globalThis.stoneHeadControlledQA = args
  try {
    await import(pathToFileURL(adapter).href)
    signal.throwIfAborted()
  } finally {
    delete globalThis.stoneHeadControlledQA
  }
  const result = JSON.parse(readFileSync(resolve(output, 'controlled-fixture/evidence.json'), 'utf8'))
  assert.equal(result.status, 'PASS_STONE_HEAD_45_LIVE_PENDING_ORIGINAL_SUBMISSION_COMPARISON')
  assert.equal(result.error, undefined)
  assert.equal(result.expired, undefined)
  assert.equal(result.frames.length, 18)
  assert.deepEqual(result.errors, [])
  assert.deepEqual(receipt.errors, [])
  return { label: 'Controlled model45 geometry/lifecycle fixture; not ordinary cadence or native full-raster proof', result }
}
