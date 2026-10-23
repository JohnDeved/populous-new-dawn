import { spawn } from 'node:child_process'
import { openSync, closeSync, writeSync } from 'node:fs'
import { limits } from './policy.mjs'

// The standard hosted Linux runner supports process groups. Kill the complete
// owned group on timeout, including Chrome, then wait for close before returning.
export async function supervise(args, { cwd, log, capMs, env = process.env, inspect = () => {} }) {
  const fd = openSync(log, 'wx')
  const startedAt = performance.now()
  let bytes = 0, failure = null, force, timer, monitor, settled = false
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['--max-old-space-size=768', ...args], {
      cwd, env: { ...env, NODE_OPTIONS: '', NODE_PATH: '', NODE_COMPILE_CACHE: '', NODE_V8_COVERAGE: '' },
      detached: true, stdio: ['ignore', 'pipe', 'pipe'],
    })
    const kill = signal => { try { process.kill(-child.pid, signal) } catch (error) { if (error.code !== 'ESRCH') throw error } }
    const stop = reason => {
      if (failure) return
      failure = reason; kill('SIGTERM'); force = setTimeout(() => kill('SIGKILL'), limits.cleanupMs)
    }
    const chunk = data => {
      if (bytes + data.length > limits.logBytes) { stop('Log budget exceeded; further output not retained'); return }
      writeSync(fd, data); bytes += data.length
    }
    child.stdout.on('data', chunk); child.stderr.on('data', chunk)
    timer = setTimeout(() => stop('Command deadline exceeded'), capMs)
    monitor = setInterval(() => { try { inspect() } catch (error) { stop(String(error)) } }, 1000)
    child.on('error', error => { settled = true; clearTimeout(timer); clearTimeout(force); clearInterval(monitor); closeSync(fd); reject(error) })
    child.on('close', (exitCode, signal) => {
      if (settled) return
      settled = true
      if (performance.now() - startedAt >= capMs) failure ??= 'Command deadline exceeded'
      clearTimeout(timer); clearTimeout(force); clearInterval(monitor); closeSync(fd)
      // An orphan grandchild is not allowed to survive even a normal exit.
      kill('SIGKILL')
      resolve({ command: [process.execPath, '--max-old-space-size=768', ...args], exitCode, signal,
        capMs, logBytes: bytes, failure, status: exitCode === 0 && !failure && !signal ? 'passed' : 'failed' })
    })
  })
}
