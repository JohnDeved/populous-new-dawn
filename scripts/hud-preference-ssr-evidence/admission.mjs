import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'
import { manualIdentity, fullSha } from '../native-ui-evidence/identity.mjs'
import { APP } from './policy.mjs'
export function hostedAdmission(env) {
  const identity = manualIdentity(env)
  assert.equal(env.PND_EVIDENCE_KIND, 'hud-preference-ssr')
  assert.equal(identity.candidateSha, APP, 'This deployment admits only exact #885 HUD application')
  assert.equal(fullSha(env.PND_HUD_INFRASTRUCTURE_SHA), identity.workflowSha, 'Executing main differs from explicitly approved infrastructure')
  assert.equal(identity.runAttempt, '1', 'No automatic hosted rerun admission')
  assert.match(identity.runId ?? '', /^[1-9][0-9]*$/)
  return identity
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify(hostedAdmission(process.env)))
}
