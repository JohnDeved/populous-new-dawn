import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ROOT, parseOptions, safeRepoPath } from './cli.mjs'
import { scopeHash, summarize } from '../parity.mjs'

const STATE = 'work/orchestration/delivery-clock.json'
const MINUTE = 60_000

function parity(repo) {
  const ledger = JSON.parse(readFileSync(safeRepoPath(repo, 'parity.json'), 'utf8'))
  const summary = summarize(ledger, repo)
  return { scope: scopeHash(ledger), percent: 100 * summary.earned / summary.total }
}

export function report(state, currentParity, now = Date.now()) {
  if (!state) return { status: 'not-started', action: 'Start the delivery clock for the selected feature.' }
  assert(now >= state.events.at(-1).at, 'Clock moved backwards; investigate before updating timing')
  const elapsedMinutes = (now - state.startedAt) / MINUTE
  const gameplay = state.events.filter(event => event.kind === 'gameplay')
  const minutesWithoutGameplay = (now - (gameplay.at(-1)?.at ?? state.startedAt)) / MINUTE
  const taskMinutes = state.active ? (now - state.active.startedAt) / MINUTE : null
  const comparable = currentParity.scope === state.parity.scope
  const parityGain = comparable ? currentParity.percent - state.parity.percent : null
  const status = minutesWithoutGameplay >= 60 ? 'recover-now'
    : minutesWithoutGameplay >= 30 || (state.active && taskMinutes > state.active.budgetMinutes)
      ? 'review-approach' : 'on-budget'
  return {
    status, observedAt: new Date(now).toISOString(), elapsedMinutes, minutesWithoutGameplay,
    activeTask: state.active, taskMinutes,
    parityPercentagePoints: parityGain,
    parityPercentagePointsPerHour: comparable && elapsedMinutes > 0 ? parityGain * 60 / elapsedMinutes : null,
    latestOutcome: state.events.at(-1),
    action: status === 'recover-now' ? 'Diagnose the delay and apply a supported recovery at the next safe boundary.'
      : status === 'review-approach' ? 'Compare remaining gameplay gaps with elapsed time; adjust the approach if needed.'
        : 'Continue toward the feature acceptance criteria.',
    limits: 'Wall time includes idle and external waits. Events cite agent-supplied evidence; they do not certify parity. Scope changes make parity rates incomparable.',
  }
}

export function progressStatus(repo = ROOT, now = Date.now()) {
  const path = safeRepoPath(repo, STATE, { mustExist: false })
  return report(existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null, parity(repo), now)
}

export function observeProgress(repo = ROOT, now = Date.now()) {
  try { return progressStatus(repo, now) }
  catch (error) {
    return { status: 'unavailable', reason: error.message,
      action: 'Inspect and repair the delivery clock without discarding its history. Verification results remain authoritative.' }
  }
}

export function main(argv = process.argv.slice(2), repo = ROOT, now = Date.now()) {
  const [command = 'status', ...rest] = argv
  const options = parseOptions(rest)
  assert(['start', 'note', 'finish', 'abandon', 'status'].includes(command), 'Unknown delivery clock command')
  const allowed = command === 'start' ? ['task', 'minutes']
    : command === 'status' ? [] : ['kind', 'note', 'evidence']
  for (const key of Object.keys(options)) assert(allowed.includes(key), `Unknown option: --${key}`)
  if (command === 'status') return progressStatus(repo, now)
  const path = safeRepoPath(repo, STATE, { mustExist: false })
  execFileSync('git', ['check-ignore', '-q', '--', STATE], { cwd: repo })
  const snapshot = parity(repo)
  const state = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8'))
    : { startedAt: now, parity: snapshot, active: null, events: [] }
  assert(!state.events.length || now >= state.events.at(-1).at, 'Clock moved backwards')
  if (command === 'start') {
    assert(options.task?.trim(), 'Requires --task')
    const budgetMinutes = Number(options.minutes)
    assert(Number.isFinite(budgetMinutes) && budgetMinutes > 0, 'Requires positive --minutes budget')
    assert(!state.active, 'Finish or abandon the active task; restarting must not erase elapsed time')
    state.active = { task: options.task, startedAt: now, budgetMinutes }
    state.events.push({ at: now, kind: 'start', ...state.active })
  } else {
    assert(state.active, 'Start a task first')
    assert(options.note?.trim(), 'Requires --note describing the outcome or blocker')
    const kind = command === 'abandon' ? 'blocked' : options.kind
    assert(['gameplay', 'research', 'refactor', 'workflow', 'blocked'].includes(kind), 'Requires a valid --kind')
    assert(options.evidence, 'Requires --evidence pointing to an existing local receipt or handoff')
    safeRepoPath(repo, options.evidence)
    const taskMinutes = (now - state.active.startedAt) / MINUTE
    const evidence = readFileSync(safeRepoPath(repo, options.evidence))
    assert(evidence.length, 'Evidence file must not be empty')
    state.events.push({ at: now, task: state.active.task, kind, note: options.note,
      evidence: options.evidence, taskMinutes,
      evidenceHash: createHash('sha256').update(evidence).digest('hex'),
      commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim(),
      feedback: command === 'finish' && kind === 'gameplay'
        ? taskMinutes <= state.active.budgetMinutes ? 'delivered-within-budget: retain the effective approach'
          : 'delivered-over-budget: identify avoidable delay'
        : 'supporting-work: no feature-delivery reward',
    })
    if (command !== 'note') state.active = null
  }
  // ponytail: one parent writer; add a file lock only if concurrent writers are introduced.
  mkdirSync(dirname(path), { recursive: true })
  const temporary = safeRepoPath(repo, `${STATE}.tmp`, { mustExist: false })
  writeFileSync(temporary, `${JSON.stringify(state, null, 2)}\n`)
  renameSync(temporary, path)
  return report(state, snapshot, now)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try { console.log(JSON.stringify(main(), null, 2)) }
  catch (error) { console.error(`delivery clock: ${error.message}`); process.exitCode = 1 }
}
