// Trusted exact inventory for the explicitly selected split-profile policy.
export const SPLIT_BROWSER_JOBS = Object.freeze([
  ['tutorial', 'Tutorial browser', 'tutorial-browser', 'Build plain production Home and validate Tutorial interactions', 15],
  ['frontend-held-escape', 'Frontend held Escape browser', 'frontend-held-escape-browser', 'Build plain production Home and validate bounded frontend Escape navigation', 15],
  ['compact-message-layout', 'Compact message layout browser', 'compact-message-layout-browser', 'Validate compact messages and F8 under public HUD preferences', 15],
  ['pause-checkpoint-recovery', 'Pause checkpoint recovery browser', 'pause-checkpoint-recovery-browser', 'Build plain production Home and validate pause checkpoint recovery', 15],
  ['profile-recovery', 'Profile recovery browser', 'profile-recovery-browser', 'Build plain production Home and validate IndexedDB recovery', 15],
  ['mission10-profile', 'Mission 10 crew persistence browser', 'mission10-crew-persistence-browser', 'Build plain production Home and validate Mission 10 crew persistence', 15],
  ['gameplay-frames', 'Gameplay frame recording browser', 'gameplay-frame-recording-browser', 'Record live authored Level 2 frame exports and workload summaries', 15],
  ['snapshot-protocol', 'Controlled snapshot functional smoke', 'candidate-snapshot-functional-smoke', 'Validate candidate snapshot setup and F8 attribution, not a comparison', 6],
])
export function validateSplitBrowserJobs(jobs, run) {
  const fail = reason => { throw Error(`Split browser inventory: ${reason}`) }
  if (jobs.length !== SPLIT_BROWSER_JOBS.length || new Set(jobs.map(j => j.id)).size !== jobs.length) fail('missing/extra/duplicate jobs')
  for (const [, name, , buildStep] of SPLIT_BROWSER_JOBS) {
    const matching = jobs.filter(j => j.name === name)
    if (matching.length !== 1) fail(`missing/duplicate ${name}`)
    const job = matching[0]
    if (job.run_id !== run.id || job.run_attempt !== run.run_attempt || job.status !== 'completed' || job.conclusion !== 'success') fail(`wrong attempt or failed ${name}`)
    for (const step of ['Require a ready pull request', 'Check out exact proposed merge', 'Set up Node',
      'Install locked dependencies and verify supported Chrome', 'Record exact tested source', buildStep,
      'Reject tracked input mutation', 'Retain bounded validation receipts and screenshots'])
      if (job.steps?.filter(s => s.name === step).length !== 1 || job.steps.find(s => s.name === step).conclusion !== 'success') fail(`incomplete ${name}: ${step}`)
  }
  return true
}
