#!/usr/bin/env node
import assert from 'node:assert/strict'
import { spawnSync, execFileSync } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import { closeSync, mkdirSync, openSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, normalize, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isDeepStrictEqual } from 'node:util'

export const ROOT = fileURLToPath(new URL('../../', import.meta.url))
const sha256 = value => createHash('sha256').update(value).digest('hex')

function safeOutput(repo, value) {
  assert(typeof value === 'string' && value.length, 'receipt output is required')
  assert(
    value.startsWith('work/orchestration/') && value.endsWith('.json'),
    'receipt output must be JSON under work/orchestration/'
  )
  assert(!isAbsolute(value) && !value.includes('\0'), `unsafe receipt output: ${value}`)
  assert(value.replaceAll('\\', '/') === value, `non-canonical receipt output: ${value}`)
  assert(!value.split('/').includes('..'), `unsafe receipt output traversal: ${value}`)
  assert(normalize(value).split(sep).join('/') === value, `non-canonical receipt output: ${value}`)
  const tracked = execFileSync('git', ['ls-files', '--', value], {
    cwd: repo,
    encoding: 'utf8',
  }).trim()
  assert(!tracked, 'receipt output must remain untracked')
  const ignored = spawnSync('git', ['check-ignore', '-q', '--', value], { cwd: repo })
  assert.equal(ignored.status, 0, 'receipt output must be ignored')
  return resolve(repo, value)
}

function sourceSnapshot(repo, inputs) {
  const git = (...args) => execFileSync('git', args, { cwd: repo, maxBuffer: 32 * 1024 * 1024 })
  return {
    headOid: git('rev-parse', 'HEAD').toString().trim(),
    branch: git('branch', '--show-current').toString().trim(),
    trackedDiffSha256: sha256(git('diff', 'HEAD', '--binary')),
    inputs: Object.fromEntries(inputs.map(file => [file, sha256(readFileSync(resolve(repo, file)))])),
  }
}

export function runCommandReceipt(repo, { output, command, inputs = [], env = process.env, cwd = repo }) {
  assert(Array.isArray(command) && command.length, 'receipt command is required')
  assert(
    command.every(value => typeof value === 'string' && value.length),
    'receipt command arguments must be non-empty strings'
  )
  assert(Array.isArray(inputs) && inputs.every(file => typeof file === 'string' && file.length), 'receipt inputs must be file paths')
  const target = safeOutput(repo, output),
    source = sourceSnapshot(repo, inputs),
    artifacts = `${target}.artifacts`,
    stdoutPath = `${artifacts}/stdout.log`,
    stderrPath = `${artifacts}/stderr.log`,
    started = {
      version: 1,
      kind: 'pnd-command-receipt',
      runId: randomUUID(),
      status: 'unknown',
      phase: 'prepared',
      source,
      command,
      cwd: resolve(cwd),
      startedAt: new Date().toISOString(),
      artifacts: { stdout: stdoutPath, stderr: stderrPath },
    }
  mkdirSync(dirname(target), { recursive: true })
  // Each attempt needs a new output path. Never replace an earlier pass or an
  // unknown interrupted attempt; its logs may still belong to a live command.
  mkdirSync(artifacts)
  writeFileSync(target, `${JSON.stringify(started, null, 2)}\n`, { flag: 'wx' })
  const stdoutFd = openSync(stdoutPath, 'wx', 0o600),
    stderrFd = openSync(stderrPath, 'wx', 0o600)
  let result
  try {
    // Keep one foreground process tree, with raw output on disk during execution.
    // If this wrapper is killed, only the unknown prelaunch record remains.
    result = spawnSync(command[0], command.slice(1), {
      cwd,
      env,
      stdio: ['ignore', stdoutFd, stderrFd],
    })
  } finally {
    closeSync(stdoutFd)
    closeSync(stderrFd)
  }
  const stdout = readFileSync(stdoutPath, 'utf8'),
    stderr = readFileSync(stderrPath, 'utf8'),
    receipt = {
      ...started,
      phase: 'finished',
      status: result.status === 0 && !result.error ? 'passed' : 'failed',
      finishedAt: new Date().toISOString(),
      exitCode: result.status,
      signal: result.signal,
      error: result.error ? { code: result.error.code, message: result.error.message } : undefined,
      stdout,
      stderr,
      stdoutSha256: sha256(stdout),
      stderrSha256: sha256(stderr),
    }
  try {
    receipt.sourceAfter = sourceSnapshot(repo, inputs)
    if (!isDeepStrictEqual(receipt.source, receipt.sourceAfter)) receipt.status = 'invalidated'
  } catch (error) {
    receipt.status = 'invalidated'
    receipt.sourceError = error.message
  }
  const temporary = `${target}.${randomUUID()}.tmp`
  writeFileSync(temporary, `${JSON.stringify(receipt, null, 2)}\n`, { flag: 'wx' })
  renameSync(temporary, target)
  return receipt
}

function parseArgs(args) {
  const separator = args.indexOf('--')
  assert(separator >= 0, 'receipt command requires -- before the command')
  const before = args.slice(0, separator),
    command = args.slice(separator + 1),
    options = {}
  for (let index = 0; index < before.length; index++) {
    const flag = before[index]
    assert(['--output', '--input'].includes(flag), `unknown receipt option: ${flag}`)
    const value = before[++index]
    assert(value && !value.startsWith('--'), 'missing value for --output')
    if (flag === '--input') (options.inputs ??= []).push(value)
    else {
      assert(!options.output, 'duplicate --output')
      options.output = value
    }
  }
  assert(options.output, 'receipt command requires --output')
  assert(command.length, 'receipt command cannot be empty')
  return { output: options.output, command }
}

function main() {
  const options = parseArgs(process.argv.slice(2)),
    receipt = runCommandReceipt(ROOT, options)
  console.log(
    JSON.stringify(
      {
        status: receipt.status,
        output: options.output,
        headOid: receipt.source.headOid,
        exitCode: receipt.exitCode,
        stdoutSha256: receipt.stdoutSha256,
        stderrSha256: receipt.stderrSha256,
      },
      null,
      2
    )
  )
  process.exitCode = receipt.status === 'passed' ? 0 : (receipt.exitCode || 1)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main()
