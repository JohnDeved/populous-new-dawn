// Sole launcher. Literal binding is filled only after review freeze.
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { spawn } from 'node:child_process'
import { sha, fileSha, save } from './io.mjs'
const expectedBinding = 'b71327d8509359bdb2882bb20486895d9fa3fa40b6f5bcd07f737b10bd7310a0'
const here = import.meta.dirname,
  bindingPath = join(here, 'binding.json')
const [base, candidate, output, browser] = process.argv.slice(2),
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
let timer, kill, child
try {
  const result = await new Promise((resolvePromise, reject) => {
    child = spawn(
      process.execPath,
      [join(here, 'driver.mjs'), base, candidate, join(out, 'run'), browser],
      { stdio: ['ignore', 'pipe', 'pipe'], detached: true }
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
    }, 720000)
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
  save(receipt, report)
}
