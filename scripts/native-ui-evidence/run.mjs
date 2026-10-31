import assert from 'node:assert/strict'
import { dependencyReceipt } from '../orchestration/dependency-profile.mjs'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { manualIdentity, separateRoots, sourceManifest, verifyManifest, infrastructureInput, sha256 } from './identity.mjs'
import { limits, acceptSeries } from './policy.mjs'
import { artifactInventory } from './browser-owner.mjs'
import { finalizeArtifactReceipt, recordArtifactFailure, artifactFailureText } from './receipt-finalization.mjs'
import { supervise } from './supervise.mjs'
import { directoryManifest, publicLinks, verifyBuiltOutput, afterScopes } from './files.mjs'
import { initializeEpisodeLedger, recordUnstartedFailure } from './ledger.mjs'
const identity = manualIdentity(process.env)
const { candidateRoot, infrastructureRoot } = separateRoots(resolve(process.argv[2]), resolve(import.meta.dirname, '../..'))
const output = resolve(process.argv[3]), dist = resolve(process.argv[4])
for (const path of [output, dist]) {
  assert.equal(existsSync(path), false, 'Fresh output required')
  assert.ok(!path.startsWith(candidateRoot + '/') && !path.startsWith(infrastructureRoot + '/'), 'Outputs must be outside both source roots')
}
assert.ok(output !== dist && !dist.startsWith(output + '/') && !output.startsWith(dist + '/'))
mkdirSync(output, { recursive: true }); mkdirSync(dist, { recursive: true })
initializeEpisodeLedger(output)
const report = { status: 'running', identity, limits, startedAt: new Date().toISOString(),
  claim: 'Read-only pre-ready rendered evidence for a candidate head, NOT a synthetic merge/full check or deployment',
  limitsOfEvidence: ['Plain production Home through Vite, not Vinext/Cloudflare/RSC hosting', 'Native pixel equivalence, acoustic quality and hardware performance are not established'] }
const save = () => writeFileSync(resolve(output, 'receipt.json'), JSON.stringify(report, null, 2) + '\n')
let candidateSource, infrastructureSource, dependencies, built, links, browserStarted = false
let stage = 'source-inputs'
try {
  candidateSource = sourceManifest(candidateRoot, identity.candidateSha)
  infrastructureSource = sourceManifest(infrastructureRoot, identity.workflowSha, infrastructureInput)
  for (const [name, source] of [['candidate', candidateSource], ['infrastructure', infrastructureSource]]) {
    writeFileSync(resolve(output, `${name}-source.json`), JSON.stringify(source, null, 2) + '\n')
    report[`${name}ManifestSha256`] = sha256(resolve(output, `${name}-source.json`))
  }
  dependencies = directoryManifest(resolve(candidateRoot, 'node_modules'))
  writeFileSync(resolve(output, 'dependencies.json'), JSON.stringify(dependencies, null, 2) + '\n')
  report.dependenciesSha256 = sha256(resolve(output, 'dependencies.json'))
  report.packageLockSha256 = sha256(resolve(candidateRoot, 'package-lock.json'))
  Object.assign(report, dependencyReceipt(candidateRoot))
  save()
  stage = 'candidate-audio-source-contract'
  report.candidateAudioSourceContract = await supervise(
    ['--test', '--test-concurrency=1', resolve(import.meta.dirname, 'candidate-audio-probes-contract.mjs')],
    { cwd: candidateRoot, log: resolve(output, 'candidate-audio-source-contract.log'), capMs: 30000, inspect: () => artifactInventory(output) })
  save(); assert.equal(report.candidateAudioSourceContract.status, 'passed', 'Exact candidate audio source contract failed')
  stage = 'candidate-build'
  report.build = await supervise([resolve(import.meta.dirname, 'build-home.mjs'), candidateRoot, dist, identity.candidateSha],
    { cwd: candidateRoot, log: resolve(output, 'build.log'), capMs: limits.buildMs, inspect: () => artifactInventory(output) })
  save(); assert.equal(report.build.status, 'passed', 'Candidate Home build failed')
  built = directoryManifest(dist)
  links = publicLinks(candidateRoot, built)
  writeFileSync(resolve(output, 'public-links.json'), JSON.stringify(links, null, 2) + '\n')
  writeFileSync(resolve(output, 'build-manifest.json'), JSON.stringify(built, null, 2) + '\n')
  report.buildManifestSha256 = sha256(resolve(output, 'build-manifest.json'))
  assert.ok(Object.keys(built).some(name => name.endsWith('.js') && readFileSync(resolve(dist, name), 'utf8').includes(identity.candidateSha)), 'Bundle must identify the candidate revision')
  browserStarted = true
  stage = 'browser-worker'
  report.browser = await supervise([resolve(import.meta.dirname, 'browser-worker.mjs'), candidateRoot, infrastructureRoot, output, dist],
    { cwd: candidateRoot, log: resolve(output, 'browser.log'), capMs: limits.browserMs, inspect: () => artifactInventory(output) })
  save(); assert.equal(report.browser.status, 'passed', 'Nine-episode browser worker failed')
  const series = JSON.parse(readFileSync(resolve(output, 'episodes.json'), 'utf8'))
  assert.equal(series.status, 'passed'); assert.equal(series.cleanupVerified, true); acceptSeries(series.episodes)
  verifyBuiltOutput(dist, built, links)
  report.status = 'passed'
} catch (error) {
  report.status = 'failed'; report.failure = String(error); report.stack = error.stack; process.exitCode = 1
  recordUnstartedFailure(output, stage, error)
}
finally {
  const after = afterScopes({
    candidate: { captured: !!candidateSource, verify: () => verifyManifest(candidateRoot, candidateSource) },
    infrastructure: { captured: !!infrastructureSource, verify: () => verifyManifest(infrastructureRoot, infrastructureSource) },
    dependencies: { captured: !!dependencies, verify: () => assert.deepEqual(directoryManifest(resolve(candidateRoot, 'node_modules')), dependencies) },
    built: { captured: !!built, verify: () => verifyBuiltOutput(dist, built, browserStarted ? links : {}) },
  })
  report.inputsAfter = after.states
  if (after.failures.length) { report.inputFailures = after.failures; report.status = 'failed'; process.exitCode = 1 }
  report.finishedAt = new Date().toISOString()
  try { report.artifacts = finalizeArtifactReceipt(output, report) }
  catch (error) {
    delete report.artifacts; report.status = 'failed'; report.artifactFailure = artifactFailureText(error); process.exitCode = 1
    try { recordArtifactFailure(output, report) }
    catch (failure) { console.error('Native UI receipt NOT accepted:', report.artifactFailure,
      'Failure receipt unavailable:', artifactFailureText(failure), 'Primary failure:', artifactFailureText(report.failure ?? 'none'),
      'Input failures:', artifactFailureText(report.inputFailures ?? 'none')) }
  }
}
