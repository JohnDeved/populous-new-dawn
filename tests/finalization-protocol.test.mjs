import test from 'node:test'
import assert from 'node:assert/strict'
import { createFinalizationGate, acceptOuterOutcome, requiredHashKeys } from '../scripts/native-ui-evidence/setup-v2-proposal/finalization-protocol.mjs'
const digest = 'a'.repeat(64), other = 'b'.repeat(64)
const sources = { parent: digest, metadata: digest, writer: digest }, expectedHashes = Object.fromEntries(requiredHashKeys.map(key => [key, digest]))
const descriptor = { device: '1', inode: '2', token: 'owned-fd-1' }
function fixture(workMs = 100) {
  let time = 0
  const gate = createFinalizationGate({ runNonce: 'run-nonce-01', startMs: 0, expectedSources: sources,
    expectedHashes, now: () => time, workMs, cleanupMs: 20 })
  const identities = {}
  for (const [index, role] of ['parent', 'metadata', 'writer'].entries()) {
    identities[role] = { pid: 10 + index, starttime: '100', sourceSha256: digest, channelNonce: 'channel-' + role }
    gate.bind(role, identities[role])
  }
  let sequence = 0
  const begin = name => {
    const envelope = gate.begin(name, 'phase-nonce-' + (++sequence), 10)
    return { ...envelope, ...identities[envelope.role] }
  }
  const phase = (name, extra = {}) => gate.complete({ ...begin(name), hashes: expectedHashes, descriptor,
    casesVerified: true, candidateSha256: digest, ...extra })
  const throughAfter = () => { phase('before'); phase('cases'); phase('after') }
  const retire = role => { gate.exited(role, { code: 0, signal: null }); gate.reaped(role) }
  const complete = () => { throughAfter(); retire('parent'); retire('metadata'); phase('commit'); retire('writer'); return gate.terminalManifest() }
  return { gate, identities, begin, phase, throughAfter, retire, complete, time: value => { time = value } }
}
const outer = manifest => ({ runNonce: manifest.runNonce, candidateSha256: manifest.candidateSha256,
  candidateValidated: true, lateErrors: [], interventions: [], coordinatorExit: 0, coordinatorReaped: true,
  watchdogFailed: false, serviceCompleted: true, serviceSucceeded: true })
test('candidate requires all reaps plus independently bound outer completion', () => {
  const f = fixture(), manifest = f.complete()
  assert.equal(manifest.status, 'ready-for-outer-owner')
  assert.equal(acceptOuterOutcome(manifest, outer(manifest)).status, 'passed')
})
for (const [name, patch] of [
  ['wrong run', { runNonce: 'wrong-run-01' }], ['wrong candidate', { candidateSha256: other }],
  ['writer artifact unvalidated', { candidateValidated: false }], ['late error', { lateErrors: ['late'] }],
  ['intervention', { interventions: ['TERM'] }], ['coordinator failed', { coordinatorExit: 1 }],
  ['coordinator unreaped', { coordinatorReaped: false }], ['watchdog failed', { watchdogFailed: true }],
  ['service incomplete', { serviceCompleted: false }],
]) test('outer outcome rejects ' + name, () => {
  const manifest = fixture().complete()
  assert.throws(() => acceptOuterOutcome(manifest, { ...outer(manifest), ...patch }))
})
test('candidate ack alone never certifies writer exit', () => {
  const f = fixture(); f.throughAfter(); f.retire('parent'); f.retire('metadata'); f.phase('commit')
  assert.throws(() => f.gate.terminalManifest(), /all actor reaps/)
})
test('writer error after candidate ack invalidates the run', () => {
  const f = fixture(); f.throughAfter(); f.retire('parent'); f.retire('metadata'); f.phase('commit')
  assert.throws(() => f.gate.exited('writer', { code: 1, signal: null }), /Actor failed/)
  assert.throws(() => f.gate.terminalManifest(), /already failed/)
})
test('commit cannot precede metadata and parent reap', () => {
  const f = fixture(); f.throughAfter()
  assert.throws(() => f.begin('commit'), /before parent and metadata reaped/)
})
for (const [name, patch] of [
  ['run', { runNonce: 'old-run-000' }], ['phase', { phase: 'after' }], ['nonce', { phaseNonce: 'wrong-phase' }],
  ['sequence', { sequence: 9 }], ['role', { role: 'writer' }], ['pid', { pid: 99 }],
  ['starttime', { starttime: '200' }], ['channel', { channelNonce: 'other-channel' }],
]) test('phase response rejects wrong ' + name, () => {
  const f = fixture(), message = f.begin('before')
  assert.throws(() => f.gate.complete({ ...message, hashes: expectedHashes, descriptor, ...patch }), /Unauthenticated/)
  assert.equal(f.gate.snapshot().failed, true)
})
test('before response cannot be replayed for after hash', () => {
  const f = fixture(), message = { ...f.begin('before'), hashes: expectedHashes, descriptor }
  f.gate.complete(message); f.phase('cases'); f.begin('after')
  assert.throws(() => f.gate.complete(message), /Unauthenticated/)
})
test('descriptor replacement fails even with matching digest', () => {
  const f = fixture(); f.phase('before'); f.phase('cases')
  assert.throws(() => f.phase('after', { descriptor: { ...descriptor, token: 'new-fd-01' } }), /descriptor changed/)
})
test('changed hash closure fails finalization after verified cases', () => {
  const f = fixture(); f.phase('before'); f.phase('cases')
  assert.throws(() => f.phase('after', { hashes: { ...expectedHashes, node: other } }), /Hash closure mismatch/)
})
test('metadata worker cannot exit and reacquire the descriptor before after hash', () => {
  const f = fixture(); f.phase('before')
  assert.throws(() => f.gate.exited('metadata', { code: 0, signal: null }), /before required phase/)
  assert.throws(() => f.begin('cases'), /already failed/)
})
test('late phase completion cannot become success', () => {
  const f = fixture(), message = f.begin('before'); f.time(10)
  assert.throws(() => f.gate.complete({ ...message, hashes: expectedHashes, descriptor }), /late phase/)
})
test('bootstrap time counts before first phase', () => {
  assert.throws(() => createFinalizationGate({ runNonce: 'run-nonce-01', startMs: 0, expectedSources: sources,
    expectedHashes, now: () => 100, workMs: 100, cleanupMs: 20 }), /Global work deadline/)
})
test('phase cannot reset the global remaining budget', () => {
  const f = fixture(); f.phase('before'); f.time(95)
  assert.throws(() => f.begin('cases'), /remaining global budget/)
})
test('all live handles share one cleanup deadline and one escalation', () => {
  const f = fixture(); f.time(50); f.gate.abort('stop')
  const first = f.gate.cleanupActions()
  assert.equal(first.sharedDeadline, 70); assert.equal(first.actions.length, 3)
  assert.ok(first.actions.every(action => action.kind === 'TERM'))
  assert.deepEqual(f.gate.cleanupActions().actions, [])
  f.time(60)
  assert.ok(f.gate.cleanupActions().actions.every(action => action.kind === 'KILL'))
  f.time(70); assert.equal(f.gate.cleanupActions().status, 'unverified')
  f.time(80); assert.equal(f.gate.cleanupActions().status, 'unverified')
})
test('exited handles are never included in destructive cleanup plans', () => {
  const f = fixture(); f.throughAfter()
  f.gate.exited('parent', { code: 0, signal: null }); f.gate.abort()
  const actions = f.gate.cleanupActions().actions
  assert.deepEqual(actions.map(action => action.role), ['metadata', 'writer'])
})
test('actor identity snapshots cannot be mutated after binding', () => {
  const f = fixture(); f.identities.metadata.pid = 99
  assert.throws(() => f.phase('before'), /Unauthenticated/)
})
test('backward global clock fails closed', () => {
  const f = fixture(); f.time(20); f.phase('before'); f.time(19)
  assert.throws(() => f.begin('cases'), /backward/)
})
function preparePhase(f, name) {
  if (name === 'before') return
  f.phase('before')
  if (name === 'cases') return
  f.phase('cases')
  if (name === 'after') return
  f.phase('after'); f.retire('parent'); f.retire('metadata')
}
for (const [name, ceiling] of [['before', 7000], ['cases', 10000], ['after', 7000], ['commit', 2000]]) {
  test(name + ' admits its fixed ceiling without expanding global time', () => {
    const f = fixture(26000); preparePhase(f, name)
    assert.equal(f.gate.begin(name, 'boundary-nonce', ceiling).phase, name)
  })
  test(name + ' rejects one millisecond over fixed ceiling', () => {
    const f = fixture(26000); preparePhase(f, name)
    assert.throws(() => f.gate.begin(name, 'overlimit-nonce', ceiling + 1), /fixed ceiling/)
  })
}
test('one-key digest equality is not an admitted complete mandatory closure', () => {
  assert.throws(() => createFinalizationGate({ runNonce: 'run-nonce-01', startMs: 0,
    expectedSources: sources, expectedHashes: { node: digest }, now: () => 0 }), /hash closure/)
})
for (const missing of requiredHashKeys) test('mandatory hash identity cannot be omitted: ' + missing, () => {
  const incomplete = { ...expectedHashes }; delete incomplete[missing]
  assert.throws(() => createFinalizationGate({ runNonce: 'run-nonce-01', startMs: 0,
    expectedSources: sources, expectedHashes: incomplete, now: () => 0 }), /hash closure/)
})
test('actor identity must match its mandatory closure digest', () => {
  assert.throws(() => createFinalizationGate({ runNonce: 'run-nonce-01', startMs: 0,
    expectedSources: { ...sources, metadata: other }, expectedHashes, now: () => 0 }), /Actor sources differ/)
})
test('response cannot omit a mandatory digest from an admitted closure', () => {
  const f = fixture(), incomplete = { ...expectedHashes }; delete incomplete.node
  assert.throws(() => f.phase('before', { hashes: incomplete }), /Invalid hash response/)
})
