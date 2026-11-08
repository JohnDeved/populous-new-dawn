#!/usr/bin/env node
import assert from 'node:assert/strict'
import { spawnSync, execFileSync } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { isAbsolute, normalize, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isDeepStrictEqual } from 'node:util'
import { captureMeasurement, finishMeasurement, refreshMeasurement } from '../parity-measure.mjs'
import { captureReceiptOutput, receiptRawBudget } from './command-log.mjs'
import { createReceiptArtifacts } from './receipt-streams.mjs'
import { runCommandReceipt as runLegacyCommandReceipt } from './command-receipt-v1.mjs'

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

export function runCommandReceipt(repo, { output, command, inputs = [], env = process.env, cwd = repo, streamVersion = 1, maxRawBytes }) {
  assert(streamVersion === 1 || streamVersion === 2, 'receipt stream version must be 1 or 2')
  const rawLogBudget = receiptRawBudget(env, maxRawBytes)
  // Preserve the existing default workflow until raw-log bundle export is qualified.
  if (streamVersion === 1) return runLegacyCommandReceipt(repo, { output, command, inputs, env, cwd, maxRawBytes: rawLogBudget.snapshot().maxBytes })
  assert(Array.isArray(command) && command.length, 'receipt command is required')
  assert(
    command.every(value => typeof value === 'string' && value.length),
    'receipt command arguments must be non-empty strings'
  )
  assert(Array.isArray(inputs) && inputs.every(file => typeof file === 'string' && file.length), 'receipt inputs must be file paths')
  const measurementBefore = captureMeasurement(repo, command, { cwd })
  const target = safeOutput(repo, output),
    source = sourceSnapshot(repo, inputs),
    artifacts = `${target}.artifacts`,
    stdoutPath = `${artifacts}/stdout.log`,
    stderrPath = `${artifacts}/stderr.log`,
    started = {
      version: 2,
      streamFormat: 'raw-artifact-v1',
      kind: 'pnd-command-receipt',
      runId: randomUUID(),
      status: 'unknown',
      phase: 'prepared',
      source,
      command,
      cwd: resolve(cwd),
      startedAt: new Date().toISOString(),
      artifacts: { stdout: stdoutPath, stderr: stderrPath },
      rawBudget: rawLogBudget.snapshot(),
    }
  started.parityMeasurements = finishMeasurement(measurementBefore, measurementBefore, { status: 'unknown', exitCode: null, finishedAt: started.startedAt })
  // Fresh, pinned handles preserve raw bytes without reopening child-controlled
  // paths. An interrupted/uncapturable run never invents successful completion.
  const evidence = createReceiptArtifacts(target)
  return (async () => {
    let operationError
    try {
      evidence.write(started)
      const result = await captureReceiptOutput(command, { cwd, env, rawLogBudget,
        fds: { stdout: evidence.fd('stdout'), stderr: evidence.fd('stderr') } })
      const failure = result.captureError ?? result.spawnError
      operationError = result.captureError
      const receipt = {
        ...started,
        phase: 'finished',
        status: result.exitCode === 0 && !failure ? 'passed' : 'failed',
        finishedAt: new Date().toISOString(),
        exitCode: result.exitCode,
        signal: result.signal,
        error: failure ? { code: rawLogBudget.error?.code ?? failure.code, message: failure.message } : undefined,
        rawBudget: rawLogBudget.snapshot(),
        rawCapture: { complete: result.complete, streams: result.streams,
          ...(result.drainIncomplete ? { drainIncomplete: true, ownedChildPid: result.ownedChildPid, ownedChildExited: result.ownedChildExited } : {}) },
      }
      try {
        Object.assign(receipt, evidence.capture())
        for (const name of ['stdout', 'stderr']) assert.equal(receipt.streams[name].sha256, result.streams[name].sha256, 'Raw receipt output differs from observed child bytes')
      } catch (error) {
        receipt.status = 'invalidated'
        receipt.captureError = error.message
      }
      try {
        receipt.sourceAfter = sourceSnapshot(repo, inputs)
        if (!isDeepStrictEqual(receipt.source, receipt.sourceAfter)) receipt.status = 'invalidated'
      } catch (error) {
        receipt.status = 'invalidated'
        receipt.sourceError = error.message
      }
      let measurementAfter = []
      try { measurementAfter = captureMeasurement(repo, command, { cwd }) } catch {
        // The empty after-state invalidates prior measurements, as for v1.
      }
      receipt.parityMeasurements = finishMeasurement(measurementBefore, measurementAfter, receipt)
      // A replaced path prevents terminal writing. The original pinned evidence
      // and prepared state remain retained, rather than writing through an alias.
      return evidence.write(receipt, true)
    } catch (error) { operationError = error; throw error }
    finally { evidence.close(operationError) }
  })()

}

function parseArgs(args) {
  const separator = args.indexOf('--')
  assert(separator >= 0, 'receipt command requires -- before the command')
  const before = args.slice(0, separator),
    command = args.slice(separator + 1),
    options = {}
  for (let index = 0; index < before.length; index++) {
    const flag = before[index]
    assert(['--output', '--input', '--stream-version'].includes(flag), `unknown receipt option: ${flag}`)
    const value = before[++index]
    assert(value && !value.startsWith('--'), 'missing value for --output')
    if (flag === '--stream-version') {
      assert(!Object.hasOwn(options, 'streamVersion'), 'duplicate --stream-version')
      assert(value === '1' || value === '2', 'receipt stream version must be 1 or 2')
      options.streamVersion = Number(value)
    } else if (flag === '--input') (options.inputs ??= []).push(value)
    else {
      assert(!options.output, 'duplicate --output')
      options.output = value
    }
  }
  assert(options.output, 'receipt command requires --output')
  assert(command.length, 'receipt command cannot be empty')
  return { ...options, command }
}

async function main() {
  const options = parseArgs(process.argv.slice(2)),
    receipt = await runCommandReceipt(ROOT, options)
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
  refreshMeasurement(ROOT)
  process.exitCode = receipt.status === 'passed' ? 0 : (receipt.exitCode || 1)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main()
