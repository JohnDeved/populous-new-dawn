import { readFileSync } from 'node:fs'
import { resolve, isAbsolute } from 'node:path'
import { createHash } from 'node:crypto'
import expected from './capture-qualified-inputs.json' with { type: 'json' }
const sha256 = path => createHash('sha256').update(readFileSync(path)).digest('hex')

// Only source/package file identity. This does NOT qualify arbitrary transitive
// imports, supervisor ownership, browser policy or historic installed bytes.
export function qualifyCaptureInputs({ cwd, runner, node }, trustedNodeSha256) {
  if (![cwd, runner, node].every(path => typeof path === 'string' && isAbsolute(path)))
    throw Error('Capture cwd, runner and executable must be absolute paths')
  if (!/^[a-f0-9]{64}$/.test(trustedNodeSha256 ?? ''))
    throw Error('A separately authorized Node executable identity is required')
  if (resolve(runner) !== resolve(cwd, 'scripts/tutorial-browser/run.mjs'))
    throw Error('Unexpected capture runner path')
  if (sha256(node) !== trustedNodeSha256) throw Error('Capture Node identity mismatch')
  for (const [path, hash] of Object.entries(expected))
    if (sha256(resolve(cwd, path)) !== hash) throw Error(`Capture input identity mismatch: ${path}`)
  return { qualified: true, scope: 'declared source/package bytes and supplied trusted Node digest only', files: Object.keys(expected).length }
}
