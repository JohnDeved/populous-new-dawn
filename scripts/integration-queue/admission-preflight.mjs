// Trusted entry preparation and preflight only. Never rewrites pinned inputs.
import assert from 'node:assert/strict'
import { sha256 } from './policy.mjs'
import { FULL_WORKFLOW } from './admission.mjs'

// Deliberately recognizes the reviewed literal diagnostic form, not arbitrary
// YAML or expressions. A changed/ambiguous diagnostic requires source review.
export function deriveFullCheckDiagnostic(workflow) {
  const headers = [...workflow.matchAll(/^  benchmark-baseline:\s*$/gm)]
  const names = [...workflow.matchAll(/^\s+name: Legacy test baseline \(diagnostic\)\s*$/gm)]
  if (!workflow.includes('benchmark-baseline') && !workflow.includes('Legacy test baseline')) return undefined
  assert.equal(headers.length, 1, 'Expected one diagnostic job')
  assert.equal(names.length, 1, 'Expected one diagnostic job name')
  const start = headers[0].index + headers[0][0].length
  const rest = workflow.slice(start)
  const end = rest.search(/^  [A-Za-z0-9_-]+:\s*$/m)
  const block = rest.slice(0, end < 0 ? rest.length : end)
  // Only literal, unique job-level control keys are supported. Counting just
  // expected values would overlook a second key overriding the reviewed value.
  for (const key of ['name', 'needs', 'if']) {
    const controls = block.split('\n').filter(line =>
      new RegExp(`^    (?:${key}|["']${key}["'])[ \t]*:`).test(line))
    assert.equal(controls.length, 1, `Diagnostic ${key} must be unique`)
    assert(controls[0].startsWith(`    ${key}: `), `Diagnostic ${key} must be an unquoted literal key`)
  }
  assert.equal((block.match(/^    name: Legacy test baseline \(diagnostic\)$/gm) ?? []).length, 1, 'Diagnostic name must belong to literal job')
  assert.equal((block.match(/^    needs: full-check$/gm) ?? []).length, 1, 'Diagnostic dependency differs')
  const conditions = [...block.matchAll(/^    if: (.*)$/gm)]
  assert.equal(conditions.length, 1, 'Diagnostic condition missing or duplicate')
  const match = conditions[0][1].match(/^\$\{\{ github\.event\.pull_request\.number == ([1-9][0-9]*) && needs\.full-check\.result == 'success' \}\}$/)
  assert(match, 'Unsupported diagnostic activation condition')
  const activationPr = Number(match[1])
  assert(Number.isSafeInteger(activationPr), 'Invalid diagnostic activation PR')
  return { activationPr }
}

export function preflightAdmissionPolicy(reader, entry, grant) {
  let workflow
  for (const ref of [grant.tuple.head, grant.tuple.base, grant.tuple.merge]) {
    const bytes = reader.gitOutput('show', `${ref}:${FULL_WORKFLOW}`)
    assert.equal(sha256(bytes), entry.workflowHashes[FULL_WORKFLOW], 'Pinned Full workflow differs before registration')
    workflow = bytes
  }
  assert.equal(workflow.match(/^on:\n([\s\S]*?)\n\n/m)?.[1],
    '  pull_request:\n    branches: [main]\n    types: [ready_for_review]', 'Admission requires ready-only Full workflow')
  const derived = deriveFullCheckDiagnostic(workflow)
  assert.deepEqual(entry.fullCheckDiagnostic, derived, 'Entry diagnostic policy must match reviewed workflow before registration')
  return derived
}
