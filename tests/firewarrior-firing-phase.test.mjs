import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { gunzipSync } from 'node:zlib'
import test from 'node:test'
import policy from '../decomp/research/firewarrior-firing-phase/owned-projection.json' with { type: 'json' }

const root = new URL('../', import.meta.url)
const proof = new URL('evidence/firewarrior-firing-phase/native-comparison-20261006/', root)
const sha = data => createHash('sha256').update(data).digest('hex')
const fixtures = gunzipSync(readFileSync(new URL('fixtures.json.gz', proof)))
const nativeBytes = gunzipSync(readFileSync(new URL('native.json.gz', proof)))
assert.equal(sha(fixtures), policy.fixtureSha256)
assert.equal(sha(nativeBytes), '977f01bd263bc7c49de959e8738c5538d7e14c637146b324a32dbfbf1fd0ba1a')
assert.equal(sha(readFileSync(new URL('decomp/research/firewarrior-firing-phase/owned-projection.json', root))),
  '5ea3bf389c59cb4ecbf98b19f98566939103e14ce49301b7fb64b330289d0128')
const native = JSON.parse(nativeBytes)
const child = spawnSync(process.execPath,
  ['--max-old-space-size=128', 'decomp/research/firewarrior-firing-phase/port.mjs'],
  { cwd: fileURLToPath(root), input: fixtures, encoding: 'utf8', timeout: 20_000,
    maxBuffer: 2 * 1024 * 1024, env: { ...process.env, NODE_OPTIONS: '', NODE_PATH: '' } })
assert.equal(child.error, undefined)
assert.equal(child.status, 0, child.stderr)
const port = JSON.parse(child.stdout)
assert.equal(port.exposures, 1)
assert.deepEqual(port.cases.map(c => c.name), native.cases.map(c => c.name))

for (const [index, expected] of native.cases.entries()) {
  test(`actual ranged body matches owned native visits: ${expected.name}`, () => {
    const actual = port.cases[index]
    assert.deepEqual(actual.visits[0].before.fields, expected.visits[0].before.fields,
      'the fixed native/port initial comparison records must still agree')
    assert.equal(actual.visits.length, expected.visits.length, 'body completion invocation count')
    for (const [visit, n] of expected.visits.entries()) {
      const p = actual.visits[visit]
      assert.equal(p.complete, n.complete, `completion at invocation ${visit}`)
      if (n.complete) continue
      for (const field of policy.activeAfterFields)
        assert.equal(p.after.fields[field], n.after.fields[field], `${field} at invocation ${visit}`)
      for (const bit of policy.activeAfterBits) {
        const mask = Number(bit.maskHex)
        assert.equal(p.after.fields[bit.field] & mask, n.after.fields[bit.field] & mask,
          `${bit.field}&${bit.maskHex} at invocation ${visit}`)
      }
    }
    const effects = actual.visits.at(-1).after.world.effects
    const entry = expected.name.includes('-entry-') && !expected.name.includes('wait-entry-')
      && !expected.name.includes('cooldown-entry')
    if (entry) {
      assert.equal(effects.length, 2, 'one paired launch across the entire body')
      assert.deepEqual(effects.map(effect => effect.firewarriorShot.source), [1, 1])
      assert.deepEqual(effects.map(effect => effect.firewarriorShot.target), [2, 2])
    } else {
      const initial = actual.visits[0].before.world.effects
      assert.deepEqual(effects, initial, 'recovery/cooldown does not create another projectile')
    }
  })
}
