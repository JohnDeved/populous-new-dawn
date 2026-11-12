// Inactive pure protocol core. No process, filesystem, IPC or kernel actions.
// Trusted runtime glue must authenticate private endpoints and actual FD ownership.
const roles = ['parent', 'metadata', 'writer']
const phases = [
  ['before', 'metadata'], ['cases', 'parent'], ['after', 'metadata'], ['commit', 'writer'],
]
const sha = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
const nonce = value => typeof value === 'string' && value.length >= 8 && value.length <= 128
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const hashes = value => {
  if (!value || Object.getPrototypeOf(value) !== Object.prototype) throw Error('Plain hash closure required')
  const keys = Object.keys(value).sort()
  if (!keys.length || keys.length > 32 || keys.some(key => key.length > 128 || !sha(value[key])))
    throw Error('Invalid hash closure')
  return Object.fromEntries(keys.map(key => [key, value[key]]))
}
export function createFinalizationGate({ runNonce, startMs, expectedSources, expectedHashes,
  now, workMs = 26000, cleanupMs = 4000 }) {
  if (!nonce(runNonce) || !Number.isFinite(startMs) || typeof now !== 'function' ||
      !Number.isFinite(workMs) || workMs < 1 || workMs > 26000 ||
      !Number.isFinite(cleanupMs) || cleanupMs < 1 || cleanupMs > 4000)
    throw Error('Invalid protocol admission')
  if (!expectedSources || !same(Object.keys(expectedSources).sort(), [...roles].sort()) ||
      roles.some(role => !sha(expectedSources[role]))) throw Error('Pinned actor sources required')
  const sources = { ...expectedSources }, expected = hashes(expectedHashes)
  const actors = new Map(), usedNonces = new Set([runNonce])
  let previous = startMs, failure, failed = false, next = 0, pending, descriptor, candidate
  let cleanupStart
  const fail = message => { failed = true; failure ??= message; throw Error(message) }
  const clock = () => {
    const value = now()
    if (!Number.isFinite(value) || value < previous) return fail('Invalid or backward global clock')
    previous = value
    return value
  }
  const work = () => {
    if (failed) return fail('Protocol already failed')
    const time = clock()
    if (time >= startMs + workMs) return fail('Global work deadline exhausted')
    return time
  }
  const bound = role => { const actor = actors.get(role); if (!actor) return fail('Unbound actor'); return actor }
  const live = role => { const actor = bound(role); if (actor.exited) return fail('Actor already exited'); return actor }
  const stableDescriptor = value => {
    if (!value || !['device', 'inode', 'token'].every(key => typeof value[key] === 'string' && value[key].length > 0 && value[key].length <= 128) ||
        !same(Object.keys(value).sort(), ['device', 'inode', 'token'])) return fail('Invalid executable descriptor identity')
    return { device: value.device, inode: value.inode, token: value.token }
  }
  const gate = {
    bind(role, identity) {
      work()
      if (!roles.includes(role) || actors.has(role) || next !== 0 || pending) return fail('Actor bind out of order')
      if (!identity || !Number.isSafeInteger(identity.pid) || identity.pid <= 1 ||
          !/^\d+$/.test(identity.starttime ?? '') || identity.sourceSha256 !== sources[role] ||
          !nonce(identity.channelNonce) || usedNonces.has(identity.channelNonce))
        return fail('Actor identity mismatch')
      usedNonces.add(identity.channelNonce)
      actors.set(role, { pid: identity.pid, starttime: identity.starttime, sourceSha256: identity.sourceSha256,
        channelNonce: identity.channelNonce, exited: false, reaped: false, term: false, kill: false })
    },
    begin(name, phaseNonce, capMs) {
      const time = work()
      if (pending || next >= phases.length || name !== phases[next][0] || actors.size !== roles.length ||
          !nonce(phaseNonce) || usedNonces.has(phaseNonce) || !Number.isFinite(capMs) || capMs <= 0)
        return fail('Phase admission mismatch')
      if (capMs > startMs + workMs - time) return fail('Phase exceeds remaining global budget')
      const role = phases[next][1]
      live(role)
      if (name === 'before' || name === 'after') { live('parent'); live('metadata') }
      if (name === 'commit' && (!bound('parent').reaped || !bound('metadata').reaped))
        return fail('Commit before parent and metadata reaped')
      usedNonces.add(phaseNonce)
      pending = { name, role, nonce: phaseNonce, sequence: next + 1, deadline: time + capMs }
      return { runNonce, phase: name, phaseNonce, sequence: pending.sequence, role }
    },
    complete(message) {
      const time = work(), phase = pending
      if (!phase || time >= phase.deadline) return fail('Missing or late phase response')
      const actor = live(phase.role)
      if (!message || message.runNonce !== runNonce || message.phase !== phase.name ||
          message.phaseNonce !== phase.nonce || message.sequence !== phase.sequence ||
          message.role !== phase.role || message.pid !== actor.pid || message.starttime !== actor.starttime ||
          message.channelNonce !== actor.channelNonce) return fail('Unauthenticated phase response')
      if (phase.name === 'before' || phase.name === 'after') {
        let actual
        try { actual = hashes(message.hashes) } catch { return fail('Invalid hash response') }
        if (!same(actual, expected)) return fail('Hash closure mismatch')
        const current = stableDescriptor(message.descriptor)
        if (phase.name === 'before') descriptor = current
        else if (!same(descriptor, current)) return fail('Executable descriptor changed')
      } else if (phase.name === 'cases') {
        if (message.casesVerified !== true) return fail('Kernel cases not verified')
      } else {
        if (!sha(message.candidateSha256)) return fail('Invalid candidate digest')
        candidate = message.candidateSha256
      }
      pending = undefined; next++
    },
    exited(role, { code, signal }) {
      clock()
      const actor = bound(role)
      if (actor.exited) return fail('Duplicate actor exit')
      actor.exited = true
      if (code !== 0 || signal !== null) return fail('Actor failed')
      if (role === 'writer' ? next < 4 : next < 3) return fail('Actor exited before required phase')
    },
    reaped(role) {
      clock()
      const actor = bound(role)
      if (!actor.exited || actor.reaped) return fail('Invalid actor reap')
      actor.reaped = true
    },
    terminalManifest() {
      work()
      if (pending || next !== 4 || !roles.every(role => bound(role).reaped))
        return fail('Terminal outcome before all actor reaps')
      return { status: 'ready-for-outer-owner', runNonce, candidateSha256: candidate,
        actorSources: { ...sources }, allActorsReaped: true, phaseCount: next }
    },
    abort(reason = 'Aborted') { failed = true; failure ??= String(reason) },
    cleanupActions() {
      const time = clock()
      if (!failed) return fail('Cleanup requires failed or aborted protocol')
      cleanupStart ??= time
      const end = Math.min(cleanupStart + cleanupMs, startMs + workMs + cleanupMs)
      if (time >= end) return { status: 'unverified', actions: [] }
      const kind = time < cleanupStart + cleanupMs / 2 ? 'TERM' : 'KILL'
      const actions = []
      for (const [role, actor] of actors) {
        if (actor.exited) continue
        const flag = kind === 'TERM' ? 'term' : 'kill'
        if (!actor[flag]) { actor[flag] = true; actions.push({ role, pid: actor.pid, starttime: actor.starttime, kind }) }
      }
      return { status: 'cleanup-pending', sharedDeadline: end, actions }
    },
    snapshot() { return { failed, failure, next, pending: pending ? { ...pending } : null,
      actors: Object.fromEntries([...actors].map(([role, actor]) => [role, { ...actor }])),
      candidateSha256: candidate ?? null } },
  }
  // Count bootstrap already spent before construction; no reset at first await.
  work()
  return gate
}
export function acceptOuterOutcome(manifest, outcome) {
  if (manifest?.status !== 'ready-for-outer-owner' || manifest.allActorsReaped !== true ||
      manifest.phaseCount !== 4 || !sha(manifest.candidateSha256) ||
      outcome?.coordinatorExit !== 0 || outcome.coordinatorReaped !== true ||
      outcome.watchdogFailed !== false || outcome.serviceCompleted !== true || outcome.serviceSucceeded !== true)
    throw Error('Whole-run outcome unverified')
  return { status: 'passed', runNonce: manifest.runNonce, candidateSha256: manifest.candidateSha256 }
}
