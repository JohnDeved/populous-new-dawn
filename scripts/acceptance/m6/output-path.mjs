import assert from 'node:assert/strict'
import { join } from 'node:path'

// Each acceptance invocation owns a new directory; never reuse historical saves.
export function outputPath(name) {
  assert(process.env.PND_M6_OUTPUT, 'Run the dedicated Mission 6 acceptance command')
  assert(/^[a-z0-9-]+\.(v8|json)$/.test(name), 'Invalid acceptance artifact name')
  return join(process.env.PND_M6_OUTPUT, name)
}
