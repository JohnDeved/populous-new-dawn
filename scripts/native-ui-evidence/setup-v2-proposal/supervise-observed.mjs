import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { openSync, closeSync, writeSync } from 'node:fs'
import { observeGroupExit } from './group-exit-observer.mjs'

const text = error => { try { return String(error) } catch { return 'Unserializable failure' } }
// Inactive bounded pilot, not the active runner or a production ownership API.
// Injectable boundaries exist solely for supplied tests. Production integration
// must retain infrastructure-owned defaults and cannot take candidate overrides.
export function createObservedSupervisor({ spawnProcess = spawn,
  signalGroup = (pid, signal) => process.kill(-pid, signal), observe = observeGroupExit } = {}) {
  return async function superviseObserved(args, { cwd, log, capMs, env = process.env, inspect = () => {} }) {
    assert.ok(Number.isFinite(capMs) && capMs >= 1 && capMs <= 5000)
    const fd = openSync(log, 'wx')
    const started = performance.now(), command = [process.execPath, '--max-old-space-size=64', ...args]
    let child
    try { child = spawnProcess(command[0], command.slice(1), {
      cwd, env: { ...env, NODE_OPTIONS: '', NODE_PATH: '', NODE_COMPILE_CACHE: '', NODE_V8_COVERAGE: '' },
      detached: true, stdio: ['ignore', 'pipe', 'pipe'],
    }) } catch (error) { closeSync(fd); throw error }
    let bytes = 0, failure = null, settled = false, fdClosed = false, timer, force, monitor
    const signalErrors = []
    const fail = reason => { if (failure === null) failure = reason }
    const closeLog = () => { if (!fdClosed) { fdClosed = true; closeSync(fd) } }
    const clear = () => { clearTimeout(timer); clearTimeout(force); clearInterval(monitor) }
    const kill = signal => {
      if (!Number.isSafeInteger(child.pid) || child.pid <= 1) { fail('Owned child group unavailable'); return }
      try { signalGroup(child.pid, signal) }
      catch (error) { if (error?.code !== 'ESRCH') { signalErrors.push(text(error)); fail('Owned group signal failed') } }
    }
    const stop = reason => {
      if (settled || failure !== null) return
      fail(reason); kill('SIGTERM')
      force = setTimeout(() => kill('SIGKILL'), 100)
    }
    return new Promise((resolve, reject) => {
      const chunk = data => {
        if (settled) return
        if (bytes + data.length > 65536) { stop('Log budget exceeded'); return }
        try { writeSync(fd, data); bytes += data.length }
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
      child.once('close', (exitCode, signal) => {
        if (settled) return
        settled = true; clear()
        if (performance.now() - started >= capMs) fail('Command deadline exceeded')
        const finalize = async () => {
          try { closeLog() } catch (error) { fail('Log close failed: ' + text(error)) }
          // Preserve existing owner intent but never equate signal delivery with absence.
          kill('SIGKILL')
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
