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
export async function packagedBrowserSha256(path) {
  const archive = spawn('dpkg-deb', ['--fsys-tarfile', path], { stdio: ['ignore', 'pipe', 'pipe'] })
  const member = spawn('tar', ['--extract', '--to-stdout', '--file', '-', './opt/google/chrome/chrome'], { stdio: ['pipe', 'pipe', 'pipe'] })
  const hash = createHash('sha256'); let bytes = 0, failure
  const fail = error => { failure ??= error; archive.kill('SIGKILL'); member.kill('SIGKILL') }
  const timer = setTimeout(() => fail(Error('Packaged browser inspection timed out')), 60000)
  archive.stdout.on('error', fail); member.stdin.on('error', fail)
  // tar must consume the entire stream so a failed producer cannot be hidden.
  archive.stdout.pipe(member.stdin)
  member.stdout.on('data', data => { bytes += data.length; if (bytes > 1024 * 1024 * 1024) fail(Error('Oversized packaged browser')); else hash.update(data) })
  archive.stderr.resume(); member.stderr.resume()
  const closed = child => new Promise(done => { child.on('error', fail); child.on('close', (code, signal) => done({ code, signal })) })
  try {
    const results = await Promise.all([closed(archive), closed(member)])
    if (failure) throw failure
    assert.ok(results.every(result => result.code === 0 && result.signal === null), 'Packaged browser extraction failed')
    assert.ok(bytes > 0, 'Packaged browser is missing')
    return hash.digest('hex')
  } finally { clearTimeout(timer) }
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
