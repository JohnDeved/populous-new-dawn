import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import test from 'node:test'
import { packagedBrowserSha256 } from '../scripts/browser-performance/install-browser.mjs'

// Only the command launch is substituted. Actual OS processes, streams, signals,
// lifecycle events and production deadlines remain in use. No browser/package runs.
function processFixture(t, memberFile, memberArgs) {
  const children = [], closes = [], calls = []
  t.after(async () => {
    for (const child of children) {
      if (child.pid && child.exitCode === null && child.signalCode === null) child.kill('SIGKILL')
    }
    await Promise.all(closes)
  })
  return {
    children, calls,
    inspect: () => packagedBrowserSha256('/fixture/inert-package.deb', {
      spawn(file, args, options) {
        calls.push({ file, args, options })
        const archive = file === 'dpkg-deb'
        assert.ok(archive || file === 'tar')
        const child = spawn(archive ? process.execPath : memberFile, archive
          ? ['--max-old-space-size=32', '-e', 'setInterval(() => {}, 1000); process.stdout.write("ready\\n")']
          : memberArgs, options)
        children.push(child)
        closes.push(new Promise(resolveClose => child.once('close', (code, signal) => resolveClose({ code, signal }))))
        return child
      },
    }),
    closed: () => Promise.all(closes),
  }
}

test('real member failure kills and reaps its still-running archive producer', { timeout: 10000 }, async t => {
  const fixture = processFixture(t, process.execPath, ['--max-old-space-size=32', '-e',
    'let input = ""; process.stdin.on("data", data => { input += data; if (input.includes("\\n")) process.exit(input === "ready\\n" ? 23 : 24) }); process.stdin.resume()'])
  let failure
  await assert.rejects(fixture.inspect(), error => {
    failure = error
    return error.inspection?.reason === 'Packaged browser extraction failed'
  })
  assert.equal(failure.inspection.children[0].spawned, true)
  assert.equal(failure.inspection.children[0].exitObserved, true)
  assert.equal(failure.inspection.children[0].kill, 'sent')
  assert.deepEqual(await fixture.closed(), [{ code: null, signal: 'SIGKILL' }, { code: 23, signal: null }])
  assert.equal(failure.inspection.children[1].exitObserved, true)
  assert.equal(failure.inspection.children[1].closeObserved, true)
  assert.equal(failure.inspection.children[1].kill, 'not-attempted')
  assert.equal(failure.inspection.descendantCleanup, 'not-established')
  assert.deepEqual(fixture.calls, [
    { file: 'dpkg-deb', args: ['--fsys-tarfile', '/fixture/inert-package.deb'], options: { stdio: ['ignore', 'pipe', 'pipe'] } },
    { file: 'tar', args: ['--extract', '--to-stdout', '--file', '-', './opt/google/chrome/chrome'], options: { stdio: ['pipe', 'pipe', 'pipe'] } },
  ])
})

test('real member launch failure remains a spawn failure and reaps the acquired producer', { timeout: 10000 }, async t => {
  const directory = mkdtempSync(resolve(tmpdir(), 'pnd-inspection-process-'))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  const fixture = processFixture(t, resolve(directory, 'missing-executable'), [])
  let failure
  await assert.rejects(fixture.inspect(), error => {
    failure = error
    return error.inspection?.reason === 'Packaged browser process failed'
  })
  const [archive, member] = failure.inspection.children
  assert.equal(archive.exitObserved, true)
  assert.equal(archive.kill, 'sent')
  assert.deepEqual((await fixture.closed())[0], { code: null, signal: 'SIGKILL' })
  assert.equal(fixture.children[1].pid, undefined)
  assert.equal(member.spawned, false)
  assert.equal(member.spawnFailed, true)
  assert.equal(member.errorObserved, true)
  assert.equal(member.kill, 'not-attempted')
  assert.equal(failure.inspection.descendantCleanup, 'not-established')
})
