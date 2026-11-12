import {
  closeSync,
  constants,
  fstatSync,
  lstatSync,
  openSync,
  readFileSync,
  readdirSync,
  readSync,
} from 'node:fs'
import { createHash } from 'node:crypto'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const manifestBytes = readFileSync(new URL('./reference-inputs.json', import.meta.url))
const manifest = JSON.parse(manifestBytes)
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const maxFileBytes = 32 * 1024 * 1024

function regularDirectory(path) {
  if (path.split(/[\\/]/).includes('..')) throw new Error('parent-directory-component')
  const root = resolve(path)
  for (let current = root; ; current = dirname(current)) {
    if (!lstatSync(current).isDirectory()) throw new Error('non-directory-or-symlink')
    if (dirname(current) === current) return root
  }
}

function identity(stat) {
  return [stat.dev, stat.ino, stat.size, stat.mtimeNs, stat.ctimeNs].join(':')
}

function hashFile(path) {
  const before = lstatSync(path, { bigint: true })
  if (!before.isFile()) throw new Error('non-regular-file')
  if (before.size > BigInt(maxFileBytes)) throw new Error('file-size-limit')
  const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK)
  try {
    if (identity(before) !== identity(fstatSync(fd, { bigint: true }))) {
      throw new Error('input-changed')
    }
    const hash = createHash('sha256')
    const buffer = Buffer.alloc(64 * 1024)
    let size = 0
    for (;;) {
      const count = readSync(fd, buffer, 0, buffer.length, null)
      if (count === 0) break
      size += count
      if (size > maxFileBytes || BigInt(size) > before.size) throw new Error('input-changed')
      hash.update(buffer.subarray(0, count))
    }
    if (
      BigInt(size) !== before.size ||
      identity(before) !== identity(fstatSync(fd, { bigint: true })) ||
      identity(before) !== identity(lstatSync(path, { bigint: true }))
    ) {
      throw new Error('input-changed')
    }
    return { bytes: size, sha256: hash.digest('hex') }
  } finally {
    closeSync(fd)
  }
}

// This data-only primitive also accepts invented test identities. The CLI never
// accepts a caller-supplied manifest, digest, override, command, or profile file.
export function inspectRequiredFiles(gameRoot, requiredFiles) {
  const root = regularDirectory(gameRoot)
  const names = readdirSync(root)
  return Object.entries(requiredFiles).map(([name, expectedSha256]) => {
    const matches = names.filter(candidate => candidate.toLowerCase() === name.toLowerCase())
    const result = { name, expectedSha256 }
    if (matches.length !== 1) {
      return { ...result, status: 'blocked', reason: matches.length ? 'ambiguous-case' : 'missing' }
    }
    try {
      const actual = hashFile(join(root, matches[0]))
      return {
        ...result,
        actualName: matches[0],
        ...actual,
        status: actual.sha256 === expectedSha256 ? 'matched' : 'blocked',
        ...(actual.sha256 === expectedSha256 ? {} : { reason: 'sha256-mismatch' }),
      }
    } catch (error) {
      return { ...result, status: 'blocked', reason: error.code ?? error.message }
    }
  })
}

export function inspectInputs(profileName, gameRoot) {
  if (!Object.hasOwn(manifest.profiles, profileName)) throw new Error('unknown-profile')
  const profile = manifest.profiles[profileName]
  const files = inspectRequiredFiles(gameRoot, profile.requiredFiles)
  return {
    schema: 1,
    kind: 'original-reference-binary-identity',
    profile: profileName,
    status: files.every(file => file.status === 'matched') ? 'matched' : 'blocked',
    manifestSha256: sha256(manifestBytes),
    inspectorSha256: sha256(readFileSync(new URL(import.meta.url))),
    runtime: { node: process.version, platform: process.platform, arch: process.arch },
    upstream: profile,
    files,
    scope: {
      originalCodeExecuted: false,
      sourceCheckoutVerified: false,
      assetIdentityVerified: false,
      toolchainVerified: false,
      runtimeReadiness: 'not-evaluated',
      license: 'Upstream MIT covers authored source only, not original files or translated output.',
    },
  }
}

export function main(args) {
  if (
    args.length !== 4 ||
    args[0] !== '--profile' ||
    args[2] !== '--game-root' ||
    !args[1] ||
    !args[3] ||
    args[3].startsWith('--')
  ) {
    console.error(
      'Usage: node inspect-inputs.mjs --profile <openpoptb-software|populous-recomp-web> --game-root <directory>'
    )
    return 2
  }
  try {
    const result = inspectInputs(args[1], args[3])
    console.log(JSON.stringify(result, null, 2))
    return result.status === 'matched' ? 0 : 1
  } catch (error) {
    console.log(
      JSON.stringify({ schema: 1, status: 'blocked', reason: error.code ?? error.message })
    )
    return 1
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.exitCode = main(process.argv.slice(2))
}
