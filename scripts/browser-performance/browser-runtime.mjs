// The benchmark pins the normal official Chrome package at its existing
// sandbox-supported installation path. Never select a runner-image fallback.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { accessSync, closeSync, constants, lstatSync, openSync, readFileSync, readSync, realpathSync } from 'node:fs'
import { resolve } from 'node:path'
import { browserConfiguration } from '../tutorial-browser/browser-config.mjs'

export const browserPath = '/opt/google/chrome/chrome'
export const packageName = 'google-chrome-stable'
export const metadataUrl = 'https://dl.google.com/linux/chrome/deb/dists/stable/main/binary-amd64/Packages'
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')

export function fileSha256(path) {
  const hash = createHash('sha256'), buffer = Buffer.alloc(1024 * 1024), fd = openSync(path, 'r')
  try { let bytes; while ((bytes = readSync(fd, buffer, 0, buffer.length, null))) hash.update(buffer.subarray(0, bytes)) }
  finally { closeSync(fd) }
  return hash.digest('hex')
}

export function validateBrowserPin(pin) {
  assert.deepEqual(Object.keys(pin).sort(), ['version', 'packageVersion', 'packageBytes', 'packageSha256', 'metadataUrl', 'metadataCheckedOn'].sort())
  assert.equal(pin.version, 1)
  assert.match(pin.packageVersion, /^\d+\.\d+\.\d+\.\d+-1$/)
  assert.ok(Number.isSafeInteger(pin.packageBytes) && pin.packageBytes > 0 && pin.packageBytes <= 256 * 1024 * 1024)
  assert.match(pin.packageSha256, /^[a-f0-9]{64}$/)
  assert.equal(pin.metadataUrl, metadataUrl)
  assert.match(pin.metadataCheckedOn, /^\d{4}-\d{2}-\d{2}$/)
  return pin
}

export function loadBrowserPin(root) {
  return validateBrowserPin(JSON.parse(readFileSync(resolve(root, 'scripts/browser-performance/browser-runtime.json'), 'utf8')))
}
export const browserVersion = pin => validateBrowserPin(pin).packageVersion.split('-')[0]
export const packageUrl = pin => `https://dl.google.com/linux/chrome/deb/pool/main/g/${packageName}/${packageName}_${validateBrowserPin(pin).packageVersion}_amd64.deb`
export const pinSha256 = pin => sha256(JSON.stringify(validateBrowserPin(pin)))

// Exposed for offline fixtures; neither metadata nor a caller can choose a URL,
// executable path, alternate package, platform or installation command.
export function verifyPackageMetadata(text, pin) {
  assert.equal(text.trim(), `${packageName}\t${pin.packageVersion}\tamd64`, 'Downloaded package identity mismatch')
}

export function installedPlaywrightIdentity(root) {
  const lock = JSON.parse(readFileSync(resolve(root, 'package-lock.json'), 'utf8'))
  const core = JSON.parse(readFileSync(resolve(root, 'node_modules/playwright-core/package.json'), 'utf8'))
  assert.equal(core.version, lock.packages['node_modules/playwright-core'].version, 'Installed Playwright differs from trusted lock')
  return { version: core.version, lockSha256: fileSha256(resolve(root, 'package-lock.json')),
    manifestSha256: fileSha256(resolve(root, 'node_modules/playwright-core/browsers.json')) }
}

export function verifyBrowserFiles(pin, installation, {
  path = browserPath,
  inspect = value => ({ stat: lstatSync(value), realpath: realpathSync(value) }),
  accessible = value => accessSync(value, constants.X_OK),
  hashFile = fileSha256,
  version = value => execFileSync(value, ['--version'], { encoding: 'utf8', timeout: 10000, maxBuffer: 4096 }).trim(),
} = {}) {
  validateBrowserPin(pin)
  assert.equal(path, browserPath, 'Browser launcher path must remain the supported system path')
  assert.equal(installation.status, 'passed', 'Pinned browser installation did not pass')
  assert.equal(installation.pinSha256, pinSha256(pin), 'Browser installation pin mismatch')
  assert.equal(installation.packageSha256, pin.packageSha256, 'Browser package digest mismatch')
  assert.equal(installation.browserPath, browserPath)
  assert.match(installation.browserSha256, /^[a-f0-9]{64}$/)
  const { stat, realpath } = inspect(path)
  assert.ok(stat.isFile() && !stat.isSymbolicLink(), 'Browser must be a regular executable')
  assert.equal(realpath, path, 'Browser path must not redirect through symlinks')
  accessible(path)
  assert.equal(hashFile(path), installation.browserSha256, 'Installed browser is missing, corrupt or replaced')
  const actualVersion = version(path)
  assert.equal(actualVersion, `Google Chrome ${browserVersion(pin)}`, 'Installed browser version mismatch')
  return { browserPath, browserVersion: actualVersion, browserSha256: installation.browserSha256 }
}

export function benchmarkBrowser(root) {
  const pin = loadBrowserPin(root)
  const installation = JSON.parse(readFileSync(resolve(root, 'outputs/browser-runtime/receipt.json'), 'utf8'))
  const playwright = installedPlaywrightIdentity(root)
  assert.deepEqual(installation.playwright, playwright, 'Playwright changed after browser installation')
  const verified = verifyBrowserFiles(pin, installation)
  return { config: browserConfiguration(browserPath), provenance: { ...verified, pin, pinSha256: pinSha256(pin),
    packageUrl: packageUrl(pin), playwright },
  verify: () => verifyBrowserFiles(pin, installation),
  verifyLaunched: version => verifyLaunchedBrowser(pin, version) }
}

export const verifyLaunchedBrowser = (pin, version) => assert.equal(version, browserVersion(pin), 'Launched browser version mismatch')
