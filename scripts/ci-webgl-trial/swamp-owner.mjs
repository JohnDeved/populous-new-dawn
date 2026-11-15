import assert from 'node:assert/strict'
import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { createHash } from 'node:crypto'
import { spawnSync, execFileSync } from 'node:child_process'
const root = process.cwd(), output = resolve(root, '../outputs')
mkdirSync(output, { recursive: true })
const observer = resolve(dirname(import.meta.filename), 'observe.py')
const sha = data => createHash('sha256').update(data).digest('hex')
assert.equal(sha(readFileSync(observer)), '3503c6027954bd6fad2d4b9b03f1e1d919adf2af0417d136b62e3d9ea17e055d')
const source = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
assert.equal(source, 'a8b1d2bfe158898b8085af132fef72144a4dd236')
function metadata(path, prefix = '') {
  const result = {}
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const file = resolve(path, entry.name), key = prefix + entry.name
    if (entry.isDirectory()) Object.assign(result, metadata(file, key + '/'))
    else if (entry.isFile()) { const stat = statSync(file); result[key] = [stat.size, stat.mtimeMs] }
  }
  return result
}
const receipt = { source, observerSha256: sha(readFileSync(observer)), status: 'running',
  limits: 'Dependency metadata detects size/mtime changes, not byte-for-byte integrity. RSS samples are same-launcher owned-process observations, not a historical before/after memory improvement.' }
const save = () => writeFileSync(resolve(output, 'owner.json'), JSON.stringify(receipt, null, 2) + '\n')
const before = metadata(resolve(root, 'node_modules'))
receipt.dependenciesBeforeSha256 = sha(JSON.stringify(before)); save()
try {
  const child = spawnSync('python3', [observer, resolve(output, 'resource.jsonl'), '--', process.execPath,
    'scripts/owned-swamp-evidence/run.mjs', resolve(output, 'owned-swamp')], { stdio: 'inherit' })
  receipt.exitCode = child.status; receipt.signal = child.signal; receipt.error = child.error ? String(child.error) : null
  assert.equal(child.status, 0, 'Owned workload must pass')
  const runtime = JSON.parse(readFileSync(resolve(output, 'owned-swamp/receipt.json'), 'utf8'))
  assert.equal(runtime.commit, source); assert.equal(runtime.status, 'passed')
  assert.equal(runtime.cleanupVerified, true); assert.equal(runtime.sourceAfter, 'identical')
  receipt.status = 'passed'
} catch (error) {
  receipt.status = 'failed'; receipt.failure = String(error); process.exitCode = 1
} finally {
  const after = metadata(resolve(root, 'node_modules'))
  receipt.dependenciesAfterSha256 = sha(JSON.stringify(after))
  receipt.dependencyChanges = Object.keys({ ...before, ...after }).filter(key => JSON.stringify(before[key]) !== JSON.stringify(after[key]))
  if (receipt.dependencyChanges.length) { receipt.status = 'failed'; process.exitCode = 1 }
  save()
}
