import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { render, scopeHash, summarize, validateRevision } from '../scripts/parity.mjs'

test('parity credits verified scope only and rejects misleading or untraceable assessments', () => {
  const currentLedger = JSON.parse(readFileSync(new URL('../parity.json', import.meta.url), 'utf8'))
  const ledger = {
    revision: 1,
    discovery: { status: 'open', note: 'Test inventory is incomplete.', evidence: [] },
    groups: [
      {
        id: 'example',
        title: 'Example subsystem',
        items: ['verified', 'partial', 'missing'].map(status => ({
          id: `example.${status}`,
          title: `Example ${status} behavior`,
          status,
          note: 'Test-only scope.',
          evidence: ['tests/parity.test.mjs'],
        })),
      },
    ],
  }
  const history = JSON.parse(
    readFileSync(new URL('../parity-history.json', import.meta.url), 'utf8')
  )
  const summary = summarize(ledger)
  assert.equal(
    summary.total,
    summary.verified + summary.partial + summary.missing + summary.unassessed
  )
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
  const expanded = structuredClone(ledger)
  expanded.groups.push({
    id: 'discovered',
    title: 'Newly discovered system',
    items: [
      {
        id: 'discovered.behavior',
        title: 'Previously unknown behavior',
        status: 'unassessed',
        evidence: [],
        note: 'Needs investigation.',
      },
    ],
  })
  assert.throws(() => validateRevision(expanded, previous), /Scope changed/)
  expanded.revision++
  validateRevision(expanded, previous)
  const larger = summarize(expanded)
  assert.equal(larger.total, summary.total + 1)
  assert.equal(larger.unassessed, summary.unassessed + 1)
  assert(larger.verified / larger.total < summary.verified / summary.total)
  for (const group of expanded.groups)
    for (const item of group.items) {
      item.status = 'verified'
      item.evidence = ['tests/parity.test.mjs']
    }
  assert.equal(summarize(expanded).verified, summarize(expanded).total)
  assert.equal(
    summarize(expanded).completionReady,
    false,
    '100% known coverage cannot close open discovery'
  )
  expanded.discovery = { status: 'audited', note: 'Test-only scope audit', evidence: [] }
  assert.throws(() => summarize(expanded), /Evidence required/)
  expanded.discovery.evidence = ['tests/parity.test.mjs']
  assert.equal(summarize(expanded).completionReady, true)
  assert.throws(() => validateRevision(expanded, previous), /reopen discovery/)
  assert.equal(
    render(currentLedger, history),
    readFileSync(new URL('../PARITY.md', import.meta.url), 'utf8')
  )
})
