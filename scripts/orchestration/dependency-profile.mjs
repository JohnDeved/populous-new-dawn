// Genuine dependency metadata, not a complete installed-package integrity proof.
// Legacy npm receipts retain their original fields; pnpm has an explicit schema.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { lstatSync, readFileSync, realpathSync } from 'node:fs'
import { dirname, join } from 'node:path'

export const PNPM_MANAGER = 'pnpm@11.25.0'
export const NPM_MANAGER = 'npm@11.9.0'
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const present = path => !!lstatSync(path, { throwIfNoEntry: false })
function regular(path) {
  assert(lstatSync(path).isFile(), `Dependency input must be a regular file: ${path}`)
  return readFileSync(path)
}
export function sourcePackageManager(repo) {
  const manager = JSON.parse(regular(join(repo, 'package.json'))).packageManager ?? NPM_MANAGER
  assert([PNPM_MANAGER, NPM_MANAGER].includes(manager), 'Unsupported source package-manager policy')
  return manager
}

export function dependencyReceipt(repo) {
  const modules = join(repo, 'node_modules'), npmLock = join(modules, '.package-lock.json')
  const pnpm = present(join(modules, '.modules.yaml')) || present(join(modules, '.pnpm'))
  if (!pnpm) {
    assert.notEqual(sourcePackageManager(repo), PNPM_MANAGER, 'Declared pnpm source requires a genuine pnpm layout')
    return { installedLockSha256: hash(regular(npmLock)) }
  }
  assert(!present(npmLock), 'Mixed npm/pnpm installed metadata is forbidden')
  assert(lstatSync(join(modules, '.pnpm')).isDirectory(), 'Private pnpm virtual store must be a physical directory')
  const profile = dirname(realpathSync(modules))
  for (const name of ['package.json', 'package-lock.json'])
    assert(regular(join(repo, name)).equals(regular(join(profile, name))), `Source/profile ${name} mismatch`)
  const desired = regular(join(profile, 'pnpm-lock.yaml')), installed = regular(join(modules, '.pnpm/lock.yaml'))
  assert(desired.equals(installed), 'Desired and installed pnpm locks differ')
  // A declared pnpm checkout also binds its own committed lock/profile, even
  // when node_modules points to a separately allocated private local runtime.
  if (sourcePackageManager(repo) === PNPM_MANAGER) {
    for (const name of ['pnpm-lock.yaml', 'pnpm-workspace.yaml'])
      assert(regular(join(repo, name)).equals(regular(join(profile, name))), `Source/profile ${name} mismatch`)
  }
  return { dependencyFormat: 'pnpm-isolated-v1', dependencyLocks: {
    packageManager: PNPM_MANAGER,
    packageJsonSha256: hash(regular(join(repo, 'package.json'))),
    sourceNpmLockSha256: hash(regular(join(repo, 'package-lock.json'))),
    pnpmLockSha256: hash(desired), installedPnpmLockSha256: hash(installed),
    workspaceSha256: hash(regular(join(profile, 'pnpm-workspace.yaml'))),
    modulesMetadataSha256: hash(regular(join(modules, '.modules.yaml'))),
  } }
}

// .modules.yaml contains installation-local timestamps/store paths. Bind its raw
// bytes within each job, but never pretend separate clean installs have the same
// raw metadata. Portable source/lock hashes are compared across all five jobs.
export function portablePnpmRuntime(receipt) {
  assert.equal(receipt.dependencyFormat, 'pnpm-isolated-v1')
  const { modulesMetadataSha256, ...locks } = receipt.dependencyLocks
  return { runtime: { dependencyFormat: receipt.dependencyFormat, ...locks },
    installation: { modulesMetadataSha256 } }
}
export function validPnpmInstallation(value) {
  return value && Object.keys(value).length === 1 && /^[a-f0-9]{64}$/.test(value.modulesMetadataSha256)
}

// Paths for bounded command receipts. Genuine installed metadata is always
// captured; declared pnpm source additionally captures its committed policy.
export function dependencyInputPaths(repo) {
  const receipt = dependencyReceipt(repo)
  if (!receipt.dependencyFormat) return ['node_modules/.package-lock.json']
  return ['node_modules/.modules.yaml', 'node_modules/.pnpm/lock.yaml',
    ...(sourcePackageManager(repo) === PNPM_MANAGER ? ['pnpm-lock.yaml', 'pnpm-workspace.yaml'] : [])]
}

// Npm consumes its separator; pnpm forwards it to the script as an argument.
export function scriptCommand(manager, script, args = []) {
  assert(['npm', 'pnpm'].includes(manager), 'Unsupported script package manager')
  return [manager, 'run', script, ...(manager === 'npm' && args.length ? ['--'] : []), ...args]
}
export function packageScriptCommand(repo, script, args = []) {
  return scriptCommand(sourcePackageManager(repo).split('@')[0], script, args)
}
