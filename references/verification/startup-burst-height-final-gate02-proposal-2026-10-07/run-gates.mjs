import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
const { runCommandReceipt } = await import(pathToFileURL(resolve(process.cwd(), 'scripts/orchestration/command-receipt.mjs')).href)

const root = process.cwd()
const directory = 'work/orchestration/startup-burst-height-final-gates-02'
const commonInputs = [
  'package.json', 'package-lock.json', 'node_modules/.package-lock.json',
  'scripts/orchestration/command-receipt.mjs',
  '/workspace/scratch/69fd8163d94e/startup-burst-height-assessment-20261007/references/verification/startup-burst-height-final-gate02-proposal-2026-10-07/run-gates.mjs',
  '/workspace/scratch/69fd8163d94e/startup-burst-height-assessment-20261007/references/verification/startup-burst-height-final-gate02-proposal-2026-10-07/host-gates.py',
  '/workspace/scratch/69fd8163d94e/startup-burst-height-assessment-20261007/references/verification/startup-burst-height-final-gate02-proposal-2026-10-07/gate-packet.json',
]
const steps = [
  { id: 'format-scoped', seconds: 30, command: ['node_modules/.bin/oxfmt', '--check', 'app/level-start-runtime.ts'] },
  { id: 'eslint-scoped', seconds: 60, command: ['node_modules/.bin/eslint', 'app/level-start-runtime.ts', 'scripts/local-render/startup-burst.mjs', 'scripts/local-render/startup-burst-observer.mjs', 'tests/startup-burst-height.test.mjs', 'tests/startup-burst-observer.test.mjs'] },
  { id: 'oxlint-scoped', seconds: 30, advisory: true, advisoryLabel: 'inherited Oxlint findings; independent exact-set review required', command: ['node_modules/.bin/oxlint', 'app/level-start-runtime.ts', 'scripts/local-render/startup-burst.mjs', 'scripts/local-render/startup-burst-observer.mjs', 'tests/startup-burst-height.test.mjs', 'tests/startup-burst-observer.test.mjs'] },
  { id: 'fallow-health', seconds: 60, advisory: true, command: ['npm', 'run', 'quality:health', '--', '--no-cache'] },
  { id: 'fallow-dupes', seconds: 60, advisory: true, command: ['npm', 'run', 'quality:dupes', '--', '--no-cache'] },
  { id: 'fallow-unused', seconds: 60, advisory: true, command: ['npm', 'run', 'quality:unused', '--', '--no-cache'] },
  { id: 'check', seconds: 900, command: ['npm', 'run', 'check'] },
  { id: 'build', seconds: 900, command: ['npm', 'run', 'build'] },
]
const results = []
for (const step of steps) {
  const receipt = runCommandReceipt(root, {
    output: `${directory}/${step.id}.json`, inputs: commonInputs,
    command: ['/usr/bin/timeout', '--signal=TERM', '--kill-after=10s', `${step.seconds}s`, ...step.command],
  })
  const accepted = receipt.status === 'passed' || (step.advisory && receipt.status === 'failed' && receipt.exitCode === 1)
  results.push({ id: step.id, status: receipt.status, exitCode: receipt.exitCode,
    advisory: !!step.advisory, classification: step.advisory && receipt.exitCode === 1 ? (step.advisoryLabel ?? 'advisory findings retained') : receipt.status })
  console.log(JSON.stringify(results.at(-1)))
  if (!accepted) { process.exitCode = 1; break }
}
mkdirSync(resolve(root, directory), { recursive: true })
writeFileSync(resolve(root, directory, 'results.json'), JSON.stringify({ results, notRun: steps.slice(results.length).map(step => step.id) }, null, 2) + '\n', { flag: 'wx' })
