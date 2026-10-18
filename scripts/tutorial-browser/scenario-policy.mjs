// Fixed read-only browser episode policy. No environment-selected cap overrides.
export const browserScenarios = Object.freeze(['tutorial', 'm2-pointer-f8', 'pause-checkpoint-recovery',
  'profile-recovery', 'gameplay-frames', 'snapshot-protocol'])
// This expands smoke from one shared 90s allowance to at most two 90s
// episodes (180s combined), still inside the unchanged six-minute hosted job.
export const snapshotSmokeBudget = Object.freeze({ version: 1, maxEpisodes: 2,
  episodeMs: 90000, totalBrowserMs: 180000, hostedJobMs: 360000 })
export function browserCapMs(scenario) {
  if (!browserScenarios.includes(scenario)) throw Error('Unknown browser scenario')
  return scenario === 'snapshot-protocol' ? 90000 : 180000
}
