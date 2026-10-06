import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { runCommandReceipt } from '../../../scripts/orchestration/command-receipt.mjs'

const root = process.cwd()
const head = '47d2e2dc229f35352f1a7a1cfb948789053c9b1c'
const prefix = 'work/orchestration/issue223-erosion-activation/gates-47d2e2d'
const privateRoot = resolve(root, '../gate-private/issue223-47d2e2d')
for (const name of ['tmp', 'cache', 'npm-cache']) mkdirSync(`${privateRoot}/${name}`, { recursive: true })
const env = { ...process.env, TMPDIR: `${privateRoot}/tmp`, XDG_CACHE_HOME: `${privateRoot}/cache`,
  npm_config_cache: `${privateRoot}/npm-cache`, RAYON_NUM_THREADS: '4', UV_THREADPOOL_SIZE: '4' }
const inputs = ['scripts/orchestration/command-receipt.mjs', 'package-lock.json',
  'node_modules/.package-lock.json', 'work/orchestration/issue223-erosion-activation/run-gates.mjs']
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
if (git('rev-parse', 'HEAD') !== head || git('status', '--short')) throw new Error('Gate source must be the exact clean merge head')
const summary = { head, startedAt: new Date().toISOString(), cpu: '0-3', privateRoot, results: [] }
const save = () => writeFileSync(`${prefix}/summary.json`, `${JSON.stringify(summary, null, 2)}\n`)
mkdirSync(prefix, { recursive: true })
save()
for (const [name, seconds, script, required] of [
  ['check', 900, 'check', true], ['build', 300, 'build', true],
  ['format', 120, 'format:check', false], ['lint', 300, 'lint', false],
  ['standard', 120, 'lint:standard', false], ['health', 120, 'quality:health', false],
  ['dupes', 120, 'quality:dupes', false], ['unused', 120, 'quality:unused', false],
]) {
  console.log(JSON.stringify({ stage: name, head, startedAt: new Date().toISOString() }))
  const receipt = runCommandReceipt(root, { output: `${prefix}/${name}.json`, inputs, env,
    command: ['timeout', `${seconds}s`, 'taskset', '-c', '0-3', 'npm', 'run', script] })
  summary.results.push({ name, status: receipt.status, exitCode: receipt.exitCode,
    output: `${prefix}/${name}.json`, source: receipt.source.headOid })
  save()
  console.log(JSON.stringify(summary.results.at(-1)))
  if (required && receipt.status !== 'passed') {
    summary.stoppedAt = name
    summary.finishedAt = new Date().toISOString()
    save()
    process.exit(1)
  }
}
summary.finishedAt = new Date().toISOString()
summary.qualityRequiresClassification = summary.results.some(row => row.status !== 'passed')
summary.rootLock = readFileSync('package-lock.json').length
save()
