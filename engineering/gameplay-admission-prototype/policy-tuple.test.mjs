import test from 'node:test'
import assert from 'node:assert/strict'
import { compareReviewedGameplayPolicy as compare } from './policy-tuple.mjs'
const sha = 'a'.repeat(64)
function fixture() {
  return { version: 1, candidate: 'b'.repeat(40), infrastructure: 'c'.repeat(40),
    kind: 'owned-swamp-diagnostic', manager: 'pnpm@11.25.0',
    bootstrap: { origin: 'https://registry.npmjs.org/pnpm/-/pnpm-11.25.0.tgz', sha256: sha },
    toolchain: { nodeVersion: '24.19.0', nodeSha256: sha, platform: 'linux', architecture: 'x64' },
    argv: ['install', '--frozen-lockfile', '--ignore-scripts'],
    configuration: [{ name: 'NODE_OPTIONS', state: 'absent', value: null },
      { name: 'npm_config_verify_deps_before_run', state: 'absent', value: null }],
    closure: ['package.json', 'package-lock.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', '.npmrc', '.pnpmfile.cjs'].map(path => ({ path,
      state: ['package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml'].includes(path) ? 'regular' : 'absent',
      sha256: ['package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml'].includes(path) ? sha : null })),
    resolutions: [{ id: 'example@1.0.0', origin: 'https://registry.npmjs.org/example/-/example-1.0.0.tgz', integrity: 'sha512-' + 'A'.repeat(86) + '==', kind: 'registry' }],
    features: [] }
}
test('identical independently supplied tuple matches but grants no execution', () => {
  const a = fixture(), b = structuredClone(a)
  const result = compare(a, b)
  assert.equal(result.metadataMatches, true); assert.equal(result.executionAuthorized, false)
  assert.ok(Object.isFrozen(result)); assert.deepEqual(a, b)
})
for (const [name, mutate] of [
  ['candidate', x => { x.candidate = 'd'.repeat(40) }],
  ['infrastructure', x => { x.infrastructure = 'd'.repeat(40) }],
  ['kind', x => { x.kind = 'spy-discovery-diagnostic' }],
  ['manager', x => { x.manager = 'npm@11.9.0' }],
  ['bootstrap bytes', x => { x.bootstrap.sha256 = 'd'.repeat(64) }],
  ['node bytes', x => { x.toolchain.nodeSha256 = 'd'.repeat(64) }],
  ['platform', x => { x.toolchain.platform = 'darwin' }],
  ['install flags', x => { x.argv.pop() }],
  ['unknown field', x => { x.authorized = true }],
  ['unknown nested field', x => { x.bootstrap.allowed = true }],
  ['new config', x => { x.configuration.push({ name: 'pnpm_config_ignore_scripts', state: 'present', value: 'false' }) }],
  ['absent becomes present', x => { x.configuration[1] = { name: x.configuration[1].name, state: 'present', value: 'false' } }],
  ['missing lock', x => { x.closure = x.closure.filter(r => r.path !== 'pnpm-lock.yaml') }],
  ['changed lock', x => { x.closure[2].sha256 = 'd'.repeat(64) }],
  ['symlink file', x => { x.closure[2].state = 'symlink' }],
  ['new policy file', x => { x.closure.push({ path: '.pnpmfile.mjs', state: 'regular', sha256: sha }) }],
  ['new hook', x => { x.closure[5] = { path: '.pnpmfile.cjs', state: 'regular', sha256: sha } }],
  ['local source', x => { x.resolutions[0].kind = 'file' }],
  ['git source', x => { x.resolutions[0].kind = 'git' }],
  ['different registry', x => { x.resolutions[0].origin = 'https://other.invalid/a.tgz' }],
  ['different integrity', x => { x.resolutions[0].integrity = 'sha512-' + 'B'.repeat(85) + 'A==' }],
  ['unsupported feature', x => { x.features.push('patchedDependencies') }],
  ['duplicate config', x => { x.configuration.push({ ...x.configuration[0] }) }],
  ['duplicate path', x => { x.closure.push({ ...x.closure[0] }) }],
  ['duplicate package', x => { x.resolutions.push({ ...x.resolutions[0] }) }],
  ['sparse array', x => { delete x.argv[1] }],
  ['accessor field', x => { Object.defineProperty(x, 'kind', { get() { throw Error('must not invoke getter') }, enumerable: true }) }],
]) test(`rejects ${name}`, () => {
  const reviewed = fixture(), observed = structuredClone(reviewed)
  mutate(observed); assert.throws(() => compare(reviewed, observed))
})
test('unsupported metadata is rejected even if present in both inputs', () => {
  const policy = fixture(); policy.features = ['catalog']
  assert.throws(() => compare(policy, structuredClone(policy)))
})
test('comparison is fresh, not a reusable authorization token', () => {
  const reviewed = fixture(), observed = structuredClone(reviewed)
  compare(reviewed, observed); observed.closure[2].sha256 = 'd'.repeat(64)
  assert.throws(() => compare(reviewed, observed))
})

for (const [name, integrity] of [
  ['short digest', 'sha512-YQ=='],
  ['missing padding', 'sha512-' + 'A'.repeat(86)],
  ['extra padding', 'sha512-' + 'A'.repeat(86) + '==='],
  ['noncanonical padding bits', 'sha512-' + 'A'.repeat(85) + 'B=='],
  ['wrong digest length', 'sha512-' + 'A'.repeat(90) + '=='],
]) test(`rejects identical malformed SHA-512 integrity: ${name}`, () => {
  const policy = fixture(); policy.resolutions[0].integrity = integrity
  assert.throws(() => compare(policy, structuredClone(policy)))
})
