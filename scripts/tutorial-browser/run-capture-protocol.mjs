#!/usr/bin/env node
// Dedicated opt-in queue entry. Never substituted for the ordinary Tutorial CLI.
import { resolve, dirname, isAbsolute } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

export function captureCommandExit(result) {
  return result?.enabled === true && result.runnerSucceeded === true && result.usableObservation === true ? 0 : 1
}

export function captureQueueArguments(env, cwd, node, sourceRoot) {
  if (![cwd, node, sourceRoot].every(value => typeof value === 'string' && isAbsolute(value)))
    throw Error('Capture queue paths must be absolute')
  if (env.PND_CAPTURE_PROTOCOL_WINDOW !== '1') throw Error('Capture diagnostics require explicit opt-in')
  if (resolve(cwd) !== sourceRoot) throw Error('Capture diagnostics require the qualified checkout root')
  for (const name of ['PND_QUEUE_JOB_ID','PND_QUEUE_OUTPUT','PND_QUEUE_CLEANUP'])
    if (!env[name]) throw Error('Capture diagnostics require an owned queue job')
  if (env.POPULOUS_URL !== 'http://127.0.0.1:5198' || env.PND_QUEUE_PORTS !== '5198')
    throw Error('Capture diagnostics require the exact declared runner port')
  if (!/^[a-f0-9]{64}$/.test(env.PND_CAPTURE_NODE_SHA256 ?? ''))
    throw Error('Capture diagnostics require separately qualified Node identity')
  if (!/^[a-f0-9]{64}$/.test(env.PND_CAPTURE_MANIFEST_SHA256 ?? ''))
    throw Error('Capture diagnostics require separately qualified manifest identity')
  return { enabled: true, cwd, runner: resolve(sourceRoot, 'scripts/tutorial-browser/run.mjs'),
    node, trustedNodeSha256: env.PND_CAPTURE_NODE_SHA256, env }
}

// This verifies data BEFORE importing the application-owned helper graph. The
// queue must still admit this entry, Node and this manifest's trusted digest
// externally. It cannot defend a mutable checkout against concurrent mutation.
export function verifyCapturePreimports({ cwd, node, trustedNodeSha256, env }) {
  if (![cwd,node].every(value => typeof value === 'string' && isAbsolute(value)))
    throw Error('Capture pre-import paths must be absolute')
  const hash = bytes => createHash('sha256').update(bytes).digest('hex')
  const authority = env.PND_CAPTURE_MANIFEST_SHA256
  if (!/^[a-f0-9]{64}$/.test(authority ?? '')) throw Error('Missing capture manifest identity')
  const bytes = readFileSync(resolve(cwd,'scripts/tutorial-browser/capture-qualified-inputs.json'))
  if (hash(bytes) !== authority) throw Error('Capture manifest identity mismatch')
  if (!/^[a-f0-9]{64}$/.test(trustedNodeSha256 ?? '') || hash(readFileSync(node)) !== trustedNodeSha256)
    throw Error('Capture Node identity mismatch')
  const inputs = JSON.parse(bytes)
  if (!inputs || Array.isArray(inputs) || typeof inputs !== 'object' || !Object.keys(inputs).length)
    throw Error('Invalid capture input manifest')
  for (const [path, digest] of Object.entries(inputs)) {
    if (isAbsolute(path) || path.split(/[\\/]/).some(part => part === '..' || part === '') || !/^[a-f0-9]{64}$/.test(digest))
      throw Error('Invalid capture input manifest entry')
    if (hash(readFileSync(resolve(cwd,path))) !== digest) throw Error('Capture input identity mismatch')
  }
  return { files: Object.keys(inputs).length }
}

async function main() {
  try {
    const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
    const options = captureQueueArguments(Object.freeze({ ...process.env }), process.cwd(), process.execPath, sourceRoot)
    // Outer queue must qualify this entry and all static-import sources BEFORE
    // execution. Inner checks cannot sandbox already executed imports.
    verifyCapturePreimports(options)
    const { runIntegratedCaptureProtocol } = await import('./integrated-capture-protocol.mjs')
    const result = await runIntegratedCaptureProtocol(options)
    process.stdout.write(JSON.stringify(result) + '\n')
    process.exitCode = captureCommandExit(result)
  } catch {
    // Never echo exception/cause payload into queue logs.
    process.stdout.write(JSON.stringify({ enabled: true, runnerSucceeded: false,
      usableObservation: false, error: 'capture-admission-or-execution-failed' }) + '\n')
    process.exitCode = 1
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) void main()
