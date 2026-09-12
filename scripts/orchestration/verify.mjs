import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { once } from 'node:events'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
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

export function runCommand(command, { cwd, env, timeoutMs }) {
  return new Promise(resolve => {
    const child = spawn(command[0], command.slice(1), { cwd, env, shell: false }),
      stdout = [],
      stderr = []
    child.stdout.on('data', chunk => stdout.push(chunk))
    child.stderr.on('data', chunk => stderr.push(chunk))
    const timer = setTimeout(() => child.kill('SIGKILL'), timeoutMs)
    child.on('error', error => {
      clearTimeout(timer)
      resolve({ exitCode: 1, stdout: '', stderr: error.message, timedOut: false })
    })
    child.on('close', code => {
      clearTimeout(timer)
      resolve({
        exitCode: code ?? 1,
        stdout: Buffer.concat(stdout).toString(),
        stderr: Buffer.concat(stderr).toString(),
        timedOut: code === null,
      })
    })
  })
}

async function waitForServer(url, timeoutMs, child) {
  const end = Date.now() + timeoutMs
  while (Date.now() < end) {
    if (child?.exitCode != null) throw new Error(`game server exited with ${child.exitCode}`)
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error(`game server was not ready within ${timeoutMs}ms`)
}

async function stopServer(child) {
  if (child.exitCode != null) return
  child.kill('SIGTERM')
  await Promise.race([once(child, 'exit'), new Promise(resolve => setTimeout(resolve, 2_000))])
  if (child.exitCode == null) child.kill('SIGKILL')
}

export async function startGameServer(repo, env, logPath) {
  const supplied = env.POPULOUS_URL
  if (supplied) {
    await waitForServer(supplied, 10_000)
    return { url: supplied, stop: async () => {} }
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
  const child = spawn('npm', ['run', 'dev', '--', '--port', String(port)], { cwd: repo, env, shell: false }),
    output = []
  child.stdout.on('data', chunk => output.push(chunk))
  child.stderr.on('data', chunk => output.push(chunk))
  try {
    await waitForServer(url, 30_000, child)
    return {
      url,
      stop: async () => {
        await stopServer(child)
        writeFileSync(logPath, Buffer.concat(output))
      },
    }
  } catch (error) {
    await stopServer(child)
    writeFileSync(logPath, Buffer.concat(output))
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
  const manifests = validateRepository(repo),
    absoluteContract = safeRepoPath(repo, contractPath),
    contract = JSON.parse(readFileSync(absoluteContract, 'utf8'))
  validateContract(repo, contract, manifests)
  const checks = new Map(manifests.checks.checks.map(check => [check.id, check])),
    required = contract.verification.requiredCheckIds.map(id => checks.get(id)),
    logDirectory = safeRepoPath(
      repo,
      `work/orchestration/${contract.identity.taskId}/checks`,
      { mustExist: false }
    )
  mkdirSync(logDirectory, { recursive: true })
  const results = [],
    runEnv = { ...env },
    initialState = checkoutState(repo, contract.identity.baseCommit)
  let gameServer = null,
    nativeError,
    stopReason = null
  try {
    for (const check of required) {
      if (check.kind !== 'browser' && gameServer) {
        await gameServer.stop()
        gameServer = null
        if (!env.POPULOUS_URL) delete runEnv.POPULOUS_URL
      }
      const fingerprint = fingerprintPaths(repo, check.inputs),
        command = commandFor(check, runEnv),
        automationError = checkAutomation(check)
      if (stopReason) {
        results.push(blocked(check, fingerprint, command, stopReason))
        continue
      }
      if (automationError) {
        results.push(blocked(check, fingerprint, command, automationError))
        continue
      }
      const missing = check.env.filter(name => !runEnv[name])
      if (missing.length) {
        results.push(blocked(check, fingerprint, command, `missing environment: ${missing.join(', ')}`))
        continue
      }
      if (check.kind === 'native') {
        nativeError ??= nativePreflight(repo, runEnv) ?? false
        if (nativeError) {
          results.push(blocked(check, fingerprint, command, nativeError))
          continue
        }
      }
      if (check.kind === 'browser' && !gameServer) {
        const serverLog = join(dirname(logDirectory), 'game-server.log')
        try {
          gameServer = await startServer(repo, runEnv, serverLog)
          runEnv.POPULOUS_URL = gameServer.url
        } catch (error) {
          results.push(blocked(check, fingerprint, command, error.message))
          continue
        }
      }
      const concreteCommand = commandFor(check, runEnv),
        started = performance.now(),
        outcome = await execute(concreteCommand, {
          cwd: safeRepoPath(repo, check.cwd),
          env: runEnv,
          timeoutMs: TIMEOUT_MS,
        }),
        durationMs = Math.round(performance.now() - started),
        log = join(logDirectory, `${check.id}.log`)
      writeFileSync(log, `${outcome.stdout}${outcome.stderr}`)
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
      results.push({
        checkId: check.id,
        status: reason ? 'failed' : 'passed',
        command: concreteCommand,
        testedFingerprint: fingerprint,
        inputPaths: check.inputs,
        exitCode: outcome.exitCode,
        artifacts,
        reason,
        durationMs,
        log: relative(repo, log),
      })
    }
  } finally {
    await gameServer?.stop()
  }
  const requiredIds = new Set(required.map(check => check.id))
  contract.verification.results = [
    ...contract.verification.results.filter(result => !requiredIds.has(result.checkId)),
    ...results,
  ]
  writeFileSync(absoluteContract, `${JSON.stringify(contract, null, 2)}\n`)
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
