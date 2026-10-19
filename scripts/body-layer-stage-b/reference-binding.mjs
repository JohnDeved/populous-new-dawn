import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { sha } from '../../scripts/body-layer-stage-a/io.mjs'
// Qualified offline proof only; original hosted failure and missing final drift check retained.
export const expectedReferenceManifest = '195a2eaa8bc02e343b6c1bac95bcd66f328da60c4f378f8ff374349cd677edaa'
export function verifyReferences(root) {
  assert.match(expectedReferenceManifest, /^[a-f0-9]{64}$/, 'Reference admission still pending')
  const bytes = readFileSync(join(root, 'stage-b-reference-manifest.json'))
  assert.equal(sha(bytes), expectedReferenceManifest)
  const manifest = JSON.parse(bytes)
  for (const [path, hash] of Object.entries(manifest.files)) {
    assert.ok(!path.startsWith('/') && !path.split('/').includes('..'), 'Unsafe reference path')
    assert.equal(sha(readFileSync(join(root, path))), hash, path)
  }
}
