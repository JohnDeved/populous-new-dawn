import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import path from 'node:path'

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const jobId = process.env.PND_QUEUE_JOB_ID
const output = process.env.PND_QUEUE_OUTPUT
const cleanupPath = process.env.PND_QUEUE_CLEANUP
const suppliedUrl = process.env.POPULOUS_URL

assert(jobId, 'PND_QUEUE_JOB_ID is required')
assert(output, 'PND_QUEUE_OUTPUT is required')
assert(cleanupPath, 'PND_QUEUE_CLEANUP is required')
assert(suppliedUrl, 'POPULOUS_URL is required')

const url = new URL(suppliedUrl)
assert.equal(url.protocol, 'http:', 'POPULOUS_URL must use http')
assert(
  ['127.0.0.1', 'localhost'].includes(url.hostname),
  'POPULOUS_URL must target the queue-owned local server'
)
const port = Number(url.port || 80)
assert(Number.isInteger(port) && port > 0 && port < 65536, 'POPULOUS_URL has an invalid port')

let server = null
let terminationSignal = null
const owned = []

for (const signal of ['SIGTERM', 'SIGINT'])
  process.once(signal, () => {
    terminationSignal = signal
  })

function groupAlive(pid) {
  try {
    process.kill(-pid, 0)
    return true
  } catch (error) {
    if (error.code === 'ESRCH') return false
    throw error
  }
}

function signalGroup(pid, signal) {
  try {
    process.kill(-pid, signal)
  } catch (error) {
    if (error.code !== 'ESRCH') throw error
  }
}

async function portFree() {
  const probe = host =>
    new Promise(resolve => {
      const listener = net.createServer()
      listener.once('error', error =>
        resolve(host === '::1' && ['EAFNOSUPPORT', 'EADDRNOTAVAIL'].includes(error.code))
      )
      listener.listen({ port, host }, () => listener.close(() => resolve(true)))
    })
  return (await probe('127.0.0.1')) && (await probe('::1'))
}

async function waitForServer(timeoutMs) {
  const deadline = Date.now() + timeoutMs
  let probe = 0
  console.error(`[issue73-server] advertised ${url.toString()}`)
  while (Date.now() < deadline) {
    if (terminationSignal) throw new Error(`Queue termination requested: ${terminationSignal}`)
    if (server?.exitCode !== null) throw new Error('Game server exited before becoming ready')
    probe++
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1_000) })
      console.error(
        `[issue73-server] probe ${probe} HTTP ${response.status} ${response.statusText}`
      )
      if (response.ok) return
    } catch (error) {
      console.error(`[issue73-server] probe ${probe} ERROR ${error.name}: ${error.message}`)
    }
    await sleep(100)
  }
  throw new Error(`Game server was not ready within ${timeoutMs}ms at ${url.toString()}`)
}

async function runChecker() {
  const child = spawn(process.execPath, ['scripts/check-browser-hut-occupancy-smoke.mjs'], {
    cwd: process.cwd(),
    env: { ...process.env, POPULOUS_URL: url.toString() },
    stdio: 'inherit',
  })
  const result = await new Promise((resolve, reject) => {
    child.once('error', reject)
    child.once('exit', (code, signal) => resolve({ code, signal }))
  })
  if (terminationSignal)
    throw new Error(
      `Queue termination requested while browser acceptance was running: ${terminationSignal}`
    )
  if (result.signal) throw new Error(`Browser acceptance exited from signal ${result.signal}`)
  if (result.code !== 0) throw new Error(`Browser acceptance exited with code ${result.code}`)
}

async function stopServer() {
  if (!server?.pid) return
  if (groupAlive(server.pid)) {
    signalGroup(server.pid, 'SIGTERM')
    for (let i = 0; i < 40 && groupAlive(server.pid); i++) await sleep(50)
  }
  if (groupAlive(server.pid)) {
    signalGroup(server.pid, 'SIGKILL')
    for (let i = 0; i < 40 && groupAlive(server.pid); i++) await sleep(50)
  }
  assert(!groupAlive(server.pid), 'Owned game-server process group is still alive after cleanup')
  for (let i = 0; i < 40 && !(await portFree()); i++) await sleep(50)
  assert(await portFree(), 'Owned game-server port is still occupied after cleanup')
}

function writeCleanupReceipt() {
  const receipt = `${JSON.stringify(
    {
      jobId,
      resourcesReleased: true,
      releasedAt: new Date().toISOString(),
      processes: owned,
    },
    null,
    2
  )}\n`
  fs.writeFileSync(cleanupPath, receipt, { flag: 'wx', mode: 0o600 })
}

let failure = null
try {
  assert(await portFree(), 'Refusing to start over an occupied POPULOUS_URL port')
  const serverLog = fs.openSync(path.join(output, 'server.log'), 'wx', 0o600)
  try {
    server = spawn(
      'npm',
      ['run', 'dev', '--', '--port', String(port), '--hostname', url.hostname],
      {
        cwd: process.cwd(),
        detached: true,
        env: process.env,
        stdio: ['ignore', serverLog, serverLog],
      }
    )
  } finally {
    fs.closeSync(serverLog)
  }
  assert(server.pid, 'Game server did not report a PID')
  owned.push({ pid: server.pid, group: true })
  await waitForServer(45_000)
  await runChecker()
} catch (error) {
  failure = error
} finally {
  try {
    await stopServer()
    writeCleanupReceipt()
  } catch (cleanupError) {
    failure = failure
      ? new AggregateError([failure, cleanupError], 'Acceptance and cleanup both failed')
      : cleanupError
  }
}

if (failure) throw failure
