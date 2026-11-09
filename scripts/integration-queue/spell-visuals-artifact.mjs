// Data-only upload/metadata binding. Never use receipt-supplied URLs as transport.
import assert from 'node:assert/strict'
import { REPO } from './policy.mjs'
export const spellVisualArchiveLimit = 48 * 1024 * 1024
export function spellVisualArtifactUpload(log, mergeSha) {
  assert.match(mergeSha, /^[a-f0-9]{40}$/)
  const lines = log.split('\n').map(line => line.replace(/^\d{4}-\d\d-\d\dT\S+\s+/, ''))
  const one = pattern => {
    const matches = lines.map(line => line.match(pattern)).filter(Boolean)
    assert.equal(matches.length, 1, 'Missing/duplicate spell visuals upload binding')
    return matches[0]
  }
  const name = `spell-visuals-browser-${mergeSha}`
  const uploaded = one(new RegExp(`^Artifact ${name} has been successfully uploaded! Final size is ([1-9][0-9]*) bytes\\. Artifact ID is ([1-9][0-9]*)$`))
  const finalized = one(new RegExp(`^Artifact ${name}\\.zip successfully finalized\\. Artifact ID ([1-9][0-9]*)$`))
  const digest = one(/^SHA256 digest of uploaded artifact zip is ([a-f0-9]{64})$/)[1]
  assert.equal(uploaded[2], finalized[1])
  const bytes = Number(uploaded[1]), id = Number(uploaded[2])
  assert.ok(Number.isSafeInteger(id) && Number.isSafeInteger(bytes) && bytes <= spellVisualArchiveLimit)
  return { id, name, bytes, sha256: digest }
}
export function validateSpellVisualArtifactMetadata(metadata, upload, identity) {
  assert.equal(identity.repository, REPO)
  assert.match(identity.runId, /^[1-9][0-9]*$/)
  assert.match(identity.headSha, /^[a-f0-9]{40}$/)
  assert.ok(Number.isSafeInteger(upload.id) && upload.id > 0)
  const url = `https://api.github.com/repos/${REPO}/actions/artifacts/${upload.id}`
  assert.equal(metadata.id, upload.id); assert.equal(metadata.name, upload.name)
  assert.equal(metadata.expired, false); assert.equal(metadata.size_in_bytes, upload.bytes)
  assert.equal(metadata.digest, `sha256:${upload.sha256}`)
  assert.equal(metadata.url, url); assert.equal(metadata.archive_download_url, `${url}/zip`)
  assert.equal(String(metadata.workflow_run?.id), identity.runId)
  assert.equal(metadata.workflow_run?.head_sha, identity.headSha)
  return true
}
