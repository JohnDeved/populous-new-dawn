import { writeFileSync, readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { runSpellIconEvidence } from '../../../scripts/spell-icon-state-evidence.mjs'
const report = { status: 'running' }
let closeCalls = 0
await runSpellIconEvidence({ report, timeout: 5,
  launch: async () => ({ async close() {
    if (++closeCalls === 1) throw Error('timeout close rejected')
  } }),
  run: () => new Promise(() => {}),
  snapshot: () => ({
    head: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    helperSha256: createHash('sha256').update(readFileSync('scripts/spell-icon-state-evidence.mjs')).digest('hex'),
    node: process.version,
  }),
  save: () => writeFileSync(new URL('timeout-close-terminal-report.json', import.meta.url), JSON.stringify({ ...report, closeCalls }, null, 2) + '\n'),
})
console.log(JSON.stringify({ status: report.status, expired: report.expired, closeCalls, browserClosed: report.browserClosed, finishedAt: report.finishedAt }))
if (report.status !== 'passed') process.exitCode = 1
