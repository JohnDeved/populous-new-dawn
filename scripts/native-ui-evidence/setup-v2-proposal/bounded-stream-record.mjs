import { createHash } from 'node:crypto'

// Inactive storage primitive, not a stream drainer or deadline owner.
export function createBoundedStreamRecord(capBytes = 65536) {
  if (!Number.isSafeInteger(capBytes) || capBytes < 1 || capBytes > 65536)
    throw Error('Invalid stream byte ceiling')
  const storage = Buffer.alloc(capBytes)
  let captured = 0, observed = 0, ended = false, overflow = false
  let hasFailure = false, originalFailure, lateData = false
  const fail = error => { if (!hasFailure) { hasFailure = true; originalFailure = error } }
  return Object.freeze({
    append(bytes) {
      if (!(bytes instanceof Uint8Array)) {
        const error = Error('Stream chunks must be bytes')
        fail(error); throw error
      }
      if (ended) {
        lateData = true
        const error = Error('Stream data after terminal end')
        fail(error); throw error
      }
      if (observed > Number.MAX_SAFE_INTEGER - bytes.byteLength) {
        const error = Error('Stream observed-byte counter exceeded')
        fail(error); throw error
      }
      observed += bytes.byteLength
      const take = Math.min(bytes.byteLength, capBytes - captured)
      // Copy the exact view, not unrelated bytes in its underlying allocation.
      storage.set(bytes.subarray(0, take), captured)
      captured += take
      if (take !== bytes.byteLength) {
        overflow = true
        const error = Error('Stream byte ceiling exceeded')
        fail(error); throw error
      }
    },
    fail,
    end() {
      if (ended) {
        const error = Error('Duplicate stream end')
        fail(error); throw error
      }
      ended = true
    },
    snapshot() {
      const bytes = Buffer.from(storage.subarray(0, captured))
      return {
        status: ended && !hasFailure ? 'complete' : hasFailure ? 'failed' : 'open',
        ended, capBytes, capturedBytes: captured, observedBytes: observed,
        truncated: overflow, lateData, hasFailure, originalFailure,
        sha256OfCapturedBytes: createHash('sha256').update(bytes).digest('hex'),
        bytes,
      }
    },
  })
}
