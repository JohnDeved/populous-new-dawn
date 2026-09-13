import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { main, report, observeProgress } from '../scripts/orchestration/progress.mjs'

test('delivery clock persists real time, rejects resets, and rewards only evidenced gameplay delivery', () => {
  const repo = mkdtempSync(join(tmpdir(), 'pnd-delivery-'))
  const run = (...args) => execFileSync('git', args, { cwd: repo, stdio: 'pipe' })
  const minute = 60_000, start = 1_700_000_000_000
  try {
    run('init')
    writeFileSync(join(repo, '.gitignore'), 'work/\n')
    writeFileSync(join(repo, 'proof.md'), 'Test receipt: original behavior, integration, and limitations.\n')
    writeFileSync(join(repo, 'parity.json'), JSON.stringify({ revision: 1,
      discovery: { status: 'open', note: 'Test scope', evidence: [] },
      groups: [{ id: 'test', title: 'Test', items: [{ id: 'test.a', title: 'A',
        status: 'missing', note: 'Test behavior has not been implemented.', evidence: [] }] }],
    }))
    run('add', '.')
    run('-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-m', 'fixture')
    assert.equal(main(['status'], repo, start).status, 'not-started')
    main(['start', '--task', 'feature', '--minutes', '90'], repo, start)
    assert.throws(() => main(['start', '--task', 'reset', '--minutes', '90'], repo, start), /active task/)
    assert.equal(main(['status'], repo, start + 30 * minute).status, 'review-approach')
    main(['note', '--kind', 'research', '--note', 'resolved question', '--evidence', 'proof.md'], repo, start + 45 * minute)
    assert.equal(main(['status'], repo, start + 60 * minute).status, 'recover-now')
    assert.throws(() => main(['finish', '--kind', 'gameplay', '--note', 'done'], repo, start + 61 * minute), /evidence/)
    const result = main(['finish', '--kind', 'gameplay', '--note', 'feature reached in game', '--evidence', 'proof.md'], repo, start + 70 * minute)
    assert.equal(result.minutesWithoutGameplay, 0)
    assert.match(result.latestOutcome.feedback, /delivered-within-budget/)
    assert.equal(result.latestOutcome.evidenceHash.length, 64)
    assert.equal(result.parityPercentagePoints, 0, 'Gameplay event cannot grant parity credit')
    main(['start', '--task', 'next', '--minutes', '10'], repo, start + 71 * minute)
    assert.equal(main(['status'], repo, start + 82 * minute).status, 'review-approach')
    const state = JSON.parse(readFileSync(join(repo, 'work/orchestration/delivery-clock.json')))
    assert.equal(report(state, { ...state.parity, percent: 2 }, start + 120 * minute).parityPercentagePointsPerHour, 1)
    assert.equal(report(state, { scope: 'different', percent: 2 }, start + 120 * minute).parityPercentagePointsPerHour, null)
    assert.throws(() => main(['status'], repo, start), /backwards/)
    assert.equal(observeProgress(repo, start).status, 'unavailable')
    assert.equal(observeProgress(repo, start + 82 * minute).status, 'review-approach')
    assert.equal(main(['status'], repo, start + 130 * minute).status, 'recover-now')
    const ended = main(['abandon', '--note', 'external dependency', '--evidence', 'proof.md'], repo, start + 131 * minute)
    assert.equal(ended.status, 'recover-now', 'Abandonment cannot reset gameplay clock')
    main(['start', '--task', 'alternative', '--minutes', '5'], repo, start + 132 * minute)
    const slow = main(['finish', '--kind', 'gameplay', '--note', 'delivered', '--evidence', 'proof.md'], repo, start + 140 * minute)
    assert.match(slow.latestOutcome.feedback, /delivered-over-budget/)
  } finally { rmSync(repo, { recursive: true, force: true }) }
})
