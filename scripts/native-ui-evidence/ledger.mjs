import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { episodes } from './policy.mjs'

export function initialEpisodeReport() {
  return { status: 'not-run', cleanupVerified: false,
    episodes: episodes.map(episode => ({ id: episode.id, owner: episode.owner,
      path: episode.path, capMs: episode.capMs,
      ...(episode.pauseMode ? { executionContract: { version: 'pause-style-split-v1', mode: episode.pauseMode, primary: episode.primary } } : {}),
      ...(episode.audioMode ? { executionContract: { version: 'audio-style-split-v1', mode: episode.audioMode, primary: episode.primary } } : {}),
      status: 'not-run', timedOut: false, cleanupVerified: false })),
    errors: [], warnings: [], expectedErrors: [], injectedRequests: [], observations: [] }
}
export function initializeEpisodeLedger(output) {
  writeFileSync(resolve(output, 'episodes.json'), JSON.stringify(initialEpisodeReport(), null, 2) + '\n')
}
export function recordUnstartedFailure(output, stage, error) {
  const file = resolve(output, 'episodes.json'), report = JSON.parse(readFileSync(file, 'utf8'))
  if (report.status !== 'not-run') return // Never replace actual episode outcomes or an earlier failure.
  report.status = 'failed'
  report.failureStage = stage
  report.failure = String(error)
  report.finishedAt = new Date().toISOString()
  writeFileSync(file, JSON.stringify(report, null, 2) + '\n')
}
