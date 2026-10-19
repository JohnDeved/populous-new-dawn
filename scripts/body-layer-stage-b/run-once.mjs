// Sole launcher. Literal binding is filled only after review freeze.
import assert from 'node:assert/strict'
import { timingEnvironment } from './child-environment.mjs'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { spawn, execFileSync } from 'node:child_process'
import { finalizeEvidence } from '../../scripts/body-layer-stage-a/observation-store.mjs'
import { protocol } from './protocol.mjs'
import { sha, fileSha, save, space } from '../../scripts/body-layer-stage-a/io.mjs'
const expectedBinding = '3433e0b65f474c1e28120d71791c62acd86aef32a5a86179e6ccc5f880331f99'
const here = import.meta.dirname,
  bindingPath = join(here, 'binding.json')
const [base, candidate, output, browser, references] = process.argv.slice(2),
  out = resolve(output)
assert.equal(sha(readFileSync(bindingPath)), expectedBinding, 'Unreviewed harness binding')
const binding = JSON.parse(readFileSync(bindingPath)),
  verify = () => {
    for (const [path, hash] of Object.entries(binding.files))
      assert.equal(fileSha(join(here, path)), hash, path)
  }
verify()
assert.ok(!existsSync(out), 'No retry/overwrite of an attempt')
mkdirSync(out, { recursive: true })
const report = { startedAt: new Date().toISOString(), binding: expectedBinding, status: 'running' },
  receipt = join(out, 'launcher.json')
save(receipt, report)
const deadline = Date.now() + 900000
let timer, kill, child
try {
  report.freeBeforeAcquisition = space(out, true)
  assert.ok(!existsSync(references), 'Fresh reference acquisition required')
  const acquisition = execFileSync(process.execPath, [join(here, 'acquire-reference.mjs'), references], { encoding: 'utf8', timeout: 100000, maxBuffer: 2 * 1024 ** 2 })
  writeFileSync(join(out, 'acquisition.log'), acquisition)
  report.acquisitionElapsedMs = 900000 - (deadline - Date.now())
  assert.ok(deadline - Date.now() >= 800000, 'Acquisition exhausted setup reserve')
  const result = await new Promise((resolvePromise, reject) => {
    child = spawn(
      process.execPath,
      [
        join(here, 'driver.mjs'),
        base,
        candidate,
        join(out, 'run'),
        browser,
        references,
        String(deadline),
      ],
      { stdio: ['ignore', 'pipe', 'pipe'], detached: true, env: timingEnvironment(process.env) }
    )
    let bytes = 0
    const log = []
    const append = data => {
      bytes += data.length
      if (bytes <= 4 * 1024 ** 2) log.push(data)
      else report.logTruncated = true
    }
    child.stdout.on('data', append)
    child.stderr.on('data', append)
    timer = setTimeout(() => {
      report.timedOut = true
      save(receipt, report)
      try {
        process.kill(-child.pid, 'SIGTERM')
      } catch {}
      kill = setTimeout(() => {
        try {
          process.kill(-child.pid, 'SIGKILL')
        } catch {}
      }, 5000)
    }, Math.max(0, deadline - Date.now()))
    child.on('error', reject)
    child.on('close', (code, signal) => {
      writeFileSync(join(out, 'driver.log'), Buffer.concat(log))
      resolvePromise({ code, signal })
    })
  })
  Object.assign(report, result)
  assert.equal(report.timedOut, undefined)
  assert.equal(result.code, 0)
  report.status = 'passed'
} catch (error) {
  report.status = 'failed'
  report.error = { message: String(error), stack: error.stack }
  process.exitCode = 1
} finally {
  clearTimeout(timer)
  clearTimeout(kill)
  try {
    verify()
    assert.equal(sha(readFileSync(bindingPath)), expectedBinding)
    report.endBinding = 'passed'
  } catch (error) {
    report.endBinding = String(error)
    report.status = 'failed'
    process.exitCode = 1
  }
  report.endedAt = new Date().toISOString()
  if (!finalizeEvidence(out, receipt, report, protocol.maximumEvidenceBytes)) process.exitCode = 1
}
