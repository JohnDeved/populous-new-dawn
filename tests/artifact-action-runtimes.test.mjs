import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import test from 'node:test'

const root = new URL('../', import.meta.url)
const read = path => readFileSync(new URL(path, root), 'utf8')
// Official action.yml manifests at these immutable revisions use node24.
// upload v6 / download v7 are the minimal default-Node24 upgrades. Existing
// Cloudflare upload v7.0.2 stays unchanged; no archive or digest-policy migration.
const supported = new Map([
  ['upload-artifact', new Set([
    'b7c566a772e6b6bfb58ed0dc250532a479d7789f', // v6.0.0
    'cf430e030ddbb5b0abf93d22962f4752f3646cd9', // v7.0.2
  ])],
  ['download-artifact', new Set(['37930b1c2abaa49bbe596cd826c3c89aef350131'])], // v7.0.0
])

test('artifact actions use reviewed immutable Node24 runtime revisions in every workflow', () => {
  let found = 0
  for (const file of readdirSync(new URL('.github/workflows/', root)).filter(file => /\.ya?ml$/.test(file))) {
    for (const [, action, revision] of read(`.github/workflows/${file}`).matchAll(/uses:\s*actions\/(upload-artifact|download-artifact)@([^\s#]+)/g)) {
      assert.ok(supported.get(action).has(revision), `${file}: unreviewed ${action}@${revision}`)
      found++
    }
  }
  assert.ok(found > 0, 'workflow discovery must inspect actual artifact-action uses')
})

test('performance workflow template cannot reintroduce retired artifact runtimes', () => {
  assert.equal(read('scripts/browser-performance/workflows/browser-performance.yml'), read('.github/workflows/browser-performance.yml'))
})

test('Full check retains named shard directories rather than flattened artifact-ID downloads', () => {
  const workflow = read('.github/workflows/ready-pr-check.yml')
  const download = workflow.split('uses: actions/download-artifact@')[1]
  assert.ok(download)
  const step = download.split(/\n {6}- /)[0]
  assert.match(step, /pattern: full-check-\$\{\{ github.run_id \}\}-\$\{\{ github.run_attempt \}\}-\*/)
  assert.match(step, /merge-multiple: false/)
  assert.doesNotMatch(step, /artifact-ids:/)
})
