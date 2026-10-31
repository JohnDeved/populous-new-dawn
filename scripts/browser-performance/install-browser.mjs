import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync, spawn } from 'node:child_process'
import { appendFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { browserPath, packageName, loadBrowserPin, packageUrl, pinSha256, fileSha256,
  verifyPackageMetadata, verifyBrowserFiles, installedPlaywrightIdentity } from './browser-runtime.mjs'

// Read one member as data, never extract a second browser tree or execute package
// bytes before the full package's reviewed SHA-256 and metadata have matched.
export async function packagedBrowserSha256(path, overrides = {}) {
  // Fixture-only seams; the CLI cannot change commands, byte limits or deadlines.
  const operations = { spawn, setTimeout, clearTimeout, ...overrides }
  return new Promise((resolveHash, rejectHash) => {
    const hash = createHash('sha256'), children = [], listeners = []
    let bytes = 0, state = 'running', reason, setup = true, tearingDown = false
    let archive, member, inspectionTimer, teardownTimer
    const listen = (target, event, callback) => {
      target.on(event, callback); listeners.push({ target, event, callback })
    }
    const dispose = failed => {
      for (const timer of [inspectionTimer, teardownTimer]) if (timer !== undefined) operations.clearTimeout(timer)
      inspectionTimer = teardownTimer = undefined
      // Late errors after failed teardown must remain harmless. Other owned
      // listeners can go; never remove listeners belonging to another consumer.
      for (const item of listeners) if (!failed || item.event !== 'error') item.target.removeListener(item.event, item.callback)
    }
    const finishFailure = (deadline = false) => {
      if (state !== 'failing' || setup || tearingDown) return
      if (!deadline && !children.every(item => item.spawnFailed || item.exited || item.closed)) return
      state = 'settled'
      const snapshot = Object.freeze({ reason, children: Object.freeze(children.map(item => Object.freeze({
        name: item.name, spawned: item.spawned, spawnFailed: item.spawnFailed,
        exitObserved: item.exited, closeObserved: item.closed !== null,
        errorObserved: item.errored, kill: item.kill, streamTeardownFailed: item.streamTeardownFailed,
      }))), descendantCleanup: 'not-established' })
      const facts = snapshot.children.map(item => `${item.name}: exit=${item.exitObserved}, close=${item.closeObserved}, kill=${item.kill}`).join('; ')
      const error = Error(`${reason}; ${facts || 'no child acquired'}; descendant cleanup not established`)
      Object.defineProperty(error, 'inspection', { value: snapshot })
      dispose(true); rejectHash(error)
    }
    const fail = failure => {
      if (state !== 'running') return
      state = 'failing'; reason = failure; tearingDown = true
      if (inspectionTimer !== undefined) operations.clearTimeout(inspectionTimer)
      inspectionTimer = undefined
      // This non-sliding grace bounds helper settlement, not OS process-tree
      // cleanup. Keep unreaped child handles referenced; do not hide them by unref.
      teardownTimer = operations.setTimeout(() => finishFailure(true), 1000)
      if (archive && member) {
        try { archive.child.stdout.unpipe(member.child.stdin) } catch { archive.streamTeardownFailed = true }
      }
      for (const item of children) {
        for (const stream of [item.child.stdin, item.child.stdout, item.child.stderr]) if (stream) {
          try { stream.destroy() } catch { item.streamTeardownFailed = true }
        }
        if (!item.exited && !item.closed && !item.spawnFailed) {
          try { item.kill = item.child.kill('SIGKILL') ? 'sent' : 'not-sent' } catch { item.kill = 'threw' }
        }
      }
      tearingDown = false; finishFailure()
    }
    const maybeSuccess = () => {
      if (setup || state !== 'running' || children.length !== 2 || children.some(item => !item.closed)) return
      if (children.some(item => item.closed.code !== 0 || item.closed.signal !== null)) return fail('Packaged browser extraction failed')
      if (bytes === 0) return fail('Packaged browser is missing')
      let digest
      try { digest = hash.digest('hex') } catch { return fail('Packaged browser hashing failed') }
      state = 'settled'; dispose(false); resolveHash(digest)
    }
    const start = (name, file, args, stdio) => {
      const child = operations.spawn(file, args, { stdio })
      const item = { name, child, spawned: false, spawnFailed: false, exited: false, closed: null,
        errored: false, kill: 'not-attempted', streamTeardownFailed: false }
      children.push(item)
      listen(child, 'spawn', () => { if (state !== 'settled') item.spawned = true })
      listen(child, 'error', () => {
        if (state === 'settled') return
        item.errored = true
        if (!item.spawned && child.pid == null) item.spawnFailed = true
        fail('Packaged browser process failed'); finishFailure()
      })
      listen(child, 'exit', () => {
        if (state === 'settled') return
        item.exited = true; finishFailure()
      })
      listen(child, 'close', (code, signal) => {
        if (state === 'settled') return
        item.closed = { code, signal }
        if (code !== 0 || signal !== null) fail('Packaged browser extraction failed')
        maybeSuccess(); finishFailure()
      })
      for (const stream of [child.stdin, child.stdout, child.stderr]) if (stream) {
        listen(stream, 'error', () => fail('Packaged browser stream failed'))
      }
      return item
    }
    try {
      inspectionTimer = operations.setTimeout(() => fail('Packaged browser inspection timed out'), 60000)
      archive = start('archive', 'dpkg-deb', ['--fsys-tarfile', path], ['ignore', 'pipe', 'pipe'])
      if (state === 'running') member = start('member', 'tar', ['--extract', '--to-stdout', '--file', '-', './opt/google/chrome/chrome'], ['pipe', 'pipe', 'pipe'])
      if (state === 'running') {
        listen(member.child.stdout, 'data', data => {
          if (state !== 'running') return
          try {
            bytes += data.length
            if (bytes > 1024 * 1024 * 1024) fail('Oversized packaged browser')
            else hash.update(data)
          } catch { fail('Packaged browser hashing failed') }
        })
        // Consume the entire producer; an early consumer close cannot certify it.
        archive.child.stdout.pipe(member.child.stdin)
        if (state === 'running') archive.child.stderr.resume()
        if (state === 'running') member.child.stderr.resume()
      }
    } catch { fail('Packaged browser setup failed') }
    finally { setup = false; maybeSuccess(); finishFailure() }
  })
}

// Injection is exclusively a Node fixture seam. The CLI has no user-selectable
// commands, package source, executable path, skip-install or fallback options.
export async function installBenchmarkBrowser(root, overrides = {}) {
  const pin = loadBrowserPin(root), out = resolve(root, 'outputs/browser-runtime')
  assert.ok(!existsSync(out), 'Browser installation output must be fresh')
  mkdirSync(out, { recursive: true })
  const receipt = { version: 1, status: 'incomplete', pinSha256: pinSha256(pin), pin,
    packageUrl: packageUrl(pin), packageSha256: null, browserPath, browserSha256: null,
    playwright: null, commands: [], startedAt: new Date().toISOString() }
  const save = () => writeFileSync(resolve(out, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n')
  const operations = {
    execute: (file, args) => execFileSync(file, args, { encoding: 'utf8', timeout: 180000, maxBuffer: 1024 * 1024 }),
    size: path => statSync(path).size,
    hashFile: fileSha256,
    packagedHash: packagedBrowserSha256,
    verify: verifyBrowserFiles,
    platform: process.platform,
    arch: process.arch,
    ...overrides,
  }
  const command = (file, args) => {
    const item = { file, args, status: 'running' }; receipt.commands.push(item); save()
    try {
      const output = operations.execute(file, args)
      appendFileSync(resolve(out, 'install.log'), `${file}: ${output}\n`)
      item.status = 'passed'; return output
    } catch (error) {
      item.status = 'failed'; item.failure = String(error).slice(0, 2000)
      appendFileSync(resolve(out, 'install.log'), `${file}: ${item.failure}\n${String(error.stdout ?? '').slice(0, 65536)}\n${String(error.stderr ?? '').slice(0, 65536)}\n`)
      throw error
    } finally { save() }
  }
  let temporary
  try {
    save()
    assert.equal(operations.platform, 'linux', 'Pinned benchmark browser supports Linux only')
    assert.equal(operations.arch, 'x64', 'Pinned benchmark browser supports x64 only')
    receipt.playwright = installedPlaywrightIdentity(root)
    // An ordinary update of the runner's installed package, not a new privileged
    // helper configuration, AppArmor exception or dependency/OS upgrade.
    assert.equal(command('dpkg-query', ['--show', '--showformat=${Status}', packageName]).trim(), 'install ok installed', 'Expected existing Chrome package')
    temporary = mkdtempSync(resolve(tmpdir(), 'pnd-browser-install-'))
    const archive = resolve(temporary, 'chrome.deb')
    command('curl', ['--fail', '--location', '--proto', '=https', '--proto-redir', '=https', '--max-time', '120', '--retry', '0',
      '--max-filesize', String(pin.packageBytes), '--output', archive, packageUrl(pin)])
    assert.equal(operations.size(archive), pin.packageBytes, 'Browser package size mismatch')
    receipt.packageSha256 = operations.hashFile(archive)
    assert.equal(receipt.packageSha256, pin.packageSha256, 'Browser package SHA-256 mismatch')
    verifyPackageMetadata(command('dpkg-deb', ['--show', '--showformat=${Package}\t${Version}\t${Architecture}', archive]), pin)
    receipt.browserSha256 = await operations.packagedHash(archive)
    assert.match(receipt.browserSha256, /^[a-f0-9]{64}$/)
    // No apt update, dependency repair, floating package resolution or fallback.
    command('sudo', ['--non-interactive', 'dpkg', '--install', archive])
    assert.equal(command('dpkg-query', ['--show', '--showformat=${Status}\t${Version}', packageName]).trim(),
      `install ok installed\t${pin.packageVersion}`, 'Installed package version mismatch')
    receipt.browser = operations.verify(pin, { ...receipt, status: 'passed' })
    receipt.status = 'passed'
    return receipt
  } catch (error) { receipt.status = 'failed'; receipt.failure = String(error).slice(0, 2000); throw error }
  finally {
    // Remove only this invocation's fresh download, including failed attempts.
    if (temporary) rmSync(temporary, { recursive: true, force: true })
    receipt.endedAt = new Date().toISOString(); save()
  }
}

if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) {
  assert.equal(process.argv.length, 2, 'Browser installer accepts no options')
  await installBenchmarkBrowser(resolve(import.meta.dirname, '../..'))
}
