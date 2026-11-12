// Inactive supplied-observation adapter. No filesystem, app or package execution.
// Future trusted IO MUST hold no-follow opened root/parent/file descriptors,
// compare lstat/fstat identities before/after read, and use exclusive ownership.
// Supplied identities below test consistency only, not actual filesystem safety.
export const limits = Object.freeze({ files: 32, bytesPerFile: 4 * 1024 * 1024, totalBytes: 8 * 1024 * 1024 })
const digest = /^[0-9a-f]{64}$/
const commit = /^[0-9a-f]{40}$/
function require(ok, message) { if (!ok) throw new TypeError(message) }
function record(v, keys) {
  require(v !== null && typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype, 'plain record required')
  const ds = Object.getOwnPropertyDescriptors(v)
  require(Reflect.ownKeys(ds).length === keys.length && keys.every(k => Object.hasOwn(ds, k)), 'unknown/missing fields')
  require(Object.values(ds).every(d => Object.hasOwn(d, 'value') && d.enumerable), 'data fields required')
}
function list(v) {
  require(Array.isArray(v) && Object.getPrototypeOf(v) === Array.prototype && v.length <= limits.files, 'bounded list required')
  require(Reflect.ownKeys(v).length === v.length + 1, 'dense unadorned list required')
  for (let i = 0; i < v.length; i++) {
    const d = Object.getOwnPropertyDescriptor(v, String(i))
    require(d && Object.hasOwn(d, 'value') && d.enumerable, 'dense data list required')
  }
}
function path(v) { require(typeof v === 'string' && v.length <= 128 && /^[A-Za-z0-9_.-]+$/.test(v) && !/^\.+$/.test(v), 'root filename required') }
function sha(v) { require(typeof v === 'string' && digest.test(v), 'digest required') }
function size(v) { require(Number.isSafeInteger(v) && v >= 0 && v <= limits.bytesPerFile, 'file byte cap') }
function identity(v) {
  record(v, ['device', 'inode', 'size', 'links', 'mode', 'mtimeNs', 'ctimeNs'])
  for (const k of ['device', 'inode', 'mtimeNs', 'ctimeNs']) require(typeof v[k] === 'string' && /^[0-9]{1,30}$/.test(v[k]), 'identity integer string required')
  size(v.size); require(v.links === 1 && v.mode === 'regular', 'private regular file required')
}
function same(a, b) { return Object.keys(a).every(k => a[k] === b[k]) }
// manifestBindings is a projected sourceManifest output, NOT a replacement verifier.
// sha256/byteLength in observations must come from trusted IO hashing actual bytes.
export function candidatePolicyFragment(profile, manifestBindings, observations) {
  record(profile, ['candidate', 'paths']); record(manifestBindings, ['candidate', 'files'])
  require(typeof profile.candidate === 'string' && commit.test(profile.candidate) && manifestBindings.candidate === profile.candidate, 'candidate mismatch')
  list(profile.paths); list(manifestBindings.files); list(observations)
  require(profile.paths.length > 0 && observations.length === profile.paths.length, 'observation coverage')
  const wanted = new Map(), tracked = new Map(), seen = new Set()
  let total = 0
  for (const p of profile.paths) {
    record(p, ['path', 'state', 'sha256', 'bytes']); path(p.path)
    require(!wanted.has(p.path), 'duplicate profile path'); wanted.set(p.path, p)
    if (p.state === 'absent') require(p.sha256 === null && p.bytes === null, 'absence has content')
    else { require(p.state === 'regular', 'unsupported state'); sha(p.sha256); size(p.bytes); total += p.bytes }
  }
  require(total <= limits.totalBytes, 'aggregate byte cap')
  for (const f of manifestBindings.files) {
    record(f, ['path', 'sha256', 'bytes']); path(f.path); sha(f.sha256); size(f.bytes)
    require(!tracked.has(f.path), 'duplicate tracked path'); tracked.set(f.path, f)
    const p = wanted.get(f.path)
    require(p?.state === 'regular' && p.sha256 === f.sha256 && p.bytes === f.bytes, 'unexpected/mismatched tracked binding')
  }
  for (const o of observations) {
    record(o, ['path', 'state', 'sha256', 'bytes', 'rootAlias', 'parentAlias', 'before', 'opened', 'after'])
    path(o.path); require(!seen.has(o.path), 'duplicate observation'); seen.add(o.path)
    const p = wanted.get(o.path); require(p && p.state === o.state, 'unexpected path/state')
    require(o.rootAlias === false && o.parentAlias === false, 'aliased owner')
    if (o.state === 'absent') require(o.sha256 === null && o.bytes === null && o.before === null && o.opened === null && o.after === null && !tracked.has(o.path), 'invalid absence')
    else {
      sha(o.sha256); size(o.bytes)
      require(tracked.has(o.path) && o.sha256 === p.sha256 && o.bytes === p.bytes, 'unbound bytes')
      for (const id of [o.before, o.opened, o.after]) identity(id)
      require(same(o.before, o.opened) && same(o.opened, o.after) && o.bytes === o.opened.size, 'identity changed')
    }
  }
  return Object.freeze({ kind: 'candidate-policy-files', candidate: profile.candidate,
    closure: Object.freeze(profile.paths.map(p => Object.freeze({ ...p }))), executionAuthorized: false,
    scope: 'Supplied observations only; no concrete profile, trusted IO, complete config closure or runtime admission.' })
}
