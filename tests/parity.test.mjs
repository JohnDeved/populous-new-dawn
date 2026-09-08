import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { render, scopeHash, summarize, validateRevision } from '../scripts/parity.mjs'

test('parity credits verified scope only and rejects misleading or untraceable assessments', () => {
  const ledger = JSON.parse(readFileSync(new URL('../parity.json', import.meta.url), 'utf8'))
  const history = JSON.parse(
    readFileSync(new URL('../parity-history.json', import.meta.url), 'utf8')
  )
  const summary = summarize(ledger)
  assert.equal(summary.total, summary.verified + summary.partial + summary.missing)
  const changed = structuredClone(ledger)
  const partial = changed.groups.flatMap(g => g.items).find(i => i.status === 'partial')
  partial.status = 'missing'
  assert.equal(summarize(changed).verified, summary.verified)
  partial.status = 'verified'
  assert.equal(summarize(changed).verified, summary.verified + 1)
  partial.evidence = []
  assert.throws(() => summarize(changed), /Evidence required/)
  partial.evidence = ['absent-parity-proof.txt']
  assert.throws(() => summarize(changed), /Evidence not found/)
  partial.evidence = ['../outside.txt']
  assert.throws(() => summarize(changed), /outside repository/)
  partial.status = 'almost'
  assert.throws(() => summarize(changed), /Invalid status/)
  const duplicate = structuredClone(ledger)
  duplicate.groups[0].items.push(duplicate.groups[0].items[0])
  assert.throws(() => summarize(duplicate), /Duplicate ID/)
  const weighted = structuredClone(ledger)
  weighted.groups[0].items[0].weight = 10
  assert.throws(() => summarize(weighted), /equal weight/)
  const previous = { revision: ledger.revision, scopeHash: scopeHash(ledger) }
  validateRevision(ledger, previous)
  changed.groups[0].items.pop()
  assert.throws(() => validateRevision(changed, previous), /Scope changed/)
  changed.revision++
  validateRevision(changed, previous)
  assert.equal(
    render(ledger, history),
    readFileSync(new URL('../PARITY.md', import.meta.url), 'utf8')
  )
})
