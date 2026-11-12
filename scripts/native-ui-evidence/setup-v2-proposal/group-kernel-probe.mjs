import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { processGroupPresent, observeGroupExit } from './group-exit-observer.mjs'

const admissionToken = 'owned-child-group-observation-v1'
const childSource = `let input = ''
process.stdin.on('data', data => {
  input += data.toString()
  if (input === 'EXIT\\n') process.exit(0)
  if (input.length > 5) process.exit(4)
})
setTimeout(() => process.exit(3), 2000)
process.stdout.write('READY ' + process.pid + '\\n')
`
const hash = path => createHash('sha256').update(readFileSync(path)).digest('hex')
const failureText = error => { try { return String(error) } catch { return 'Unserializable failure' } }
async function bounded(promise, ms, name) {
  let timer
  try { return await Promise.race([promise, new Promise((_, reject) => {
    timer = setTimeout(() => reject(Error(name + ' exceeded deadline')), ms)
  })]) } finally { clearTimeout(timer) }
}

// Source-only inactive probe. Invocation requires separate serialized admission.
// One direct child, no descendants, no application/browser/dependency imports.
export async function runOwnedGroupProbe({ output, admission }) {
  assert.equal(admission, admissionToken)
  assert.equal(process.platform, 'linux')
  assert.equal(typeof output, 'string')
  assert.equal(resolve(output), output, 'Absolute exclusive output directory required')
  mkdirSync(output) // Refuse overwrite/reuse; parent directory must exist.
  const self = fileURLToPath(import.meta.url)
  const observer = fileURLToPath(new URL('./group-exit-observer.mjs', import.meta.url))
  const inputs = () => ({ probe: hash(self), observer: hash(observer), node: hash(process.execPath) })
  const before = inputs()
  const report = { status: 'running', scope: 'One owned direct child group; no descendant/escape/production proof',
    nodeVersion: process.version, before, phases: [], cleanup: { status: 'not-started', killRequested: false } }
  const save = () => writeFileSync(resolve(output, 'result.json'), JSON.stringify(report, null, 2) + '\n')
  const phase = name => { report.phases.push(name); save() }
  writeFileSync(resolve(output, 'child-source.mjs'), childSource, { flag: 'wx' })
  save()
  let child, closed = false, closePromise, hasPrimary = false, primary
  let stdout = Buffer.alloc(0), stderr = Buffer.alloc(0), streamFailure
  try {
    phase('spawn')
    child = spawn(process.execPath, ['--max-old-space-size=32', '--input-type=module', '-e', childSource], {
      detached: true, stdio: ['pipe', 'pipe', 'pipe'],
      env: { PATH: '/usr/bin:/bin', NODE_OPTIONS: '', NODE_PATH: '', NODE_COMPILE_CACHE: '', NODE_V8_COVERAGE: '' },
    })
    let resolveReady, rejectReady
    const ready = new Promise((a, b) => { resolveReady = a; rejectReady = b })
    ready.catch(() => {})
    closePromise = new Promise((resolveClose, rejectClose) => {
      child.once('error', error => { rejectReady(error); rejectClose(error) })
      child.once('close', (code, signal) => { closed = true; rejectReady(Error('Child closed before readiness')); resolveClose({ code, signal }) })
    })
    closePromise.catch(() => {})
    child.stdin.on('error', error => { streamFailure ??= error; rejectReady(error) })
    const append = (channel, data) => {
      const current = channel === 'stdout' ? stdout : stderr
      if (current.length + data.length > 16384) {
        streamFailure ??= Error('Child stream budget exceeded')
        rejectReady(streamFailure)
        if (!closed) { report.cleanup.killRequested = true; child.kill('SIGKILL') }
        return
      }
      if (channel === 'stdout') stdout = Buffer.concat([stdout, data])
      else stderr = Buffer.concat([stderr, data])
      if (stdout.toString() === 'READY ' + child.pid + '\n') resolveReady()
    }
    child.stdout.on('data', data => append('stdout', data))
    child.stderr.on('data', data => append('stderr', data))
    await bounded(ready, 1000, 'Owned child readiness')
    phase('bind-owned-group')
    const stat = readFileSync('/proc/' + child.pid + '/stat', 'utf8')
    const fields = stat.slice(stat.lastIndexOf(')') + 2).trim().split(/\s+/)
    report.owner = { pid: child.pid, ppid: Number(fields[1]), pgrp: Number(fields[2]), session: Number(fields[3]), starttime: fields[19] }
    assert.equal(report.owner.ppid, process.pid)
    assert.equal(report.owner.pgrp, child.pid)
    assert.equal(report.owner.session, child.pid)
    assert.match(report.owner.starttime, /^\d+$/)
    assert.equal(processGroupPresent(child.pid), true)
    phase('request-normal-exit')
    child.stdin.end('EXIT\n')
    report.childExit = await bounded(closePromise, 1000, 'Owned child exit')
    assert.equal(streamFailure, undefined)
    assert.deepEqual(report.childExit, { code: 0, signal: null })
    phase('observe-group-absence')
    const observation = await observeGroupExit(child.pid, { capMs: 250, intervalMs: 10 })
    const { error, ...receipt } = observation
    report.observation = receipt
    if (Object.hasOwn(observation, 'error')) report.observation.error = failureText(error)
    assert.equal(observation.status, 'absent')
    report.status = 'passed'
  } catch (error) {
    hasPrimary = true; primary = error; report.status = 'failed'; report.error = failureText(error)
  } finally {
    if (child && !closed) {
      report.cleanup.killRequested = true
      // Kill only our unreaped direct ChildProcess, never an arbitrary group.
      try { child.kill('SIGKILL') } catch (error) { report.cleanup.error = failureText(error) }
    }
    if (closePromise) {
      try { report.cleanup.childExit = await bounded(closePromise, 1000, 'Owned child cleanup'); report.cleanup.status = closed ? 'child-close-observed' : 'unverified' }
      catch (error) { report.cleanup.status = 'unverified'; report.cleanup.error = failureText(error) }
    } else report.cleanup.status = 'not-spawned'
    writeFileSync(resolve(output, 'stdout.log'), stdout, { flag: 'wx' })
    writeFileSync(resolve(output, 'stderr.log'), stderr, { flag: 'wx' })
    report.after = inputs()
    report.inputsUnchanged = JSON.stringify(before) === JSON.stringify(report.after)
    report.streams = { stdout: { bytes: stdout.length, sha256: hash(resolve(output, 'stdout.log')) },
      stderr: { bytes: stderr.length, sha256: hash(resolve(output, 'stderr.log')) } }
    if (report.cleanup.status === 'unverified' || report.cleanup.killRequested || !report.inputsUnchanged) report.status = 'failed'
    save()
  }
  if (hasPrimary) throw primary
  assert.equal(report.status, 'passed')
  return report
}
