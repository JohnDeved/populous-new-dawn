import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, lstatSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { validateSegmentPredecessor, campaignActive, requireCampaignBudget, requireLoadedCheckpoint, requireContinueBoundary } from '../../../../qa/campaign-continuity/boundaries.mjs'
const b = 'work/orchestration/campaign-continuity', out = b + '/mission-two-segment-01'
const read = p => JSON.parse(readFileSync(p)), shaBytes = bytes => createHash('sha256').update(bytes).digest('hex'), sha = p => shaBytes(readFileSync(p))
const packetPath = b + '/mission-two-segment-01-terminal-packet.json', packet = read(packetPath)
assert.equal(sha(packetPath), 'bd7c890f04de82370165bf69f990336e0fbcddac269f92385c6be8565eb8f019')
for (const f of packet.files) { assert.equal(sha(f.path), f.sha256, f.path); assert.equal(readFileSync(f.path).length, f.bytes, f.path) }
const inner = read(out + '/receipt.json'), boundary = read(out + '/segment-boundary.json'), journey = read(out + '/journey.json'), outer = read(b + '/mission-two-segment-01.outer.json'), launcher = read(b + '/mission-two-segment-01.launcher.json')
assert.equal(inner.status, 'failed'); assert.equal(outer.status, 'failed'); assert.equal(outer.exitCode, 1); assert.equal(outer.signal, null); assert.equal(launcher.commandExitCode, 1)
assert.equal(Object.hasOwn(inner, 'result'), false); assert.equal(Object.hasOwn(inner, 'previousFailure'), false)
assert.equal(shaBytes(inner.failure), boundary.terminal.failureSha256); assert.equal(boundary.terminal.status, inner.status)
assert.equal(launcher.innerReceiptSha256, sha(out + '/receipt.json')); assert.equal(inner.campaignBoundary.path, resolve(out + '/segment-boundary.json')); assert.equal(inner.campaignBoundary.sha256, sha(out + '/segment-boundary.json'))
assert.deepEqual(inner.source, inner.sourceAfter); assert.deepEqual(inner.runtime, inner.runtimeAfter); assert.deepEqual(inner.scenario, inner.scenarioAfter); assert.deepEqual(outer.source, outer.sourceAfter)
assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), inner.source.commit); assert.equal(execFileSync('git', ['status', '--short'], { encoding: 'utf8' }), '')
for (const n of ['stdout', 'stderr']) { assert.equal(sha(outer.artifacts[n]), outer[n + 'Sha256']); assert.equal(readFileSync(outer.artifacts[n], 'utf8'), outer[n]) }
for (const key of ['failures', 'controlStops', 'browserErrors', 'epochs', 'milestones', 'transitions', 'checkpointProofs', 'protectedLatest', 'currentEpoch']) assert.deepEqual(journey[key], boundary[key], key)
assert.equal(boundary.currentEpoch, null); assert.equal(journey.status, 'failed'); assert.equal(boundary.failures.length, 2)
assert.deepEqual(boundary.failures.map(f => f.index), [11, 14]); assert.deepEqual(boundary.controlStops, []); assert.deepEqual(boundary.browserErrors, []); assert.deepEqual(inner.errors, [])
const actions = readFileSync(out + '/actions.jsonl', 'utf8').trim().split('\n').map(JSON.parse), executed = [], unexecuted = [], inputHashes = new Map(boundary.inputs.map(row => [row.name, row.sha256]))
let scheduledCount = 0
for (let n = 1; n <= 15; n++) {
 const filename = String(n).padStart(4, '0') + '.json', p = out + '/commands/' + filename, commands = read(p)
 assert.equal(sha(p), sha(out + '/consumed-' + filename)); assert.equal(sha(p), inputHashes.get('commands/' + filename)); scheduledCount += commands.length
 const count = n === 11 ? 3 : n === 14 ? 5 : commands.length
 executed.push(...commands.slice(0, count)); unexecuted.push(...commands.slice(count).map(command => ({ batch: n, command })))
}
assert.deepEqual(executed, actions.filter(row => row.action === 'requested-command').map(row => row.command)); assert.equal(executed.length, 99)
for (const input of boundary.inputs.filter(row => !row.name.startsWith('commands/') && !row.name.startsWith('/'))) { assert.equal(sha(out + '/' + input.name), input.sha256); assert.equal(sha('qa/campaign-continuity/' + input.name), input.sha256) }
for (const [p, hash] of Object.entries(boundary.policy.applicationImports)) assert.equal(sha(p), hash)
const staleIndex = actions.findIndex(row => row.action === 'entity-immediate-hit-revalidation' && row.hit.id === 6)
assert.equal(actions[staleIndex].fresh.valid, false); assert.equal(actions[staleIndex].fresh.point, null); assert.equal(actions[staleIndex + 1].action, 'entity-delivered-pointer-observation'); assert.equal(actions[staleIndex + 1].observed, null)
const groundIndex = actions.findIndex(row => row.action === 'movement-ground-probe' && row.requested.x === 85 && row.requested.z === 104)
assert.equal(actions[groundIndex].hit, null); assert.equal(actions[groundIndex + 1].action, 'button'); assert.equal(actions[groundIndex + 1].name, 'Pause game')
assert.ok(!actions.some(row => row.action === 'cast-click' && row.spell === 'blast')); assert.equal(actions.filter(row => row.action === 'cast-accepted').length, 2)
const previous = read(inner.profile.previousRun.receiptPath)
assert.equal(sha(inner.profile.previousRun.receiptPath), inner.profile.previousRun.receiptSha256); assert.deepEqual(inner.profile.checkpointAtStart, previous.profile.checkpointAtEnd)
const oldBoundary = read(previous.campaignBoundary.path)
assert.deepEqual(boundary.epochs.slice(0, oldBoundary.epochs.length), oldBoundary.epochs); assert.deepEqual(boundary.milestones.slice(0, oldBoundary.milestones.length), oldBoundary.milestones)
for (const proof of boundary.checkpointProofs.filter(p => p.loaded)) { requireLoadedCheckpoint(proof.saved, proof.boundary, proof.stored); requireContinueBoundary(proof.identity, proof.level) }
const m2Load = boundary.checkpointProofs.find(p => p.level === 2 && p.loaded && !p.segment); assert.equal(m2Load.saved.turn, 5185)
for (const transition of boundary.transitions) requireContinueBoundary(transition.boundary, transition.to)
const markerPath = inner.profile.path + '/populous-profile.json', marker = read(markerPath)
assert.equal(marker.lastRun.receiptSha256, sha(out + '/receipt.json')); assert.equal(marker.id, inner.profile.id); assert.deepEqual(marker.lastRun.checkpointAtEnd, inner.profile.checkpointAtEnd); assert.deepEqual(marker.binding.runtime, inner.runtime)
for (const name of ['owner.lock', 'browser/SingletonLock', 'browser/SingletonSocket', 'browser/SingletonCookie']) { let absent = false; try { lstatSync(inner.profile.path + '/' + name) } catch (error) { if (error.code === 'ENOENT') absent = true; else throw error } assert.ok(absent, name) }
assert.ok(inner.profile.cleanupVerified && inner.profile.continuationVerified && launcher.cleanupVerified && launcher.continuationVerified && launcher.originClosed)
assert.ok(launcher.postTcp.every(row => row.port === 4375 && row.closed && row.code === 111))
const nextProfile = { id: marker.id, checkpointAtStart: marker.lastRun.checkpointAtEnd }
const retained = validateSegmentPredecessor(marker.lastRun, inner, boundary, nextProfile, inner.source)
assert.deepEqual(retained.failures.slice(0, 2), boundary.failures); assert.equal(retained.failures.length, 3); assert.deepEqual(retained.failures[2], { kind: 'prior-harness-failure', runId: inner.profile.runId, error: inner.failure })
assert.throws(() => validateSegmentPredecessor(marker.lastRun, { ...inner, failure: 'Error: stopServer cleanup failed', previousFailure: inner.failure }, boundary, nextProfile, inner.source))
assert.throws(() => validateSegmentPredecessor(marker.lastRun, { ...inner, failure: 'Error: stopServer cleanup failed' }, boundary, nextProfile, inner.source))
const budgets = requireCampaignBudget(retained.epochs, null, 3, retained.policy.limits)
for (const epoch of retained.epochs) { assert.deepEqual(epoch.errors, []); assert.deepEqual(epoch.speedViolations, []) }
assert.equal(campaignActive(retained.epochs, null, 2), 1141.4166666666665); assert.equal(budgets.campaign, 1857.1666666666667); assert.equal(budgets.mission, 18.166666666666668)
assert.equal(retained.missionWallMs[2], 2039727); assert.equal(retained.missionWallMs[3], 30211); assert.equal(retained.ownedWallMs, 3659465)
const won = read(out + '/m2-genuine-victory-result.json'), m3 = read(out + '/m3-continued-segment.json'), preserved = actions.at(-1)
assert.equal(won.status, 'won'); assert.equal(won.turn, 13632); assert.deepEqual(won.completedMissions, [1, 2]); assert.equal(won.units.filter(u => u.team === 'green').length, 0); assert.equal(won.units.filter(u => u.team === 'blue' && u.kind === 'warrior').length, 6); assert.equal(won.units.find(u => u.team === 'blue' && u.kind === 'shaman').hp, 100); assert.equal(won.buildings.find(b => b.id === 1).hp, 97.5)
assert.equal(m3.level, 3); assert.equal(m3.turn, 179); assert.equal(m3.status, 'playing'); assert.deepEqual(m3.completedMissions, [1, 2]); assert.equal(inner.profile.checkpointAtEnd.turn, 179)
assert.equal(preserved.action, 'terminal-latest-preserved'); assert.equal(preserved.matches, true); assert.deepEqual(preserved.actual, inner.profile.checkpointAtEnd)
const verification = { status: 'PASS EVIDENCE AND PREDECESSOR', reviewedAt: new Date().toISOString(), terminalStatus: inner.status, packetSha256: sha(packetPath), packetFiles: packet.files.length, innerSha256: sha(out + '/receipt.json'), boundarySha256: sha(out + '/segment-boundary.json'), terminalFailureSha256: shaBytes(inner.failure), markerSha256: sha(markerPath), commandBatches: 15, scheduledCommands: scheduledCount, requestedCommands: executed.length, unexecutedSuffixes: unexecuted, actions: actions.length, sourceCopiesVerified: 8, sourceImportsVerified: 8, helperFailures: boundary.failures, forwardFailureRecords: retained.failures.length, forwardFailureKinds: ['helper-input-failure', 'helper-input-failure', 'prior-harness-failure'], cleanupOverrideNegativeCases: 2, preservedCheckpoint: inner.profile.checkpointAtEnd, activeByMission: Object.fromEntries([1, 2, 3].map(l => [l, campaignActive(retained.epochs, null, l)])), totalActiveSeconds: budgets.campaign, missionWallMs: retained.missionWallMs, ownedWallMs: retained.ownedWallMs, scope: 'Actual source-bound evidence, read-only marker and maintained host validator only. No lease/browser/storage read or launch performed. Future actual pre-entry checkpoint digest and ordinary Load remain required.' }
const path = b + '/review-mission-two-segment-01/verification.json'; writeFileSync(path, JSON.stringify(verification, null, 2) + '\n'); console.log(JSON.stringify({ status: verification.status, path, sha256: sha(path), requestedCommands: executed.length, scheduledCommands: scheduledCount }))
