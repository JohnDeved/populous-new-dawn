import assert from 'node:assert/strict'
// Dispatch independent scenarios without starting/restarting any browser timer.
export async function runProfileEpisode(scenario, { runRecovery, runTornado, closeRecoveryProbe, runMission10, closeProbe, signal, deadlineAt }) {
  assert.ok(Number.isFinite(deadlineAt), 'Original host deadline required')
  signal.throwIfAborted()
  if (scenario === 'profile-recovery') {
    const profileRecovery = await runRecovery()
    signal.throwIfAborted()
    await closeRecoveryProbe()
    signal.throwIfAborted()
    const tornadoAppearance = await runTornado({ signal, deadlineAt })
    signal.throwIfAborted()
    return { profileRecovery, tornadoAppearance }
  }
  assert.equal(scenario, 'mission10-profile', 'Unknown profile episode')
  await closeProbe()
  signal.throwIfAborted()
  return { mission10Profile: await runMission10({ signal, deadlineAt }) }
}
