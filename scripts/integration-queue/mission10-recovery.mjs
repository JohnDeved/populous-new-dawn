import { PROFILE_INPUTS, profileRecoveryLog, validateProfileHost, validateMission10Profile } from './profile-recovery.mjs'
export const MISSION10_JOB = 'Mission 10 crew persistence browser'
export const MISSION10_INPUTS = PROFILE_INPUTS
export const MISSION10_STEPS = ['Require a ready pull request', 'Check out exact proposed merge',
  'Set up Node', 'Install locked dependencies and verify supported Chrome', 'Record exact tested source',
  'Build plain production Home and validate Mission 10 crew persistence',
  'Reject tracked input mutation', 'Retain bounded validation receipts and screenshots']
export function mission10CrewLog(log) {
  if (log.includes('PND_PROFILE_RECOVERY_') || log.includes('PND_PROFILE_CASES_')) throw Error('Mission 10 cannot reuse recovery evidence')
  return profileRecoveryLog(log.replaceAll('PND_MISSION10_CREW_', 'PND_PROFILE_RECOVERY_'))
}
export function validateMission10Crew(receipt, expected) {
  validateProfileHost(receipt, expected, 'mission10-crew-persistence-browser', 'mission10-profile')
  if (receipt.cases !== undefined || receipt.scenarioStatus !== undefined) throw Error('Mission 10 cannot claim independent recovery cases')
  validateMission10Profile(receipt.mission10, expected.identity.mergeSha, expected.mission10Evidence, expected)
  validateMission10Resumption(expected.mission10Evidence)
  return true
}

export function validateMission10Resumption(phases) {
  const ensure = (value, message) => { if (!value) throw Error(`Mission 10 completion: ${message}`) }
  for (const [index, result] of phases.entries()) {
    const used = new Set(), names = index === 0 ? ['boarded'] : ['loaded', 'unloaded']
    for (const phase of names) {
      const rows = result.observations.filter(row => row.label === `${phase}-before-strip`)
      ensure(rows.length === 1 && typeof rows[0].paused === 'boolean', 'entering pause state missing')
      if (rows[0].paused) continue
      const controls = result.actions.map((action, at) => ({ ...action, at })).filter(action =>
        action.label === `${phase}: Select follower Shift` && action.phase === 'after')
      ensure(controls.length === 1, 'final control action completion missing')
      const before = result.actions.findIndex((action, at) => at > controls[0].at && action.label === 'Resume game' && action.phase === 'before')
      const after = result.actions.findIndex((action, at) => at > before && action.label === 'Resume game' && action.phase === 'after')
      ensure(before > controls[0].at && after > before && !used.has(after), 'public Resume did not complete')
      used.add(after)
    }
    ensure(result.actions.filter(action => action.label === 'Resume game' && action.phase === 'after').length === used.size,
      'unexpected extra Resume completion')
  }
  return true
}
