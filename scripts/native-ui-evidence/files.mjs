import assert from 'node:assert/strict'
import { readdirSync, lstatSync, readlinkSync } from 'node:fs'
import { resolve, relative } from 'node:path'
import { sha256 } from './identity.mjs'

export function directoryManifest(root) {
  const files = {}
  function walk(path) {
    for (const entry of readdirSync(path, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const file = resolve(path, entry.name), name = relative(root, file), stat = lstatSync(file)
      if (entry.isDirectory()) { files[name] = { type: 'directory', mode: stat.mode }; walk(file) }
      else if (entry.isSymbolicLink()) files[name] = { type: 'symlink', mode: stat.mode, link: readlinkSync(file) }
      else { assert.ok(entry.isFile()); files[name] = { type: 'file', mode: stat.mode, bytes: stat.size, sha256: sha256(file) } }
    }
  }
  walk(root)
  return files
}
export function publicLinks(candidateRoot, built) {
  return Object.fromEntries(readdirSync(resolve(candidateRoot, 'public')).sort().map(name => {
    assert.equal(Object.hasOwn(built, name), false, 'Public asset collision')
    return [name, { type: 'symlink', mode: 0o120777, link: resolve(candidateRoot, 'public', name) }]
  }))
}
export function verifyBuiltOutput(dist, built, links) {
  assert.deepEqual(directoryManifest(dist), { ...built, ...links }, 'Closed build/public output membership changed')
}
export function afterScopes(scopes) {
  const states = {}, failures = []
  for (const [name, scope] of Object.entries(scopes)) {
    states[name] = scope.captured ? 'not-verified' : 'not-captured'
    if (!scope.captured) continue
    try { scope.verify(); states[name] = 'identical' }
    catch (error) { failures.push({ scope: name, error: String(error) }) }
  }
  return { states, failures }
}
