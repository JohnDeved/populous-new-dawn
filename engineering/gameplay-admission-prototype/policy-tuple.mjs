// Inactive, pure comparison of independently reviewed and supplied metadata.
// This does not scan files, authenticate a reviewer, or authorize any execution.
const SHA = /^[a-f0-9]{64}$/
const COMMIT = /^[a-f0-9]{40}$/
const fail = message => { throw new TypeError(message) }
function object(value, keys, where) {
  if (!value || Object.getPrototypeOf(value) !== Object.prototype) fail(`${where}: plain record required`)
  const descriptors = Object.getOwnPropertyDescriptors(value)
  if (Reflect.ownKeys(descriptors).some(k => typeof k !== 'string') ||
      Object.keys(descriptors).sort().join('\0') !== [...keys].sort().join('\0')) fail(`${where}: unexpected fields`)
  for (const [key, d] of Object.entries(descriptors))
    if (!Object.hasOwn(d, 'value') || !d.enumerable) fail(`${where}.${key}: data field required`)
}
function string(value, where) {
  if (typeof value !== 'string' || !value.length || value.includes('\0')) fail(`${where}: nonempty string required`)
}
function array(value, where) {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) fail(`${where}: array required`)
  const keys = Reflect.ownKeys(value)
  if (keys.length !== value.length + 1 || keys.some(k => k !== 'length' && !/^(0|[1-9][0-9]*)$/.test(k))) fail(`${where}: dense array required`)
  for (let i = 0; i < value.length; i++) {
    const d = Object.getOwnPropertyDescriptor(value, String(i))
    if (!d || !Object.hasOwn(d, 'value') || !d.enumerable) fail(`${where}: array data required`)
  }
}
function fingerprint(value, where) {
  if (typeof value !== 'string' || !SHA.test(value)) fail(`${where}: SHA-256 required`)
}
function validate(v) {
  object(v, ['version', 'candidate', 'infrastructure', 'kind', 'manager', 'bootstrap', 'toolchain', 'argv', 'configuration', 'closure', 'resolutions', 'features'], 'tuple')
  if (v.version !== 1 || typeof v.candidate !== 'string' || !COMMIT.test(v.candidate) ||
      typeof v.infrastructure !== 'string' || !COMMIT.test(v.infrastructure)) fail('tuple: invalid version/commit')
  if (!['owned-swamp-diagnostic', 'spy-discovery-diagnostic'].includes(v.kind)) fail('tuple: unsupported diagnostic')
  if (v.manager !== 'pnpm@11.25.0') fail('tuple: unsupported manager')
  object(v.bootstrap, ['origin', 'sha256'], 'bootstrap')
  string(v.bootstrap.origin, 'bootstrap.origin'); fingerprint(v.bootstrap.sha256, 'bootstrap.sha256')
  object(v.toolchain, ['nodeVersion', 'nodeSha256', 'platform', 'architecture'], 'toolchain')
  for (const k of ['nodeVersion', 'platform', 'architecture']) string(v.toolchain[k], `toolchain.${k}`)
  fingerprint(v.toolchain.nodeSha256, 'toolchain.nodeSha256')
  array(v.argv, 'argv')
  if (JSON.stringify(v.argv) !== JSON.stringify(['install', '--frozen-lockfile', '--ignore-scripts'])) fail('unsupported install arguments')
  // Scanner must supply the COMPLETE effective environment/configuration closure.
  // Records include NODE_OPTIONS, proxy policy and all npm/pnpm inherited settings.
  array(v.configuration, 'configuration')
  const configNames = new Set()
  for (const r of v.configuration) {
    object(r, ['name', 'state', 'value'], 'configuration entry'); string(r.name, 'configuration.name')
    if (configNames.has(r.name)) fail('duplicate configuration name')
    configNames.add(r.name)
    if (r.state === 'absent') { if (r.value !== null) fail('absent configuration has value') }
    else if (r.state === 'present') { if (typeof r.value !== 'string') fail('configuration value must be string') }
    else fail('invalid configuration state')
  }
  if (!configNames.has('NODE_OPTIONS')) fail('NODE_OPTIONS presence/absence required')
  array(v.closure, 'closure')
  const paths = new Set()
  for (const r of v.closure) {
    object(r, ['path', 'state', 'sha256'], 'closure entry'); string(r.path, 'closure.path')
    if (paths.has(r.path)) fail('duplicate closure path')
    paths.add(r.path)
    if (r.state === 'absent') { if (r.sha256 !== null) fail('absent file has digest') }
    else if (r.state === 'regular') fingerprint(r.sha256, 'closure.sha256')
    else fail('unsupported file kind')
  }
  for (const name of ['package.json', 'package-lock.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', '.npmrc', '.pnpmfile.cjs'])
    if (!paths.has(name)) fail(`missing required presence/absence: ${name}`)
  for (const name of ['package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml'])
    if (v.closure.find(r => r.path === name).state !== 'regular') fail(`required file absent: ${name}`)
  // SHA-512 is exactly 64 bytes: 86 base64 digits plus ==; the final
  // digit has two data bits and four zero padding bits (A/Q/g/w only).
  array(v.resolutions, 'resolutions')
  const ids = new Set()
  for (const r of v.resolutions) {
    object(r, ['id', 'origin', 'integrity', 'kind'], 'resolution entry')
    for (const k of ['id', 'origin', 'integrity']) string(r[k], `resolution.${k}`)
    if (ids.has(r.id)) fail('duplicate resolution')
    ids.add(r.id)
    if (r.kind !== 'registry' || !/^https:\/\/[^\s]+$/.test(r.origin) || !/^sha512-[A-Za-z0-9+/]{85}[AQgw]==$/.test(r.integrity)) fail('unsupported resolution')
  }
  array(v.features, 'features')
  // No patch/catalog/override/local-source resolver is implemented by this predicate.
  if (v.features.length) fail('unsupported feature')
}
function equal(a, b) {
  if (typeof a !== 'object' || a === null) return a === b
  if (Array.isArray(a)) return a.length === b.length && a.every((v, i) => equal(v, b[i]))
  return Object.keys(a).every(k => equal(a[k], b[k]))
}
export function compareReviewedGameplayPolicy(reviewed, observed) {
  validate(reviewed); validate(observed)
  if (!equal(reviewed, observed)) fail('observed metadata differs from reviewed policy')
  return Object.freeze({ metadataMatches: true, executionAuthorized: false,
    scope: 'Supplied metadata equality only; scanner, trust, ownership and runtime gates remain external.' })
}
