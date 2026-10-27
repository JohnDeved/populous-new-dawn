// Manual trusted-main check. This module never uploads a version or promotes it.
import { appendFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { cfRequest } from './control.mjs'
import { account, repository, worker } from './protocol.mjs'

export const readVerified = 'Stored credential read access verified for the selected Worker: the runtime secret-name inventory is empty. No upload or promotion was attempted. Write and deployment permissions remain unverified.'
const failures = Object.freeze({
  context: 'Credential read preflight refused: only a manual dispatch on the expected repository main branch is allowed.',
  request: 'Credential read preflight failed: stored credential could not read the selected Worker secret-name inventory. Check token validity and exact Worker scope. No upload or promotion was attempted.',
  response: 'Credential read preflight refused: unexpected Worker secret-name response. No upload or promotion was attempted.',
  secrets: 'Credential read preflight refused: Worker runtime secrets exist. An isolated-preview review is required; no upload or promotion was attempted.',
  unknown: 'Credential read preflight failed without verified access. No upload or promotion was attempted.',
})
const allowedFailures = new Set(Object.values(failures))

export async function verifyCredentialRead(context, request = cfRequest) {
  if (context.GITHUB_REPOSITORY !== repository || context.GITHUB_REF !== 'refs/heads/main' ||
      context.GITHUB_EVENT_NAME !== 'workflow_dispatch') throw new Error(failures.context)
  let secrets
  try {
    // Same exact Worker-scoped read as the publisher preflight, without Wrangler.
    secrets = await request(`/accounts/${account}/workers/scripts/${worker}/secrets`, { method: 'GET' })
  } catch {
    // A thrown request/body error must not reach stdout/stderr or retain its cause.
    throw new Error(failures.request)
  }
  let count
  try { if (Array.isArray(secrets)) count = secrets.length } catch { /* reject below */ }
  if (!Number.isSafeInteger(count) || count < 0) throw new Error(failures.response)
  if (count !== 0) throw new Error(failures.secrets)
  return readVerified
}

export function verificationFailure(error) {
  // Never stringify an unexpected error, response, token, cause or stack.
  try {
    const message = error?.message
    if (allowedFailures.has(message)) return message
  } catch { /* fixed fallback */ }
  return failures.unknown
}

export async function main() {
  const message = await verifyCredentialRead(process.env)
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${message}\n`)
  console.log(message)
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(verificationFailure(error))
    process.exitCode = 1
  })
}
