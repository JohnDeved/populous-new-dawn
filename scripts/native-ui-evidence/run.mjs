import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, lstatSync, readlinkSync } from 'node:fs'
import { resolve, relative } from 'node:path'
import { manualIdentity, separateRoots, sourceManifest, verifyManifest, infrastructureInput, sha256 } from './identity.mjs'
import { limits, acceptSeries } from './policy.mjs'
import { artifactInventory } from './browser-owner.mjs'
import { supervise } from './supervise.mjs'

export function installedManifest(root) {
  const files = {}
  function walk(path) {
    for (const entry of readdirSync(path, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const file = resolve(path, entry.name), name = relative(root, file), stat = lstatSync(file)
      if (entry.isDirectory()) walk(file)
      else if (entry.isSymbolicLink()) files[name] = { mode: stat.mode, link: readlinkSync(file) }
      else { assert.ok(entry.isFile()); files[name] = { mode: stat.mode, bytes: stat.size, sha256: sha256(file) } }
    }
  }
  walk(root)
  return files
}
const identity = manualIdentity(process.env)
const { candidateRoot, infrastructureRoot } = separateRoots(resolve(process.argv[2]), resolve(import.meta.dirname, '../..'))
const output = resolve(process.argv[3]), dist = resolve(process.argv[4])
for (const path of [output, dist]) {
  assert.equal(existsSync(path), false, 'Fresh output required')
  assert.ok(!path.startsWith(candidateRoot + '/') && !path.startsWith(infrastructureRoot + '/'), 'Outputs must be outside both source roots')
}
assert.ok(output !== dist && !dist.startsWith(output + '/') && !output.startsWith(dist + '/'))
mkdirSync(output, { recursive: true }); mkdirSync(dist, { recursive: true })
const report = { status: 'running', identity, limits, startedAt: new Date().toISOString(),
  claim: 'Read-only pre-ready rendered evidence for a candidate head, NOT a synthetic merge/full check or deployment',
  limitsOfEvidence: ['Plain production Home through Vite, not Vinext/Cloudflare/RSC hosting', 'Native pixel equivalence, acoustic quality and hardware performance are not established'] }
const save = () => writeFileSync(resolve(output, 'receipt.json'), JSON.stringify(report, null, 2) + '\n')
let candidateSource, infrastructureSource, dependencies
try {
  candidateSource = sourceManifest(candidateRoot, identity.candidateSha)
  infrastructureSource = sourceManifest(infrastructureRoot, identity.workflowSha, infrastructureInput)
  for (const [name, source] of [['candidate', candidateSource], ['infrastructure', infrastructureSource]]) {
    writeFileSync(resolve(output, `${name}-source.json`), JSON.stringify(source, null, 2) + '\n')
    report[`${name}ManifestSha256`] = sha256(resolve(output, `${name}-source.json`))
  }
  dependencies = installedManifest(resolve(candidateRoot, 'node_modules'))
  writeFileSync(resolve(output, 'dependencies.json'), JSON.stringify(dependencies, null, 2) + '\n')
  report.dependenciesSha256 = sha256(resolve(output, 'dependencies.json'))
  report.packageLockSha256 = sha256(resolve(candidateRoot, 'package-lock.json'))
  report.installedLockSha256 = sha256(resolve(candidateRoot, 'node_modules/.package-lock.json'))
  save()
  report.build = await supervise([resolve(import.meta.dirname, 'build-home.mjs'), candidateRoot, dist, identity.candidateSha],
    { cwd: candidateRoot, log: resolve(output, 'build.log'), capMs: limits.buildMs, inspect: () => artifactInventory(output) })
  save(); assert.equal(report.build.status, 'passed', 'Candidate Home build failed')
  const built = installedManifest(dist)
  writeFileSync(resolve(output, 'build-manifest.json'), JSON.stringify(built, null, 2) + '\n')
  report.buildManifestSha256 = sha256(resolve(output, 'build-manifest.json'))
  assert.ok(Object.keys(built).some(name => name.endsWith('.js') && readFileSync(resolve(dist, name), 'utf8').includes(identity.candidateSha)), 'Bundle must identify the candidate revision')
  report.browser = await supervise([resolve(import.meta.dirname, 'browser-worker.mjs'), candidateRoot, infrastructureRoot, output, dist],
    { cwd: candidateRoot, log: resolve(output, 'browser.log'), capMs: limits.browserMs, inspect: () => artifactInventory(output) })
  save(); assert.equal(report.browser.status, 'passed', 'Seven-episode browser worker failed')
  const series = JSON.parse(readFileSync(resolve(output, 'episodes.json'), 'utf8'))
  assert.equal(series.status, 'passed'); assert.equal(series.cleanupVerified, true); acceptSeries(series.episodes)
  for (const [name, expected] of Object.entries(built)) assert.equal(sha256(resolve(dist, name)), expected.sha256, 'Built output mutated')
  report.status = 'passed'
} catch (error) { report.status = 'failed'; report.failure = String(error); report.stack = error.stack; process.exitCode = 1 }
finally {
  try {
    if (candidateSource) verifyManifest(candidateRoot, candidateSource)
    if (infrastructureSource) verifyManifest(infrastructureRoot, infrastructureSource)
    if (dependencies) assert.deepEqual(installedManifest(resolve(candidateRoot, 'node_modules')), dependencies)
    report.inputsAfter = 'identical'
  } catch (error) { report.inputsAfter = String(error); report.status = 'failed'; process.exitCode = 1 }
  report.finishedAt = new Date().toISOString(); save()
  try { report.artifacts = artifactInventory(output); save() }
  catch (error) { report.status = 'failed'; report.artifactFailure = String(error); process.exitCode = 1; save() }
}
