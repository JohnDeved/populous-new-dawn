import assert from 'node:assert/strict'
import { test } from 'node:test'
import { spawn, spawnSync, execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { runCommandReceipt } from '../scripts/orchestration/command-receipt.mjs'
import { fileURLToPath } from 'node:url'
import { performance } from 'node:perf_hooks'
import { runForegroundCommand } from '../scripts/performance-queue.mjs'

const cli = fileURLToPath(new URL('../scripts/performance-queue.mjs', import.meta.url))
const run = (source, timeoutMs = 500) => runForegroundCommand({
  command: [process.execPath, '-e', source], timeoutMs, stdio: 'ignore',
})

test('foreground mode preserves success, findings, and launch failures', async () => {
  for (const code of [0, 1, 2]) {
    // This checks exit classification, not deadline behavior. Aggregate child
    // scheduling can exceed500ms; dedicated timeout cases keep that strict bound.
    const result = await run(`process.exit(${code})`, 5000)
    assert.equal(result.exitCode, code)
    assert.equal(result.status, code === 0 ? 'passed' : 'failed')
    assert.equal(result.resourcesReleased, true)
  }
  const missing = await runForegroundCommand({ command: ['/pnd-missing-fixture-command'], timeoutMs: 500, stdio: 'ignore' })
  assert.equal(missing.status, 'failed')
  assert.equal(missing.error.code, 'ENOENT')
})

test('timeout cannot pass even when the command handles TERM with exit zero', async () => {
  const result = await run("process.on('SIGTERM',()=>process.exit(0));setInterval(()=>{},1000)")
  assert.equal(result.status, 'timed-out')
  assert.equal(result.exitCode, 0)
  assert.equal(result.resourcesReleased, true)
})

test('timeout escalates a TERM-resistant owned command', async () => {
  const result = await run("process.on('SIGTERM',()=>{});setInterval(()=>{},1000)")
  assert.equal(result.status, 'timed-out')
  assert.equal(result.signal, 'SIGKILL')
  assert.equal(result.resourcesReleased, true)
})

test('CLI needs an explicit positive timeout and preserves raw command output', () => {
  for (const value of ['0', '-1', 'NaN', '1.5']) {
    const result = spawnSync(process.execPath, [cli, 'foreground', value, '--', process.execPath, '-e', "console.log('must-not-start')"], { encoding: 'utf8' })
    assert.notEqual(result.status, 0)
    assert.doesNotMatch(result.stdout, /must-not-start/)
  }
  const result = spawnSync(process.execPath, [cli, 'foreground', '500', '--', process.execPath, '-e', "console.log('raw-out');console.error('raw-err');process.on('SIGTERM',()=>process.exit(0));setInterval(()=>{},1000)"], { encoding: 'utf8', timeout: 5000 })
  assert.equal(result.status, 124)
  assert.match(result.stdout, /raw-out/)
  assert.match(result.stderr, /raw-err/)
  assert.match(result.stderr, /"status":"timed-out"/)
})

test('an exited leader cannot leave descendant-held output pipes hanging', () => {
  // The fixture descendant has its own finite fallback, even if supervision fails.
  const source = `const {spawn}=require('node:child_process');spawn(process.execPath,['-e',"console.log('descendant-ready');setTimeout(()=>{},1500)"],{stdio:'inherit'});setTimeout(()=>process.exit(0),250)`
  // This exercises early-exit cleanup, not the timeout path. Leave scheduling
  // headroom when the aggregate suite runs many independent fixture processes.
  const result = spawnSync(process.execPath, [cli, 'foreground', '5000', '--', process.execPath, '-e', source], { encoding: 'utf8', timeout: 8000 })
  assert.equal(result.error, undefined)
  assert.match(result.stdout, /descendant-ready/)
  const terminal = JSON.parse(result.stderr.trim().split('\n').at(-1))
  assert(['passed', 'cleanup-blocked'].includes(terminal.status))
  if (terminal.status === 'cleanup-blocked') {
    assert.equal(terminal.resourcesReleased, false)
    assert.notEqual(result.status, 0)
  } else assert.equal(terminal.resourcesReleased, true)
})


test('interruption cleans the owned command without converting exit zero to a pass', async () => {
  const child = spawn(process.execPath, [cli, 'foreground', '5000', '--', process.execPath, '-e', "process.on('SIGTERM',()=>process.exit(0));console.log('ready');setInterval(()=>{},1000)"], { stdio: ['ignore', 'pipe', 'pipe'] })
  let stderr = ''
  child.stderr.on('data', data => { stderr += data })
  const exited = new Promise(resolve => child.once('exit', code => resolve(code)))
  await new Promise(resolve => child.stdout.once('data', resolve))
  child.kill('SIGTERM')
  assert.equal(await exited, 130)
  const terminal = JSON.parse(stderr.trim().split('\n').at(-1))
  assert.equal(terminal.status, 'interrupted')
  assert.equal(terminal.resourcesReleased, true)
})

test('existing command receipt retains timed-out failure and complete logs', async t => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'pnd-foreground-receipt-'))
  t.after(() => fs.rmSync(repo, { recursive: true, force: true }))
  fs.writeFileSync(path.join(repo, '.gitignore'), 'work/\n')
  const git = (...args) => execFileSync('git', args, { cwd: repo, stdio: 'pipe' })
  git('init', '-q'); git('add', '.')
  git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'fixture')
  const receipt = await runCommandReceipt(repo, {
    output: 'work/orchestration/timeout.json', inputs: [cli],
    command: [process.execPath, cli, 'foreground', '500', '--', process.execPath, '-e', "console.log('retained-out');console.error('retained-err');setInterval(()=>{},1000)"],
  })
  assert.equal(receipt.status, 'failed')
  assert.equal(receipt.exitCode, 124)
  assert.equal(receipt.phase, 'finished')
  assert.match(receipt.stdout, /retained-out/)
  assert.match(receipt.stderr, /retained-err/)
  assert.match(receipt.stderr, /"status":"timed-out"/)
  assert.deepEqual(receipt.sourceAfter, receipt.source)
  assert.equal(fs.readFileSync(receipt.artifacts.stderr, 'utf8'), receipt.stderr)
})

test('changed ownership proof withholds signals and cleanup certification', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pnd-foreground-identity-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const marker = path.join(root, 'term'), done = path.join(root, 'done')
  // Alter only the owned supervisor fixture's ps view. Its finite child finishes
  // naturally; missing identity must never authorize signalling a recycled PID.
  fs.writeFileSync(path.join(root, 'ps'), `#!${process.execPath}
const fs=require('node:fs'),{execFileSync}=require('node:child_process');
const count=${JSON.stringify(path.join(root, 'count'))};
const previous=fs.existsSync(count);fs.writeFileSync(count,'seen');
const rows=execFileSync('/usr/bin/ps',process.argv.slice(2),{encoding:'utf8'});
process.stdout.write(previous?rows.trimEnd().split('\\n').map(row=>row+' changed-identity').join('\\n')+'\\n':rows);
`, { mode: 0o700 })
  const result = spawnSync(process.execPath, [cli, 'foreground', '200', '--', process.execPath, '-e',
    `const fs=require('node:fs');process.on('SIGTERM',()=>fs.writeFileSync(${JSON.stringify(marker)},'unexpected'));setTimeout(()=>fs.writeFileSync(${JSON.stringify(done)},'done'),700)`,
  ], { encoding: 'utf8', timeout: 5000, env: { ...process.env, PATH: `${root}:${process.env.PATH}` } })
  assert.equal(result.error, undefined)
  assert.equal(result.status, 1)
  const terminal = JSON.parse(result.stderr.trim().split('\n').at(-1))
  assert.equal(terminal.status, 'cleanup-blocked')
  assert.equal(terminal.resourcesReleased, false)
  assert.match(terminal.reason, /owned process identity is no longer present/)
  assert.equal(fs.existsSync(marker), false)
  assert.equal(fs.existsSync(done), true)
})


test('exit observed after the deadline between polls cannot pass', async t => {
  const realSetTimeout = globalThis.setTimeout
  let clockReads = 0, releasePoll
  // Hold the next poll while a real finite child exits. The monotonic clock
  // moves from before to after the deadline at the outcome callback itself.
  t.mock.method(globalThis, 'setTimeout', (callback, ms, ...args) => {
    if (ms !== 50) return realSetTimeout(callback, ms, ...args)
    const fallback = realSetTimeout(callback, 1000, ...args)
    releasePoll = () => { clearTimeout(fallback); setImmediate(callback, ...args) }
    return fallback
  })
  t.mock.method(performance, 'now', () => {
    clockReads++
    if (clockReads === 1) return 0
    if (clockReads === 2) return 99
    releasePoll?.()
    return 101
  })
  const result = await run('setTimeout(()=>process.exit(0),30)', 100)
  assert.equal(result.exitCode, 0)
  assert.equal(result.status, 'timed-out')
  assert.equal(result.resourcesReleased, true)
  assert.equal(clockReads, 3, 'deadline, pre-deadline poll, and post-deadline exit must all be observed')
})
