import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { test } from 'node:test'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  assessmentChanges,
  render,
  scopeHash,
  summarize,
  validateRevision,
} from '../scripts/parity.mjs'

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
  const report = render(currentLedger, history)
  assert.match(report, /verified gameplay and game-mechanics parity across known scope/)
  assert.match(report, /gameplay and game-mechanics parity percentage is the project progress measure/)
  assert.doesNotMatch(report, /planning metric|not an objective percentage/)
  assert.equal(report, readFileSync(new URL('../PARITY.md', import.meta.url), 'utf8'))
})

test('report-only rendering refuses unrecorded parity progress', () => {
  const repo = mkdtempSync(join(tmpdir(), 'pnd-parity-render-'))
  try {
    mkdirSync(join(repo, 'scripts'))
    for (const path of ['parity.json', 'parity-history.json', 'PARITY.md'])
      copyFileSync(new URL(`../${path}`, import.meta.url), join(repo, path))
    copyFileSync(new URL('../scripts/parity.mjs', import.meta.url), join(repo, 'scripts/parity.mjs'))
    const beforeHistory = readFileSync(join(repo, 'parity-history.json'), 'utf8')
    const beforeReport = readFileSync(join(repo, 'PARITY.md'), 'utf8')
    const ledger = JSON.parse(readFileSync(join(repo, 'parity.json'), 'utf8'))
    const evidence = [
      ...ledger.discovery.evidence,
      ...ledger.groups.flatMap(group =>
        group.items.flatMap(item => [
          ...item.evidence,
          ...(item.requirements ?? []).flatMap(requirement => requirement.evidence),
        ])
      ),
    ]
    for (const path of evidence) {
      const target = join(repo, path)
      mkdirSync(dirname(target), { recursive: true })
      if (!existsSync(target)) writeFileSync(target, '')
    }
    ledger.discovery.note += ' Unrecorded test change.'
    writeFileSync(join(repo, 'parity.json'), `${JSON.stringify(ledger, null, 2)}\n`)
    assert.throws(
      () => execFileSync(process.execPath, ['scripts/parity.mjs', 'render'], { cwd: repo }),
      /Unrecorded ledger change/
    )
    assert.equal(readFileSync(join(repo, 'parity-history.json'), 'utf8'), beforeHistory)
    assert.equal(readFileSync(join(repo, 'PARITY.md'), 'utf8'), beforeReport)
  } finally {
    rmSync(repo, { recursive: true, force: true })
  }
})

test('verified requirements advance a fixed checkpoint share without hiding unknown scope', () => {
  const requirement = (key, status) => ({
    id: `example.work.${key}`,
    title: key,
    status,
    note: 'Test scope',
    evidence: ['tests/parity.test.mjs'],
  })
  const ledger = {
    revision: 1,
    discovery: { status: 'open', note: 'Open', evidence: [] },
    groups: [
      {
        id: 'example',
        title: 'Example',
        items: [
          {
            id: 'example.work',
            title: 'Work',
            status: 'partial',
            note: 'Incomplete',
            evidence: ['tests/parity.test.mjs'],
            requirements: [requirement('one', 'verified'), requirement('two', 'missing')],
          },
        ],
      },
    ],
  }
  let summary = summarize(ledger)
  assert.equal(summary.earned, 0.5)
  assert.equal(summary.verified, 0)
  assert.equal(summary.verifiedRequirements, 1)
  const parent = ledger.groups[0].items[0]
  const prior = { revision: 1, scopeHash: scopeHash(ledger) }
  parent.requirements.push(requirement('discovered', 'unassessed'))
  assert.equal(summarize(ledger).earned, 1 / 3)
  assert.throws(() => validateRevision(ledger, prior), /Scope changed/)
  ledger.revision++
  validateRevision(ledger, prior)
  parent.status = 'verified'
  assert.throws(() => summarize(ledger), /Parent completion/)
  parent.requirements.forEach(r => {
    r.status = 'verified'
  })
  summary = summarize(ledger)
  assert.equal(summary.earned, 1)
  assert.equal(summary.completionReady, false)
  parent.requirements.push(requirement('extra', 'verified'))
  assert.equal(summarize(ledger).earned, 1, 'More subdivisions cannot increase a checkpoint share')
  parent.requirements[0].evidence = []
  assert.throws(() => summarize(ledger), /Evidence required/)
  const rendered = render(
    JSON.parse(readFileSync(new URL('../parity.json', import.meta.url), 'utf8')),
    [
      { date: 'before', revision: 1, verified: 1, total: 2, note: 'Old scope' },
      { date: 'after', revision: 2, verified: 1, earned: 1.5, total: 2, note: 'New scope' },
    ]
  )
  assert.match(rendered, /scope revision/)
  assert.doesNotMatch(rendered, /25.0 pp/)
})

test('assessments expose small gains and regressions without crediting scope revisions', () => {
  const ledger = JSON.parse(readFileSync(new URL('../parity.json', import.meta.url), 'utf8'))
  const previous = {
    date: 'before',
    revision: 4,
    verified: 17,
    earned: 20,
    total: 96,
    verifiedIds: ['interface.hud.health'],
    note: 'Baseline',
  }
  const current = {
    ...previous,
    date: 'after',
    earned: 20 + 1 / 13,
    verifiedIds: [...previous.verifiedIds, 'interface.hud.minimap-terrain'],
    note: 'Verified map',
  }
  assert.deepEqual(assessmentChanges(current, previous), {
    verified: ['interface.hud.minimap-terrain'],
    reopened: [],
  })
  assert.match(render(ledger, [previous, current]), /0\.08 pp/)
  assert.match(render(ledger, [previous, current]), /Newly verified: 1\. Reopened: 0\./)
  const regression = {
    ...current,
    earned: previous.earned,
    verifiedIds: ['interface.hud.minimap-terrain'],
  }
  assert.deepEqual(assessmentChanges(regression, current), {
    verified: [],
    reopened: ['interface.hud.health'],
  })
  assert.match(render(ledger, [current, regression]), /-0\.08 pp/)
  // Equal total credit can hide one completion and one regression.
  assert.deepEqual(assessmentChanges(regression, previous), {
    verified: ['interface.hud.minimap-terrain'],
    reopened: ['interface.hud.health'],
  })
  assert.deepEqual(assessmentChanges(previous, previous), { verified: [], reopened: [] })
  assert.equal(assessmentChanges(current, { ...previous, revision: 3 }), null)
  assert.equal(assessmentChanges(current, { ...previous, verifiedIds: undefined }), null)
  assert.match(render(ledger, [previous, { ...current, revision: 5 }]), /scope revision/)
})
