import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { isAbsolute, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const states = ['verified', 'partial', 'missing', 'unassessed']
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')
const percent = ({ earned, verified, total }) =>
  `${((100 * (earned ?? verified)) / total).toFixed(1)}%`
const read = name => JSON.parse(readFileSync(resolve(root, name), 'utf8'))

function validateEvidence(paths, required, subject, base) {
  assert(Array.isArray(paths), `Missing evidence list: ${subject}`)
  assert(!required || paths.length, `Evidence required: ${subject}`)
  for (const path of paths) {
    assert(typeof path === 'string' && path.length, `Invalid evidence: ${subject}`)
    const local = relative(base, resolve(base, path))
    assert(
      !isAbsolute(path) && local !== '..' && !local.startsWith('../'),
      `Evidence outside repository: ${path}`
    )
    assert(existsSync(resolve(base, path)), `Evidence not found: ${path}`)
  }
}

export function summarize(ledger, base = root) {
  assert(Number.isInteger(ledger.revision) && ledger.revision > 0, 'Invalid checklist revision')
  assert(Array.isArray(ledger.groups) && ledger.groups.length, 'Empty checklist')
  const { discovery } = ledger
  assert(discovery && ['open', 'audited'].includes(discovery.status), 'Invalid discovery status')
  assert(
    typeof discovery.note === 'string' && discovery.note.trim(),
    'Missing discovery scope note'
  )
  validateEvidence(discovery.evidence, discovery.status === 'audited', 'discovery audit', base)
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
      earned: 0,
      requirements: 0,
      verifiedRequirements: 0,
      verified: 0,
      partial: 0,
      missing: 0,
      unassessed: 0,
    }
    for (const item of group.items) {
      identify(item)
      assert(item.id.startsWith(`${group.id}.`), `Wrong group: ${item.id}`)
      assert(states.includes(item.status), `Invalid status: ${item.id}`)
      assert(
        typeof item.note === 'string' && item.note.trim(),
        `Missing scope/boundary: ${item.id}`
      )
      validateEvidence(item.evidence, ['verified', 'partial'].includes(item.status), item.id, base)
      counts[item.status]++
      const requirements = item.requirements ?? [item]
      assert(Array.isArray(requirements) && requirements.length, `Empty requirements: ${item.id}`)
      if (item.requirements) {
        for (const requirement of requirements) {
          identify(requirement)
          assert(requirement.id.startsWith(`${item.id}.`), `Wrong checkpoint: ${requirement.id}`)
          assert(!requirement.requirements, 'Only one requirement level is supported')
          assert(states.includes(requirement.status), `Invalid status: ${requirement.id}`)
          assert(
            typeof requirement.note === 'string' && requirement.note.trim(),
            `Missing scope/boundary: ${requirement.id}`
          )
          validateEvidence(
            requirement.evidence,
            ['verified', 'partial'].includes(requirement.status),
            requirement.id,
            base
          )
        }
        const allVerified = requirements.every(r => r.status === 'verified')
        assert(
          (item.status === 'verified') === allVerified,
          `Parent completion disagrees with requirements: ${item.id}`
        )
        assert(
          !requirements.some(r => ['verified', 'partial'].includes(r.status)) ||
            ['verified', 'partial'].includes(item.status),
          `Parent hides progress: ${item.id}`
        )
      }
      const verified = requirements.filter(r => r.status === 'verified').length
      counts.requirements += requirements.length
      counts.verifiedRequirements += verified
      counts.earned += verified / requirements.length
    }
    return counts
  })
  const total = {
    total: 0,
    verified: 0,
    partial: 0,
    missing: 0,
    unassessed: 0,
    earned: 0,
    requirements: 0,
    verifiedRequirements: 0,
  }
  for (const group of groups) for (const key of Object.keys(total)) total[key] += group[key]
  return {
    ...total,
    groups,
    discovery,
    completionReady: total.verified === total.total && discovery.status === 'audited',
  }
}

export function scopeHash(ledger) {
  return hash(
    ledger.groups.map(({ id, title, items }) => ({
      id,
      title,
      items: items.map(({ id, title, requirements }) => ({
        id,
        title,
        ...(requirements
          ? { requirements: requirements.map(({ id, title }) => ({ id, title })) }
          : {}),
      })),
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
  assert(
    scopeHash(ledger) === previous.scopeHash || ledger.discovery.status === 'open',
    'Scope changed: reopen discovery before reassessing completeness'
  )
}

export function render(ledger, history) {
  const summary = summarize(ledger)
  const rows = summary.groups.map(
    g =>
      `| ${g.title} | ${percent(g)} | ${g.verifiedRequirements}/${g.requirements} | ${g.verified}/${g.total} |`
  )
  const progress = history.map((entry, i) => {
    const previous = history[i - 1]
    const delta =
      previous && previous.revision === entry.revision
        ? `${(Number.parseFloat(percent(entry)) - Number.parseFloat(percent(previous))).toFixed(1)} pp`
        : previous
          ? 'scope revision'
          : 'baseline'
    const note = entry.note.replaceAll('|', '\\|').replaceAll('\n', ' ')
    return `| ${entry.date} | ${entry.revision} | ${percent(entry)} | ${entry.verified}/${entry.total} | ${delta} | ${note} |`
  })
  const details = ledger.groups.flatMap(group => [
    `### ${group.title}`,
    '',
    ...group.items.flatMap(item => [
      `- **${item.status}** — ${item.title} (\`${item.id}\`). ${item.note}${item.evidence.length ? ` Evidence: ${item.evidence.map(p => `[${p}](${p})`).join(', ')}.` : ''}`,
      ...(item.requirements ?? []).map(
        r =>
          `  - **${r.status}** — ${r.title} (\`${r.id}\`). ${r.note}${r.evidence.length ? ` Evidence: ${r.evidence.map(p => `[${p}](${p})`).join(', ')}.` : ''}`
      ),
    ]),
    '',
  ])
  return [
    '# Game parity progress',
    '',
    `**${percent(summary)} evidence-backed progress across known scope.**`,
    '',
    `**Graphics: ${percent(summary.groups.find(g => g.id === 'graphics') ?? summary)}.** Overall: ${summary.verifiedRequirements}/${summary.requirements} individual requirements verified; ${summary.verified}/${summary.total} broad checkpoints complete.`,
    '',
    `${summary.partial} partial; ${summary.missing} missing; ${summary.unassessed} unassessed. Checklist revision ${ledger.revision}.`,
    '',
    `**Discovery: ${summary.discovery.status}.** ${summary.discovery.note}`,
    '',
    'Unknown scope is not assigned an invented size or percentage. This checklist is expandable: add checkpoints or entire subsystems as research reveals them. Use `unassessed` for newly identified behavior whose implementation/parity has not been investigated; it enters the denominator immediately and receives no verified credit. Split overly broad checkpoints when discoveries justify it, with a recorded revision.',
    '',
    `Ready for final parity review: **${summary.completionReady ? 'yes' : 'no'}**. Even 100% of known checkpoints is not a full-game claim while discovery is open. An audited scope requires recorded evidence of a full content/system inventory review; new discoveries reopen it. This tool never automatically completes the project goal.`,
    '',
    'This is a planning metric against a versioned capability checklist, not an objective percentage of the original engine or an estimate of effort remaining. Each broad checkpoint retains one equal share of the total. Within a decomposed checkpoint, only verified requirements earn their fraction of that share. Splitting a checkpoint cannot increase its maximum contribution. Unverified partial work receives no credit. Tests, exported functions and developer tooling do not earn extra points.',
    '',
    'Verified means the named scope has original-engine evidence and browser/game integration evidence reviewed for that scope. A verified rendering primitive does not certify its entire subsystem. Evidence links record the assessment; `parity:check` validates metadata and report freshness, not the execution or success of native/browser checks. Re-run relevant checks before crediting or retaining a changed behavior.',
    '',
    '## By subsystem',
    '',
    '| Subsystem | Progress | Verified requirements | Complete checkpoints |',
    '| --- | ---: | ---: | ---: |',
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
    '1. Edit `parity.json`: update status, evidence and remaining boundaries. Break broad partial checkpoints into explicit `requirements`; retain every unfinished part and give each requirement its own evidence. Parent completion must agree with its requirements. Preserve IDs for unchanged scope. Add discoveries as `unassessed`, then classify them as missing, partial or verified after investigation. Credit only compared and integrated behavior; reopen regressions.',
    '2. Run the affected native/browser/game checks. Add or split checkpoints/groups freely as research requires, increment the revision, reopen discovery and explain the scope change; never silently shrink the denominator. There is no fixed checkpoint or group limit.',
    '3. Run `npm run parity:record -- "What changed and what was verified"`, then `npm run check`. Commit the ledger, history and generated report together.',
    '4. Use `npm run parity` for a compact summary or `npm run --silent parity -- --json` for machine-readable counts. Keep maintainability and decomp progress in GOAL.md; they are not gameplay completion credit.',
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
    `Game parity: ${percent(summary)} verified coverage of known scope (${summary.verifiedRequirements}/${summary.requirements} requirements; ${summary.verified}/${summary.total} whole checkpoints); ${summary.partial} partial, ${summary.missing} missing, ${summary.unassessed} unassessed. Revision ${ledger.revision}.`
  )
  console.log(
    `Discovery: ${summary.discovery.status}. Ready for final parity review: ${summary.completionReady ? 'yes' : 'no'}. Unknown scope is not yet quantifiable.`
  )
  for (const group of summary.groups)
    console.log(
      `${group.title}: ${percent(group)} (${group.verifiedRequirements}/${group.requirements} requirements; ${group.verified}/${group.total} checkpoints), ${group.partial} partial, ${group.missing} missing, ${group.unassessed} unassessed`
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
