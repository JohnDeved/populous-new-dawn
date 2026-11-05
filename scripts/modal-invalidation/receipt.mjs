import assert from 'node:assert/strict'
import { limits } from './hosted-policy.mjs'
// File hashes exclude this self-describing receipt; the byte total includes it.
export function serializeReceipt(report, files) {
  assert.ok(files.every(file => file.name !== 'receipt.json' && Number.isSafeInteger(file.bytes) && file.bytes >= 0))
  const externalBytes = files.reduce((sum, file) => sum + file.bytes, 0)
  report.artifacts = { files, receiptBytes: 0, bytes: 0 }
  const measure = () => {
    for (let i = 0; i < 10; i++) {
      const text = JSON.stringify(report, null, 2) + '\n', bytes = Buffer.byteLength(text)
      if (report.artifacts.receiptBytes === bytes && report.artifacts.bytes === bytes + externalBytes) return text
      report.artifacts.receiptBytes = bytes; report.artifacts.bytes = bytes + externalBytes
    }
    throw Error('Receipt byte accounting did not converge')
  }
  let text = measure()
  if (report.artifacts.bytes > limits.artifactBytes || files.filter(file => file.name.endsWith('.png')).length > 1) {
    report.status = 'failed'; report.artifactFailure = 'Artifact budget exceeded'; text = measure()
  }
  assert.equal(Buffer.byteLength(text), report.artifacts.receiptBytes)
  return text
}
