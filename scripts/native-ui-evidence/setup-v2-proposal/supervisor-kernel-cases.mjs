import assert from 'node:assert/strict'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { superviseObserved } from './supervise-observed.mjs'
const sha = path => createHash('sha256').update(readFileSync(path)).digest('hex')
const text = error => { try { return String(error) } catch { return 'Unserializable error' } }

// Source-only inactive harness. Marker does not grant admission.
// Both commands are fixed, child-only, no imports or descendants.
export async function runSupervisorKernelCases({ output, admission }) {
  assert.equal(admission, 'observed-supervisor-two-owned-children-v1')
  assert.equal(process.platform, 'linux')
  assert.equal(resolve(output), output)
  mkdirSync(output)
  const inputs = () => Object.fromEntries([
    ['harness', fileURLToPath(import.meta.url)],
    ['supervisor', fileURLToPath(new URL('./supervise-observed.mjs', import.meta.url))],
    ['observer', fileURLToPath(new URL('./group-exit-observer.mjs', import.meta.url))],
    ['node', process.execPath],
  ].map(([name, path]) => [name, sha(path)]))
  const report = { status: 'running', nodeVersion: process.version, before: inputs(), cases: [],
    scope: 'Two direct child pilot cases; no descendants, browser, production or general cleanup proof' }
  const save = () => writeFileSync(resolve(output, 'result.json'), JSON.stringify(report, null, 2) + '\n')
  let primary, hasPrimary = false
  try {
    save()
    for (const [name, code, capMs] of [
      ['normal', 'console.log("owned-normal")', 2000],
      ['deadline', 'setTimeout(() => {}, 2000)', 100],
    ]) {
      const record = { name, code, capMs, status: 'running' }
      report.cases.push(record); save()
      const log = resolve(output, name + '.log')
      record.result = await superviseObserved(['-e', code], { cwd: output, log, capMs, env: { PATH: '/usr/bin:/bin' } })
      record.rawLog = { bytes: readFileSync(log).length, sha256: sha(log) }
      save()
      assert.equal(record.result.groupCleanup.status, 'absent')
      assert.deepEqual(record.result.signalErrors, [])
      if (name === 'normal') {
        assert.equal(record.result.status, 'passed')
        assert.equal(record.result.exitCode, 0)
        assert.equal(record.result.signal, null)
        assert.equal(record.result.failure, null)
        assert.equal(readFileSync(log, 'utf8'), 'owned-normal\n')
      } else {
        assert.equal(record.result.status, 'failed')
        assert.equal(record.result.failure, 'Command deadline exceeded')
        assert.equal(record.result.signal, 'SIGTERM')
        assert.equal(record.result.exitCode, null)
        assert.equal(readFileSync(log).length, 0)
      }
      record.status = 'verified'; save()
    }
    report.status = 'passed'
  } catch (error) { hasPrimary = true; primary = error; report.status = 'failed'; report.error = text(error) }
  finally {
    try {
      report.after = inputs()
      report.inputsUnchanged = JSON.stringify(report.before) === JSON.stringify(report.after)
      if (!report.inputsUnchanged) report.status = 'failed'
      save()
    } catch (error) {
      if (!hasPrimary) { hasPrimary = true; primary = error }
      report.status = 'failed'; report.receiptError = text(error)
      try { save() } catch {}
    }
  }
  if (hasPrimary) throw primary
  assert.equal(report.status, 'passed')
  return report
}
