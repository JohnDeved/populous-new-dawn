import assert from 'node:assert/strict'
import * as fs from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { test } from 'node:test'
import { createBuildLogSpool, captureBuild } from '../scripts/browser-performance/browser-runtime.mjs'

const temp = t => {
  const dir = fs.mkdtempSync(join(tmpdir(), 'bounded-build-log-'))
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }))
  return { dir, target: join(dir, 'build.log') }
}

test('publishes only after successful finish and preserves exact whole chunk cutoff', t => {
  const { dir, target } = temp(t)
  fs.writeFileSync(target, 'prior')
  const spool = createBuildLogSpool(target, { limit: 8 })
  spool.record(Buffer.from('one'))
  spool.record(Buffer.from('xx'))
  spool.record(Buffer.from('drop'))
  spool.record(Buffer.from('z'))
  assert.equal(fs.readFileSync(target, 'utf8'), 'prior')
  assert.deepEqual(spool.finish(), { cappedLog: true })
  assert.equal(fs.readFileSync(target, 'utf8'), 'onexx')
  assert.deepEqual(fs.readdirSync(dir), ['build.log'])
})

test('writes complete events after short writes, allows exactly-cap, and publishes empty logs', t => {
  const { dir, target } = temp(t)
  const io = { ...fs, writeSync(fd, chunk, at, length) { return fs.writeSync(fd, chunk, at, Math.min(2, length)) } }
  const spool = createBuildLogSpool(target, { limit: 5, io })
  spool.record(Buffer.from('abcde'))
  spool.record(Buffer.alloc(0))
  assert.deepEqual(spool.finish(), { cappedLog: false })
  assert.equal(fs.readFileSync(target, 'utf8'), 'abcde')
  assert.deepEqual(createBuildLogSpool(target).finish(), { cappedLog: false })
  assert.deepEqual(fs.readFileSync(target), Buffer.alloc(0))
  assert.deepEqual(fs.readdirSync(dir), ['build.log'])
})

test('captures both real streams on normal and nonzero exit with no private leftovers', async t => {
  const { dir, target } = temp(t)
  const result = await captureBuild(process.execPath, ['-e', "process.stdout.write('alpha'); setTimeout(() => { process.stderr.write('beta'); process.exitCode = 3 }, 150)"], target)
  assert.deepEqual(result, { code: 3, signal: null, timedOut: false, cappedLog: false })
  assert.equal(fs.readFileSync(target, 'utf8'), 'alphabeta')
  assert.deepEqual(fs.readdirSync(dir), ['build.log'])
})

test('write failure is primary even when close also fails; final file remains unchanged', async t => {
  const { dir, target } = temp(t)
  fs.writeFileSync(target, 'prior')
  const primary = new Error('write fault'), secondary = new Error('close fault')
  const io = { ...fs, writeSync() { throw primary }, closeSync(fd) { fs.closeSync(fd); throw secondary } }
  await assert.rejects(captureBuild(process.execPath, ['-e', "process.stdout.write('test')"], target, { io }), error => error === primary)
  assert.equal(fs.readFileSync(target, 'utf8'), 'prior')
  assert.deepEqual(fs.readdirSync(dir), ['build.log'])
})

test('close and rename errors preserve prior output and do not strand owned temporary logs', async t => {
  const { dir, target } = temp(t)
  fs.writeFileSync(target, 'prior')
  for (const phase of ['closeSync', 'renameSync']) {
    const failure = new Error(phase)
    const io = { ...fs, [phase](...args) {
      if (phase === 'closeSync') fs.closeSync(...args)
      throw failure
    } }
    await assert.rejects(captureBuild(process.execPath, ['-e', "process.stdout.write('test')"], target, { io }), error => error === failure)
    assert.equal(fs.readFileSync(target, 'utf8'), 'prior')
    assert.deepEqual(fs.readdirSync(dir), ['build.log'])
  }
})

test('spawn failure leaves no final file or spool, and open failure remains primary', async t => {
  const { dir, target } = temp(t)
  await assert.rejects(captureBuild(join(dir, 'missing-executable'), [], target), { code: 'ENOENT' })
  assert.deepEqual(fs.readdirSync(dir), [])
  const primary = new Error('open fault')
  const io = { ...fs, openSync() { throw primary } }
  await assert.rejects(captureBuild(process.execPath, [], target, { io }), error => error === primary)
  assert.deepEqual(fs.readdirSync(dir), [])
})

test('timeout publishes captured diagnostics after the child closes', async t => {
  const { dir, target } = temp(t)
  const result = await captureBuild(process.execPath, ['-e', "process.stdout.write('waiting'); setInterval(() => {}, 1000)"], target, { timeout: 750, killGrace: 100 })
  assert.deepEqual(result, { code: null, signal: 'SIGTERM', timedOut: true, cappedLog: false })
  assert.equal(fs.readFileSync(target, 'utf8'), 'waiting')
  assert.deepEqual(fs.readdirSync(dir), ['build.log'])
})

test('exclusive open collision cannot remove somebody else’s temporary file', t => {
  const { dir, target } = temp(t)
  const collision = target + '.spool-collision'
  fs.writeFileSync(target, 'prior')
  fs.writeFileSync(collision, 'somebody else')
  assert.throws(() => createBuildLogSpool(target, { id: () => 'collision' }), { code: 'EEXIST' })
  assert.equal(fs.readFileSync(collision, 'utf8'), 'somebody else')
  assert.equal(fs.readFileSync(target, 'utf8'), 'prior')
  const spool = createBuildLogSpool(target, { id: () => 'owned' })
  spool.record(Buffer.from('replacement'))
  spool.finish()
  assert.equal(fs.readFileSync(target, 'utf8'), 'replacement')
  assert.equal(fs.readFileSync(collision, 'utf8'), 'somebody else')
  assert.deepEqual(fs.readdirSync(dir).sort(), ['build.log', 'build.log.spool-collision'])
})

test('an unlink failure cannot replace a precommit primary error or prior output', async t => {
  const { dir, target } = temp(t)
  fs.writeFileSync(target, 'prior')
  const primary = new Error('rename fault')
  const io = { ...fs, renameSync() { throw primary }, unlinkSync() { throw new Error('unlink fault') } }
  await assert.rejects(captureBuild(process.execPath, ['-e', "process.stdout.write('test')"], target, { io }), error => error === primary)
  assert.equal(fs.readFileSync(target, 'utf8'), 'prior')
  const leftovers = fs.readdirSync(dir).filter(name => name !== 'build.log')
  assert.equal(leftovers.length, 1)
  assert.match(leftovers[0], /^build\.log\.spool-[0-9a-f-]+$/)
  assert.equal(fs.readFileSync(join(dir, leftovers[0]), 'utf8'), 'test')
})

test('child catches TERM, then authentic KILL closes and publishes both diagnostics', async t => {
  const { dir, target } = temp(t)
  const code = "process.on('SIGTERM', () => process.stderr.write('term ignored')); process.stdout.write('ready:'); setInterval(() => {}, 1000)"
  const result = await captureBuild(process.execPath, ['-e', code], target, { timeout: 850, killGrace: 350 })
  assert.deepEqual(result, { code: null, signal: 'SIGKILL', timedOut: true, cappedLog: false })
  assert.equal(fs.readFileSync(target, 'utf8'), 'ready:term ignored')
  assert.deepEqual(fs.readdirSync(dir), ['build.log'])
})
