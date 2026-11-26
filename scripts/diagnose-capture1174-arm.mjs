import assert from 'node:assert/strict'
import {readFileSync, readlinkSync, writeFileSync} from 'node:fs'
import {basename, dirname, resolve} from 'node:path'
import {spawn} from 'node:child_process'
import {fileURLToPath, pathToFileURL} from 'node:url'

const [arm, runtime, output, log, receipt, workloadRevision] = process.argv.slice(2)
assert.equal(process.version, 'v24.19.0')
assert.equal(process.arch, 'x64')
assert.ok(['baseline', 'candidate'].includes(arm))
const pressureEntry = fileURLToPath(new URL('./diagnose-capture1174-pressure.mjs', import.meta.url))
// Baseline did not export captureBuild. Its exact inline Promise is executed
// with the same closed-over values as the stock run.mjs; no duplicate body.
const capture = arm === 'baseline' ? (() => {
  const src = readFileSync(runtime, 'utf8')
  const open = '    const result = await new Promise((done, reject) => {\n'
  const close = '    receipt.builds.push(result);'
  assert.equal(src.split(open).length, 2)
  const block = src.split(open)[1].split(close)
  assert.equal(block.length, 2)
  const expression = 'new Promise((done, reject) => {\n' + block[0].trimEnd()
  assert.ok(expression.endsWith('})'))
  const browserHarness = resolve('scripts/browser-performance')
  const baselineExpression = expression.replaceAll('import.meta.dirname', 'browserHarness')
  assert.equal(baselineExpression.split('browserHarness').length, 2)
  const stockEntry = "resolve(browserHarness, 'build.mjs')"
  assert.equal(baselineExpression.split(stockEntry).length, 2)
  const pressureExpression = baselineExpression.replace(stockEntry, 'pressureEntry')
  const side = basename(log).replace(/^build-/, '').replace(/\.log$/, '')
  return () => new Function('spawn', 'process', 'resolve', 'writeFileSync', 'browserHarness', 'pressureEntry', 'sources', 'identity', 'side', 'out', 'output',
    'return ' + pressureExpression)(spawn, process, resolve, writeFileSync, browserHarness, pressureEntry, {[side]:process.cwd()},
      {[side+'Sha']:workloadRevision}, side, dirname(log), resolve(output))
})() : await (async () => {
  const {captureBuild} = await import(pathToFileURL(resolve(runtime)).href)
  return () => captureBuild(process.execPath,
    [pressureEntry, process.cwd(), resolve(output), workloadRevision],
    resolve(log), {timeout:120000, killGrace:5000, drainGrace:1000})
})()
function snapshot() {
  const status = readFileSync('/proc/self/status', 'utf8')
  const stat = readFileSync('/proc/self/stat', 'utf8')
  const hwm = /^VmHWM:\s+(\d+) kB$/m.exec(status)
  assert.ok(hwm)
  return {
    pid: process.pid,
    boot: readFileSync('/proc/sys/kernel/random/boot_id','utf8').trim(),
    namespace: readlinkSync('/proc/self/ns/pid'),
    startTicks: stat.slice(stat.lastIndexOf(')') + 2).split(' ')[19],
    captureParentVmHwmKiB: +hwm[1],
    monotonicNs: process.hrtime.bigint().toString(),
  }
}

const before = snapshot()
const result = await capture()
const after = snapshot()
writeFileSync(receipt, JSON.stringify({before, after, result}, null, 2) + '\n', {flag:'wx'})
assert.equal(result.code, 0)
assert.equal(result.signal, null)
assert.ok(!result.timedOut && !result.incompleteLog && !result.cappedLog)
