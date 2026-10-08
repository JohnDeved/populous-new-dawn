// Read-only measurement of existing evidence. This module never executes a check,
// accepts a reference baseline, or changes the historical hand-assessed ledger.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fingerprintPaths, safeRepoPath } from './orchestration/cli.mjs'
import { ORDINARY_M2, isOrdinaryCheckpointCandidate, readOrdinaryCheckpoint, selectOrdinaryCheckpoint } from './parity-owned-checkpoint.mjs'
import { BLAST_BINDINGS, BLAST_REFERENCE, isOrdinaryBlastCandidate, readOrdinaryBlast, selectOrdinaryBlast, isBlastReferenceCandidate, readBlastReference, selectBlastReference } from './parity-owned-blast.mjs'

const ROOT = fileURLToPath(new URL('../', import.meta.url))
const DEFINITIONS = 'engineering/parity-capabilities.json'
const OUTPUT = 'work/orchestration/parity-measure'
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')
const read = (repo, path) => JSON.parse(readFileSync(safeRepoPath(repo, path), 'utf8'))
const runtime = () => ({ node: process.version, platform: process.platform, arch: process.arch })
const states = ['verified', 'failed', 'blocked', 'stale', 'unknown']
const browserInputs = ['app', 'scripts', 'public/original', 'package.json', 'package-lock.json', DEFINITIONS]
export const browserSourceFingerprint = repo => fingerprintPaths(repo, browserInputs)

export function loadMeasurement(repo) {
  const definitions = read(repo, DEFINITIONS)
  assert.equal(definitions.version, 1, 'unsupported capability definition version')
  const checks = read(repo, 'engineering/checks.json').checks
  const ledger = read(repo, 'parity.json')
  const inventory = ledger.groups.flatMap(group => group.items.flatMap(item =>
    (item.requirements ?? [item]).map(requirement => ({
      id: requirement.id, title: requirement.title, group: group.id,
    }))))
  const allIds = new Set(ledger.groups.flatMap(group => group.items.flatMap(item =>
    [item.id, ...(item.requirements ?? []).map(requirement => requirement.id)])))
  const seen = new Set()
  for (const capability of definitions.capabilities) {
    assert(!seen.has(capability.id), 'duplicate capability ID')
    seen.add(capability.id)
    assert(['scenario', 'requirement', 'observation'].includes(capability.scope), 'invalid capability scope')
    if (capability.scope === 'requirement') assert(capability.id === capability.parityId && inventory.some(r => r.id === capability.id), 'whole-requirement bindings must use the exact leaf requirement ID')
    assert(typeof capability.title === 'string' && capability.title, 'missing capability title')
    assert(allIds.has(capability.parityId), `unknown parity ID: ${capability.parityId}`)
    assert(!('status' in capability) && !('percent' in capability), 'completion is derived, never editable')
    for (const [field, kind] of [['browserCheckIds', 'browser'], ['originalCheckIds', 'native']]) {
      assert(Array.isArray(capability[field]), `missing ${field}`)
      assert.equal(new Set(capability[field]).size, capability[field].length, 'duplicate check binding')
      for (const id of capability[field]) {
        const check = checks.find(check => check.id === id)
        assert(check?.kind === kind, `invalid ${kind} check binding: ${id}`)
      }
    }
  }
  return { definitions, checks, inventory, ledger }
}

// Capture only exact, registered checks. Aggregate commands never imply a pass for
// their constituents. Broad app/asset inputs deliberately invalidate conservatively.
export function captureMeasurement(repo, command, { cwd = repo, ownedServerFingerprint = null } = {}) {
  if (!existsSync(resolve(repo, DEFINITIONS))) return []
  const { definitions, checks } = loadMeasurement(repo)
  const bound = new Set(definitions.capabilities.flatMap(c => [...c.browserCheckIds, ...c.originalCheckIds]))
  return checks.filter(check => !check.receiptAdapter && bound.has(check.id) && resolve(repo, check.cwd ?? '.') === resolve(cwd) &&
    JSON.stringify([check.executable, ...check.args]) === JSON.stringify(command)).map(check => {
    const inputs = [...new Set([...check.inputs, ...browserInputs])].sort()
    return {
      version: 1, checkId: check.id, definitionHash: digest(check),
      inputPaths: inputs, inputFingerprint: fingerprintPaths(repo, inputs), runtime: runtime(),
      ...(check.kind === 'browser' ? { browserInputFingerprint: browserSourceFingerprint(repo), ownedServerFingerprint } : {}),
    }
  })
}

export function finishMeasurement(before, after, { status, exitCode, finishedAt }) {
  return before.map(evidence => ({
    ...evidence, status: JSON.stringify(evidence) === JSON.stringify(after.find(e => e.checkId === evidence.checkId))
      ? status : 'invalidated', exitCode, finishedAt,
  }))
}

function combine(results) {
  if (!results.length) return 'unknown'
  for (const state of ['failed', 'blocked', 'stale', 'unknown'])
    if (results.some(result => result.status === state)) return state
  return 'verified'
}

export function evaluateCheck(check, receipts, current) {
  const candidates = receipts.flatMap(receipt => (receipt.measurements ?? []).filter(e => e.checkId === check.id)
    .map(evidence => ({ ...evidence, receipt: receipt.path })))
  // Equal timestamps resolve conservatively. An older pass cannot hide a new failure.
  const priority = { failed: 0, invalidated: 1, blocked: 2, unknown: 3, 'not-run': 3, passed: 4 }
  candidates.sort((a, b) => String(b.finishedAt ?? '').localeCompare(String(a.finishedAt ?? '')) ||
    (priority[a.status] ?? 3) - (priority[b.status] ?? 3) || a.receipt.localeCompare(b.receipt))
  const latest = candidates[0]
  if (!latest) return { id: check.id, status: 'unknown', reason: 'No measurement-capable receipt' }
  let status, reason
  if (!latest.finishedAt || !Number.isFinite(Date.parse(latest.finishedAt))) {
    status = 'unknown'; reason = 'Missing valid completion time'
  } else if (latest.version !== 1 || latest.definitionHash !== current.definitionHash ||
    latest.inputFingerprint !== current.inputFingerprint ||
    JSON.stringify(latest.inputPaths) !== JSON.stringify(current.inputPaths) ||
    JSON.stringify(latest.runtime) !== JSON.stringify(current.runtime) || latest.status === 'invalidated') {
    status = 'stale'; reason = 'Definition, source, fixture, dependency or runtime identity changed'
  } else if (check.kind === 'browser' && ['passed', 'failed'].includes(latest.status) &&
    (!latest.ownedServerFingerprint || latest.ownedServerFingerprint !== latest.browserInputFingerprint)) {
    status = 'unknown'; reason = 'Diagnostic outcome only: no matching owned-server source provenance'
  } else if (latest.status === 'passed' && latest.exitCode === check.expected.exitCode) {
    status = 'verified'; reason = 'Current source-bound check passed; declared check limits apply'
  } else if (latest.status === 'failed' || latest.status === 'passed') {
    status = 'failed'; reason = 'Required check failed or its exit status disagrees'
  } else {
    status = latest.status === 'blocked' ? 'blocked' : 'unknown'; reason = 'No completed successful check'
  }
  return { id: check.id, status, diagnosticStatus: latest.status, reason, receipt: latest.receipt, finishedAt: latest.finishedAt,
    regression: status === 'failed' && candidates.slice(1).some(e => e.status === 'passed' &&
      e.exitCode === check.expected.exitCode && e.version === 1 && e.definitionHash === current.definitionHash &&
      (check.kind !== 'browser' || e.ownedServerFingerprint && e.ownedServerFingerprint === e.browserInputFingerprint)) }
}

export function buildReport(model, receipts, currentEvidence, source, adaptedResults = []) {
  const current = new Map(currentEvidence.map(e => [e.checkId, e]))
  const adapted = new Map(adaptedResults.map(result => [result.id, result]))
  const checkResults = model.checks.filter(check => current.has(check.id) || adapted.has(check.id)).map(check => ({
    ...(adapted.get(check.id) ?? evaluateCheck(check, receipts, current.get(check.id))), kind: check.kind,
    coveredBehavior: check.coveredBehavior, limits: check.knownLimits,
  }))
  const byId = new Map(checkResults.map(result => [result.id, result]))
  const capabilities = model.definitions.capabilities.map(capability => {
    const browser = capability.browserCheckIds.map(id => byId.get(id) ?? { status: 'unknown' })
    const original = capability.originalCheckIds.map(id => byId.get(id) ?? { status: 'unknown' })
    return { ...capability, browserStatus: combine(browser), originalStatus: combine(original),
      status: combine([{ status: combine(browser) }, { status: combine(original) }]),
      regression: [...browser, ...original].some(result => result.regression) }
  })
  // Narrow mission cases cannot certify their whole-game parent. This inventory
  // retains every known requirement regardless of missing tests or old manual status.
  const knownScope = model.inventory.map(item => {
    const binding = capabilities.find(c => c.scope === 'requirement' && c.id === item.id)
    return { ...item, status: binding?.status ?? 'unknown',
      reason: binding ? 'Exact requirement evidence binding; declared scope limits apply' : 'Whole requirement has no complete automatic evidence binding' }
  })
  const scoredCapabilities = capabilities.filter(capability => capability.scope !== 'observation')
  const counts = values => Object.fromEntries(states.map(state => [state, values.filter(v => v.status === state).length]))
  const historyEntry = model.history?.at(-1)
  return {
    version: 1, source, scopeHash: digest({ inventory: model.inventory, capabilities: model.definitions.capabilities }),
    discovery: 'open',
    knownScope: { total: knownScope.length, counts: counts(knownScope), percent: knownScope.length ? 100 * knownScope.filter(r => r.status === 'verified').length / knownScope.length : null, requirements: knownScope },
    browserIntegration: { total: scoredCapabilities.length, verified: scoredCapabilities.filter(c => c.browserStatus === 'verified').length,
      percent: scoredCapabilities.length ? 100 * scoredCapabilities.filter(c => c.browserStatus === 'verified').length / scoredCapabilities.length : null },
    missionCases: { total: scoredCapabilities.length, counts: counts(scoredCapabilities),
      observations: capabilities.filter(c => c.scope === 'observation').length,
      percent: scoredCapabilities.length ? 100 * scoredCapabilities.filter(c => c.status === 'verified').length / scoredCapabilities.length : null,
      capabilities },
    checks: checkResults,
    historical: historyEntry ? { date: historyEntry.date, revision: historyEntry.revision,
      percent: 100 * (historyEntry.earned ?? historyEntry.verified) / historyEntry.total,
      label: 'Historical manually assessed checkpoint-share coverage; not current automatic measurement' } : null,
    limits: [
      'Unknown is unmeasured, not evidence that the game has zero implemented behavior.',
      'Mission cases and whole-game requirements overlap and are never added together.',
      'Browser integration, supplied-state native components and natural original execution are different claims.',
      'No full original-game execution or matched full-frame visual score is established.',
      'Receipts are local development evidence, not tamper-proof attestations.',
    ],
  }
}

export function discoverReceipts(repo) {
  const receipts = [], warnings = []
  const root = resolve(repo, 'work/orchestration')
  let count = 0
  function walk(directory) {
    if (!existsSync(directory)) return
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (++count > 10000) throw new Error('Receipt discovery limit reached; no partial report written')
      if (entry.isSymbolicLink()) continue
      const path = resolve(directory, entry.name), local = relative(repo, path)
      if (path === resolve(repo, OUTPUT) || entry.name.endsWith('.artifacts')) continue
      if (entry.isDirectory()) walk(path)
      else if (entry.isFile() && entry.name.endsWith('.json')) {
        if (lstatSync(path).size > 4 * 1024 * 1024) { warnings.push(`Not inspected (oversized): ${local}`); continue }
        let value
        try { value = JSON.parse(readFileSync(path, 'utf8')) } catch { warnings.push(`Not inspected (invalid JSON): ${local}`); continue }
        let measurements
        if (value.kind === 'pnd-command-receipt') {
          measurements = value.parityMeasurements?.map(e => ({ ...e, status: value.status === e.status ? e.status : 'invalidated' }))
        } else if (value.identity && Array.isArray(value.verification?.results)) {
          measurements = value.verification.results.flatMap(result => (result.parityMeasurements ?? [])
            .map(e => ({ ...e, status: result.status === e.status ? e.status : 'invalidated' })))
        }
        const owned = isOrdinaryCheckpointCandidate(value) || BLAST_BINDINGS.some(binding => isOrdinaryBlastCandidate(value, binding)) || isBlastReferenceCandidate(value)
        if (Array.isArray(measurements) || owned)
          receipts.push({ path: local, measurements: measurements ?? [],
            ...(owned ? { commandReceipt: value } : {}) })
      }
    }
  }
  walk(root)
  return { receipts, warnings }
}

const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
export function renderHTML(report) {
  const rows = report.missionCases.capabilities.map(c => `<tr><td>${escape(c.title)}${c.scope === 'observation' ? ' (evidence only; no extra credit)' : ''}</td><td>${escape(c.browserStatus)}</td><td>${escape(c.originalStatus)}</td><td>${escape(c.status)}</td><td>${escape(c.limits)}</td></tr>`).join('')
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Automatic parity evidence</title><style>body{font:16px system-ui;max-width:1100px;margin:40px auto;padding:0 20px;color:#e8edf2;background:#15202b}h1,h2{color:#9cdbff}table{border-collapse:collapse;width:100%}th,td{text-align:left;border-bottom:1px solid #486070;padding:12px;vertical-align:top}code{overflow-wrap:anywhere}summary{cursor:pointer}li{margin:8px 0}</style><h1>Automatic parity evidence</h1><p>Build <code>${escape(report.source.head)}</code> · scope <code>${escape(report.scopeHash.slice(0,12))}</code> · discovery open</p><h2>${report.knownScope.counts.verified}/${report.knownScope.total} known requirements automatically verified</h2><p>Unmeasured requirements remain in the denominator. This is evidence coverage, not game implementation percentage.</p><h2>Browser integration: ${report.browserIntegration.verified}/${report.browserIntegration.total} declared mission cases</h2><p>These are diagnostic browser checks with the setup limitations below, not original-game parity.</p><h2>Missions 1–3: ${report.missionCases.counts.verified}/${report.missionCases.total} paired evidence gates</h2><table><thead><tr><th>Capability</th><th>Browser</th><th>Original</th><th>Paired status</th><th>Boundary</th></tr></thead><tbody>${rows}</tbody></table><h2>Checks</h2><ul>${report.checks.map(c => `<li><b>${escape(c.id)}: ${escape(c.status)}</b> ${escape(c.reason)}${c.diagnosticStatus ? ` (recorded outcome: ${escape(c.diagnosticStatus)})` : ''}${c.testedSource ? `<br>Tested source: <code>${escape(c.testedSource.commit)}</code> · ${escape(c.finishedAt)} · ${escape(c.evidenceClass)}` : ''}${c.observed ? `<br>Observed: ${escape(JSON.stringify(c.observed))}` : ''}${c.receipt ? `<br>Receipt: <code>${escape(c.receipt)}</code>` : ''}<br>${escape((c.limits ?? []).join(' '))}</li>`).join('')}</ul><h2>Historical ledger</h2><p>${report.historical ? `${report.historical.percent.toFixed(2)}%, ${escape(report.historical.date)}. ${escape(report.historical.label)}.` : 'No historical assessment.'}</p><h2>Limits</h2><ul>${[...report.limits, ...(report.warnings ?? [])].map(l => `<li>${escape(l)}</li>`).join('')}</ul><details><summary>All known requirements</summary><ul>${report.knownScope.requirements.map(r => `<li>${escape(r.id)}: ${escape(r.status)} — ${escape(r.title)}</li>`).join('')}</ul></details></html>\n`
}

export function writeReport(repo) {
  const model = loadMeasurement(repo)
  model.history = read(repo, 'parity-history.json')
  const bound = new Set(model.definitions.capabilities.flatMap(c => [...c.browserCheckIds, ...c.originalCheckIds]))
  const currentEvidence = model.checks.filter(check => bound.has(check.id)).flatMap(check =>
    captureMeasurement(repo, [check.executable, ...check.args]))
  const git = args => execFileSync('git', args, { cwd: repo, encoding: 'utf8' }).trim()
  const source = { head: git(['rev-parse', 'HEAD']), tree: git(['rev-parse', 'HEAD^{tree}']), clean: git(['status', '--porcelain']) === '', trackedDiffHash: digest(git(['diff', 'HEAD', '--binary'])) }
  const { receipts, warnings } = discoverReceipts(repo)
  // Never retain an old pass when discovery may have omitted a newer failure.
  const eligibleReceipts = warnings.length ? [] : receipts
  const adapted = bound.has(ORDINARY_M2) ? [selectOrdinaryCheckpoint(eligibleReceipts.filter(r => isOrdinaryCheckpointCandidate(r.commandReceipt))
    .map(receipt => readOrdinaryCheckpoint(repo, receipt, source)))] : []
  for (const binding of BLAST_BINDINGS.filter(binding => bound.has(binding.id)))
    adapted.push(selectOrdinaryBlast(eligibleReceipts.filter(r => isOrdinaryBlastCandidate(r.commandReceipt, binding))
      .map(receipt => readOrdinaryBlast(repo, receipt, source, binding)), binding))
  // This portable reference detail is intentionally unbound from all capability scores.
  if (model.checks.some(check => check.id === BLAST_REFERENCE.id))
    adapted.push(selectBlastReference(eligibleReceipts.filter(r => isBlastReferenceCandidate(r.commandReceipt))
      .map(receipt => readBlastReference(repo, receipt, source))))
  const report = { ...buildReport(model, eligibleReceipts, currentEvidence, source, adapted), warnings }
  const output = safeRepoPath(repo, OUTPUT, { mustExist: false })
  mkdirSync(output, { recursive: true })
  const historyPath = resolve(output, 'history.json')
  const history = existsSync(historyPath) ? JSON.parse(readFileSync(historyPath, 'utf8')) : []
  const reportHash = digest(report)
  if (history.at(-1)?.reportHash !== reportHash) history.push({ recordedAt: new Date().toISOString(), reportHash,
    scopeHash: report.scopeHash, source, knownScope: report.knownScope.counts, missionCases: report.missionCases.counts, browserIntegration: report.browserIntegration,
    change: !history.length ? 'baseline' : history.at(-1).scopeHash === report.scopeHash ? 'evidence' : 'scope revision' })
  for (const [name, content] of [['report.json', JSON.stringify(report, null, 2) + '\n'], ['index.html', renderHTML(report)], ['history.json', JSON.stringify(history, null, 2) + '\n']]) {
    const path = resolve(output, name), temporary = `${path}.${process.pid}.tmp`
    writeFileSync(temporary, content); renameSync(temporary, path)
  }
  return report
}

export function invalidateReport(repo) {
  const output = safeRepoPath(repo, OUTPUT, { mustExist: false })
  mkdirSync(output, { recursive: true })
  const unavailable = { version: 1, status: 'unavailable', reason: 'Measurement refresh failed; previous scores are unavailable. Run parity:measure for the error.' }
  writeFileSync(resolve(output, 'report.json'), JSON.stringify(unavailable, null, 2) + '\n')
  writeFileSync(resolve(output, 'index.html'), '<!doctype html><html lang="en"><meta charset="utf-8"><title>Parity evidence unavailable</title><h1>Parity evidence unavailable</h1><p>' + unavailable.reason + '</p></html>\n')
}

export function refreshMeasurement(repo) {
  if (!existsSync(resolve(repo, DEFINITIONS))) return
  try { writeReport(repo) } catch (error) {
    invalidateReport(repo)
    console.error(`Automatic parity report unavailable: ${error.message}`)
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    assert(process.argv.length === 2, 'parity:measure is report-only and accepts no execution options')
    const report = writeReport(ROOT)
    console.log(`Automatic evidence: ${report.knownScope.counts.verified}/${report.knownScope.total} known requirements; ${report.missionCases.counts.verified}/${report.missionCases.total} mission gates. ${OUTPUT}/index.html`)
    process.exitCode = report.checks.some(c => c.status === 'failed') ? 1 : report.checks.some(c => c.status !== 'verified') || report.missionCases.counts.verified < report.missionCases.total ? 2 : 0
  } catch (error) {
    try { invalidateReport(ROOT) } catch (failure) { console.error(`Cannot invalidate prior report: ${failure.message}`) }
    console.error(error.message); process.exitCode = 1
  }
}
