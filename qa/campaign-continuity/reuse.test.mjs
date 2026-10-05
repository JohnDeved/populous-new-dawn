import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { applicationImportPaths } from './boundaries.mjs'
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const reuse = JSON.parse(readFileSync(new URL('./reuse.json', import.meta.url)))
const root = new URL('../../', import.meta.url)
const git = (...args) => execFileSync('git', args, { cwd: root })
const sections = text => {
  const starts = [...text.matchAll(/^  const (\w+) =/gm)]
  return Object.fromEntries(starts.map((start, index) => [start[1], text.slice(start.index, starts[index + 1]?.index ?? text.length)]))
}
test('carried source modules match their exact historical objects and current test bytes', () => {
  for (const file of reuse.files) {
    const historical = git('show', `${reuse.historicalSourceCommit}:${file.sourcePath}`)
    assert.equal(hash(historical), file.sha256)
    assert.equal(hash(readFileSync(new URL(file.path, import.meta.url))), file.sha256)
  }
  for (const file of reuse.adaptedFiles ?? []) {
    const historical = git('show', `${reuse.historicalSourceCommit}:${file.sourcePath}`)
    const current = readFileSync(new URL(file.path, import.meta.url))
    assert.equal(hash(historical), file.sourceSha256)
    assert.equal(hash(current), file.currentSha256)
    assert.equal(current.subarray(0, historical.length).equals(historical), true, 'Original clone-only probe bodies remain unchanged')
  }
  for (const file of reuse.patchedFiles ?? []) {
    assert.equal(hash(git('show', `${reuse.historicalSourceCommit}:${file.sourcePath}`)), file.sourceSha256)
    assert.equal(hash(readFileSync(new URL(file.path, import.meta.url))), file.currentSha256)
    assert.ok(file.scope, 'Describe the changed historical helper honestly')
  }
})
test('reuse inventory identifies exact unchanged and adapted scenario sections', () => {
  const old = sections(git('show', `${reuse.historicalSourceCommit}:qa/mission-three-controls/driver.mjs`).toString())
  const current = sections(readFileSync(new URL('./scenario.mjs', import.meta.url), 'utf8'))
  for (const [kind, rows] of Object.entries({ unchanged: reuse.unchangedActionSections, adapted: reuse.adaptedActionSections }))
    for (const row of rows) {
      assert.equal(hash(old[row.name]), row.sourceSha256)
      assert.equal(hash(current[row.name]), row.currentSha256)
      assert.equal(row.currentSha256 === row.sourceSha256, kind === 'unchanged')
    }
  for (const row of reuse.newActionSections ?? []) assert.equal(hash(current[row.name]), row.currentSha256)
})
test('current candidate carries the accepted application subtree and unchanged maintained profile harness', () => {
  const policy = JSON.parse(readFileSync(new URL('./run-policy.json', import.meta.url)))
  assert.equal(policy.applicationCommit, reuse.applicationReferenceCommit)
  git('merge-base', '--is-ancestor', policy.applicationCommit, 'HEAD')
  assert.equal(git('rev-parse', 'HEAD:app').toString().trim(), policy.applicationTree)
  assert.equal(git('diff', 'HEAD', '--', 'app').toString(), '', 'Working app bytes retain the actual committed tree')
  assert.equal(git('rev-parse', `${reuse.applicationReferenceCommit}:app`).toString().trim(), policy.applicationTree)
  assert.deepEqual(Object.keys(policy.applicationImports), applicationImportPaths)
  for (const file of applicationImportPaths) {
    assert.equal(hash(readFileSync(new URL(file, root))), policy.applicationImports[file])
    assert.equal(hash(git('show', `${policy.applicationCommit}:${file}`)), policy.applicationImports[file])
  }
  for (const file of ['scripts/local-render/harness.mjs', 'scripts/local-render/owned-profile.mjs', 'scripts/local-render/checkpoint-observer.mjs'])
    assert.equal(hash(readFileSync(new URL(file, root))), hash(git('show', `${reuse.applicationReferenceCommit}:${file}`)))
})
