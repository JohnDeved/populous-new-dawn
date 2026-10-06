// The coordinator reviews the external launch plan; its JSON is not an approval service.
import assert from 'node:assert/strict'
import { readFileSync, lstatSync, existsSync, readdirSync, realpathSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { resolve, dirname } from 'node:path'
import { sourceReceipt } from '../../scripts/local-render/harness.mjs'
import policy from './policy.json' with { type: 'json' }

export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
export const limits = Object.freeze(policy.limits)
export const browserModules = Object.freeze(['app/erosion.ts', 'app/erosion-observation.ts', 'app/world-turn.ts', 'app/game-clock.ts',
  'qa/erosion-native-replay/capture.mjs', 'qa/erosion-ordinary/lifecycle.mjs', 'qa/erosion-ordinary/input.mjs', 'qa/erosion-ordinary/minimap-input.mjs'])

export function serverIdentity(root) {
  const files = ['package-lock.json', 'node_modules/.package-lock.json', 'scripts/local-render/harness.mjs', 'scripts/local-render/owned-profile.mjs',
    'scripts/local-render/checkpoint-observer.mjs', 'scripts/local-render/vite.config.mjs']
  const roots = ['vite', 'vinext', '@cloudflare/vite-plugin', '@playwright/test'].map(name => {
    let path = dirname(fileURLToPath(import.meta.resolve(name)))
    while (!existsSync(resolve(path, 'package.json')) || JSON.parse(readFileSync(resolve(path, 'package.json'))).name !== name) {
      assert.notEqual(dirname(path), path, `Package root not found: ${name}`); path = dirname(path)
    }
    return path
  })
  return { node: process.version, platform: process.platform, arch: process.arch, packages: packageCodeIdentity(roots),
    generatedCaches: 'Generated node_modules/.vite, .cache and task TMP/output files are excluded from immutable package identity; actual executed page scripts are retained separately.',
    files: Object.fromEntries(files.map(path => [path, sha256(readFileSync(resolve(root, path)))])) }
}

// Hash each installed declared package's executable/configuration files, including
// CLI/chunks/native transforms. This is a bounded package subset, not OS attestation.
export function packageCodeIdentity(roots) {
  const pending = [...roots], packages = {}, seen = new Set()
  let count = 0, bytes = 0
  const locate = (from, name) => {
    assert.match(name, /^(?:@[\w.-]+\/)?[\w.-]+$/)
    for (let dir = from;; dir = dirname(dir)) {
      const candidate = resolve(dir, 'node_modules', name)
      if (existsSync(resolve(candidate, 'package.json'))) return candidate
      if (dirname(dir) === dir) return null
    }
  }
  while (pending.length) {
    const dir = realpathSync(pending.pop())
    if (seen.has(dir)) continue
    seen.add(dir); assert.ok(seen.size <= 512, 'Compiler dependency package bound exceeded')
    const manifest = JSON.parse(readFileSync(resolve(dir, 'package.json'))), files = {}
    const walk = relative => {
      for (const entry of readdirSync(resolve(dir, relative), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
        if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
        const path = relative ? `${relative}/${entry.name}` : entry.name
        if (entry.isDirectory()) walk(path)
        else if (/\.(?:[cm]?js|json|node|wasm)$/.test(entry.name) || path.startsWith('bin/')) {
          assert.ok(!entry.isSymbolicLink(), `Unexpected executable-file link: ${path}`)
          const data = readFileSync(resolve(dir, path)); count++; bytes += data.length
          assert.ok(count <= 100000 && bytes <= 2 ** 30, 'Compiler code-file bound exceeded')
          files[path] = sha256(data)
        }
      }
    }
    walk('')
    const absent = []
    for (const name of Object.keys({ ...manifest.dependencies, ...manifest.optionalDependencies, ...manifest.peerDependencies }).sort()) {
      const dependency = locate(dir, name)
      if (dependency) pending.push(dependency)
      else { assert.ok(!manifest.dependencies?.[name] || manifest.optionalDependencies?.[name], `Required installed compiler dependency missing: ${name}`); absent.push(name) }
    }
    packages[dir] = { name: manifest.name, version: manifest.version, files, absentOptionalOrPeer: absent }
  }
  return Object.fromEntries(Object.entries(packages).sort(([a], [b]) => a.localeCompare(b)))
}

export function validatePlan(plan, source, server, expectedRoot) {
  assert.equal(plan.kind, 'erosion-ordinary-capture-launch-plan')
  assert.equal(plan.operationalGrantReceived, true, 'Coordinator runtime grant is still required')
  assert.equal(source.status, ''); assert.deepEqual(source.untracked, [])
  assert.equal(plan.sourceHead, source.commit); assert.equal(plan.sourceFingerprint, source.fingerprint)
  assert.equal(plan.root, expectedRoot)
  assert.equal(plan.applicationTree, policy.applicationTree)
  assert.equal(plan.serverIdentitySha256, sha256(JSON.stringify(server)))
  assert.match(plan.origin, /^http:\/\/127\.0\.0\.1:\d+$/)
  assert.equal(dirname(plan.profilePath), resolve(expectedRoot, 'work/local-render-profiles'))
  assert.equal(resolve(plan.profilePath), plan.profilePath)
  assert.ok(plan.output.startsWith(resolve(expectedRoot, 'work/orchestration/erosion-ordinary') + '/'))
  assert.equal(resolve(plan.output), plan.output)
  assert.deepEqual(plan.limits, limits)
  assert.equal(plan.restoreTested, false)
  return plan
}

export function readLaunchPlan(root, path) {
  assert.ok(path, 'Set POPULOUS_EROSION_LAUNCH_PLAN to the exact reviewed launch plan; no automatic launch')
  const stat = lstatSync(path)
  assert.ok(stat.isFile() && !stat.isSymbolicLink() && stat.nlink === 1 && stat.uid === process.getuid() && stat.size <= 65536)
  const bytes = readFileSync(path), plan = JSON.parse(bytes), source = sourceReceipt(root), server = serverIdentity(root)
  validatePlan(plan, source, server, root)
  assert.equal(execFileSync('git', ['rev-parse', 'HEAD:app'], { cwd: root, encoding: 'utf8' }).trim(), policy.applicationTree)
  for (const commit of [policy.compositionCommit, policy.producerCommit, policy.recorderCommit])
    execFileSync('git', ['merge-base', '--is-ancestor', commit, 'HEAD'], { cwd: root })
  for (const [file, hash] of Object.entries(policy.inputs)) assert.equal(sha256(readFileSync(resolve(root, file))), hash, `Pinned source changed: ${file}`)
  assert.equal(existsSync(plan.profilePath), false, 'Use a new task-owned profile; no reuse')
  assert.equal(existsSync(plan.output), false, 'Use a fresh output directory')
  assert.equal(plan.scenarioSha256, sha256(readFileSync(resolve(root, 'qa/erosion-ordinary/scenario.mjs'))))
  return { plan, planSha256: sha256(bytes), source, server }
}
