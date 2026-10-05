import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
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
})
test('current candidate carries the accepted application subtree and unchanged maintained profile harness', () => {
  const policy = JSON.parse(readFileSync(new URL('./run-policy.json', import.meta.url)))
  assert.equal(git('rev-parse', `${reuse.applicationReferenceCommit}:app`).toString().trim(), policy.applicationTree)
  for (const file of ['scripts/local-render/harness.mjs', 'scripts/local-render/owned-profile.mjs', 'scripts/local-render/checkpoint-observer.mjs'])
    assert.equal(hash(readFileSync(new URL(file, root))), hash(git('show', `${reuse.applicationReferenceCommit}:${file}`)))
})
