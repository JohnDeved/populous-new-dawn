import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import test from 'node:test'
import { browserPath, browserVersion, packageUrl, pinSha256, loadBrowserPin, validateBrowserPin, sha256,
  verifyPackageMetadata, verifyBrowserFiles, verifyLaunchedBrowser, installedPlaywrightIdentity, benchmarkBrowser, fileSha256 } from '../scripts/browser-performance/browser-runtime.mjs'
import { installBenchmarkBrowser, packagedBrowserSha256 } from '../scripts/browser-performance/install-browser.mjs'
import { browserConfiguration } from '../scripts/tutorial-browser/browser-config.mjs'

const root = resolve(import.meta.dirname, '..'), pin = loadBrowserPin(root)
const digest = sha256('fixture browser bytes'), installed = () => ({ status: 'passed', pinSha256: pinSha256(pin), packageSha256: pin.packageSha256,
  browserPath, browserSha256: digest })
const verification = () => ({ inspect: path => ({ stat: { isFile: () => true, isSymbolicLink: () => false }, realpath: path }),
  accessible: () => {}, hashFile: () => digest, version: () => `Google Chrome ${browserVersion(pin)}` })

function fixture(t) {
  const directory = mkdtempSync(resolve(tmpdir(), 'pnd-browser-pin-test-'))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  for (const path of ['scripts/browser-performance', 'node_modules/playwright-core']) mkdirSync(resolve(directory, path), { recursive: true })
  writeFileSync(resolve(directory, 'scripts/browser-performance/browser-runtime.json'), JSON.stringify(pin))
  writeFileSync(resolve(directory, 'package-lock.json'), JSON.stringify({ packages: { 'node_modules/playwright-core': { version: '1.63.0' } } }))
  writeFileSync(resolve(directory, 'node_modules/playwright-core/package.json'), JSON.stringify({ version: '1.63.0' }))
  writeFileSync(resolve(directory, 'node_modules/playwright-core/browsers.json'), '{"browsers":[]}')
  const calls = [], operations = {
    execute: (file, args) => {
      calls.push({ file, args })
      if (file === 'dpkg-query') return args[1].includes('Version') ? `install ok installed\t${pin.packageVersion}` : 'install ok installed'
      if (file === 'dpkg-deb') return `google-chrome-stable\t${pin.packageVersion}\tamd64`
      if (file === 'curl') { writeFileSync(args[args.indexOf('--output') + 1], 'fixture download'); return '' }
      assert.equal(file, 'sudo'); return 'fixture installation only'
    },
    size: () => pin.packageBytes, hashFile: () => pin.packageSha256, packagedHash: async () => digest,
    verify: (selected, installation) => verifyBrowserFiles(selected, installation, verification()), platform: 'linux', arch: 'x64',
  }
  return { directory, calls, operations, receipt: () => JSON.parse(readFileSync(resolve(directory, 'outputs/browser-runtime/receipt.json'))) }
}

test('pin has one release source, exact official package identity and bounded digest/size', () => {
  assert.equal(browserVersion(pin), pin.packageVersion.split('-')[0])
  assert.equal(packageUrl(pin), `https://dl.google.com/linux/chrome/deb/pool/main/g/google-chrome-stable/google-chrome-stable_${pin.packageVersion}_amd64.deb`)
  for (const change of [p => { p.packageVersion = 'latest' }, p => { p.packageBytes = Infinity }, p => { p.packageSha256 = 'x' },
    p => { p.metadataUrl = 'https://evil.test' }, p => { p.executablePath = '/tmp/chrome' }]) {
    const wrong = structuredClone(pin); change(wrong); assert.throws(() => validateBrowserPin(wrong))
  }
  verifyPackageMetadata(`google-chrome-stable\t${pin.packageVersion}\tamd64`, pin)
  for (const value of [`google-chrome-beta\t${pin.packageVersion}\tamd64`, `google-chrome-stable\t0.0.0.0-1\tamd64`,
    `google-chrome-stable\t${pin.packageVersion}\tarm64`]) assert.throws(() => verifyPackageMetadata(value, pin))
})

test('missing, nonexecutable, redirected, wrong-version and corrupt browsers fail closed', () => {
  verifyLaunchedBrowser(pin, browserVersion(pin))
  assert.throws(() => verifyLaunchedBrowser(pin, '0.0.0.0'), /Launched browser version mismatch/)
  assert.deepEqual(verifyBrowserFiles(pin, installed(), verification()), { browserPath, browserVersion: `Google Chrome ${browserVersion(pin)}`, browserSha256: digest })
  const cases = [
    { inspect: () => { throw Error('ENOENT') } }, { accessible: () => { throw Error('EACCES') } },
    { inspect: () => ({ stat: { isFile: () => false }, realpath: browserPath }) },
    { inspect: () => ({ stat: { isFile: () => true, isSymbolicLink: () => true }, realpath: '/tmp/chrome' }) },
    { hashFile: () => sha256('corrupt browser') }, { version: () => 'Google Chrome 0.0.0.0' },
    { version: () => { throw Error('version command failed') } }, { path: '/tmp/chrome' },
  ]
  for (const changed of cases) assert.throws(() => verifyBrowserFiles(pin, installed(), { ...verification(), ...changed }))
  for (const changed of [{ status: 'failed' }, { pinSha256: sha256('other pin') }, { packageSha256: sha256('other package') },
    { browserPath: '/tmp/chrome' }, { browserSha256: '' }]) assert.throws(() => verifyBrowserFiles(pin, { ...installed(), ...changed }, verification()))
})

test('installation is mandatory and installed Playwright must match the exact locked dependency', t => {
  const f = fixture(t)
  assert.equal(installedPlaywrightIdentity(f.directory).version, '1.63.0')
  assert.throws(() => benchmarkBrowser(f.directory), /ENOENT/)
  writeFileSync(resolve(f.directory, 'node_modules/playwright-core/package.json'), '{"version":"other"}')
  assert.throws(() => installedPlaywrightIdentity(f.directory), /Playwright differs/)
})

test('installer uses a fresh download, verifies package before install and retains provenance and cleanup', async t => {
  const f = fixture(t), result = await installBenchmarkBrowser(f.directory, f.operations)
  assert.equal(result.status, 'passed'); assert.equal(f.receipt().browserSha256, digest)
  assert.equal(result.pinSha256, pinSha256(pin)); assert.equal(result.packageSha256, pin.packageSha256)
  assert.deepEqual(f.calls.map(call => call.file), ['dpkg-query', 'curl', 'dpkg-deb', 'sudo', 'dpkg-query'])
  const download = f.calls[1].args, archive = download[download.indexOf('--output') + 1]
  assert.ok(download.includes('--fail')); assert.ok(download.includes('--max-filesize')); assert.equal(download.at(-1), packageUrl(pin))
  assert.deepEqual(f.calls[3].args, ['--non-interactive', 'dpkg', '--install', archive])
  assert.equal(existsSync(archive), false)
  assert.equal(result.commands.every(command => command.status === 'passed'), true)
  assert.ok(result.endedAt)
  await assert.rejects(() => installBenchmarkBrowser(f.directory, f.operations), /must be fresh/)
})

test('unavailable or corrupt package and metadata failure never install or fall back', async t => {
  for (const failure of ['download', 'size', 'hash', 'metadata', 'member', 'platform', 'arch', 'existing-package']) {
    const f = fixture(t), execute = f.operations.execute
    if (failure === 'download') f.operations.execute = (file, args) => { if (file === 'curl') throw Error('404'); return execute(file, args) }
    if (failure === 'size') f.operations.size = () => 195
    if (failure === 'hash') f.operations.hashFile = () => sha256('HTML or corrupt archive')
    if (failure === 'metadata') f.operations.execute = (file, args) => file === 'dpkg-deb' ? 'wrong package' : execute(file, args)
    if (failure === 'member') f.operations.packagedHash = async () => { throw Error('missing archive member') }
    if (failure === 'platform') f.operations.platform = 'darwin'
    if (failure === 'arch') f.operations.arch = 'arm64'
    if (failure === 'existing-package') f.operations.execute = () => 'not installed'
    await assert.rejects(() => installBenchmarkBrowser(f.directory, f.operations))
    assert.equal(f.calls.some(call => call.file === 'sudo'), false)
    assert.equal(f.receipt().status, 'failed'); assert.ok(f.receipt().failure)
    const download = f.calls.find(call => call.file === 'curl')?.args
    if (download) assert.equal(existsSync(download[download.indexOf('--output') + 1]), false)
  }
})

test('installation, post-install package version and executable verification failures stay failed', async t => {
  for (const failure of ['install', 'package-version', 'executable']) {
    const f = fixture(t), execute = f.operations.execute
    if (failure === 'install') f.operations.execute = (file, args) => { if (file === 'sudo') throw Error('dependency unavailable'); return execute(file, args) }
    if (failure === 'package-version') f.operations.execute = (file, args) => file === 'dpkg-query' && args[1].includes('Version') ? 'install ok installed\t0.0.0.0-1' : execute(file, args)
    if (failure === 'executable') f.operations.verify = () => { throw Error('corrupt installed browser') }
    await assert.rejects(() => installBenchmarkBrowser(f.directory, f.operations))
    assert.equal(f.receipt().status, 'failed'); assert.ok(f.receipt().failure)
  }
})

test('packaged executable hashing streams data without installing or executing the member', async t => {
  const f = fixture(t), tree = resolve(f.directory, 'package')
  mkdirSync(resolve(tree, 'DEBIAN'), { recursive: true }); mkdirSync(resolve(tree, 'opt/google/chrome'), { recursive: true })
  writeFileSync(resolve(tree, 'DEBIAN/control'), 'Package: pnd-test-data\nVersion: 1\nArchitecture: all\nMaintainer: Test <test@example.invalid>\nDescription: Inert data fixture\n')
  const bytes = 'not an executable; data-only fixture\n', executable = resolve(tree, 'opt/google/chrome/chrome')
  writeFileSync(executable, bytes)
  assert.equal(fileSha256(executable), sha256(bytes))
  const archive = resolve(f.directory, 'fixture.deb')
  execFileSync('dpkg-deb', ['--build', tree, archive], { stdio: 'pipe', timeout: 10000 })
  assert.equal(await packagedBrowserSha256(archive), sha256(bytes))
  rmSync(executable); execFileSync('dpkg-deb', ['--build', tree, archive], { stdio: 'pipe', timeout: 10000 })
  await assert.rejects(() => packagedBrowserSha256(archive), /extraction failed/)
})

test('both benchmark entry points bind pin, launcher, live version and before/after hashes without changing sandbox or comparisons', () => {
  const config = browserConfiguration(browserPath)
  assert.deepEqual(config.launch, { executablePath: browserPath, headless: true, chromiumSandbox: true,
    ignoreDefaultArgs: true, args: ['--headless', '--remote-debugging-pipe'], timeout: 30000 })
  for (const name of ['run.mjs', 'run-live.mjs']) {
    const source = readFileSync(resolve(root, 'scripts/browser-performance', name), 'utf8')
    assert.match(source, /const pinnedBrowser = pinned \? benchmarkBrowser\(root\) : null/)
    assert.match(source, /pinned = false/)
    assert.match(source, /const config = pinned \? pinnedBrowser.config : browserConfiguration\(\)/)
    assert.match(source, /receipt.browser = provenance/)
    assert.equal((source.match(/pinnedBrowser\?\.verify\(\)/g) ?? []).length, 3)
    assert.match(source, /pinnedBrowser.verifyLaunched\(session.browserVersion\)/)
    assert.match(source, /runnerVersion: process.env.ImageVersion/); assert.match(source, /release: release\(\)/)
    assert.doesNotMatch(source, /--no-sandbox|CHROME_DEVEL_SANDBOX/)
  }
  const active = readFileSync(resolve(root, '.github/workflows/browser-performance.yml'), 'utf8')
  const template = readFileSync(resolve(root, 'scripts/browser-performance/workflows/browser-performance.yml'), 'utf8')
  assert.equal(active, template); assert.match(active, /node scripts\/browser-performance\/install-browser.mjs/)
  assert.match(active, /run: node scripts\/browser-performance\/run-pinned.mjs/)
  assert.match(active, /outputs\/browser-runtime\/receipt.json/); assert.match(active, /outputs\/browser-runtime\/install.log/)
  assert.doesNotMatch(active, /test -x \/opt\/google\/chrome\/chrome|--no-sandbox|install-deps|actions\/cache/)
  assert.match(active, /max-parallel: 2/); assert.match(active, /timeout-minutes: 15/); assert.match(active, /contents: read/)
})


test('passive pinned entrypoints require explicit source selection and cannot choose legacy fallback', () => {
  for (const [name, runner] of [['run-pinned.mjs', 'runBenchmark'], ['run-live-pinned.mjs', 'runLiveBenchmark']]) {
    const source = readFileSync(resolve(root, 'scripts/browser-performance', name), 'utf8')
    assert.ok(source.includes(`await ${runner}({ pinned: true })`))
    assert.match(source, /assert.equal\(process.argv.length, 2/)
    assert.doesNotMatch(source, /process.env|browserConfiguration|catch\s*\(/)
  }
})

test('shared benchmark runners can be imported without initializing outputs or selecting a browser', () => {
  const source = `
    import assert from 'node:assert/strict'
    const { runBenchmark } = await import('./scripts/browser-performance/run.mjs')
    const { runLiveBenchmark } = await import('./scripts/browser-performance/run-live.mjs')
    assert.equal(typeof runBenchmark, 'function')
    assert.equal(typeof runLiveBenchmark, 'function')
  `
  execFileSync(process.execPath, ['--input-type=module', '-e', source], {
    cwd: root, env: { ...process.env, BENCHMARK_SHARD: 'invalid-import-must-not-run' }, timeout: 15000, stdio: 'pipe',
  })
})
