// Test-only inverse of the reviewed corpse scheduling transition. This does NOT
// qualify the current runner for the historical capture protocol. Its production
// manifest and fail-closed byte identity checks intentionally remain unchanged.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import yaml from 'js-yaml'
const transition = [
  [
    "import { browserScenarios, browserCapMs, snapshotSmokeBudget, gameplayResourceSplitBudget, followerCorpseSplitBudget } from './scenario-policy.mjs'\n",
    "import { browserScenarios, browserCapMs, snapshotSmokeBudget, gameplayResourceSplitBudget } from './scenario-policy.mjs'\n"
  ],
  [
    "  if (['gameplay-frames', 'follower-corpse'].includes(selectedScenario)) receipt.followerCorpseSplitBudget = followerCorpseSplitBudget\n",
    ""
  ],
  [
    "  } else if (selectedScenario === 'follower-corpse') {\n    // Independent mandatory job: unchanged ordinary combat, crops and Save/Load.\n    // Release the unused probe before the original episode owns its fresh context.\n    await context.close(); context = undefined; page = undefined\n",
    "    // Separate ordinary follower combat and actual checkpoint continuation. No\n    // performance window or existing 75-second, first-observed-entry melee assertions change.\n"
  ]
]
export function historicalCaptureRunnerDigest(source) {
  for (const [current, previous] of transition) {
    assert.equal(source.split(current).length, 2, 'Exact approved transition must occur once')
    source = source.replace(current, previous)
  }
  return createHash('sha256').update(source).digest('hex')
}
export const corpseMatrixRow = Object.freeze({ scenario: 'follower-corpse', timeoutMinutes: 15,
  name: 'Follower corpse checkpoint browser', artifact: 'follower-corpse-checkpoint-browser',
  buildStep: 'Validate ordinary follower death artwork and genuine checkpoint continuation' })
export function priorMatrixWithoutCorpse(text) {
  const job = yaml.load(text).jobs['tutorial-browser']
  assert.equal(job.if, undefined)
  assert.equal(job['continue-on-error'], undefined)
  const rows = job.strategy.matrix.include
  assert.deepEqual(rows.filter(row => row.scenario === 'follower-corpse'), [corpseMatrixRow])
  return rows.filter(row => row.scenario !== 'follower-corpse')
}
