import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { findKeyConsumers, keyToken, scanSource } from '../scripts/key-consumers.mjs'

const tool = fileURLToPath(new URL('../scripts/key-consumers.mjs', import.meta.url))

test('key tokens unify Playwright names, KeyboardEvent keys and codes', () => {
  assert.equal(keyToken('d'), 'd')
  assert.equal(keyToken('D'), 'd')
  assert.equal(keyToken('KeyD'), 'd')
  assert.equal(keyToken('1'), 'digit1')
  assert.equal(keyToken('Digit1'), 'digit1')
  assert.equal(keyToken('.'), 'period')
  assert.equal(keyToken('Period'), 'period')
  assert.equal(keyToken(' '), 'space')
  assert.equal(keyToken('ArrowRight'), 'arrowright')
})

test('direct, chord, locator, event and indirect consumers are found; unrelated text is not', () => {
  const wanted = new Set(['d'])
  const source = [
    "await page.keyboard.down('d')",
    "await page.keyboard.press('Shift+D')",
    "await canvas.press('KeyD')",
    "await page.press('canvas', 'd')",
    "const label = 'd' // plain string, no key context",
    "await page.keyboard.press('Shift+Digit1')",
  ].join('\n')
  assert.deepEqual(scanSource(source, wanted).map(hit => [hit.line, hit.kind, hit.key]), [
    [1, 'direct', 'd'], [2, 'direct', 'Shift+D'], [3, 'direct', 'KeyD'], [4, 'direct', 'd'],
  ])

  const events = "el.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', code: 'KeyD' }))\nconst row = { key: 'd' }"
  assert.deepEqual(scanSource(events, wanted).map(hit => [hit.line, hit.kind, hit.key]), [
    [1, 'event', 'd'], [1, 'event', 'KeyD'], [2, 'event', 'd'],
  ])
  assert.deepEqual(scanSource("const row = { key: 'd' }", wanted), [], 'no key events: object keys are ignored')

  const indirect = "const cases = [['w', 'd'], ['q']]\nfor (const key of keys) await page.keyboard.down(key)"
  assert.deepEqual(scanSource(indirect, wanted).map(hit => [hit.line, hit.kind]), [[1, 'indirect']])
  assert.deepEqual(scanSource("const cases = [['w', 'd']]", wanted), [], 'arrays only count beside variable presses')
})

test('only tracked scripts/tests/qa files are scanned and the CLI reports them', t => {
  const repo = mkdtempSync(join(tmpdir(), 'pnd-key-consumers-'))
  t.after(() => rmSync(repo, { recursive: true, force: true }))
  const put = (path, text) => {
    mkdirSync(dirname(join(repo, path)), { recursive: true })
    writeFileSync(join(repo, path), text)
  }
  const git = (...args) => execFileSync('git', args, { cwd: repo, encoding: 'utf8' })
  git('init', '-q')
  put('scripts/a.mjs', "await page.keyboard.press('.')\n")
  put('qa/b.mjs', "await page.keyboard.down('Period')\n")
  put('app/c.ts', "await page.keyboard.press('.')\n")
  put('scripts/untracked.mjs', "await page.keyboard.press('.')\n")
  git('add', 'scripts/a.mjs', 'qa/b.mjs', 'app/c.ts')
  assert.deepEqual(findKeyConsumers(repo, ['period']).map(hit => `${hit.path}:${hit.line}`), ['qa/b.mjs:1', 'scripts/a.mjs:1'])

  const cli = spawnSync(process.execPath, [tool, '--root', repo, '--key', '.', '--json'], { encoding: 'utf8' })
  assert.equal(cli.status, 0, cli.stderr)
  assert.deepEqual(JSON.parse(cli.stdout).hits.map(hit => hit.path), ['qa/b.mjs', 'scripts/a.mjs'])
  const usage = spawnSync(process.execPath, [tool, '--root', repo], { encoding: 'utf8' })
  assert.equal(usage.status, 2)
  assert.match(usage.stderr, /Usage/)
})
