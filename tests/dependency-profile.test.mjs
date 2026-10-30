import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync, existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import test from 'node:test'
import { spawnSync } from 'node:child_process'
import { dependencyReceipt, portablePnpmRuntime, sourcePackageManager, validPnpmInstallation, scriptCommand, packageScriptCommand, dependencyInputPaths } from '../scripts/orchestration/dependency-profile.mjs'
function fixture(t, manager) {
  const repo = mkdtempSync(join(tmpdir(), 'pnd-dependency-'))
  t.after(() => rmSync(repo, { recursive: true, force: true }))
  const put = (name, value) => { mkdirSync(join(repo, name, '..'), { recursive: true }); writeFileSync(join(repo, name), value) }
  put('package.json', JSON.stringify(manager ? { packageManager: manager } : {})); put('package-lock.json', '{}')
  return { repo, put }
}
function pnpm(t) {
  const f = fixture(t, 'pnpm@11.25.0')
  f.put('pnpm-lock.yaml', 'lockfileVersion: 9\n'); f.put('pnpm-workspace.yaml', 'nodeLinker: isolated\n')
  f.put('node_modules/.pnpm/lock.yaml', 'lockfileVersion: 9\n'); f.put('node_modules/.modules.yaml', 'prunedAt: installation-one\n')
  return f
}
test('legacy npm receipt retains its exact original field shape', t => {
  const f = fixture(t); f.put('node_modules/.package-lock.json', '{}')
  assert.equal(sourcePackageManager(f.repo), 'npm@11.9.0')
  assert.deepEqual(Object.keys(dependencyReceipt(f.repo)), ['installedLockSha256'])
})
test('pnpm binds genuine locks and separates portable policy from per-install metadata', t => {
  const f = pnpm(t), first = dependencyReceipt(f.repo), a = portablePnpmRuntime(first)
  f.put('node_modules/.modules.yaml', 'prunedAt: installation-two\n')
  const second = dependencyReceipt(f.repo), b = portablePnpmRuntime(second)
  assert.equal(first.dependencyFormat, 'pnpm-isolated-v1'); assert.equal(first.installedLockSha256, undefined)
  assert.deepEqual(a.runtime, b.runtime); assert.notDeepEqual(a.installation, b.installation)
  assert.equal(validPnpmInstallation(a.installation), true)
})
for (const mutation of ['mixed', 'installed-drift', 'metadata-symlink', 'virtual-store-symlink', 'missing-lock', 'unknown-manager', 'npm-downgrade']) test(`dependency metadata rejects ${mutation}`, t => {
  const f = pnpm(t)
  if (mutation === 'mixed') f.put('node_modules/.package-lock.json', '{}')
  if (mutation === 'installed-drift') f.put('node_modules/.pnpm/lock.yaml', 'changed')
  if (mutation === 'metadata-symlink') { rmSync(join(f.repo, 'node_modules/.modules.yaml')); symlinkSync('../pnpm-lock.yaml', join(f.repo, 'node_modules/.modules.yaml')) }
  if (mutation === 'virtual-store-symlink') { rmSync(join(f.repo, 'node_modules/.pnpm'), { recursive: true }); symlinkSync('elsewhere', join(f.repo, 'node_modules/.pnpm')) }
  if (mutation === 'missing-lock') rmSync(join(f.repo, 'pnpm-lock.yaml'))
  if (mutation === 'unknown-manager') f.put('package.json', '{"packageManager":"pnpm@0.0.0"}')
  if (mutation === 'npm-downgrade') { rmSync(join(f.repo, 'node_modules'), { recursive: true }); f.put('node_modules/.package-lock.json', '{}') }
  assert.throws(() => dependencyReceipt(f.repo))
})


test('source-selected script arguments preserve npm separators but never leak them to pnpm scripts', t => {
  const f = fixture(t, 'pnpm@11.25.0'), args = ['--port', '1234', '--hostname', '127.0.0.1']
  assert.deepEqual(packageScriptCommand(f.repo, 'dev', args), ['pnpm', 'run', 'dev', ...args])
  assert.deepEqual(scriptCommand('npm', 'dev', args), ['npm', 'run', 'dev', '--', ...args])
  f.put('package.json', JSON.stringify({ private: true, scripts: { argv: 'node argv.mjs' } }))
  f.put('argv.mjs', 'console.log(JSON.stringify(process.argv.slice(2)))')
  const version = spawnSync('pnpm', ['--version'], { encoding: 'utf8' })
  assert.equal(version.status, 0, version.stderr); assert.equal(version.stdout.trim(), '11.25.0')
  // This has no dependencies or installation. Disable pre-run checking only in
  // this disposable argv fixture so it cannot trigger an automatic install.
  for (const separator of [[], ['--']]) {
    const result = spawnSync('pnpm', ['--config.verify-deps-before-run=false', ...scriptCommand('pnpm', 'argv', [...separator, ...args]).slice(1)],
      { cwd: f.repo, encoding: 'utf8' })
    assert.equal(result.status, 0, result.stderr)
    assert.deepEqual(JSON.parse(result.stdout.trim().split('\n').at(-1)), [...separator, ...args])
  }
  assert.equal(existsSync(join(f.repo, 'node_modules')), false)
  assert.equal(existsSync(join(f.repo, 'pnpm-lock.yaml')), false)
})
test('current source policy fails closed instead of silently installing before scripts', () => {
  assert.match(readFileSync(new URL('../pnpm-workspace.yaml', import.meta.url), 'utf8'), /^verifyDepsBeforeRun: error$/m)
})
test('bounded writer paths follow genuine metadata without creating an npm lock', t => {
  const f = pnpm(t)
  assert.deepEqual(dependencyInputPaths(f.repo), ['node_modules/.modules.yaml', 'node_modules/.pnpm/lock.yaml', 'pnpm-lock.yaml', 'pnpm-workspace.yaml'])
  assert.equal(existsSync(join(f.repo, 'node_modules/.package-lock.json')), false)
})


test('pinned pnpm rejects missing installation before executing a script or installing', t => {
  const f = fixture(t)
  f.put('package.json', JSON.stringify({ private: true, scripts: { probe: 'node probe.mjs' } }))
  f.put('probe.mjs', 'import fs from "node:fs"; fs.writeFileSync("executed", "unexpected")')
  f.put('pnpm-workspace.yaml', "packages:\n  - '.'\nverifyDepsBeforeRun: error\n")
  const result = spawnSync('pnpm', ['run', 'probe'], { cwd: f.repo, encoding: 'utf8' })
  assert.notEqual(result.status, 0)
  assert.match(result.stdout + result.stderr, /VERIFY_DEPS_BEFORE_RUN|out of sync|outdated|not installed/i)
  for (const name of ['executed', 'node_modules', 'pnpm-lock.yaml']) assert.equal(existsSync(join(f.repo, name)), false)
})
