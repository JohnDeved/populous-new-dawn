import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import test from 'node:test'
import { dependencyReceipt, portablePnpmRuntime, sourcePackageManager, validPnpmInstallation } from '../scripts/orchestration/dependency-profile.mjs'
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
