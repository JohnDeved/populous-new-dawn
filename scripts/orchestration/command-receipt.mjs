#!/usr/bin/env node
import assert from 'node:assert/strict'
import { spawnSync, execFileSync } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import { mkdirSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, normalize, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

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

export function runCommandReceipt(repo, { output, command, env = process.env, cwd = repo }) {
  assert(Array.isArray(command) && command.length, 'receipt command is required')
  assert(
    command.every(value => typeof value === 'string' && value.length),
    'receipt command arguments must be non-empty strings'
  )
  const target = safeOutput(repo, output),
    headOid = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim(),
    startedAt = new Date().toISOString(),
    result = spawnSync(command[0], command.slice(1), {
      cwd,
      env,
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
    }),
    finishedAt = new Date().toISOString(),
    stdout = result.stdout ?? '',
    stderr = result.stderr ?? '',
    receipt = {
      version: 1,
      kind: 'pnd-command-receipt',
      source: {
        headOid,
        branch: execFileSync('git', ['branch', '--show-current'], {
          cwd: repo,
          encoding: 'utf8',
        }).trim(),
      },
      command,
      cwd: resolve(cwd),
      startedAt,
      finishedAt,
      exitCode: result.status,
      signal: result.signal,
      stdout,
      stderr,
      stdoutSha256: sha256(stdout),
      stderrSha256: sha256(stderr),
    }
  mkdirSync(dirname(target), { recursive: true })
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
    assert(flag === '--output', `unknown receipt option: ${flag}`)
    const value = before[++index]
    assert(value && !value.startsWith('--'), 'missing value for --output')
    assert(!options.output, 'duplicate --output')
    options.output = value
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
        status: receipt.exitCode === 0 ? 'passed' : 'failed',
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
  process.exitCode = receipt.exitCode === 0 ? 0 : (receipt.exitCode ?? 1)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main()
