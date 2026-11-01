import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { summarize } from '../scripts/parity.mjs'

function fixture(run) {
  const root = mkdtempSync(join(tmpdir(), 'pnd-evidence-paths-'))
  const repo = join(root, 'repo'), other = join(root, 'repo-sibling')
  mkdirSync(repo); mkdirSync(other)
  writeFileSync(join(repo, 'proof.txt'), 'local evidence')
  writeFileSync(join(other, 'proof.txt'), 'outside evidence')
  const ledger = {
    revision: 1,
    discovery: { status: 'open', note: 'Test scope', evidence: [] },
    groups: [{ id: 'sample', title: 'Sample', items: [{
      id: 'sample.case', title: 'Case', status: 'verified', note: 'Test scope',
      evidence: ['proof.txt'],
    }] }],
  }
  try { run({ root, repo, other, ledger }) }
  finally { rmSync(root, { recursive: true, force: true }) }
}

for (const site of ['item', 'requirement', 'discovery']) {
  test(`parity rejects escaping file symlink in ${site} evidence`, () => fixture(({ repo, other, ledger }) => {
    symlinkSync(join(other, 'proof.txt'), join(repo, 'escape.txt'))
    if (site === 'item') ledger.groups[0].items[0].evidence = ['escape.txt']
    else if (site === 'discovery') ledger.discovery = { status: 'audited', note: 'Test audit', evidence: ['escape.txt'] }
    else ledger.groups[0].items[0].requirements = [{
      id: 'sample.case.one', title: 'One', status: 'verified', note: 'Test scope', evidence: ['escape.txt'],
    }]
    assert.throws(() => summarize(ledger, repo), /Evidence outside repository/)
  }))
}

test('parity rejects escaping directory symlink and shared-prefix sibling', () => fixture(({ repo, other, ledger }) => {
  symlinkSync(other, join(repo, 'escape'), 'dir')
  ledger.groups[0].items[0].evidence = ['escape/proof.txt']
  assert.throws(() => summarize(ledger, repo), /Evidence outside repository/)
}))

test('parity preserves in-repository symlink and directory evidence', () => fixture(({ repo, ledger }) => {
  symlinkSync('proof.txt', join(repo, 'alias.txt'))
  mkdirSync(join(repo, 'evidence'))
  ledger.groups[0].items[0].evidence = ['alias.txt', 'evidence']
  assert.equal(summarize(ledger, repo).verified, 1)
}))

test('parity accepts a symlinked repository root', () => fixture(({ root, repo, ledger }) => {
  const alias = join(root, 'repo-alias')
  symlinkSync(repo, alias, 'dir')
  assert.equal(summarize(ledger, alias).verified, 1)
}))

test('parity retains missing and lexical traversal refusals', () => fixture(({ repo, ledger }) => {
  ledger.groups[0].items[0].evidence = ['missing.txt']
  assert.throws(() => summarize(ledger, repo), /Evidence not found/)
  ledger.groups[0].items[0].evidence = ['../repo-sibling/proof.txt']
  assert.throws(() => summarize(ledger, repo), /Evidence outside repository/)
}))

test('parity refuses dangling evidence links', () => fixture(({ repo, ledger }) => {
  symlinkSync('missing.txt', join(repo, 'dangling.txt'))
  ledger.groups[0].items[0].evidence = ['dangling.txt']
  assert.throws(() => summarize(ledger, repo), /Evidence not found/)
}))
