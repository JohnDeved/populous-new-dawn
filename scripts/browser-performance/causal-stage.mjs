// Always retain bounded partial evidence; never follow public-asset symlinks.
import { existsSync, mkdirSync, readdirSync, lstatSync, copyFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { limits } from './causal-profiler.mjs'
const root = resolve(import.meta.dirname, '../../outputs/causal-profile'), target = resolve(root, '../causal-upload')
mkdirSync(target, { recursive: true })
const manifest = { diagnosticOnly: true, timingComparable: false, retained: [], skipped: [], bytes: 0, limit: limits.total }
function walk(path) {
  for (const e of readdirSync(path, { withFileTypes: true }).sort((a,b) => a.name.localeCompare(b.name))) {
    const file = resolve(path, e.name)
    if (e.isSymbolicLink()) continue
    if (e.isDirectory()) { walk(file); continue }
    const name = file.slice(root.length + 1), size = lstatSync(file).size
    // Diagnostic build source fixtures are small but not relevant; retain emitted JS/maps.
    if (name.startsWith('build-') && !/\.(js|map|log)$/.test(name)) continue
    if (manifest.bytes + size > limits.total - 1024 * 1024) { manifest.skipped.push({ name, size, reason: 'total-output-cap' }); continue }
    const destination = resolve(target, name); mkdirSync(dirname(destination), { recursive: true }); copyFileSync(file, destination)
    manifest.retained.push({ name, size }); manifest.bytes += size
  }
}
if (existsSync(root)) walk(root)
else manifest.skipped.push({ reason: 'capture-never-started' })
const json = JSON.stringify(manifest, null, 2)
if (Buffer.byteLength(json) > 1024 * 1024) throw Error('Stage manifest cap exceeded')
writeFileSync(resolve(target, 'artifact-manifest.json'), json)
if (manifest.skipped.length) process.exitCode = 1
