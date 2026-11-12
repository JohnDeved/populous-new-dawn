import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { openSync, closeSync, writeSync } from 'node:fs'
import { observeGroupExit } from './group-exit-observer.mjs'

const text = error => { try { return String(error) } catch { return 'Unserializable failure' } }
// Inactive bounded pilot, not the active runner or a production ownership API.
// Injectable boundaries exist solely for supplied tests. Production integration
// must retain infrastructure-owned defaults and cannot take candidate overrides.
export function createObservedSupervisor({ spawnProcess = spawn,
  signalChild = (child, signal) => child.kill(signal), observe = observeGroupExit, writeLog = writeSync } = {}) {
  return async function superviseObserved(args, { cwd, log, capMs, env = process.env, inspect = () => {} }) {
    assert.ok(Number.isFinite(capMs) && capMs >= 1 && capMs <= 5000)
    const fd = openSync(log, 'wx')
    const started = performance.now(), command = [process.execPath, '--max-old-space-size=64', ...args]
    let child
    try { child = spawnProcess(command[0], command.slice(1), {
      cwd, env: { ...env, NODE_OPTIONS: '', NODE_PATH: '', NODE_COMPILE_CACHE: '', NODE_V8_COVERAGE: '' },
      detached: true, stdio: ['ignore', 'pipe', 'pipe'],
    }) } catch (error) { closeSync(fd); throw error }
    let bytes = 0, failure = null, settled = false, leaderExited = false, fdClosed = false, timer, force, monitor
    const signalErrors = []
    const fail = reason => { if (failure === null) failure = reason }
    const closeLog = () => { if (!fdClosed) { fdClosed = true; closeSync(fd) } }
    const clear = () => { clearTimeout(timer); clearTimeout(force); clearInterval(monitor) }
    const kill = signal => {
      if (leaderExited) return
      if (!Number.isSafeInteger(child.pid) || child.pid <= 1) { fail('Owned child identity unavailable'); return }
      try { if (signalChild(child, signal) === false) fail('Owned child signal was not delivered') }
      catch (error) { if (error?.code !== 'ESRCH') { signalErrors.push(text(error)); fail('Owned child signal failed') } }
    }
    const stop = reason => {
      if (settled || failure !== null) return
      fail(reason)
      if (leaderExited) return
      kill('SIGTERM')
      force = setTimeout(() => kill('SIGKILL'), 100)
    }
    return new Promise((resolve, reject) => {
      const chunk = data => {
        if (settled) return
        if (bytes + data.length > 65536) { stop('Log budget exceeded'); return }
        try {
          let offset = 0
          while (offset < data.length) {
            const written = writeLog(fd, data, offset, data.length - offset)
            if (!Number.isSafeInteger(written) || written <= 0 || written > data.length - offset)
              throw Error('Invalid or zero log write progress')
            offset += written; bytes += written
          }
        }
        catch (error) { stop('Log write failed: ' + text(error)) }
      }
      child.stdout.on('data', chunk); child.stderr.on('data', chunk)
      timer = setTimeout(() => stop('Command deadline exceeded'), capMs)
      monitor = setInterval(() => { try { inspect() } catch (error) { stop(text(error)) } }, 25)
      child.once('error', error => {
        if (settled) return
        if (Number.isSafeInteger(child.pid) && child.pid > 1) {
          stop('Child process error: ' + text(error)); return
        }
        settled = true; clear()
        try { closeLog() } catch {}
        reject(error)
      })
      child.once('exit', () => { leaderExited = true; clearTimeout(force) })
      child.once('close', (exitCode, signal) => {
        if (settled) return
        settled = true; leaderExited = true; clear()
        if (performance.now() - started >= capMs) fail('Command deadline exceeded')
        const finalize = async () => {
          try { closeLog() } catch (error) { fail('Log close failed: ' + text(error)) }
          // Never signal a numeric group after its leader exits or is reaped.
          // Remaining/reused groups yield unverified cleanup, not destructive action.
          let groupCleanup
          try {
            const { error, ...receipt } = await observe(child.pid, { capMs: 250, intervalMs: 10 })
            groupCleanup = receipt
            if (error !== undefined) groupCleanup.error = text(error)
          } catch (error) { groupCleanup = { status: 'unverified', error: text(error) } }
          if (groupCleanup.status !== 'absent') fail('Owned process-group disappearance unverified')
          resolve({ command, exitCode, signal, capMs, logBytes: bytes, failure, signalErrors, groupCleanup,
            status: exitCode === 0 && failure === null && signal === null && groupCleanup.status === 'absent' ? 'passed' : 'failed' })
        }
        finalize().catch(reject)
      })
    })
  }
}
export const superviseObserved = createObservedSupervisor()
