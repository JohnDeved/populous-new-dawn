import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { matchesGlob, resolve } from 'node:path'
import yaml from 'js-yaml'
import { mission10ArtifactManifest, mission10ExpectedArtifacts, mission10RetainedName,
  retainMission10Artifacts, readMission10ArtifactManifest } from '../scripts/tutorial-browser/mission10-artifacts.mjs'
import { mission10ProfileReceipt } from '../scripts/tutorial-browser/mission10-profile-receipt.mjs'
import { writeMission10Fixture } from './support/mission10-profile-receipt.mjs'

const report = { status: 'passed', sourceCommit: '1'.repeat(40), sourceFingerprint: 'a'.repeat(64) }
const workflow = yaml.load(readFileSync(new URL('../.github/workflows/tutorial-browser.yml', import.meta.url), 'utf8'))
const upload = workflow.jobs['tutorial-browser'].steps.find(step => step.name === 'Retain bounded validation receipts and screenshots')
const globs = upload.with.path.trim().split(/\s+/)
const retained = name => globs.some(glob => matchesGlob(`outputs/tutorial-browser/${name}`, glob))
const hash = path => createHash('sha256').update(readFileSync(path)).digest('hex')
function fixture(run, complete = true) {
  const output = mkdtempSync(resolve(tmpdir(), 'm10-retention-'))
  try {
    if (complete) for (const [mode, names] of Object.entries(mission10ExpectedArtifacts)) {
      mkdirSync(resolve(output, `mission10-${mode}`))
      for (const name of names) writeFileSync(resolve(output, `mission10-${mode}`, name), `${mode}:${name}\n`)
    }
    return run(output)
  } finally { rmSync(output, { recursive: true, force: true }) }
}

test('all generated M10 raw artifacts and manifest match actual unchanged workflow globs byte-for-byte', () => fixture(output => {
  const manifest = retainMission10Artifacts(output, report)
  assert.equal(manifest.status, 'passed'); assert.equal(manifest.complete, true)
  assert.equal(manifest.files.length, 12)
  assert.equal(retained(mission10ArtifactManifest), true)
  assert.deepEqual(globs, ['outputs/tutorial-browser/*.json', 'outputs/tutorial-browser/*.log', 'outputs/tutorial-browser/*.png', 'outputs/tutorial-browser/snapshot-*/*.json'])
  for (const entry of manifest.files) {
    assert.equal(retained(entry.source.path), false, 'Nested originals are not uploaded by current workflow')
    assert.equal(retained(entry.retained.path), true, 'Every advertised copy must be uploaded')
    assert.equal(entry.source.sha256, hash(resolve(output, entry.source.path)))
    assert.equal(entry.retained.sha256, hash(resolve(output, entry.retained.path)))
    assert.equal(entry.source.bytes, readFileSync(resolve(output, entry.source.path)).length)
    assert.deepEqual(readFileSync(resolve(output, entry.source.path)), readFileSync(resolve(output, entry.retained.path)))
  }
  const actual = readMission10ArtifactManifest(output, report)
  assert.equal(actual.sha256, hash(resolve(output, mission10ArtifactManifest)))
  assert.equal(actual.bytes, readFileSync(resolve(output, mission10ArtifactManifest)).length)
}))

test('incomplete failure preserves every available report, log and screenshot with truthful status and excludes private browser data', () => fixture(output => {
  mkdirSync(resolve(output, 'mission10-created'))
  for (const name of ['receipt.json', 'boat-checkpoint.json', 'failure.log', 'failure.png'])
    writeFileSync(resolve(output, 'mission10-created', name), `failure:${name}`)
  mkdirSync(resolve(output, 'private-profile')); writeFileSync(resolve(output, 'private-profile', 'cookies.json'), 'private sentinel')
  const manifest = retainMission10Artifacts(output, { ...report, status: 'failed' })
  assert.equal(manifest.status, 'failed'); assert.equal(manifest.complete, false)
  assert.equal(manifest.files.length, 4); assert.ok(manifest.missingExpected.length > 0)
  assert.ok(manifest.files.every(entry => retained(entry.retained.path)))
  assert.ok(manifest.files.every(entry => !entry.source.path.includes('private-profile')))
  assert.equal(readdirSync(output).filter(name => name.includes('cookies')).length, 0)
  assert.equal(readFileSync(resolve(output, 'private-profile/cookies.json'), 'utf8'), 'private sentinel')
  assert.throws(() => readMission10ArtifactManifest(output, report), /passed/)
}, false))

test('success cannot silently omit any expected report or screenshot; available diagnostics still retained', () => fixture(output => {
  rmSync(resolve(output, 'mission10-reused', 'loaded-class-selected.png'))
  assert.throws(() => retainMission10Artifacts(output, report), /retention failed/)
  const manifest = JSON.parse(readFileSync(resolve(output, mission10ArtifactManifest)))
  assert.equal(manifest.status, 'failed'); assert.equal(manifest.complete, false)
  assert.deepEqual(manifest.missingExpected, ['mission10-reused/loaded-class-selected.png'])
  assert.equal(manifest.files.length, 11)
  assert.equal(existsSync(resolve(output, 'mission10-created--receipt.json')), true)
}))

test('exclusive copies reject collisions and never overwrite earlier artifacts or manifest', () => fixture(output => {
  const target = resolve(output, mission10RetainedName('created', 'receipt.json'))
  writeFileSync(target, 'earlier evidence')
  assert.throws(() => retainMission10Artifacts(output, report), /retention failed/)
  assert.equal(readFileSync(target, 'utf8'), 'earlier evidence')
  const before = readFileSync(resolve(output, mission10ArtifactManifest))
  assert.throws(() => retainMission10Artifacts(output, report), /EEXIST/)
  assert.deepEqual(readFileSync(resolve(output, mission10ArtifactManifest)), before)
}))

test('symlinked phase/files and nested browser directories cannot leak into retained artifacts', () => {
  for (const attack of ['phase', 'file', 'directory']) fixture(output => {
    const privateDir = resolve(output, 'private-profile'); mkdirSync(privateDir)
    writeFileSync(resolve(privateDir, 'cookies.json'), 'private sentinel')
    if (attack === 'phase') {
      rmSync(resolve(output, 'mission10-created'), { recursive: true })
      symlinkSync(privateDir, resolve(output, 'mission10-created'))
    } else if (attack === 'file') symlinkSync(resolve(privateDir, 'cookies.json'), resolve(output, 'mission10-created', 'secret.json'))
    else mkdirSync(resolve(output, 'mission10-created', 'browser'))
    assert.throws(() => retainMission10Artifacts(output, report), /retention failed/)
    assert.equal(existsSync(resolve(output, 'mission10-created--cookies.json')), false)
    assert.equal(existsSync(resolve(output, 'mission10-created--secret.json')), false)
    assert.equal(existsSync(resolve(output, 'mission10-created--browser')), false)
  })
})

test('manifest verification rejects source, retained bytes, inventory and source-identity drift', () => {
  for (const mutate of [
    output => writeFileSync(resolve(output, 'mission10-created/receipt.json'), 'changed source'),
    output => writeFileSync(resolve(output, 'mission10-created--receipt.json'), 'changed retained'),
    output => rmSync(resolve(output, 'mission10-reused--loaded-class-selected.png')),
    output => {
      const path = resolve(output, mission10ArtifactManifest), m = JSON.parse(readFileSync(path)); m.files.pop(); writeFileSync(path, JSON.stringify(m))
    },
    output => {
      const path = resolve(output, mission10ArtifactManifest), m = JSON.parse(readFileSync(path)); m.sourceCommit = '2'.repeat(40); writeFileSync(path, JSON.stringify(m))
    },
  ]) fixture(output => {
    retainMission10Artifacts(output, report); mutate(output)
    assert.throws(() => readMission10ArtifactManifest(output, report))
  })
})

test('compact receipt report paths/screenshots bind the copies actually retained by the workflow', () => fixture(output => {
  const receipt = { source: { commit: report.sourceCommit }, node: process.version, launch: {}, buildPackageVersions: {}, browserVersion: 'test', browserSha256: 'b'.repeat(64) }
  receipt.mission10Profile = writeMission10Fixture(output, receipt)
  const compact = mission10ProfileReceipt(receipt, output)
  assert.equal(retained(compact.artifacts.path), true)
  for (const phase of compact.phases) {
    assert.equal(retained(phase.receiptName), true); assert.equal(retained(phase.resultName), true)
    assert.equal(hash(resolve(output, phase.receiptName)), phase.receiptSha256)
    assert.equal(hash(resolve(output, phase.resultName)), phase.resultSha256)
    for (const shot of phase.screenshots) { assert.equal(retained(shot.name), true); assert.equal(hash(resolve(output, shot.name)), shot.sha256) }
  }
}, false))


test('retention executes on failure as well as success and required screenshots match the actual M10 route', () => {
  const adapter = readFileSync(new URL('../scripts/tutorial-browser/mission10-profile.mjs', import.meta.url), 'utf8')
  assert.match(adapter, /finally \{ retainMission10Artifacts\(output, report\) \}/)
  const scenario = readFileSync(new URL('../scripts/local-render/mission10-boat-checkpoint.mjs', import.meta.url), 'utf8')
  const captures = [...scenario.matchAll(/capture\('([^']+)'\)/g)].map(match => match[1] + '.png').sort()
  const expected = Object.values(mission10ExpectedArtifacts).flat().filter(name => name.endsWith('.png')).sort()
  assert.deepEqual(captures, expected)
})
