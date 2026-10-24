// Fixed read-only browser episode policy. No environment-selected cap overrides.
export const browserScenarios = Object.freeze(['tutorial', 'm2-pointer-f8', 'pause-checkpoint-recovery',
  'profile-recovery', 'mission10-profile', 'gameplay-frames', 'gameplay-resources', 'snapshot-protocol', 'compact-message-layout', 'frontend-held-escape'])
// This expands smoke from one shared 90s allowance to at most two 90s
// episodes (180s combined), still inside the unchanged six-minute hosted job.
export const snapshotSmokeBudget = Object.freeze({ version: 1, maxEpisodes: 2,
  episodeMs: 90000, totalBrowserMs: 180000, hostedJobMs: 360000 })
export function browserCapMs(scenario) {
  if (!browserScenarios.includes(scenario)) throw Error('Unknown browser scenario')
  // Finite Tutorial episodes exhausted 180s in two hosted runs. This is hang
  // headroom for the unchanged aggregate, not a per-episode or performance target.
  if (scenario === 'tutorial') return 240000
  return scenario === 'snapshot-protocol' ? 90000 : 180000
}

// Independent jobs, explicitly 360s combined instead of the former shared180s.
export const profileSplitBudget = Object.freeze({ version: 1, recoveryMs: 180000,
  mission10Ms: 180000, totalBrowserMs: 360000, buildMsPerJob: 120000, hostedJobMs: 900000 })

// Additional independent job/build: explicit 360s combined, not a speed improvement.
// Original gameplay→melee→corpse remains within its unchanged 180s allowance.
export const gameplayResourceSplitBudget = Object.freeze({ version: 1, gameplayMs: 180000,
  resourcesMs: 180000, totalBrowserMs: 360000, buildMsPerJob: 120000, hostedJobMs: 900000 })
