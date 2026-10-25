import { packageScriptCommand } from './dependency-profile.mjs'
import { captureCommand, createRawLogBudget, createServerLog, writeLegacyLog } from './command-log.mjs'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  ROOT,
  changedPaths,
  fingerprintPaths,
  parseOptions,
  safeRepoPath,
  validateContract,
  validateRepository,
} from './cli.mjs'

import { browserSourceFingerprint, captureMeasurement, finishMeasurement, refreshMeasurement } from '../parity-measure.mjs'

const RECORDING_ARGUMENT = /(^|[/:-])record(?:ing)?($|[=:/-])/i
const TIMEOUT_MS = 300_000

function fileHash(path) {
  const hash = createHash('sha256')
  hash.update(readFileSync(path))
  return hash.digest('hex')
}

function checkoutState(repo, base) {
  return JSON.stringify(changedPaths(repo, base).records)
}

function commandFor(check, env) {
  return [check.executable, ...check.args].map(value =>
    value.startsWith('$') ? env[value.slice(1)] ?? value : value
  )
}

function blocked(check, fingerprint, command, reason) {
  return {
    checkId: check.id,
    status: 'blocked',
    command,
    testedFingerprint: fingerprint,
    inputPaths: check.inputs,
    artifacts: [],
    reason,
  }
}

export function checkAutomation(check) {
  if (check.automation !== 'safe') return 'check is not allowlisted for automation'
  if ([check.executable, ...check.args].some(value => RECORDING_ARGUMENT.test(value)))
    return 'recording commands are never run by verification'
  return null
}

// One 64 MiB default raw allowance per verifier attempt, shared by every check
// and owned server. Configure bytes with POPULOUS_VERIFY_MAX_RAW_BYTES (zero is
// valid). This is not an allowance for derivatives, artifacts or old attempts.
function verificationRawBudget(env) {
  const value = env.POPULOUS_VERIFY_MAX_RAW_BYTES
  assert(value === undefined || /^(0|[1-9][0-9]*)$/.test(value),
    'POPULOUS_VERIFY_MAX_RAW_BYTES must be a nonnegative safe integer')
  return createRawLogBudget(value === undefined ? undefined : Number(value))
}

export function runCommand(command, { cwd, env, timeoutMs, captureDirectory, rawLogBudget = verificationRawBudget(env) }) {
  return captureCommand(command, { cwd, env, timeoutMs, directory: captureDirectory,
    diagnosticMode: 'raw-only-v2', rawLogBudget })
}

async function waitForServer(url, timeoutMs, child, failure = () => null) {
  const end = Date.now() + timeoutMs
  while (Date.now() < end) {
    if (failure()) throw failure()
    if (child && (child.exitCode != null || child.signalCode != null)) throw new Error(`game server exited with ${child.exitCode ?? child.signalCode}`)
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error(`game server was not ready within ${timeoutMs}ms`)
}

// Only the exact spawned child is owned. Descendants may retain stdio after
// that child exits; a finite drain timeout records incomplete capture, not a
// claim that descendants were stopped. Synchronous disk writes can delay timers.
function ownServer(child, capture) {
  let closed = false, captureError, stopping, intentionalStop = false
  const cleanupErrors = []
  let resolveClosed
  const closing = new Promise(resolve => { resolveClosed = resolve })
  const fail = error => { captureError ??= error }
  child.once('error', fail)
  child.once('close', () => { closed = true; resolveClosed() })
  for (const stream of [child.stdout, child.stderr]) {
    stream.on('error', fail)
    stream.on('data', bytes => {
      if (!captureError) try { capture.write(bytes) } catch (error) {
        fail(error)
        // Begin bounded owned cleanup immediately; the caller still observes it.
        void stop().catch(() => {})
      }
    })
  }
  const live = () => child.pid && child.exitCode === null && child.signalCode === null
  const waitClose = async ms => {
    let timer
    try { await Promise.race([closing, new Promise(resolve => { timer = setTimeout(resolve, ms) })]) }
    finally { clearTimeout(timer) }
  }
  const signal = name => {
    if (live()) try { assert(child.kill(name), `Owned server could not be signaled with ${name}`) }
    catch (error) { cleanupErrors.push(error); fail(error) }
  }
  const stop = () => stopping ??= (async () => {
    if (!live() && !captureError) fail(new Error('Owned game server exited before verification completed'))
    intentionalStop = true
    signal('SIGTERM')
    if (!closed) await waitClose(2_000)
    signal('SIGKILL')
    if (!closed) await waitClose(2_000)
    if (!closed) {
      fail(new Error('Owned server stdio did not close before drain deadline; descendant cleanup is not claimed'))
      // Mark incomplete before releasing parent handles. A resulting close is
      // not genuine drained completion and cannot clear the error.
      child.stdin.destroy(); child.stdout.destroy(); child.stderr.destroy()
      child.unref()
    }
    const error = cleanupErrors.length
      ? new AggregateError([...(captureError ? [captureError] : []), ...cleanupErrors], 'Owned server cleanup failed')
      : captureError
    try { return capture.finish(error, { drainIncomplete: !closed, ownedChildExited: !live(), ownedChildPid: child.pid }) }
    finally { unsubscribe() }
  })()
  const unsubscribe = capture.subscribe(error => {
    fail(error)
    void stop().catch(() => {})
  })
  return { stop, failure: () => captureError ??
    (!intentionalStop && closed ? new Error('Owned game server closed before verification completed') : null) }
}

export async function startGameServer(repo, env, logPath, { rawLogBudget = verificationRawBudget(env) } = {}) {
  const supplied = env.POPULOUS_URL
  if (supplied) {
    await waitForServer(supplied, 10_000)
    return { url: supplied, owned: false, stop: async () => {} }
  }
  const port = Number(env.POPULOUS_PORT ?? 3000)
  assert(Number.isInteger(port) && port > 0 && port < 65536, 'POPULOUS_PORT must be a valid port')
  const url = `http://localhost:${port}`
  let occupied = false
  try {
    await fetch(url)
    occupied = true
  } catch {}
  if (occupied) throw new Error(`refusing to reuse an unidentified server at ${url}`)
  const ownedSourceFingerprint = existsSync(join(repo, 'engineering/parity-capabilities.json')) ? browserSourceFingerprint(repo) : null
  const [manager, ...args] = packageScriptCommand(repo, 'dev', ['--port', String(port)])
  const capture = createServerLog(logPath, { rawLogBudget })
  let child
  try { child = spawn(manager, args, { cwd: repo, env, shell: false }) }
  catch (error) { capture.finish(error); throw error }
  const owner = ownServer(child, capture)
  try {
    // Existing readiness fetches have no hard per-request wall-time bound.
    await waitForServer(url, 30_000, child, owner.failure)
    if (owner.failure()) throw owner.failure()
    return { url, owned: true, sourceFingerprint: ownedSourceFingerprint,
      capture: capture.reference, stop: owner.stop }
  } catch (error) {
    try { await owner.stop() } catch (cleanup) { throw new AggregateError([error, cleanup], 'Game server startup and capture failed') }
    throw error
  }
}

function nativePreflight(repo, env) {
  const executable = env.POPULOUS_EXE
  if (!executable) return 'missing environment: POPULOUS_EXE'
  if (!existsSync(executable)) return `missing native executable: ${executable}`
  const expected = JSON.parse(readFileSync(safeRepoPath(repo, 'decomp/tools.json'), 'utf8'))
    .executableSha256
  const actual = fileHash(executable)
  return actual === expected ? null : `native executable SHA-256 mismatch: ${actual}`
}

export async function verifyContract(
  repo,
  contractPath,
  { env = process.env, execute = runCommand, startServer = startGameServer } = {}
) {
  const rawLogBudget = verificationRawBudget(env)
  const manifests = validateRepository(repo),
    absoluteContract = safeRepoPath(repo, contractPath),
    contract = JSON.parse(readFileSync(absoluteContract, 'utf8'))
  assert(
    Array.isArray(contract.verification?.requiredCheckIds),
    'verification.requiredCheckIds must be an array'
  )
  const requiredIds = new Set(contract.verification.requiredCheckIds)
  if (Array.isArray(contract.verification.results))
    contract.verification.results = contract.verification.results.filter(
      result => !requiredIds.has(result.checkId)
    )
  validateContract(repo, contract, manifests)
  const checks = new Map(manifests.checks.checks.map(check => [check.id, check])),
    coverage = contract.verification.coverage ?? [],
    required = contract.verification.requiredCheckIds.map(id => ({
      ...checks.get(id),
      inputs: [...new Set([
        ...checks.get(id).inputs,
        ...coverage.filter(item => item.coveredBy === id)
          .flatMap(item => checks.get(item.checkId).inputs),
        ...(coverage.some(item => item.coveredBy === id) ? ['package.json', 'engineering/checks.json'] : []),
      ])],
    })),
    logDirectory = safeRepoPath(
      repo,
      `work/orchestration/${contract.identity.taskId}/checks`,
      { mustExist: false }
    )
  mkdirSync(logDirectory, { recursive: true })
  const results = required.map(check => ({
      ...blocked(check, fingerprintPaths(repo, check.inputs), commandFor(check, env),
        'No completed result in this run; check is pending'),
      status: 'not-run',
      coveredCheckIds: [],
    })),
    runEnv = { ...env },
    initialState = checkoutState(repo, contract.identity.baseCommit)
  contract.verification.results = [
    ...contract.verification.results.filter(result => !requiredIds.has(result.checkId)),
    ...results,
  ]
  const persist = () => {
    const temporary = `${absoluteContract}.${randomUUID()}.tmp`
    writeFileSync(temporary, `${JSON.stringify(contract, null, 2)}\n`, { flag: 'wx' })
    renameSync(temporary, absoluteContract)
  }
  const record = result => {
    result.coveredCheckIds ??= []
    const current = captureMeasurement(repo, result.command)
    result.parityMeasurements ??= finishMeasurement(current, current, { ...result, finishedAt: new Date().toISOString() })
    results[results.findIndex(item => item.checkId === result.checkId)] = result
    contract.verification.results = contract.verification.results.map(item =>
      item.checkId === result.checkId ? result : item)
    persist()
  }
  for (const result of results) {
    const current = captureMeasurement(repo, result.command)
    result.parityMeasurements = finishMeasurement(current, current, { ...result, finishedAt: new Date().toISOString() })
  }
  // Clear old passes before executing; interrupted runs retain only completed receipts.
  persist()
  let gameServer = null,
    serverSegment = null,
    nativeError,
    stopReason = null
  // Candidates contain only receipt metadata, never process output. Persisted
  // rows remain blocked until this exact owned segment has fully finalized.
  const finishServer = async () => {
    const server = gameServer, segment = serverSegment
    gameServer = null
    serverSegment = null
    if (!server) return
    if (!env.POPULOUS_URL) delete runEnv.POPULOUS_URL
    if (!segment) return // A supplied URL is not owned and must not be signaled.
    let stopped
    try { stopped = await server.stop() } catch (error) {
      if (rawLogBudget.error) for (const candidate of segment.candidates) {
        const pending = results.find(item => item.checkId === candidate.checkId)
        record({ ...pending, reason: rawLogBudget.error.message, rawBudget: rawLogBudget.snapshot() })
      }
      throw error
    }
    const capture = server.capture ? stopped : null
    if (server.capture) assert(capture?.complete === true &&
      ['version', 'path', 'runId', 'log'].every(key => capture[key] === server.capture[key]),
    'Owned server capture did not complete')
    for (const candidate of segment.candidates) {
      if (capture) candidate.serverCapture = { ...capture,
        path: relative(repo, capture.path), log: relative(repo, capture.log) }
      results[results.findIndex(item => item.checkId === candidate.checkId)] = candidate
      contract.verification.results = contract.verification.results.map(item =>
        item.checkId === candidate.checkId ? candidate : item)
    }
    persist()
  }
  const recordCompleted = result => {
    if (!serverSegment) return record(result)
    serverSegment.candidates.push(result)
    record({ ...result, status: 'blocked', coveredCheckIds: [],
      reason: 'Owned game server capture is pending finalization',
      serverCapture: serverSegment.reference,
      parityMeasurements: result.parityMeasurements.map(item => ({ ...item, status: 'blocked' })),
    })
  }
  let verificationError
  try {
    for (const check of required) {
      if (check.kind !== 'browser' && gameServer) {
        await finishServer()
      }
      const fingerprint = fingerprintPaths(repo, check.inputs),
        command = commandFor(check, runEnv),
        automationError = checkAutomation(check)
      if (stopReason || rawLogBudget.error) {
        record(blocked(check, fingerprint, command, stopReason ?? rawLogBudget.error.message))
        continue
      }
      if (automationError) {
        record(blocked(check, fingerprint, command, automationError))
        continue
      }
      const missing = check.env.filter(name => !runEnv[name])
      if (missing.length) {
        record(blocked(check, fingerprint, command, `missing environment: ${missing.join(', ')}`))
        continue
      }
      if (check.kind === 'native') {
        nativeError ??= nativePreflight(repo, runEnv) ?? false
        if (nativeError) {
          record(blocked(check, fingerprint, command, nativeError))
          continue
        }
      }
      if (check.kind === 'browser' && !gameServer) {
        const serverLog = join(dirname(logDirectory), `game-server.${randomUUID()}.log`)
        const owned = !env.POPULOUS_URL
        const reference = { version: 1, path: relative(repo, serverLog + '.capture.json'),
          log: relative(repo, serverLog), complete: false }
        // Identify startup evidence before the server can emit a single byte.
        if (owned) record({ ...blocked(check, fingerprint, command,
          'Owned game server startup is pending'), serverCapture: reference })
        try {
          gameServer = await startServer(repo, runEnv, serverLog, { rawLogBudget })
          serverSegment = owned ? { reference, candidates: [] } : null
          runEnv.POPULOUS_URL = gameServer.url
        } catch (error) {
          record({ ...blocked(check, fingerprint, command, rawLogBudget.error?.message ?? error.message),
            ...(owned ? { serverCapture: reference } : {}) })
          if (rawLogBudget.error) throw error
          continue
        }
      }
      const concreteCommand = commandFor(check, runEnv)
      const captureDirectory = join(logDirectory, `${check.id}.${randomUUID()}`)
      const pending = blocked(check, fingerprint, concreteCommand,
        'Execution started; no completed result is available if this run is interrupted')
      if (execute === runCommand) pending.capture = {
        version: 2, path: relative(repo, join(captureDirectory, 'capture.json')), complete: false,
      }
      if (serverSegment) pending.serverCapture = serverSegment.reference
      record(pending)
      const measurementContext = { cwd: safeRepoPath(repo, check.cwd), ownedServerFingerprint: gameServer?.sourceFingerprint ?? null }
      const measurementBefore = captureMeasurement(repo, concreteCommand, measurementContext)
      const started = performance.now()
      let outcome, log
      try {
        outcome = await execute(concreteCommand, {
          cwd: safeRepoPath(repo, check.cwd),
          env: runEnv,
          timeoutMs: TIMEOUT_MS,
          captureDirectory,
          rawLogBudget,
        })
        if (rawLogBudget.error) throw rawLogBudget.error
        if (outcome.capture) assert(outcome.capture.complete === true, 'Command capture is incomplete')
        log = outcome.capture?.complete
          ? outcome.capture.log
          : writeLegacyLog(logDirectory, check.id, `${outcome.stdout}${outcome.stderr}`, { rawLogBudget })
      } catch (error) {
        if (rawLogBudget.error) record({ ...pending, reason: rawLogBudget.error.message,
          rawBudget: rawLogBudget.snapshot() })
        throw error
      }
      const durationMs = Math.round(performance.now() - started)
      const changedState = checkoutState(repo, contract.identity.baseCommit),
        changedFingerprint = fingerprintPaths(repo, check.inputs),
        artifacts = check.expected.artifacts.filter(path =>
          existsSync(safeRepoPath(repo, path, { mustExist: false }))
        )
      let reason = ''
      if (changedState !== initialState) {
        reason = 'check changed the tracked or relevant untracked checkout'
        stopReason = reason
      } else if (changedFingerprint !== fingerprint) {
        reason = 'check changed fingerprinted inputs'
        stopReason = reason
      } else if (outcome.timedOut) reason = `check exceeded ${TIMEOUT_MS}ms`
      else if (outcome.exitCode !== check.expected.exitCode)
        reason = `expected exit ${check.expected.exitCode}, received ${outcome.exitCode}`
      else {
        const missingArtifacts = check.expected.artifacts.filter(path => !artifacts.includes(path))
        if (missingArtifacts.length) reason = `missing artifacts: ${missingArtifacts.join(', ')}`
      }
      recordCompleted({
        checkId: check.id,
        status: reason ? 'failed' : 'passed',
        command: concreteCommand,
        testedFingerprint: fingerprint,
        inputPaths: check.inputs,
        exitCode: outcome.exitCode,
        artifacts,
        reason,
        durationMs,
        ...(log ? { log: relative(repo, log) } : {}),
        ...(outcome.capture ? { capture: { ...outcome.capture,
          path: relative(repo, outcome.capture.path),
          ...(outcome.capture.log ? { log: relative(repo, outcome.capture.log) } : {}) } } : {}),
        parityMeasurements: finishMeasurement(measurementBefore, captureMeasurement(repo, concreteCommand, measurementContext), { status: reason ? 'failed' : 'passed', exitCode: outcome.exitCode, finishedAt: new Date().toISOString() }),
        coveredCheckIds: reason ? [] : coverage.filter(item => item.coveredBy === check.id)
          .map(item => item.checkId),
      })
    }
  } catch (error) {
    verificationError = error
  } finally {
    try { await finishServer() } catch (error) {
      verificationError = verificationError
        ? new AggregateError([verificationError, error], 'Verification and server finalization failed') : error
    } finally {
      try { refreshMeasurement(repo) } catch (error) {
        verificationError = verificationError
          ? new AggregateError([verificationError, error], 'Verification and measurement refresh failed') : error
      }
    }
  }
  if (rawLogBudget.error) throw new AggregateError([rawLogBudget.error, ...(verificationError ? [verificationError] : [])],
    rawLogBudget.error.message)
  if (verificationError) throw verificationError
  const status = results.some(result => result.status === 'failed')
    ? 'failed'
    : results.some(result => result.status !== 'passed')
      ? 'blocked'
      : 'passed'
  return { status, results }
}

async function main() {
  const options = parseOptions(process.argv.slice(2))
  assert(options.contract, 'verify requires --contract')
  const result = await verifyContract(ROOT, options.contract)
  console.log(JSON.stringify(result, null, 2))
  process.exitCode = result.status === 'passed' ? 0 : result.status === 'failed' ? 1 : 2
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1])
  main().catch(error => {
    console.error(`orchestration: ${error.message}`)
    process.exitCode = 1
  })
