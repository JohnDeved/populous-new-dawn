import assert from 'node:assert/strict'
// Dispatch independent scenarios without starting/restarting any browser timer.
export async function runProfileEpisode(scenario, { runRecovery, runTornado, closeRecoveryProbe, runMission10, runSpySource, closeProbe, signal, deadlineAt }) {
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
  const mission10Profile = await runMission10({ signal, deadlineAt })
  signal.throwIfAborted()
  assert.equal(mission10Profile.status, 'passed')
  assert.deepEqual(mission10Profile.phases.map(({ mode, status, cleanupVerified }) => [mode, status, cleanupVerified]),
    [['created', 'passed', true], ['reused', 'passed', true]], 'Both unchanged M10 phases must finish before Spy admission')
  // The independent Spy owner requires its entire 45s, including launch and
  // cleanup, within this original host deadline. Failure is never a skip.
  const spySource = await runSpySource({ signal, deadlineAt })
  signal.throwIfAborted()
  assert.equal(spySource.status, 'passed')
  return { mission10Profile, spySource }
}
