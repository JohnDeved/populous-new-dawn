// Opt-in, separately reviewed nine-job policy. Never infer this policy from
// candidate receipt fields or observed job count, and never fall back to eight.
// Parent trusted-reader deployment/selection is deliberately not wired here.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { checkpointCodec } from '../tutorial-browser/checkpoint-codec.mjs'
import { validateAngelResourceObservation, validateAngelPng } from './spell-visuals-render-evidence.mjs'
import { SHIELD_VISUAL_INPUTS, SHIELD_VISUAL_FILES } from '../tutorial-browser/shield-visuals-inputs.mjs'
import { validateShieldReceipt } from './shield-visuals-receipt.mjs'
import { SPLIT_BROWSER_JOBS, validateSplitBrowserJobs } from './browser-jobs.mjs'
export const SPELL_VISUAL_POLICY = 'spell-visuals-nine-v2'
export const SPELL_VISUAL_JOB = Object.freeze(['spell-visuals', 'Spell visuals browser', 'spell-visuals-browser',
  'Build plain production Home and validate bounded supplied spell visuals', 15])
export const SPELL_VISUAL_BROWSER_JOBS = Object.freeze([...SPLIT_BROWSER_JOBS, SPELL_VISUAL_JOB])
export const SPELL_VISUAL_INPUTS = Object.freeze([
  'scripts/tutorial-browser/run.mjs', 'scripts/tutorial-browser/scenario-policy.mjs',
  'scripts/tutorial-browser/spell-visuals.mjs', 'scripts/tutorial-browser/spell-visuals-receipt.mjs',
  'scripts/tutorial-browser/browser-config.mjs', 'scripts/tutorial-browser/build-home.mjs',
  'scripts/tutorial-browser/build-provenance.mjs', 'scripts/tutorial-browser/fixture/main.tsx',
  'scripts/tutorial-browser/fixture/index.html', 'scripts/integration-queue/browser-jobs.mjs',
  'scripts/integration-queue/spell-visuals-policy.mjs', '.github/workflows/tutorial-browser.yml',
  'app/angel.ts', 'app/angel-presentation.ts', 'app/original-angel.json', 'app/scene-angel.ts',
  'app/scene-assets.ts', 'app/scene-effects.ts', 'app/scene-picking.ts', 'app/render-view.ts',
  'app/game-clock.ts', 'app/game-store.ts', 'app/checkpoint-format.ts', 'app/world-turn.ts',
  'scripts/tutorial-browser/angel-visuals.mjs', 'scripts/tutorial-browser/angel-visuals-budget.mjs',
  'scripts/tutorial-browser/angel-visuals-fixture.mjs', 'scripts/tutorial-browser/angel-visuals-observer.mjs',
  'scripts/tutorial-browser/angel-visuals-evidence.mjs', 'scripts/tutorial-browser/checkpoint-codec.mjs',
  'scripts/browser-performance/snapshot-setup.mjs', 'scripts/browser-game.mjs',
  'scripts/tutorial-browser/m2-pointer-f8.mjs', 'tests/level-start-fixture.mjs',
  'scripts/integration-queue/spell-visuals-render-evidence.mjs', 'scripts/artifact-zip.mjs',
  'app/page.tsx', 'app/original-pause-menu.tsx', 'public/original/atlas.png', 'package.json', 'package-lock.json',
  'scripts/integration-queue/shield-visuals-receipt.mjs',
  ...SHIELD_VISUAL_INPUTS.filter(name => ![
    'scripts/tutorial-browser/checkpoint-codec.mjs', 'scripts/tutorial-browser/m2-pointer-f8.mjs',
    'scripts/browser-game.mjs', 'tests/level-start-fixture.mjs', 'app/scene-assets.ts',
    'app/checkpoint-format.ts', 'app/game-store.ts', 'app/game-clock.ts',
  ].includes(name)),
])
export const SPELL_VISUAL_FILES = Object.freeze(['receipt.json', 'angel-visuals.json',
  'angel-supplied-checkpoint.json', 'angel-supplied-expected.json', 'angel-fixture-source.json',
  'angel-public-save.json', 'angel-public-load-boundary.json',
  'angel-paused-context.png', 'angel-loop-context.png', 'angel-death-context.png', ...SHIELD_VISUAL_FILES])
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const sha = value => assert.match(value, /^[a-f0-9]{64}$/)
export function validateSpellVisualBrowserJobs(jobs, run, expected) {
  assert.equal(expected?.policy, SPELL_VISUAL_POLICY, 'Explicit trusted nine-job policy required')
  assert.match(expected.headSha, /^[a-f0-9]{40}$/)
  assert.equal(run.head_sha, expected.headSha); assert.equal(run.status, 'completed'); assert.equal(run.conclusion, 'success')
  assert.equal(jobs.length, 9); assert.equal(new Set(jobs.map(j => j.id)).size, 9)
  const spell = jobs.filter(job => job.name === SPELL_VISUAL_JOB[1])
  assert.equal(spell.length, 1, 'Missing/duplicate spell-visuals job')
  validateSplitBrowserJobs(jobs.filter(job => job !== spell[0]), run)
  for (const job of jobs) assert.equal(job.head_sha, expected.headSha, `Wrong job head: ${job.name}`)
  const job = spell[0]
  assert.equal(job.run_id, run.id); assert.equal(job.run_attempt, run.run_attempt)
  assert.equal(job.status, 'completed'); assert.equal(job.conclusion, 'success')
  for (const name of ['Require a ready pull request', 'Check out exact proposed merge', 'Set up Node',
    'Install locked dependencies and verify supported Chrome', 'Record exact tested source', SPELL_VISUAL_JOB[3],
    'Reject tracked input mutation', 'Retain bounded validation receipts and screenshots']) {
    const steps = job.steps?.filter(step => step.name === name)
    assert.equal(steps?.length, 1); assert.equal(steps[0].conclusion, 'success')
  }
  return true
}
export function spellVisualReceiptLog(receipt) {
  const json = JSON.stringify(receipt)
  assert.ok(Buffer.byteLength(json) <= 24000, 'Spell visuals receipt exceeds log bound')
  return `PND_SPELL_VISUALS_RECEIPT=${Buffer.from(json).toString('base64')}\nPND_SPELL_VISUALS_SHA256=${hash(json)}`
}
export function readSpellVisualReceiptLog(log) {
  const lines = log.split('\n').map(line => line.replace(/^\d{4}-\d\d-\d\dT\S+\s+/, '')).filter(line => line.startsWith('PND_SPELL_VISUALS_'))
  assert.equal(lines.length, 2); assert.match(lines[0], /^PND_SPELL_VISUALS_RECEIPT=[A-Za-z0-9+/=]+$/)
  assert.match(lines[1], /^PND_SPELL_VISUALS_SHA256=[a-f0-9]{64}$/)
  const encoded = lines[0].slice('PND_SPELL_VISUALS_RECEIPT='.length), bytes = Buffer.from(encoded, 'base64')
  assert.ok(bytes.length <= 24000); assert.equal(bytes.toString('base64'), encoded)
  assert.equal(hash(bytes), lines[1].slice('PND_SPELL_VISUALS_SHA256='.length))
  return JSON.parse(bytes.toString('utf8'))
}
export async function validateSpellVisualReceipt(receipt, expected) {
  assert.equal(expected?.policy, SPELL_VISUAL_POLICY, 'Explicit trusted nine-job policy required')
  assert.equal(receipt.version, 1); assert.equal(receipt.kind, 'spell-visuals-browser'); assert.equal(receipt.status, 'passed')
  assert.deepEqual(receipt.identity, expected.identity)
  assert.deepEqual(Object.keys(receipt.inputs), SPELL_VISUAL_INPUTS); assert.deepEqual(receipt.inputs, expected.inputs)
  for (const value of Object.values(receipt.inputs)) sha(value)
  assert.ok(expected.files && typeof expected.files === 'object', 'Verified exact-attempt artifact files are required')
  assert.ok(Object.keys(expected.files).length <= 50)
  assert.ok(Object.values(expected.files).every(Buffer.isBuffer))
  assert.ok(Object.values(expected.files).reduce((sum, bytes) => sum + bytes.length, 0) <= 96 * 1024 * 1024)
  const read = name => { const bytes = expected.files[name]; assert.ok(Buffer.isBuffer(bytes), `Missing artifact ${name}`); assert.ok(bytes.length <= 32 * 1024 * 1024); return bytes }
  assert.ok(Buffer.isBuffer(expected.originalAngel), 'Pinned original-angel JSON bytes are required, never candidate code')
  assert.equal(hash(expected.originalAngel), expected.inputs['app/original-angel.json'])
  const originalAngel = JSON.parse(expected.originalAngel)
  const raw = JSON.parse(read('receipt.json')), angel = JSON.parse(read('angel-visuals.json')), shield = JSON.parse(read('shield-visuals.json'))
  assert.equal(raw.status, 'passed'); assert.equal(raw.selectedScenario, 'spell-visuals')
  assert.equal(raw.source.commit, expected.identity.mergeSha); assert.equal(raw.buildRevision, expected.identity.mergeSha)
  for (const [name, digest] of Object.entries(expected.inputs)) assert.equal(raw.source.files[name], digest)
  assert.deepEqual(raw.github, receipt.github)
  assert.equal(raw.github.head, expected.identity.headSha); assert.equal(raw.github.base, expected.identity.baseSha)
  assert.equal(raw.github.merge, expected.identity.mergeSha); assert.equal(String(raw.github.runId), String(expected.identity.runId))
  assert.equal(String(raw.github.runAttempt), String(expected.identity.runAttempt))
  assert.equal(raw.build.exitCode, 0); assert.equal(raw.build.signal, null); assert.equal(raw.build.timedOut, false); assert.equal(raw.build.capMs, 120000)
  assert.equal(raw.browserCapMs, 180000); assert.ok(!raw.browserTimedOut)
  assert.equal(raw.sourceAfter, 'identical'); assert.equal(raw.cleanupVerified, true)
  assert.deepEqual(raw.errors, []); assert.deepEqual(raw.dependencyChanges, [])
  sha(raw.dependenciesBeforeSha256); assert.equal(raw.dependenciesBeforeSha256, raw.dependenciesAfterSha256)
  assert.equal(raw.browserPath, '/opt/google/chrome/chrome')
  assert.deepEqual(raw.launch, { channel: 'chrome', headless: true, chromiumSandbox: true, ignoreDefaultArgs: true,
    args: ['--headless', '--remote-debugging-pipe'], timeout: 30000 })
  assert.deepEqual(raw.spellVisualEpisodeSha256, { angel: expected.inputs['scripts/tutorial-browser/angel-visuals.mjs'], shield: expected.inputs['scripts/tutorial-browser/shield-visuals.mjs'] })
  assert.deepEqual(raw.spellVisuals?.episodes, ['angel', 'shield']); assert.deepEqual(raw.spellVisuals?.angel, angel)
  assert.deepEqual(raw.spellVisuals?.shield, shield)
  assert.ok(Number.isFinite(raw.browserDeadlineAt) && raw.browserDeadlineAt > 0)
  assert.equal(angel.budget.outerDeadlineAt, raw.browserDeadlineAt)
  assert.equal(shield.budget.runnerDeadlineAt, raw.browserDeadlineAt)
  await validateShieldReceipt(shield, read, expected)
  assert.equal(angel.schema, 'populous-new-dawn/angel-visuals'); assert.equal(angel.schemaVersion, 1)
  assert.equal(angel.status, 'passed'); assert.equal(angel.sourceCommit, expected.identity.mergeSha)
  assert.equal(angel.expectedRevision, expected.identity.mergeSha)
  assert.equal(angel.presentation.testedCommit, expected.identity.mergeSha)
  assert.deepEqual(angel.presentation.contextual, ['angel-paused-context.png', 'angel-loop-context.png', 'angel-death-context.png'])
  assert.deepEqual(Object.keys(angel.source), SPELL_VISUAL_INPUTS.slice(12, 34))
  for (const [name, digest] of Object.entries(angel.source)) assert.equal(digest, expected.inputs[name])
  assert.equal(angel.admission, 'admitted'); assert.ok(Number.isFinite(angel.budget.remainingAtAdmissionMs) && angel.budget.remainingAtAdmissionMs >= 60000 && angel.budget.remainingAtAdmissionMs <= 180000)
  assert.equal(angel.budget.episode, 50000); assert.equal(angel.budget.admission, 60000); assert.equal(angel.budget.outerReserve, 10000)
  assert.ok(Number.isFinite(angel.elapsedMs) && angel.elapsedMs >= 0 && angel.elapsedMs < 50000); assert.ok(!angel.timedOut && !angel.cleanupFailure)
  assert.equal(angel.contextClosed, true); assert.equal(angel.contextCreationPending, false); assert.equal(angel.cleanupPending, false)
  assert.deepEqual(angel.errors, []); assert.equal(angel.fixture.version, 4); assert.equal(angel.publicSave.version, 4)
  assert.equal(angel.fixture.sourceCommit, expected.identity.mergeSha)
  assert.equal(angel.setupCommittedReadback, true); assert.equal(angel.setupLoadBoundaryMatched, true); assert.equal(angel.publicLoad.fullBoundaryMatched, true)
  assert.deepEqual(angel.pausedBefore, angel.pausedAfter); assert.deepEqual(angel.publicSave.state, angel.pausedBefore)
  assert.deepEqual(angel.publicLoad.state, angel.publicSave.state)
  assert.equal(hash(read('angel-supplied-checkpoint.json')), angel.fixture.transferSha256)
  assert.equal(hash(read('angel-supplied-expected.json')), angel.fixture.expectedSha256)
  assert.deepEqual(JSON.parse(read('angel-fixture-source.json')), angel.fixture)
  assert.equal(hash(read('angel-public-save.json')), angel.publicSave.sha256)
  assert.equal(hash(read('angel-public-load-boundary.json')), angel.publicLoad.sha256)
  const stateOf = world => ({ turn: world.turn, time: world.time, pendingTime: world.pendingTime,
    randomState: world.randomState, cosmeticRandom: world.cosmeticRandom,
    angels: world.effects.filter(f => f.angel).map(f => ({ id: f.id, team: f.team, x: f.x, z: f.z, height: f.height, angel: f.angel })) })
  const supplied = checkpointCodec(JSON.parse(read('angel-supplied-checkpoint.json')), true)
  const saved = checkpointCodec(JSON.parse(read('angel-public-save.json')), true)
  const loaded = checkpointCodec(JSON.parse(read('angel-public-load-boundary.json')), true)
  assert.equal(supplied.version, 4); assert.equal(saved.version, 4)
  assert.deepEqual(stateOf(supplied.world), angel.fixture.state)
  assert.deepEqual(stateOf(saved.world), angel.publicSave.state); assert.deepEqual(stateOf(loaded), angel.publicLoad.state)
  await validateAngelPng(read('angel-paused-context.png'), 1440, 1000, false)
  for (const frame of angel.running.contextFrames) {
    const png = await validateAngelPng(read(frame.filename), frame.clip.width, frame.clip.height)
    assert.equal(hash(read(frame.filename)), frame.sha256)
    assert.equal(png.opaqueColors, frame.opaqueColors); assert.equal(png.pixelChecksum, frame.pixelChecksum)
  }
  const crops = []
  for (const segment of ['paused', 'running']) {
    const observation = angel[segment]
    validateAngelResourceObservation(observation, angel.fixture, segment, originalAngel)
    assert.equal(observation.segment, segment); assert.equal(observation.error, null); assert.equal(observation.done, true)
    assert.equal(observation.retention.done, true); assert.ok(observation.crops.length >= 4 && observation.crops.length <= 20)
    for (const crop of observation.crops) {
      assert.match(crop.filename, new RegExp(`^angel-${segment}-[0-9]+\\.png$`)); assert.equal(hash(read(crop.filename)), crop.sha256)
      const png = await validateAngelPng(read(crop.filename), crop.clip.width, crop.clip.height)
      assert.equal(png.opaqueColors, crop.opaqueColors); assert.equal(png.pixelChecksum, crop.pixelChecksum)
      assert.ok(crop.opaqueColors > 3); assert.equal(crop.canvasOwned, true); assert.deepEqual(crop.overlays, [])
      crops.push(crop.filename)
    }
  }
  assert.equal(angel.running.worldReplaced, true)
  assert.deepEqual(angel.running.cleanup.disposed, { geometry: 8, material: 8, texture: 0 })
  for (const key of ['effectsRemoved', 'groupsRemoved', 'allOwnedDetached', 'neighbourSubmitted', 'neighbourAtlasUnchanged']) assert.equal(angel.running.cleanup[key], true)
  const names = [...SPELL_VISUAL_FILES, ...crops]
  assert.equal(new Set(names).size, names.length)
  assert.deepEqual(Object.keys(expected.files).filter(name => name !== 'build.log').sort(), [...names].sort())
  assert.deepEqual(Object.keys(receipt.artifacts), names)
  for (const name of names) assert.equal(hash(read(name)), receipt.artifacts[name], `Artifact hash mismatch ${name}`)
  assert.equal(receipt.visualReview, 'required', 'Automated contract must not claim pixel/native-framebuffer acceptance')
  return true
}

// Artifact transport is separate from nine-job selection. Callers must bind the
// numeric artifact ID/name/size/digest to this exact job's upload log and API
// metadata before passing bytes; no candidate URL is followed here.
export async function resolveSpellVisualArtifact(archive, upload, receipt, expected) {
  assert.match(expected.identity.mergeSha, /^[a-f0-9]{40}$/)
  assert.equal(upload.name, `spell-visuals-browser-${expected.identity.mergeSha}`)
  assert.ok(Number.isSafeInteger(upload.id) && upload.id > 0)
  assert.equal(archive.length, upload.bytes); assert.ok(archive.length <= 48 * 1024 * 1024)
  assert.equal(hash(archive), upload.sha256)
  const { readArtifactZip } = await import('../artifact-zip.mjs')
  const allowed = new Set([...Object.keys(receipt.artifacts), 'build.log'])
  assert.ok(allowed.size <= 50)
  const files = Object.fromEntries(readArtifactZip(archive, { maxArchiveBytes: 48 * 1024 * 1024,
    maxFileBytes: 32 * 1024 * 1024, maxTotalBytes: 96 * 1024 * 1024, maxEntries: 50,
    allowName: name => allowed.has(name) }))
  await validateSpellVisualReceipt(receipt, { ...expected, files })
  return { files, angel: JSON.parse(files['angel-visuals.json']), shield: JSON.parse(files['shield-visuals.json']), visualReview: 'required' }
}
