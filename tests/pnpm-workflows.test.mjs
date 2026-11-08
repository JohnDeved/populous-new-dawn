import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, chmodSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import yaml from 'js-yaml'
const root = new URL('../', import.meta.url)
const source = name => readFileSync(new URL(name, root), 'utf8')
function installer(name) {
  const text = source(`.github/workflows/${name}.yml`)
  const start = text.indexOf('          manager="$('), end = text.indexOf("          printf 'Candidate package manager:", start)
  assert(start > 0 && end > start)
  return text.slice(start, text.indexOf('\n', text.indexOf('PND_PACKAGE_MANAGER=', end))).split('\n').map(line => line.slice(10)).join('\n')
}
for (const family of ['ready-pr-check', 'tutorial-browser', 'native-ui-evidence', 'browser-performance']) {
  for (const manager of [undefined, 'pnpm@11.25.0', 'unsupported@9']) test(`${family} installer follows exact source policy ${manager ?? 'historical npm'}`, t => {
    const repo = mkdtempSync(join(tmpdir(), 'pnd-install-policy-'))
    t.after(() => rmSync(repo, { recursive: true, force: true }))
    writeFileSync(join(repo, 'package.json'), JSON.stringify(manager ? { packageManager: manager } : {}))
    writeFileSync(join(repo, 'pnpm-lock.yaml'), 'fixture'); writeFileSync(join(repo, 'pnpm-workspace.yaml'), 'fixture')
    const bin = join(repo, 'bin'); mkdirSync(bin)
    for (const command of ['npm', 'pnpm']) {
      const path = join(bin, command)
      writeFileSync(path, `#!/bin/sh\nprintf '%s\\n' '${command}'" $*" >> "$PND_INSTALL_CALLS"\n`); chmodSync(path, 0o755)
    }
    const calls = join(repo, 'calls'), result = spawnSync('bash', ['-e', '-c', installer(family)], { cwd: repo, encoding: 'utf8',
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, PND_INSTALL_CALLS: calls, GITHUB_ENV: join(repo, 'github-env') } })
    if (manager === 'unsupported@9') { assert.notEqual(result.status, 0); assert.equal(existsSync(calls), false); return }
    assert.equal(result.status, 0, result.stderr)
    assert.equal(readFileSync(join(repo, 'github-env'), 'utf8'), `PND_PACKAGE_MANAGER=${manager ? 'pnpm' : 'npm'}\n`)
    const commands = readFileSync(calls, 'utf8').trim().split('\n')
    assert.deepEqual(commands, manager ? [
      'npm install --global --ignore-scripts --no-audit --no-fund pnpm@11.25.0', 'pnpm install --frozen-lockfile --ignore-scripts',
    ] : [
      'npm install --global --ignore-scripts --no-audit --no-fund npm@11.9.0',
      `npm ci ${family === 'browser-performance' ? '--ignore-scripts ' : ''}--no-audit --no-fund`,
    ])
  })
}
test('existing hosted Full stages and four shards remain intact under pnpm', () => {
  const text = source('.github/workflows/ready-pr-check.yml')
  for (const command of ['$PND_PACKAGE_MANAGER run typecheck', '$PND_PACKAGE_MANAGER run parity:check', '$PND_PACKAGE_MANAGER run orchestration:check', '$PND_PACKAGE_MANAGER run build', 'ci-gate.mjs aggregate']) assert.ok(text.includes(command))
  assert.match(text, /max-parallel: 4/); assert.match(text, /needs: \[quality, test-shards\]/)
  assert.match(text, /if: \$\{\{ always\(\) \}\}/); assert.match(text, /types: \[ready_for_review\]/)
  assert.match(text, /permissions:\n {2}contents: read\n/)
})
test('native historical candidates use separately source-bound dependency infrastructure', () => {
  const text = source('.github/workflows/native-ui-evidence.yml')
  assert.match(text, /\/scripts\/orchestration\/dependency-profile\.mjs/)
  assert.match(text, /working-directory: candidate/)
  assert.equal(source('scripts/browser-performance/workflows/browser-performance.yml'), source('.github/workflows/browser-performance.yml'))
})


test('all four existing workflow families remain valid YAML', () => {
  for (const family of ['ready-pr-check', 'tutorial-browser', 'native-ui-evidence', 'browser-performance']) {
    const parsed = yaml.load(source(`.github/workflows/${family}.yml`))
    assert.ok(parsed.on && parsed.jobs && parsed.permissions)
  }
})
