// Fixed read-only browser episode policy. No environment-selected cap overrides.
export const browserScenarios = Object.freeze(['tutorial', 'm2-pointer-f8', 'pause-checkpoint-recovery',
  'profile-recovery', 'mission10-profile', 'gameplay-frames', 'snapshot-protocol', 'compact-message-layout', 'frontend-held-escape'])
// This expands smoke from one shared 90s allowance to at most two 90s
// episodes (180s combined), still inside the unchanged six-minute hosted job.
export const snapshotSmokeBudget = Object.freeze({ version: 1, maxEpisodes: 2,
  episodeMs: 90000, totalBrowserMs: 180000, hostedJobMs: 360000 })
export function browserCapMs(scenario) {
  if (!browserScenarios.includes(scenario)) throw Error('Unknown browser scenario')
  return scenario === 'snapshot-protocol' ? 90000 : 180000
}

// Independent jobs, explicitly 360s combined instead of the former shared180s.
export const profileSplitBudget = Object.freeze({ version: 1, recoveryMs: 180000,
  mission10Ms: 180000, totalBrowserMs: 360000, buildMsPerJob: 120000, hostedJobMs: 900000 })
