import { decodeMission10Query, encodeMission10Query, mission10ExpectedSelection, mission10Controls, mission10Modifiers } from '../scripts/local-render/mission10-selection.mjs'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { writeMission10Fixture } from './support/mission10-profile-receipt.mjs'
import { PROFILE_INPUTS, PROFILE_CASES, PROFILE_SCREENSHOTS, validateProfileRecovery, validateMission10Profile } from '../scripts/integration-queue/profile-recovery.mjs'
import {
  profileRecoveryReceipt,
  profileRecoveryReceiptLog,
} from '../scripts/tutorial-browser/profile-recovery-receipt.mjs'

test('profile producer binds actual screenshots, cases, runtime and raw receipt', () => {
  const output = mkdtempSync(join(tmpdir(), 'profile-receipt-'))
  try {
    writeFileSync(join(output, 'receipt.json'), 'raw evidence')
    writeFileSync(join(output, 'observed.png'), 'pixel bytes')
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
        screenshots: [{ name: 'observed.png', viewport: { width: 123, height: 456 }, dpr: 2 }],
      },
    }
    receipt.mission10Profile = writeMission10Fixture(output, receipt)
    const envelope = profileRecoveryReceipt(receipt, output, {})
    assert.equal(validateMission10Profile(envelope.mission10, receipt.source.commit), true)
    assert.equal(envelope.runtimeUnchanged, true)
    assert.deepEqual(envelope.build, receipt.build)
    assert.equal(envelope.browserTimedOut, false)
    assert.equal(envelope.browserCapMs, 180000)
    assert.deepEqual(envelope.cases, [{ kind: 'empty', status: 'passed', fixture: true }])
    assert.deepEqual(envelope.screenshots[0].viewport, { width: 123, height: 456 })
    assert.equal(envelope.screenshots[0].dpr, 2)
    assert.equal(envelope.receiptSha256, createHash('sha256').update('raw evidence').digest('hex'))
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
      writeFileSync(join(output, 'receipt.json'), JSON.stringify(receipt))
      const env = { GITHUB_REPOSITORY: 'JohnDeved/populous-new-dawn', GITHUB_RUN_ID: numeric.id, GITHUB_RUN_ATTEMPT: numeric.attempt,
        GITHUB_WORKFLOW_REF: `JohnDeved/populous-new-dawn/.github/workflows/tutorial-browser.yml@refs/pull/${numeric.pr}/merge`,
        PR_HEAD_SHA: '2'.repeat(40), PR_BASE_SHA: '3'.repeat(40) }
      const envelope = profileRecoveryReceipt(receipt, output, env)
      assert.equal(validateProfileRecovery(envelope, { identity: envelope.identity, inputs }), true)
      for (const phase of envelope.mission10.phases) {
        assert.equal(phase.binding.length, 8)
        for (const checkpoint of [phase.saved, phase.loaded].filter(Array.isArray)) {
          assert.equal(checkpoint.length, 8); assert.equal(checkpoint[2], numeric.turn); assert.equal(checkpoint[3], numeric.time)
        }
        for (const row of phase.selection) for (const occupant of row.occupants) assert.equal(occupant[1], numeric.hp)
        const raw = JSON.parse(readFileSync(join(output, phase.receiptName)))
        const saved = phase.mode === 'created' ? raw.result.saved.checkpoint : raw.result.saved
        assert.equal(saved.turn, numeric.turn); assert.equal(saved.time, numeric.time)
        for (const row of raw.result.selection) for (const occupant of row.occupants) assert.equal(occupant.hp, numeric.hp)
      }
      const bytes = Buffer.byteLength(JSON.stringify(envelope))
      assert.ok(bytes <= 12000)
      assert.match(profileRecoveryReceiptLog(envelope), /^PND_PROFILE_RECOVERY_RECEIPT=/)
      t.diagnostic(`Synthetic ${numeric.name} envelope: ${bytes} bytes; ${PROFILE_INPUTS.length} source-bound inputs. Not rendered evidence.`)
      // Admission-size probe only: no enormous artifact is created or claimed.
      // Account for the widest admitted manifest byte count without replacing
      // the actual producer's file identity or its retained raw evidence.
      const widestManifest = structuredClone(envelope)
      widestManifest.mission10.artifacts.bytes = Number.MAX_SAFE_INTEGER
      assert.equal(validateProfileRecovery(widestManifest, { identity: envelope.identity, inputs }), true)
      assert.match(profileRecoveryReceiptLog(widestManifest), /^PND_PROFILE_RECOVERY_RECEIPT=/)
      t.diagnostic(`Synthetic ${numeric.name} plus admitted manifest-byte width: ${Buffer.byteLength(JSON.stringify(widestManifest))} bytes.`)
    } finally { rmSync(output, { recursive: true, force: true }) }
  }
})
