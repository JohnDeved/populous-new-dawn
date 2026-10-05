import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, lstatSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { validateSegmentPredecessor, campaignActive, requireLoadedCheckpoint, requireContinueBoundary, requireCampaignBudget } from '../../../../qa/campaign-continuity/boundaries.mjs'
const b = 'work/orchestration/campaign-continuity', out = b + '/mission-one-segment-03'
const read = p => JSON.parse(readFileSync(p)), sha = p => createHash('sha256').update(readFileSync(p)).digest('hex')
const packetPath = b + '/mission-one-segment-03-terminal-packet.json', packet = read(packetPath)
const inner = read(out + '/receipt.json'), boundary = read(out + '/segment-boundary.json'), journey = read(out + '/journey.json')
const launcher = read(b + '/mission-one-segment-03.launcher.json'), outer = read(b + '/mission-one-segment-03.outer.json')
for (const f of packet.files) { assert.equal(sha(f.path), f.sha256, f.path); assert.equal(readFileSync(f.path).length, f.bytes, f.path) }
assert.equal(inner.status, 'passed'); assert.equal(outer.status, 'passed'); assert.equal(outer.exitCode, 0); assert.equal(outer.signal, null); assert.equal(launcher.commandExitCode, 0)
assert.equal(launcher.innerReceiptSha256, sha(out + '/receipt.json')); assert.equal(inner.campaignBoundary.sha256, sha(out + '/segment-boundary.json'))
assert.equal(inner.campaignBoundary.path, resolve(out + '/segment-boundary.json')); assert.deepEqual(inner.result, boundary); assert.deepEqual(journey, { status: 'passed', ...boundary })
assert.deepEqual(inner.source, inner.sourceAfter); assert.deepEqual(inner.runtime, inner.runtimeAfter); assert.deepEqual(inner.scenario, inner.scenarioAfter); assert.deepEqual(outer.source, outer.sourceAfter)
for (const n of ['stdout', 'stderr']) { assert.equal(sha(outer.artifacts[n]), outer[n + 'Sha256']); assert.equal(readFileSync(outer.artifacts[n], 'utf8'), outer[n]) }
assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), inner.source.commit); assert.equal(execFileSync('git', ['status', '--short'], { encoding: 'utf8' }), '')
const markerPath = inner.profile.path + '/populous-profile.json', marker = read(markerPath)
assert.equal(marker.id, inner.profile.id); assert.equal(marker.lastRun.receiptSha256, sha(out + '/receipt.json')); assert.equal(marker.lastRun.receiptPath, resolve(out + '/receipt.json'))
assert.equal(marker.lastRun.sourceFingerprint, inner.source.fingerprint); assert.equal(marker.lastRun.checker, inner.profile.inputs.checker)
assert.equal(marker.binding.application, inner.profile.inputs.application); assert.deepEqual(marker.binding.runtime, inner.runtime); assert.equal(marker.binding.origin, inner.profile.origin)
assert.deepEqual(marker.lastRun.checkpointAtEnd, inner.profile.checkpointAtEnd)
const ownershipNames = ['owner.lock', 'browser/SingletonLock', 'browser/SingletonSocket', 'browser/SingletonCookie']
for (const name of ownershipNames) { let absent = false; try { lstatSync(inner.profile.path + '/' + name) } catch (error) { if (error.code === 'ENOENT') absent = true; else throw error } assert.equal(absent, true, name) }
assert.ok(launcher.originClosed && launcher.cleanupVerified && launcher.continuationVerified && inner.profile.cleanupVerified && inner.profile.continuationVerified)
assert.ok(launcher.postTcp.every(row => row.port === 4375 && row.closed && row.code === 111))
const retained = validateSegmentPredecessor(marker.lastRun, inner, boundary, { id: marker.id, checkpointAtStart: marker.lastRun.checkpointAtEnd }, inner.source)
assert.deepEqual(retained, boundary); assert.deepEqual(retained.policy, read('qa/campaign-continuity/run-policy.json'))
for (const name of ['failures', 'controlStops', 'browserErrors']) assert.deepEqual(retained[name], [])
assert.deepEqual(inner.errors, []); assert.equal(retained.currentEpoch, null)
for (const e of retained.epochs) { assert.deepEqual(e.errors, []); assert.deepEqual(e.speedViolations, []) }
const load = retained.checkpointProofs.find(proof => proof.level === 1 && proof.loaded && !proof.segment)
requireLoadedCheckpoint(load.saved, load.boundary, load.stored); requireContinueBoundary(load.identity, 1); requireContinueBoundary(retained.transitions[0].boundary, 2)
const budget = requireCampaignBudget(retained.epochs, null, 2, retained.policy.limits)
assert.equal(campaignActive(retained.epochs, null, 1), 697.5833333333333); assert.equal(budget.campaign, 733.5833333333333); assert.equal(budget.mission, 36)
assert.equal(retained.missionWallMs[1], 1589523); assert.equal(retained.missionWallMs[2], 46424); assert.equal(retained.ownedWallMs, 1635947)
assert.ok(Date.parse(outer.finishedAt) - Date.parse(outer.startedAt) < 2110000)
const victory = read(out + '/m1-milestone-victory.json')
assert.equal(victory.status, 'won'); assert.deepEqual(victory.completedMissions, [1]); assert.equal(victory.turn, 8342)
assert.equal(victory.units.filter(unit => unit.team === 'red').length, 0); assert.equal(victory.buildings.find(building => building.id === 31).hp, 65)
const actions = readFileSync(out + '/actions.jsonl', 'utf8').trim().split('\n').map(line => JSON.parse(line))
const consumed = [], inputs = new Map(retained.inputs.map(row => [row.name, row.sha256]))
for (let i = 1; i <= 10; i++) { const name = String(i).padStart(4, '0') + '.json'; assert.equal(sha(out + '/commands/' + name), sha(out + '/consumed-' + name)); assert.equal(sha(out + '/commands/' + name), inputs.get('commands/' + name)); consumed.push(...read(out + '/commands/' + name)) }
assert.deepEqual(consumed, actions.filter(row => row.action === 'requested-command').map(row => row.command))
for (const input of retained.inputs.filter(row => !row.name.startsWith('commands/'))) { assert.equal(sha(out + '/' + input.name), input.sha256); assert.equal(sha('qa/campaign-continuity/' + input.name), input.sha256) }
const returnPath = 'work/orchestration/dependency-transfers/campaign-to-stone-20261005T1937/receipt.json'
assert.equal(sha(returnPath), packet.cleanup.returnReceiptSha256); assert.equal(existsSync('node_modules'), false)
const laterTransfer = '../stone-head-logical-visit-fix/work/orchestration/dependency-transfers/stone-to-native-guard-20261005T1941/receipt.json'
assert.equal(read(laterTransfer).priorReceiptSha256, sha(returnPath))
const verification = { status: 'PASS', reviewedAt: new Date().toISOString(), sourceHead: inner.source.commit, packet: { path: packetPath, sha256: sha(packetPath), filesVerified: packet.files.length }, markerSha256: sha(markerPath), receiptSha256: sha(out + '/receipt.json'), boundarySha256: sha(out + '/segment-boundary.json'), commandBatches: 10, requestedCommands: consumed.length, loggedActions: actions.length, sourceCopiesVerified: 8, predecessor: { decision: 'ACCEPT host contract', profileId: marker.id, previousRunId: marker.lastRun.runId, checkpoint: marker.lastRun.checkpointAtEnd, activeSeconds: budget, missionWallMs: retained.missionWallMs, ownedWallMs: retained.ownedWallMs, nextEntry: 'Actual future browser pre-entry full checkpoint readback and ordinary Load remain required. No lease/browser was invoked by this verification.' }, ownershipNamesAbsent: ownershipNames, originalLauncherScopedClosure: launcher.postTcp, dependencyRelease: { returnPath, sha256: sha(returnPath), laterTransfer, laterTransferSha256: sha(laterTransfer), campaignNodeModulesAbsent: true } }
const path = b + '/review-mission-one-segment-03/verification.json'; writeFileSync(path, JSON.stringify(verification, null, 2) + '\n'); console.log(JSON.stringify({ status: 'PASS', path, sha256: sha(path), packetSha256: sha(packetPath) }))
