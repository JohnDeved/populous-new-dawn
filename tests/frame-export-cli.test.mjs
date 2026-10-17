import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const script = fileURLToPath(new URL('../scripts/analyze-frame-export.mjs', import.meta.url))
const fixture = fileURLToPath(new URL('./fixtures/frame-performance-export-v1.json', import.meta.url))
const run = (...args) => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', timeout: 10000 })

test('offline CLI prints a JSON summary for an explicitly supplied local export', () => {
  const result = run(fixture)
  assert.equal(result.status, 0, result.stderr)
  const summary = JSON.parse(result.stdout)
  assert.equal(summary.sampleCount, 2)
  assert.equal(summary.level, 2)
  assert.equal(summary.capturedSpanMs, 34)
  assert.ok(summary.warnings.length)
})

test('CLI requires exactly one input and supports help without reading a file', () => {
  for (const args of [[], [fixture, fixture], ['--unknown']]) {
    const result = run(...args)
    assert.equal(result.status, 1)
    assert.equal(result.stdout, '')
    assert.match(result.stderr, /Usage:/)
  }
  const help = run('--help')
  assert.equal(help.status, 0)
  assert.match(help.stdout, /Usage:/)
})

test('CLI fails closed on missing files, directories and non-export JSON', () => {
  for (const path of [
    `${fixture}.does-not-exist`,
    fileURLToPath(new URL('./fixtures/', import.meta.url)),
    fileURLToPath(new URL('../package.json', import.meta.url)),
  ]) {
    const result = run(path)
    assert.equal(result.status, 1)
    assert.equal(result.stdout, '')
    assert.match(result.stderr, /Frame export analysis failed:/)
  }
})

test('CLI rejects oversized files and malformed UTF-8 without printing a summary', async t => {
  const { mkdtempSync, writeFileSync, rmSync } = await import('node:fs')
  const { tmpdir } = await import('node:os')
  const { join } = await import('node:path')
  const directory = mkdtempSync(join(tmpdir(), 'frame-export-cli-'))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  const path = join(directory, 'export.json')
  for (const bytes of [Buffer.alloc(2 * 1024 * 1024 + 1), Buffer.from([0xc3, 0x28])]) {
    writeFileSync(path, bytes)
    const result = run(path)
    assert.equal(result.status, 1)
    assert.equal(result.stdout, '')
    assert.match(result.stderr, /Frame export analysis failed:/)
  }
})
