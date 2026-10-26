// Match the existing workflow's top-level JSON/log/PNG globs without uploading
// the private Chrome profile or changing workflow permissions/retention policy.
import assert from 'node:assert/strict'
import { constants, copyFileSync, lstatSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'

export const mission10ArtifactManifest = 'mission10-artifacts.json'
export const mission10ExpectedArtifacts = Object.freeze({
  created: ['receipt.json', 'boat-checkpoint.json', 'boarded.png', 'boarded-class-selected.png', 'before-public-save.png', 'saved-occupied-boat.png'],
  reused: ['receipt.json', 'boat-checkpoint.json', 'restored-occupied-boat.png', 'loaded-class-selected.png', 'unloaded-alive.png', 'unloaded-class-selected.png'],
})
const validName = /^[a-z0-9][a-z0-9-]*\.(?:json|log|png)$/
export function mission10RetainedName(mode, name) {
  assert.ok(Object.hasOwn(mission10ExpectedArtifacts, mode) && validName.test(name), 'Invalid M10 artifact name')
  return `mission10-${mode}--${name}`
}
function identity(output, name) {
  const path = resolve(output, name), stat = lstatSync(path)
  assert.ok(stat.isFile() && !stat.isSymbolicLink() && stat.nlink === 1, 'M10 artifact must be a regular unlinked file')
  const bytes = readFileSync(path)
  return { path: name, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }
}
function phaseNames(output, mode) {
  const dir = `mission10-${mode}`, stat = lstatSync(resolve(output, dir))
  assert.ok(stat.isDirectory() && !stat.isSymbolicLink(), 'M10 phase output must be a real directory')
  return readdirSync(resolve(output, dir)).sort()
}

// Runs for passed and failed routes, after phase reports are terminal. Exclusive
// writes never replace an earlier artifact. Failures remain explicit in the
// retained manifest; they cannot be mistaken for complete rendered acceptance.
export function retainMission10Artifacts(output, report) {
  const manifest = { version: 1, status: report.status, complete: false,
    sourceCommit: report.sourceCommit, sourceFingerprint: report.sourceFingerprint,
    files: [], missingExpected: [], errors: [] }
  for (const [mode, expected] of Object.entries(mission10ExpectedArtifacts)) {
    let names = []
    try { names = phaseNames(output, mode) }
    catch (error) { if (error.code !== 'ENOENT') manifest.errors.push({ phase: mode, error: String(error) }) }
    manifest.missingExpected.push(...expected.filter(name => !names.includes(name)).map(name => `mission10-${mode}/${name}`))
    for (const name of names) {
      const sourceName = `mission10-${mode}/${name}`
      try {
        const retainedName = mission10RetainedName(mode, name), source = identity(output, sourceName)
        copyFileSync(resolve(output, sourceName), resolve(output, retainedName), constants.COPYFILE_EXCL)
        const retained = identity(output, retainedName)
        assert.equal(retained.bytes, source.bytes); assert.equal(retained.sha256, source.sha256)
        manifest.files.push({ source, retained })
      } catch (error) { manifest.errors.push({ source: sourceName, error: String(error) }) }
    }
  }
  if (report.status === 'passed' && manifest.missingExpected.length)
    manifest.errors.push({ error: 'Successful M10 route is missing expected raw artifacts' })
  if (manifest.errors.length) manifest.status = 'failed'
  manifest.complete = manifest.status === 'passed' && manifest.missingExpected.length === 0
  writeFileSync(resolve(output, mission10ArtifactManifest), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' })
  assert.deepEqual(manifest.errors, [], 'M10 artifact retention failed; inspect the retained manifest')
  return manifest
}

// Verify both locations, inventory, source identity and exact copies before the
// compact acceptance envelope advertises any artifact as retrievable evidence.
export function readMission10ArtifactManifest(output, report) {
  const manifest = JSON.parse(readFileSync(resolve(output, mission10ArtifactManifest)))
  assert.equal(manifest.version, 1); assert.equal(manifest.status, 'passed'); assert.equal(manifest.complete, true)
  assert.equal(manifest.sourceCommit, report.sourceCommit); assert.equal(manifest.sourceFingerprint, report.sourceFingerprint)
  assert.deepEqual(manifest.errors, []); assert.deepEqual(manifest.missingExpected, [])
  const expectedSources = Object.entries(mission10ExpectedArtifacts).flatMap(([mode]) => phaseNames(output, mode).map(name => `mission10-${mode}/${name}`))
  assert.deepEqual(manifest.files.map(file => file.source.path), expectedSources, 'M10 retention inventory differs')
  for (const [mode, expected] of Object.entries(mission10ExpectedArtifacts)) {
    const entries = manifest.files.filter(file => file.source.path.startsWith(`mission10-${mode}/`))
    assert.ok(expected.every(name => entries.some(file => file.source.path === `mission10-${mode}/${name}`)), 'Required M10 raw artifact omitted')
    for (const file of entries) {
      const name = file.source.path.slice(`mission10-${mode}/`.length)
      assert.equal(file.retained.path, mission10RetainedName(mode, name))
      assert.deepEqual(identity(output, file.source.path), file.source)
      assert.deepEqual(identity(output, file.retained.path), file.retained)
      assert.equal(file.source.sha256, file.retained.sha256); assert.equal(file.source.bytes, file.retained.bytes)
    }
  }
  return identity(output, mission10ArtifactManifest)
}
