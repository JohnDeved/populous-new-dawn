import { resolveProfileArtifact, profileArchiveLimit } from '../scripts/integration-queue/profile-artifact.mjs'
import { artifactZip } from './support/artifact-zip.mjs'
import { decodeMission10Query, encodeMission10Query, mission10ExpectedSelection, mission10Controls, mission10Modifiers } from '../scripts/local-render/mission10-selection.mjs'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync, readdirSync, statSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { writeMission10Fixture } from './support/mission10-profile-receipt.mjs'
import { PROFILE_INPUTS, PROFILE_CASES, PROFILE_SCREENSHOTS, validateProfileRecovery, validateMission10Profile } from '../scripts/integration-queue/profile-recovery.mjs'
import {
  profileRecoveryReceipt,
  profileRecoveryReceiptLog,
} from '../scripts/tutorial-browser/profile-recovery-receipt.mjs'

function resolveEvidence(output, envelope, { wide = false, diagnostic = () => {} } = {}) {
  const files = readdirSync(output).filter(name => statSync(join(output, name)).isFile()).map(name => [name, readFileSync(join(output, name))])
  // The hosted upload uses method8 DEFLATE, not the STORE-only test transport.
  // Keep the complete wide raw roster/aliases and all unchanged inflated caps.
  const total = files.reduce((sum, [, bytes]) => sum + bytes.length, 0)
  assert.ok(files.every(([, bytes]) => bytes.length <= 32 * 1024 * 1024))
  assert.ok(total <= 128 * 1024 * 1024)
  const archive = artifactZip(files, { compress: true })
  if (wide) {
    const stored = artifactZip(files)
    assert.ok(stored.length > profileArchiveLimit, 'Wide fixture must retain the oversized STORE regression')
    assert.throws(() => resolveProfileArtifact(stored,
      { bytes: stored.length, sha256: createHash('sha256').update(stored).digest('hex') }, envelope), /archive size/)
    diagnostic(`Full wide roster: ${files.length} files, ${total} raw bytes, max file ${Math.max(...files.map(([, bytes]) => bytes.length))}, STORE ${stored.length} rejected, DEFLATE ${archive.length} bytes`)
  }
  return resolveProfileArtifact(archive, { bytes: archive.length, sha256: createHash('sha256').update(archive).digest('hex') }, envelope)
}

test('profile producer binds actual screenshots, cases, runtime and raw receipt', () => {
  const output = mkdtempSync(join(tmpdir(), 'profile-receipt-'))
  try {
    // Write terminal host receipt after its M10 companion is present.
    writeFileSync(join(output, 'malformed-profile-selector.png'), 'pixel bytes')
    const receipt = {
      status: 'passed',
      selectedScenario: 'profile-recovery',
      source: { commit: '1'.repeat(40), files: {} },
      browserSha256: 'a'.repeat(64), browserVersion: 'Chrome', node: process.version, launch: {}, buildPackageVersions: {},
      build: { exitCode: 0, signal: null, timedOut: false, capMs: 120000 },
      browserCapMs: 180000,
      profileRecovery: {
        status: 'passed',
        runtime: { input: 'same' },
        runtimeAfter: { input: 'same' },
        cases: [
          { kind: 'empty', fixture: true, status: 'passed', diagnostic: 'not in compact envelope' },
        ],
        screenshots: [{ name: 'malformed-profile-selector.png', viewport: { width: 123, height: 456 }, dpr: 2 }],
      },
    }
    receipt.mission10Profile = writeMission10Fixture(output, receipt)
    const env = { GITHUB_REPOSITORY: 'JohnDeved/populous-new-dawn', GITHUB_RUN_ID: '100', GITHUB_RUN_ATTEMPT: '2', PR_HEAD_SHA: '2'.repeat(40), PR_BASE_SHA: '3'.repeat(40) }
    receipt.github = { head: env.PR_HEAD_SHA, base: env.PR_BASE_SHA, merge: receipt.source.commit, runId: env.GITHUB_RUN_ID, runAttempt: env.GITHUB_RUN_ATTEMPT }
    writeFileSync(join(output, 'receipt.json'), JSON.stringify(receipt))
    writeFileSync(join(output, 'profile-recovery.json'), JSON.stringify(receipt.profileRecovery))
    const envelope = profileRecoveryReceipt(receipt, output, env)
    assert.equal(validateMission10Profile(envelope.mission10, receipt.source.commit, resolveEvidence(output, envelope)), true)
    assert.equal(envelope.runtimeUnchanged, true)
    assert.deepEqual(envelope.build, receipt.build)
    assert.equal(envelope.browserTimedOut, false)
    assert.equal(envelope.browserCapMs, 180000)
    assert.deepEqual(envelope.cases, [{ kind: 'empty', status: 'passed', fixture: true }])
    assert.deepEqual(envelope.screenshots[0].viewport, { width: 123, height: 456 })
    assert.equal(envelope.screenshots[0].dpr, 2)
    assert.equal(envelope.receiptSha256, createHash('sha256').update(JSON.stringify(receipt)).digest('hex'))
    assert.match(profileRecoveryReceiptLog(envelope), /^PND_PROFILE_RECOVERY_RECEIPT=/)
    receipt.profileRecovery.runtimeAfter.input = 'changed'
    assert.equal(profileRecoveryReceipt(receipt, output, {}).runtimeUnchanged, false)
    receipt.profileRecovery.screenshots[0].name = 'missing.png'
    assert.throws(() => profileRecoveryReceipt(receipt, output, {}), /ENOENT/)
    receipt.profileRecovery.status = 'failed'
    assert.throws(() => profileRecoveryReceipt(receipt, output, {}), /Successful profile/)
    assert.throws(() => profileRecoveryReceiptLog({ oversized: 'x'.repeat(12000) }), /bound/)
  } finally {
    rmSync(output, { recursive: true, force: true })
  }
})


test('complete producer, trusted tuple decoder and serializer retain ordinary and upper-width numeric facts under 12KB', t => {
  const variants = [
    { name: 'ordinary', hp: 100, turn: 100, time: 4, id: '19500366987', attempt: '12', pr: '647', pid: 4096 },
    { name: 'wide live roster', count: 320, hp: 100, turn: 100, time: 4, id: '19500366987', attempt: '12', pr: '647', pid: 4096 },
    { name: 'maximum', hp: Number.MAX_VALUE, turn: Number.MAX_VALUE, time: Number.MAX_VALUE,
      id: '18446744073709551615', attempt: '18446744073709551615', pr: '18446744073709551615', pid: Number.MAX_SAFE_INTEGER },
    { name: 'wide fixed-point', hp: 0.0000010000000000000002, turn: Number.MAX_VALUE, time: -0.0000010000000000000002,
      id: '18446744073709551615', attempt: '18446744073709551615', pr: '18446744073709551615', pid: Number.MAX_SAFE_INTEGER },
  ]
  for (const numeric of variants) {
    const output = mkdtempSync(join(tmpdir(), 'profile-envelope-'))
    try {
      const h = 'a'.repeat(64), mergeSha = '1'.repeat(40)
      const inputs = Object.fromEntries(PROFILE_INPUTS.map(path => [path,
        createHash('sha256').update(readFileSync(new URL(`../${path}`, import.meta.url))).digest('hex')]))
      assert.ok(PROFILE_INPUTS.includes('scripts/tutorial-browser/mission10-artifacts.mjs'))
      const receipt = { status: 'passed', selectedScenario: 'profile-recovery', source: { commit: mergeSha, files: inputs },
        browserSha256: h, browserVersion: '147.0.7699.0', browserPath: '/opt/google/chrome/chrome', node: process.version,
        launch: { channel: 'chrome', headless: true, chromiumSandbox: true, ignoreDefaultArgs: true,
          args: ['--headless', '--remote-debugging-pipe'], timeout: 30000 }, buildPackageVersions: {},
        build: { pid: numeric.pid, exitCode: 0, signal: null, timedOut: false, capMs: 120000 }, browserCapMs: 180000,
        sourceAfter: 'identical', cleanupVerified: true, errors: [], dependencyChanges: [],
        dependenciesBeforeSha256: h, dependenciesAfterSha256: h,
        profileRecovery: { status: 'passed', runtime: { fixture: true }, runtimeAfter: { fixture: true },
          cases: PROFILE_CASES.map(([kind, status, fixture]) => ({ kind, status, fixture })),
          screenshots: PROFILE_SCREENSHOTS.map(([name, width, height, dpr]) => ({ name, viewport: { width, height }, dpr })) } }
      for (const shot of receipt.profileRecovery.screenshots) writeFileSync(join(output, shot.name), 'synthetic pixel bytes')
      receipt.mission10Profile = writeMission10Fixture(output, receipt, value => {
        for (const phase of value.phases) {
          for (const checkpoint of [phase.saved, phase.loaded].filter(Array.isArray)) { checkpoint[2] = numeric.turn; checkpoint[3] = numeric.time }
          for (const row of phase.selection) {
            for (const occupant of row.occupants) occupant[1] = numeric.hp
            if (numeric.count) {
              const q = decodeMission10Query(row.query)
              for (let i = 0; i < numeric.count; i++) q.people.push([1000 + i, 2, 2000 + i, 256, 0, 0, 0])
              row.query = encodeMission10Query(q)
              for (const c of row.checks) c[3] = mission10ExpectedSelection(q, mission10Controls[c[0]], mission10Modifiers[c[1]]).selected
            }
            if (numeric.name !== 'ordinary') {
              const query = decodeMission10Query(row.query)
              // Widest accepted native camera representation, same relative
              // offsets/roster order so the full control obligations still hold.
              query.point = [-32768, -32768]
              for (const p of query.people) { p[2] = (p[2] + 32768) & 65535; p[3] = (p[3] + 32768) & 65535 }
              row.query = encodeMission10Query(query)
              for (const check of row.checks) check[3] = mission10ExpectedSelection(query, mission10Controls[check[0]], mission10Modifiers[check[1]]).selected
            }
          }
        }
      })
      const env = { GITHUB_REPOSITORY: 'JohnDeved/populous-new-dawn', GITHUB_RUN_ID: numeric.id, GITHUB_RUN_ATTEMPT: numeric.attempt,
        GITHUB_WORKFLOW_REF: `JohnDeved/populous-new-dawn/.github/workflows/tutorial-browser.yml@refs/pull/${numeric.pr}/merge`,
        PR_HEAD_SHA: '2'.repeat(40), PR_BASE_SHA: '3'.repeat(40) }
      receipt.github = { head: env.PR_HEAD_SHA, base: env.PR_BASE_SHA, merge: receipt.source.commit, runId: env.GITHUB_RUN_ID, runAttempt: env.GITHUB_RUN_ATTEMPT }
      writeFileSync(join(output, 'receipt.json'), JSON.stringify(receipt))
      writeFileSync(join(output, 'profile-recovery.json'), JSON.stringify(receipt.profileRecovery))
      const envelope = profileRecoveryReceipt(receipt, output, env)
      assert.equal(validateProfileRecovery(envelope, { identity: envelope.identity, inputs, mission10Evidence: resolveEvidence(output, envelope, { wide: !!numeric.count, diagnostic: message => t.diagnostic(message) }) }), true)
      for (const phase of envelope.mission10.phases) {
        assert.equal(phase.binding.length, 8)
        for (const checkpoint of [phase.saved, phase.loaded].filter(Array.isArray)) {
          assert.equal(checkpoint.length, 8); assert.equal(checkpoint[2], numeric.turn); assert.equal(checkpoint[3], numeric.time)
        }
        assert.equal(phase.selection, 0)
        const raw = JSON.parse(readFileSync(join(output, phase.receiptName)))
        const saved = phase.mode === 'created' ? raw.result.saved.checkpoint : raw.result.saved
        assert.equal(saved.turn, numeric.turn); assert.equal(saved.time, numeric.time)
        for (const row of raw.result.selection) for (const occupant of row.occupants) assert.equal(occupant.hp, numeric.hp)
      }
      const bytes = Buffer.byteLength(JSON.stringify(envelope))
      assert.ok(bytes <= 12000)
      assert.match(profileRecoveryReceiptLog(envelope), /^PND_PROFILE_RECOVERY_RECEIPT=/)
      t.diagnostic(`Synthetic ${numeric.name} envelope: ${bytes} bytes; ${PROFILE_INPUTS.length} source-bound inputs. Not rendered evidence.`)
      const wrongManifest = structuredClone(envelope)
      wrongManifest.mission10.artifacts.bytes = Number.MAX_SAFE_INTEGER
      assert.throws(() => resolveEvidence(output, wrongManifest))
    } finally { rmSync(output, { recursive: true, force: true }) }
  }
})
