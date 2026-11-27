// Read-only allocation accounting for quiescent, exact, sibling CI checkouts.
// Caller is responsible for validating the source revisions before observation.
import { lstatSync, opendirSync, realpathSync } from 'node:fs'
import { join, resolve } from 'node:path'

const areas = { assets: ['public', 'original'], packs: ['.git', 'objects', 'pack'] }
const pack = /^pack-(?:[0-9a-f]{40}|[0-9a-f]{64})\.(?:pack|idx|rev|promisor|bitmap|mtimes)$/
const stat = path => lstatSync(path, { bigint: true })
const inode = s => `${s.dev}:${s.ino}`
const stamp = s => `${inode(s)}:${s.size}:${s.mtimeNs}:${s.ctimeNs}:${s.blocks}`

// st_blocks measures allocation attributed to an inode, not unique disk extents,
// physical storage savings, or billed usage. No totals are returned from partial scans.
export function observeCheckoutAllocation(workspace, { maxEntries = 4096 } = {}) {
  let left = maxEntries
  const stop = reason => { throw new ObservationError(reason) }
  const spend = () => { if (--left < 0) stop('entry-budget') }
  const files = new Map(), arms = {}
  try {
    if (!Number.isInteger(maxEntries) || maxEntries < 1 || maxEntries > 4096) stop('invalid-budget')
    if (workspace !== resolve(workspace) || workspace !== realpathSync(workspace)) stop('nonphysical-workspace')
    const root = stat(workspace)
    if (!root.isDirectory()) stop('not-directory')
    const visitedDirectories = new Set()
    const directory = (path, read) => {
      spend()
      const s = stat(path)
      if (!s.isDirectory() || s.dev !== root.dev || visitedDirectories.has(inode(s))) stop('unexpected-directory')
      visitedDirectories.add(inode(s))
      const result = read()
      if (stamp(s) !== stamp(stat(path))) stop('changed-directory')
      return result
    }
    const count = (path, scope, depth) => directory(path, () => {
      if (depth > 12) stop('depth-budget')
      const paths = []
      const dir = opendirSync(path)
      try {
        for (let entry; (entry = dir.readSync());) {
          spend()
          const child = join(path, entry.name), s = stat(child)
          if (s.dev !== root.dev) stop('device-change')
          if (scope === 'assets' && s.isDirectory()) {
            paths.push(...count(child, scope, depth + 1))
            continue
          }
          if (!s.isFile() || (scope === 'packs' && !pack.test(entry.name))) stop('unexpected-entry')
          const id = inode(s)
          if (files.has(id) && stamp(files.get(id)) !== stamp(s)) stop('changed-file')
          files.set(id, s)
          paths.push(id)
        }
      } finally { dir.closeSync() }
      return paths
    })
    for (const [side, name] of [['base', 'harness'], ['candidate', 'candidate']]) {
      const path = join(workspace, name)
      arms[side] = directory(path, () => Object.fromEntries(Object.entries(areas).map(([scope, segments]) => {
        const descend = (parent, [part, ...rest]) => {
          const next = join(parent, part)
          return rest.length ? directory(next, () => descend(next, rest)) : count(next, scope, 0)
        }
        const paths = descend(path, segments)
        if (!paths.length) stop('empty-scope')
        return [scope, paths]
      })))
    }
    if (stamp(root) !== stamp(stat(workspace))) stop('changed-directory')
    const measure = keys => {
      const ids = new Set(keys)
      return { uniqueInodes: ids.size, inodeAllocatedBytes: [...ids].reduce((n, id) => n + files.get(id).blocks * 512n, 0n).toString() }
    }
    const perArm = Object.fromEntries(Object.entries(arms).map(([side, areas]) => [side,
      Object.fromEntries(Object.entries(areas).map(([scope, paths]) => [scope, {
        paths: paths.length, logicalPathBytes: paths.reduce((n, id) => n + files.get(id).size, 0n).toString(), ...measure(paths),
      }]))]))
    const perAreaUnion = Object.fromEntries(Object.keys(areas).map(scope => {
      const a = new Set(arms.base[scope]), b = new Set(arms.candidate[scope])
      return [scope, { ...measure([...a, ...b]), sharedInodes: [...a].filter(id => b.has(id)).length }]
    }))
    return { status: 'observed', perArm, perAreaUnion, allObservedFileUnion: measure(files.keys()) }
  } catch (error) {
    // Report only bounded reason labels, never filesystem paths or partial totals.
    return { status: 'unavailable', reason: error instanceof ObservationError ? error.message : 'filesystem-unavailable' }
  }
}

class ObservationError extends Error {}
