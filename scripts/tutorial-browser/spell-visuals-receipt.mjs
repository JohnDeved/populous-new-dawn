import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { SPELL_VISUAL_INPUTS, SPELL_VISUAL_FILES, SPELL_VISUAL_POLICY, validateSpellVisualReceipt } from '../integration-queue/spell-visuals-policy.mjs'
export async function spellVisualReceipt(raw, output, env = process.env) {
  const angel = raw.spellVisuals.angel, names = [...SPELL_VISUAL_FILES, ...['paused', 'running'].flatMap(segment => angel[segment].crops.map(crop => crop.filename))]
  const files = Object.fromEntries(names.map(name => { assert.match(name, /^[a-z0-9.-]+$/); return [name, readFileSync(resolve(output, name))] }))
  const identity = { repository: env.GITHUB_REPOSITORY, runId: env.GITHUB_RUN_ID, runAttempt: env.GITHUB_RUN_ATTEMPT,
    workflowRef: env.GITHUB_WORKFLOW_REF, mergeSha: raw.source.commit, headSha: env.PR_HEAD_SHA, baseSha: env.PR_BASE_SHA }
  const inputs = Object.fromEntries(SPELL_VISUAL_INPUTS.map(name => [name, raw.source.files[name]]))
  const receipt = { version: 1, kind: 'spell-visuals-browser', status: raw.status, identity, inputs, github: raw.github,
    artifacts: Object.fromEntries(names.map(name => [name, createHash('sha256').update(files[name]).digest('hex')])), visualReview: 'required' }
  await validateSpellVisualReceipt(receipt, { policy: SPELL_VISUAL_POLICY, identity, inputs, files, originalAngel: readFileSync(new URL('../../app/original-angel.json', import.meta.url)), originalUnits: readFileSync(new URL('../../app/original-units.json', import.meta.url)) })
  return receipt
}
