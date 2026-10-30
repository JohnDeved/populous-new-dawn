// Passive support until the reviewed workflow explicitly selects this entrypoint.
// There is no environment-variable override or runner-image fallback in pinned mode.
import assert from 'node:assert/strict'
import { runBenchmark } from './run.mjs'

assert.equal(process.argv.length, 2, 'Pinned benchmark accepts no options')
await runBenchmark({ pinned: true })
