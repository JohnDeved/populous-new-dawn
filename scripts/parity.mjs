import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { isAbsolute, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const states = ['verified', 'partial', 'missing']
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')
const percent = ({ verified, total }) => `${((100 * verified) / total).toFixed(1)}%`
const read = name => JSON.parse(readFileSync(resolve(root, name), 'utf8'))

export function summarize(ledger, base = root) {
  assert(Number.isInteger(ledger.revision) && ledger.revision > 0, 'Invalid checklist revision')
  assert(Array.isArray(ledger.groups) && ledger.groups.length, 'Empty checklist')
  const ids = new Set()
  function identify(item) {
    assert(typeof item.id === 'string' && /^[a-z][a-z0-9.-]*$/.test(item.id), 'Invalid ID')
    assert(!ids.has(item.id), `Duplicate ID: ${item.id}`)
    ids.add(item.id)
    assert(typeof item.title === 'string' && item.title.trim(), `Missing title: ${item.id}`)
    assert(!Object.hasOwn(item, 'weight'), 'Checkpoints have equal weight')
  }
  const groups = ledger.groups.map(group => {
    identify(group)
    assert(Array.isArray(group.items) && group.items.length, `Empty group: ${group.id}`)
    const counts = {
      id: group.id,
      title: group.title,
      total: group.items.length,
      verified: 0,
      partial: 0,
      missing: 0,
    }
    for (const item of group.items) {
      identify(item)
      assert(item.id.startsWith(`${group.id}.`), `Wrong group: ${item.id}`)
      assert(states.includes(item.status), `Invalid status: ${item.id}`)
      assert(
        typeof item.note === 'string' && item.note.trim(),
        `Missing scope/boundary: ${item.id}`
      )
      assert(Array.isArray(item.evidence), `Missing evidence list: ${item.id}`)
      assert(item.status === 'missing' || item.evidence.length, `Evidence required: ${item.id}`)
      for (const path of item.evidence) {
        assert(typeof path === 'string' && path.length, `Invalid evidence: ${item.id}`)
        const local = relative(base, resolve(base, path))
        assert(
          !isAbsolute(path) && local !== '..' && !local.startsWith('../'),
          `Evidence outside repository: ${path}`
        )
        assert(existsSync(resolve(base, path)), `Evidence not found: ${path}`)
      }
      counts[item.status]++
    }
    return counts
  })
  const total = { total: 0, verified: 0, partial: 0, missing: 0 }
  for (const group of groups) for (const key of Object.keys(total)) total[key] += group[key]
  return { ...total, groups }
}

export function scopeHash(ledger) {
  return hash(
    ledger.groups.map(({ id, title, items }) => ({
      id,
      title,
      items: items.map(({ id, title }) => ({ id, title })),
    }))
  )
}

export function validateRevision(ledger, previous) {
  if (!previous) return
  assert(ledger.revision >= previous.revision, 'Checklist revision cannot decrease')
  assert(
    scopeHash(ledger) === previous.scopeHash || ledger.revision > previous.revision,
    'Scope changed: increment parity.json revision and explain the denominator change in the snapshot note'
  )
}

export function render(ledger, history) {
  const summary = summarize(ledger)
  const rows = summary.groups.map(
    g => `| ${g.title} | ${percent(g)} | ${g.verified}/${g.total} | ${g.partial} | ${g.missing} |`
  )
  const progress = history.map((entry, i) => {
    const previous = history[i - 1]
    const delta = previous
      ? `${((100 * entry.verified) / entry.total - (100 * previous.verified) / previous.total).toFixed(1)} pp`
      : 'baseline'
    const note = entry.note.replaceAll('|', '\\|').replaceAll('\n', ' ')
    return `| ${entry.date} | ${entry.revision} | ${percent(entry)} | ${entry.verified}/${entry.total} | ${delta} | ${note} |`
  })
  const details = ledger.groups.flatMap(group => [
    `### ${group.title}`,
    '',
    ...group.items.map(
      item =>
        `- **${item.status}** — ${item.title} (\`${item.id}\`). ${item.note}${item.evidence.length ? ` Evidence: ${item.evidence.map(p => `[${p}](${p})`).join(', ')}.` : ''}`
    ),
    '',
  ])
  return [
    '# Game parity progress',
    '',
    `**${percent(summary)} verified checklist coverage — ${summary.verified}/${summary.total} checkpoints.**`,
    '',
    `${summary.partial} partial; ${summary.missing} missing. Checklist revision ${ledger.revision}. Full game parity remains unfinished.`,
    '',
    'This is a planning metric against a versioned capability checklist, not an objective percentage of the original engine or an estimate of effort remaining. Each checkpoint has equal weight; scope and difficulty differ. Partial work receives no completion credit. Tests, exported functions and developer tooling do not earn extra points.',
    '',
    'Verified means the named scope has original-engine evidence and browser/game integration evidence reviewed for that scope. A verified rendering primitive does not certify its entire subsystem. Evidence links record the assessment; `parity:check` validates metadata and report freshness, not the execution or success of native/browser checks. Re-run relevant checks before crediting or retaining a changed behavior.',
    '',
    '## By subsystem',
    '',
    '| Subsystem | Verified coverage | Verified | Partial | Missing |',
    '| --- | ---: | ---: | ---: | ---: |',
    ...rows,
    '',
    '## History',
    '',
    'Scope changes require a new checklist revision. Scores across different revisions have different denominators and are not directly comparable; discoveries or reopened regressions can reduce coverage. No earlier percentages have been invented. Snapshot base commits identify HEAD when recorded; the ledger digest identifies the assessment, including uncommitted changes.',
    '',
    '| Recorded (UTC) | Revision | Coverage | Verified | Change | Note |',
    '| --- | ---: | ---: | ---: | ---: | --- |',
    ...progress,
    '',
    '## Update workflow',
    '',
    '1. Edit `parity.json`: keep checkpoint IDs and scope stable, update status, evidence and remaining boundaries. Credit only the stated, compared and integrated behavior; reopen regressions.',
    '2. Run the affected native/browser/game checks. Split or add scope only with a revision increment and an explanation; never silently shrink the denominator.',
    '3. Run `npm run parity:record -- "What changed and what was verified"`, then `npm run check`. Commit the ledger, history and generated report together.',
    '4. Use `npm run parity` for a compact summary or `npm run parity -- --json` for machine-readable counts. Keep maintainability and decomp progress in GOAL.md; they are not gameplay completion credit.',
    '',
    '## Checkpoints',
    '',
    ...details,
    'Generated by `scripts/parity.mjs` from [parity.json](parity.json) and [parity-history.json](parity-history.json).',
    '',
  ].join('\n')
}

function main() {
  const [command = 'report', ...args] = process.argv.slice(2)
  assert(['report', '--json', 'check', 'record'].includes(command), `Unknown command: ${command}`)
  const ledger = read('parity.json')
  const historyPath = resolve(root, 'parity-history.json')
  const history = existsSync(historyPath) ? read('parity-history.json') : []
  const summary = summarize(ledger)
  validateRevision(ledger, history.at(-1))
  if (command === 'record') {
    const note = args.join(' ').trim()
    assert(note, 'Supply a snapshot note: npm run parity:record -- "What changed"')
    history.push({
      date: new Date().toISOString(),
      revision: ledger.revision,
      baseCommit: execFileSync('git', ['rev-parse', '--verify', 'HEAD'], {
        cwd: root,
        encoding: 'utf8',
      }).trim(),
      ledgerHash: hash(ledger),
      scopeHash: scopeHash(ledger),
      ...summary,
      note,
    })
    writeFileSync(historyPath, `${JSON.stringify(history, null, 2)}\n`)
    writeFileSync(resolve(root, 'PARITY.md'), render(ledger, history))
  }
  if (command === 'check') {
    assert(
      history.at(-1)?.ledgerHash === hash(ledger),
      'Unrecorded ledger change: run parity:record with a note'
    )
    assert.equal(
      readFileSync(resolve(root, 'PARITY.md'), 'utf8'),
      render(ledger, history),
      'Stale PARITY.md: run parity:record'
    )
    console.log('Parity ledger, evidence paths, revision and generated report are consistent.')
    return
  }
  if (command === '--json') {
    console.log(
      JSON.stringify(
        { revision: ledger.revision, percent: Number.parseFloat(percent(summary)), ...summary },
        null,
        2
      )
    )
    return
  }
  console.log(
    `Game parity: ${percent(summary)} verified checklist coverage (${summary.verified}/${summary.total}); ${summary.partial} partial, ${summary.missing} missing. Revision ${ledger.revision}.`
  )
  for (const group of summary.groups)
    console.log(
      `${group.title}: ${percent(group)} (${group.verified}/${group.total}), ${group.partial} partial, ${group.missing} missing`
    )
  console.log(
    'Scope, evidence and history: PARITY.md. Checkpoint coverage is not an estimate of effort remaining.'
  )
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main()
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
