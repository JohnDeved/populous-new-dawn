#!/usr/bin/env node
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, lstatSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { ROOT, changedPaths, parseOptions, safeRepoPath } from './cli.mjs'

// A cheap fail-closed screen, not a replacement for the selected final gates.
// Use the existing receipt wrapper outside this entry point to retain raw output.
export function preflightCommands(paths) {
  const source = [...new Set(paths)].filter(path => /\.(?:[cm]?js|jsx|tsx?)$/.test(path)).sort()
  const app = source.filter(path => /^app\/.*\.tsx?$/.test(path))
  return [
    ...(app.length ? [
      ['node_modules/.bin/oxfmt', '--check', '--', ...app],
      ['node_modules/.bin/oxlint', '--deny-warnings', '--', ...app],
    ] : []),
    ...(source.length ? [['node_modules/.bin/eslint', '--max-warnings', '0', '--', ...source]] : []),
    ['node', 'scripts/orchestration/cli.mjs', 'check'],
    ['node', '--test', '--test-name-pattern=context', 'tests/orchestration.test.mjs'],
  ]
}

// Match the planner's independent comparisons: an unstaged repair must not hide
// a staged finding (nor a worktree repair hide one already committed on the branch).
export function whitespaceCommands(repo, changes) {
  const diff = ['git', 'diff', '--no-ext-diff', '--no-textconv', '--check']
  const untracked = [...new Set(changes.records
    .filter(record => record.source === 'untracked').map(record => record.path))].sort()
  return [
    [...diff, `${changes.baseCommit}..HEAD`, '--'],
    [...diff, '--cached', '--'],
    [...diff, '--'],
    ...untracked.filter(path => lstatSync(safeRepoPath(repo, path)).isFile())
      .map(path => [...diff, '--no-index', '--', '/dev/null', path]),
  ]
}

export function runPreflight(repo, base, execute = spawnSync) {
  assert(typeof base === 'string' && base, 'Requires --base <accepted-base>')
  const changes = changedPaths(repo, base)
  const paths = [...new Set(changes.records.map(record => record.path))]
    .filter(path => existsSync(safeRepoPath(repo, path, { mustExist: false })))
  const results = []
  for (const command of [...whitespaceCommands(repo, changes), ...preflightCommands(paths)]) {
    const startedAt = new Date().toISOString()
    const noIndex = command[0] === 'git' && command.includes('--no-index')
    const result = execute(command[0], command.slice(1), {
      cwd: repo, stdio: noIndex ? ['inherit', 'inherit', 'pipe'] : 'inherit',
      timeout: 120_000, shell: false,
    })
    // --no-index implies --exit-code: 1 can mean either a clean difference or
    // an access error. Only accept it without diagnostics; 3 includes whitespace
    // errors. Forward diagnostics and retain the real exit code in the receipt.
    if (noIndex && result.stderr?.length) process.stderr.write(result.stderr)
    const cleanDifference = noIndex && result.status === 1 && result.stderr?.length === 0
    const status = result.error ? 'blocked' : result.status === 0 || cleanDifference ? 'passed' : 'failed'
    results.push({ command, startedAt, finishedAt: new Date().toISOString(), status,
      exitCode: result.status, signal: result.signal ?? null,
      error: result.error?.message ?? null })
    // Missing tools, timeouts, warnings, and inherited findings are never silently green.
    if (status !== 'passed') break
  }
  return { base: changes.baseCommit, paths, results,
    status: results.every(result => result.status === 'passed') ? 'passed' : results.at(-1).status,
    finalGate: false }
}

export function main(argv = process.argv.slice(2), repo = ROOT) {
  const options = parseOptions(argv)
  assert(Object.keys(options).every(key => key === 'base'), 'Only --base is supported')
  return runPreflight(repo, options.base)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    const result = main()
    console.log(JSON.stringify(result, null, 2))
    if (result.status !== 'passed') process.exitCode = 1
  } catch (error) {
    console.error(`orchestration preflight: ${error.message}`)
    process.exitCode = 1
  }
}
