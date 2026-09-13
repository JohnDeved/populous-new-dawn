import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from 'node:fs'
import { dirname, extname, isAbsolute, normalize, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = fileURLToPath(new URL('../../', import.meta.url))
export const INDEX_VERSION = 1
export const DEFAULT_CONTEXT_BUDGET = 24_000
export const DEFAULT_ROLE_CONTEXT_BUDGET = 12_000
const RESULT_STATES = new Set(['passed', 'failed', 'blocked', 'not-run', 'not-applicable'])
const CONTEXT_ROLES = new Set(['scout', 'native', 'performance', 'reviewer'])
const PERFORMANCE_WORKLOAD_HEADING = /\b(workload|benchmark|measured?|measurement|cost|frame|timing|performance|cpu|gpu|render(?:er|ing)?|allocation|memory)\b/i
const ID = /^[a-z][a-z0-9.-]*$/
const INDEX_EXTENSIONS = new Set(['.md', '.ts', '.tsx', '.mjs', '.py', '.json', '.toml'])
const LIMITATION =
  /remain(?:s|ed)? (?:open|unfinished|incomplete)|still requires?|unfinished|incomplete|unverified|unknown|partial|missing|bounded|cannot|exclud\w*|does not|do not|not (?:a|an|the|completed|live|hardware|rendered|native)/i

const hash = value => createHash('sha256').update(value).digest('hex')
const jsonBytes = value => Buffer.byteLength(`${JSON.stringify(value, null, 2)}\n`)

function finishContextPacket(packet) {
  packet.contextBytes ??= 0
  while (packet.contextBytes !== jsonBytes(packet)) packet.contextBytes = jsonBytes(packet)
  assert(packet.contextBytes <= packet.budgetBytes, 'Context exceeds emitted byte budget; choose a larger --budget')
  return packet
}
const readJson = (repo, path) => JSON.parse(readFileSync(safeRepoPath(repo, path), 'utf8'))
const array = (value, label, { nonempty = false } = {}) => {
  assert(Array.isArray(value), `${label} must be an array`)
  assert(!nonempty || value.length, `${label} must not be empty`)
  return value
}
const string = (value, label) => {
  assert(typeof value === 'string' && value.trim(), `${label} must be a non-empty string`)
  return value
}
const object = (value, label) => {
  assert(value && typeof value === 'object' && !Array.isArray(value), `${label} must be an object`)
  return value
}
const pathEntryExists = path => {
  try {
    lstatSync(path)
    return true
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return false
    throw error
  }
}

export function safeRepoPath(repo, value, { mustExist = true } = {}) {
  string(value, 'path')
  assert(!value.includes('\0') && !isAbsolute(value), `Unsafe repository path: ${value}`)
  const unix = value.replaceAll('\\', '/')
  assert(
    unix === value && !value.split('/').includes('..'),
    `Non-canonical repository path: ${value}`
  )
  assert(normalize(value).split(sep).join('/') === value, `Non-canonical repository path: ${value}`)
  const absolute = resolve(repo, value)
  const local = relative(repo, absolute)
  assert(
    local !== '..' && !local.startsWith(`..${sep}`) && !isAbsolute(local),
    `Path escapes repository: ${value}`
  )
  assert(!mustExist || existsSync(absolute), `Missing repository path: ${value}`)
  let ancestor = absolute
  while (!pathEntryExists(ancestor)) {
    const parent = dirname(ancestor)
    assert(parent !== ancestor, `Cannot resolve repository path: ${value}`)
    ancestor = parent
  }
  const repository = realpathSync(repo)
  const resolved = realpathSync(ancestor)
  const resolvedLocal = relative(repository, resolved)
  assert(
    resolvedLocal !== '..' && !resolvedLocal.startsWith(`..${sep}`) && !isAbsolute(resolvedLocal),
    `Path resolves outside repository: ${value}`
  )
  return absolute
}

function uniqueIds(items, label) {
  const ids = new Set()
  for (const item of items) {
    assert(ID.test(string(item.id, `${label} id`)), `Invalid ${label} id: ${item.id}`)
    assert(!ids.has(item.id), `Duplicate ${label} id: ${item.id}`)
    ids.add(item.id)
  }
  return ids
}

export function parityEntries(ledger) {
  const entries = new Map()
  for (const group of array(ledger.groups, 'parity groups', { nonempty: true })) {
    entries.set(group.id, group)
    for (const item of array(group.items, `${group.id} items`, { nonempty: true })) {
      entries.set(item.id, item)
      for (const requirement of item.requirements ?? []) entries.set(requirement.id, requirement)
    }
  }
  return entries
}

export function validateChecks(repo, manifest) {
  assert(manifest.version === 1, 'Unsupported checks version')
  const checks = array(manifest.checks, 'checks', { nonempty: true })
  const ids = uniqueIds(checks, 'check')
  for (const check of checks) {
    string(check.kind, `${check.id} kind`)
    if (check.automation !== undefined) {
      assert(
        ['safe', 'manual'].includes(check.automation),
        `${check.id} automation mode is invalid`
      )
    }
    string(check.purpose, `${check.id} purpose`)
    array(check.coveredBehavior, `${check.id} coveredBehavior`, { nonempty: true }).forEach(
      (x, i) => string(x, `${check.id} coveredBehavior[${i}]`)
    )
    array(check.knownLimits, `${check.id} knownLimits`, { nonempty: true }).forEach((x, i) =>
      string(x, `${check.id} knownLimits[${i}]`)
    )
    string(check.executable, `${check.id} executable`)
    array(check.args, `${check.id} args`).forEach((x, i) => string(x, `${check.id} args[${i}]`))
    safeRepoPath(repo, check.cwd)
    array(check.env, `${check.id} env`).forEach((x, i) => string(x, `${check.id} env[${i}]`))
    array(check.inputs, `${check.id} inputs`).forEach(path => safeRepoPath(repo, path))
    array(check.prerequisites, `${check.id} prerequisites`).forEach((x, i) =>
      string(x, `${check.id} prerequisites[${i}]`)
    )
    array(check.sideEffects, `${check.id} sideEffects`).forEach((x, i) =>
      string(x, `${check.id} sideEffects[${i}]`)
    )
    array(check.resources, `${check.id} resources`).forEach((x, i) =>
      string(x, `${check.id} resources[${i}]`)
    )
    object(check.expected, `${check.id} expected`)
    assert(
      Number.isInteger(check.expected.exitCode),
      `${check.id} expected exitCode must be an integer`
    )
    array(check.expected.artifacts, `${check.id} expected artifacts`).forEach(path =>
      safeRepoPath(repo, path, { mustExist: false })
    )
  }
  return ids
}

export function validateGenerated(repo, manifest) {
  assert(manifest.version === 1, 'Unsupported generated-files version')
  const owners = array(manifest.owners, 'generated owners', { nonempty: true })
  const ids = uniqueIds(owners, 'generated owner')
  const outputs = new Set()
  for (const owner of owners) {
    string(owner.kind, `${owner.id} kind`)
    object(owner.generator, `${owner.id} generator`)
    string(owner.generator.executable, `${owner.id} generator executable`)
    array(owner.generator.args, `${owner.id} generator args`).forEach((x, i) =>
      string(x, `${owner.id} generator args[${i}]`)
    )
    array(owner.callers, `${owner.id} callers`, { nonempty: true }).forEach(path =>
      safeRepoPath(repo, path)
    )
    array(owner.inputs, `${owner.id} inputs`).forEach(path => safeRepoPath(repo, path))
    for (const output of array(owner.outputs, `${owner.id} outputs`, { nonempty: true })) {
      object(output, `${owner.id} output`)
      safeRepoPath(repo, output.path, { mustExist: output.tracked })
      assert(['file', 'directory'].includes(output.type), `${owner.id} output has invalid type`)
      assert(typeof output.tracked === 'boolean', `${owner.id} output tracked must be boolean`)
      assert(typeof output.protected === 'boolean', `${owner.id} output protected must be boolean`)
      assert(!outputs.has(output.path), `Duplicate generated output path: ${output.path}`)
      outputs.add(output.path)
    }
    string(owner.recording, `${owner.id} recording`)
  }
  return ids
}

const headingAnchor = value => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

function headingMatches(actual, wanted) {
  const heading = actual.toLowerCase()
  const expected = wanted.toLowerCase()
  return (
    heading.includes(expected) ||
    expected.includes(heading) ||
    headingAnchor(heading) === headingAnchor(expected)
  )
}

function headingExists(repo, reference, { exact = false } = {}) {
  const content = readFileSync(safeRepoPath(repo, reference.path), 'utf8')
  return parseMarkdown(content, reference.path).some(section => {
    const heading = section.headingTrail.at(-1) ?? ''
    return exact
      ? headingAnchor(heading) === headingAnchor(reference.heading)
      : headingMatches(heading, reference.heading)
  })
}

export function validateProjectMap(repo, manifest, { checkIds, generatedIds, ledger }) {
  assert(manifest.version === 1, 'Unsupported project-map version')
  const subsystems = array(manifest.subsystems, 'subsystems', { nonempty: true })
  const ids = uniqueIds(subsystems, 'subsystem')
  const parity = parityEntries(ledger)
  for (const subsystem of subsystems) {
    string(subsystem.title, `${subsystem.id} title`)
    assert(
      ['reviewed', 'inferred', 'unmapped'].includes(subsystem.mappingStatus),
      `${subsystem.id} invalid mapping status`
    )
    for (const key of ['implementationPaths', 'researchPaths', 'sharedPaths'])
      array(subsystem[key] ?? [], `${subsystem.id} ${key}`).forEach(path =>
        safeRepoPath(repo, path)
      )
    for (const entry of array(subsystem.entrySymbols, `${subsystem.id} entrySymbols`, {
      nonempty: true,
    })) {
      const path = safeRepoPath(repo, entry.path)
      const symbol = string(entry.symbol, `${subsystem.id} entry symbol`)
      const name = symbol.split('.').at(-1)
      assert(
        (readFileSync(path, 'utf8').match(/[A-Za-z_$][\w$]*/g) ?? []).includes(name),
        `${subsystem.id} missing entry symbol: ${entry.path}#${symbol}`
      )
    }
    for (const id of array(subsystem.parityIds, `${subsystem.id} parityIds`, { nonempty: true }))
      assert(parity.has(id), `${subsystem.id} references unknown parity ID: ${id}`)
    for (const reference of array(subsystem.evidence, `${subsystem.id} evidence`, {
      nonempty: true,
    })) {
      safeRepoPath(repo, reference.path)
      string(reference.heading, `${subsystem.id} evidence heading`)
      assert(
        headingExists(repo, reference),
        `${subsystem.id} missing evidence heading: ${reference.path}#${reference.heading}`
      )
    }
    array(subsystem.nativeAddresses, `${subsystem.id} nativeAddresses`).forEach((address, i) =>
      assert(/^0x[0-9a-f]+$/i.test(address), `${subsystem.id} invalid native address[${i}]`)
    )
    for (const id of array(subsystem.checkIds, `${subsystem.id} checkIds`, { nonempty: true }))
      assert(checkIds.has(id), `${subsystem.id} references unknown check: ${id}`)
    for (const id of array(subsystem.generatedInputIds, `${subsystem.id} generatedInputIds`))
      assert(generatedIds.has(id), `${subsystem.id} references unknown generated owner: ${id}`)
    array(subsystem.risks, `${subsystem.id} risks`, { nonempty: true })
    array(subsystem.unresolved, `${subsystem.id} unresolved`, { nonempty: true })
  }
  for (const shared of array(manifest.crossCutting, 'crossCutting', { nonempty: true })) {
    safeRepoPath(repo, shared.path)
    for (const id of array(shared.subsystemIds, `${shared.path} subsystemIds`, { nonempty: true }))
      assert(ids.has(id), `${shared.path} references unknown subsystem: ${id}`)
    for (const id of array(shared.checkIds, `${shared.path} checkIds`))
      assert(checkIds.has(id), `${shared.path} references unknown check: ${id}`)
  }
  const areaIds = uniqueIds(
    array(manifest.unmappedAreas, 'unmappedAreas', { nonempty: true }),
    'unmapped area'
  )
  for (const area of manifest.unmappedAreas) {
    assert(
      ['inferred', 'unmapped'].includes(area.mappingStatus),
      `${area.id} must remain inferred or unmapped`
    )
    array(area.paths, `${area.id} paths`, { nonempty: true }).forEach(path =>
      safeRepoPath(repo, path)
    )
    string(area.note, `${area.id} note`)
  }
  return { ids, areaIds }
}

export function validateRepository(repo = ROOT) {
  const checks = readJson(repo, 'engineering/checks.json')
  const generated = readJson(repo, 'engineering/generated-files.json')
  const project = readJson(repo, 'engineering/project-map.json')
  const ledger = readJson(repo, 'parity.json')
  const checkIds = validateChecks(repo, checks)
  const generatedIds = validateGenerated(repo, generated)
  const { ids: subsystemIds } = validateProjectMap(repo, project, {
    checkIds,
    generatedIds,
    ledger,
  })
  const currentGoal = parseMarkdown(
    readFileSync(safeRepoPath(repo, 'GOAL.md'), 'utf8'),
    'GOAL.md'
  ).filter(
    section =>
      section.headingTrail.length === 2 &&
      /^Current execution order:/i.test(section.headingTrail.at(-1) ?? '')
  )
  assert(
    currentGoal.length === 1,
    'GOAL.md must contain exactly one top-level Current execution order heading'
  )
  return {
    checks,
    generated,
    project,
    ledger,
    checkIds,
    generatedIds,
    subsystemIds,
    currentGoal: currentGoal[0],
  }
}

export function parseMarkdown(raw, path = '<memory>') {
  const text = raw.replaceAll('\r\n', '\n').replaceAll('\r', '\n')
  const lines = text.split('\n')
  const headings = []
  const ancestry = []
  let fence = null
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]
    const marker = line.match(/^\s{0,3}(`{3,}|~{3,})/)
    if (marker) {
      if (!fence) fence = { char: marker[1][0], length: marker[1].length }
      else if (marker[1][0] === fence.char && marker[1].length >= fence.length) fence = null
      continue
    }
    if (fence) continue
    const match = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/)
    if (!match) continue
    const level = match[1].length
    const title = match[2].trim()
    ancestry.length = level - 1
    ancestry[level - 1] = title
    headings.push({ line: index + 1, level, title, headingTrail: ancestry.filter(Boolean).slice() })
  }
  const occurrences = new Map()
  if (!headings.length)
    return [
      {
        id: hash(`${path}\0\0${hash(text)}`),
        headingTrail: [],
        occurrence: 1,
        lineStart: 1,
        lineEnd: lines.length,
        contentHash: hash(text),
      },
    ]
  return headings.map((heading, index) => {
    const lineEnd = (headings[index + 1]?.line ?? lines.length + 1) - 1
    const content = lines.slice(heading.line - 1, lineEnd).join('\n')
    const key = heading.headingTrail.join(' > ')
    const occurrence = (occurrences.get(key) ?? 0) + 1
    occurrences.set(key, occurrence)
    const contentHash = hash(content)
    return {
      id: hash(`${path}\0${key}\0${occurrence}\0${contentHash}`),
      headingTrail: heading.headingTrail,
      occurrence,
      lineStart: heading.line,
      lineEnd,
      contentHash,
    }
  })
}

function git(repo, args, options = {}) {
  return execFileSync('git', args, { cwd: repo, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...options })
}

function nulList(value) {
  return value.split('\0').filter(Boolean)
}

function discoveredPaths(repo) {
  const tracked = nulList(git(repo, ['ls-files', '-z']))
  const untracked = nulList(git(repo, ['ls-files', '--others', '--exclude-standard', '-z']))
  return new Set([...tracked, ...untracked])
}

export function indexSourcePaths(
  repo = ROOT,
  project = readJson(repo, 'engineering/project-map.json'),
  checks = readJson(repo, 'engineering/checks.json')
) {
  const available = discoveredPaths(repo)
  const wanted = new Set([
    'AGENTS.md',
    'GOAL.md',
    'parity.json',
    'engineering/README.md',
    'engineering/contracts.md',
    'engineering/checks.json',
    'engineering/generated-files.json',
    'engineering/project-map.json',
    '.agents/skills/populous-engineering/SKILL.md',
    'references/reverse-engineering.md',
    'references/modern-performance.md',
    'decomp/README.md',
    'decomp/exports.json',
  ])
  for (const subsystem of project.subsystems) {
    for (const key of ['implementationPaths', 'researchPaths', 'sharedPaths'])
      for (const path of subsystem[key] ?? []) wanted.add(path)
    for (const entry of subsystem.entrySymbols) wanted.add(entry.path)
    for (const entry of subsystem.evidence) wanted.add(entry.path)
  }
  for (const check of checks.checks) for (const path of check.inputs) wanted.add(path)
  return [...wanted]
    .filter(path => available.has(path) && INDEX_EXTENSIONS.has(extname(path)))
    .sort()
}

export function buildIndex(
  repo = ROOT,
  project = readJson(repo, 'engineering/project-map.json'),
  checks = readJson(repo, 'engineering/checks.json')
) {
  const sources = indexSourcePaths(repo, project, checks).map(path => {
    const content = readFileSync(safeRepoPath(repo, path))
    const text = content.toString('utf8')
    const lines = text.replaceAll('\r\n', '\n').replaceAll('\r', '\n').split('\n').length
    return {
      path,
      hash: hash(content),
      lines,
      sections: extname(path) === '.md' ? parseMarkdown(text, path) : [],
    }
  })
  return { version: INDEX_VERSION, sources }
}

function sameIndexFingerprint(a, b) {
  return (
    a?.version === b.version &&
    JSON.stringify(a.sources?.map(({ path, hash: sourceHash }) => [path, sourceHash])) ===
      JSON.stringify(b.sources.map(({ path, hash: sourceHash }) => [path, sourceHash]))
  )
}

export function loadOrBuildIndex(repo = ROOT, { write = true } = {}) {
  const current = buildIndex(repo)
  const path = safeRepoPath(repo, 'work/orchestration/index.json', { mustExist: false })
  let cached
  try {
    cached = JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    cached = null
  }
  if (sameIndexFingerprint(cached, current)) return { index: cached, cache: 'valid' }
  if (write) {
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, `${JSON.stringify(current, null, 2)}\n`)
  }
  return { index: current, cache: cached ? 'regenerated-stale' : 'generated-missing' }
}

function terms(value) {
  return [...new Set(value.toLowerCase().match(/[a-z0-9][a-z0-9.-]{2,}/g) ?? [])]
}

function sectionText(repo, path, section) {
  const lines = readFileSync(safeRepoPath(repo, path), 'utf8')
    .replaceAll('\r\n', '\n')
    .replaceAll('\r', '\n')
    .split('\n')
  return lines.slice(section.lineStart - 1, section.lineEnd).join('\n')
}

function sectionExcerpt(repo, source, section, queryTerms, mapped) {
  const content = sectionText(repo, source.path, section)
  const lines = content.split('\n')
  const limit = 48
  let anchor = 0
  if (lines.length > limit || Buffer.byteLength(content) > 500) {
    const found = mapped
      ? lines.findLastIndex(line => LIMITATION.test(line))
      : lines.findIndex(line => queryTerms.some(term => line.toLowerCase().includes(term)))
    if (found >= 0) anchor = found
  }
  const start = mapped && anchor ? anchor : Math.max(0, Math.min(anchor - 4, lines.length - limit))
  const excerptLines = lines.slice(start, start + limit)
  if (mapped && Buffer.byteLength(excerptLines[0] ?? '') > 500) {
    const match = excerptLines[0].match(LIMITATION)
    if (match)
      excerptLines[0] = excerptLines[0].slice(Math.max(0, match.index - 80), match.index + 420)
  }
  while (excerptLines.length > 1 && Buffer.byteLength(excerptLines.join('\n')) > 500)
    excerptLines.pop()
  const excerpt = excerptLines.join('\n').slice(0, 500)
  return {
    path: source.path,
    headingTrail: section.headingTrail,
    occurrence: section.occurrence,
    lineStart: section.lineStart + start,
    lineEnd: section.lineStart + start + excerptLines.length - 1,
    sourceHash: source.hash,
    sectionHash: section.contentHash,
    contentHash: hash(excerpt),
    excerpt,
    truncated: start > 0 || excerpt !== content,
  }
}

function sourceExcerpt(repo, path, queryTerms, symbols) {
  const absolute = safeRepoPath(repo, path)
  const lines = readFileSync(absolute, 'utf8')
    .replaceAll('\r\n', '\n')
    .replaceAll('\r', '\n')
    .split('\n')
  const names = symbols.map(symbol => symbol.split('.').at(-1).toLowerCase())
  const findSymbol = predicate =>
    lines.findIndex(line =>
      names.some(name => {
        const index = line.toLowerCase().indexOf(name)
        return index >= 0 && predicate(line.slice(0, index), line.slice(index + name.length))
      })
    )
  const declaredSymbolIndex = findSymbol(before =>
    /\b(function|class|const|let|var|private|public|protected|export)\s*$/i.test(before)
  )
  const memberSymbolIndex = findSymbol(
    (before, after) => !before.trim() && (/^\s*=/.test(after) || /^\s*\([^)]*\)\s*{/.test(after))
  )
  const calledSymbolIndex = findSymbol(
    (before, after) => /^\s*\(/.test(after) && !/^\s*(import|export)\b/i.test(before)
  )
  const fallbackSymbolIndex = lines.findIndex(line =>
    names.some(name => line.toLowerCase().includes(name))
  )
  const queryIndex = lines.findIndex(line =>
    queryTerms.some(term => line.toLowerCase().includes(term))
  )
  const index = Math.max(
    0,
    declaredSymbolIndex >= 0
      ? declaredSymbolIndex
      : memberSymbolIndex >= 0
        ? memberSymbolIndex
        : calledSymbolIndex >= 0
          ? calledSymbolIndex
          : fallbackSymbolIndex >= 0
            ? fallbackSymbolIndex
            : queryIndex
  )
  const lineStart = Math.max(1, index + 1 - 4)
  let lineEnd = Math.min(lines.length, lineStart + 15)
  const excerptLines = lines.slice(lineStart - 1, lineEnd)
  while (excerptLines.length > 1 && Buffer.byteLength(excerptLines.join('\n')) > 500)
    excerptLines.pop()
  lineEnd = lineStart + excerptLines.length - 1
  const window = excerptLines.join('\n')
  const excerpt = window.slice(0, 500)
  return {
    path,
    headingTrail: [],
    lineStart,
    lineEnd,
    sourceHash: hash(readFileSync(absolute)),
    contentHash: hash(excerpt),
    excerpt,
    truncated: lineStart > 1 || lineEnd < lines.length || excerpt !== window,
  }
}

function ledgerScope(repo, entries, ids) {
  const ledgerPath = safeRepoPath(repo, 'parity.json')
  const lines = readFileSync(ledgerPath, 'utf8').split(/\r?\n/)
  return ids.map(id => {
    const entry = entries.get(id)
    const sentences = entry.note?.split(/(?<=[.!?])\s+/) ?? []
    const limitations = sentences.filter(sentence => LIMITATION.test(sentence))
    const uniqueLimitations = [...new Set(limitations)]
    const scope =
      entry.status === 'verified'
        ? uniqueLimitations.length
          ? uniqueLimitations
          : [sentences[0]].filter(Boolean)
        : uniqueLimitations.slice(0, 4).length
          ? uniqueLimitations.slice(0, 4)
          : [sentences[0]].filter(Boolean)
    const line = lines.findIndex(value => value.includes(`"id": "${id}"`)) + 1
    return {
      id,
      title: entry.title,
      status: entry.status ?? null,
      scope,
      omittedScopeSentences: Math.max(0, sentences.length - scope.length),
      noteHash: hash(entry.note ?? ''),
      evidence: entry.evidence ?? [],
      provenance: {
        path: 'parity.json',
        lineStart: line,
        lineEnd: line,
        sourceHash: hash(readFileSync(ledgerPath)),
      },
    }
  })
}

export function contextPacket(
  repo = ROOT,
  {
    subsystem: subsystemId,
    query = '',
    role = null,
    budget = role ? DEFAULT_ROLE_CONTEXT_BUDGET : DEFAULT_CONTEXT_BUDGET,
    contract: contractPath = null,
  } = {}
) {
  assert(Number.isInteger(budget) && budget >= 4_000, 'Context budget must be an integer >= 4000')
  assert(!role || CONTEXT_ROLES.has(role), `Unknown context role: ${role}`)
  assert(Boolean(role) === Boolean(contractPath), '--role and --contract must be used together')
  if (role && Buffer.byteLength(query) > 1_000)
    return finishContextPacket({
      version: 1,
      status: 'incomplete',
      role,
      subsystem: { id: subsystemId },
      queryHash: hash(query),
      queryBytes: Buffer.byteLength(query),
      budgetBytes: budget,
      omissions: [{ reason: 'mandatory question exceeds the 1000-byte role-packet limit' }],
      executesChecks: false,
    })
  const manifests = validateRepository(repo)
  const { checks, project, ledger, currentGoal } = manifests
  const subsystem = project.subsystems.find(item => item.id === subsystemId)
  assert(subsystem, `Unknown subsystem: ${subsystemId ?? '<missing>'}`)
  const contract = contractPath ? readJson(repo, contractPath) : null
  if (contract) {
    validateContract(repo, contract, manifests)
    assert(
      contract.scope.subsystemIds.includes(subsystem.id),
      `Contract does not include subsystem: ${subsystem.id}`
    )
  }
  const { index, cache } = loadOrBuildIndex(repo)
  const queryTerms = terms(`${subsystem.id} ${subsystem.title} ${query}`)
  const checkById = new Map(checks.checks.map(check => [check.id, check]))
  const entries = parityEntries(ledger)
  const parityIds = contract ? contract.scope.parityIds : subsystem.parityIds
  const checkIds = contract ? contract.verification.requiredCheckIds : subsystem.checkIds
  const evidenceReferences = contract
    ? contract.research.evidence.map(reference => {
        const [path, ...heading] = reference.split('#')
        return { path, heading: heading.join('#') }
      })
    : subsystem.evidence
  if (role === 'performance')
    assert(
      contract.modernization.measurementNeeds.some(
        need => typeof need === 'string' && need.trim()
      ) && contract.modernization.workloadEvidence,
      'Performance role requires a nonblank measurement need and explicit workload evidence'
    )
  const requiredPolicyReferences =
    role === 'performance'
      ? [{ path: 'references/modern-performance.md', heading: 'Measurement rules' }]
      : []
  const packet = {
    version: 1,
    subsystem: {
      id: subsystem.id,
      title: subsystem.title,
      mappingStatus: subsystem.mappingStatus,
      implementationPaths: subsystem.implementationPaths,
      researchPaths: subsystem.researchPaths ?? [],
      sharedPaths: subsystem.sharedPaths,
      entrySymbols: subsystem.entrySymbols,
      nativeAddresses: subsystem.nativeAddresses,
      risks: subsystem.risks,
    },
    query,
    cache,
    ledgerRevision: ledger.revision,
    parityScope: ledgerScope(repo, entries, parityIds),
    checks: checkIds.map(id => {
      const check = checkById.get(id)
      return {
        id,
        kind: check.kind,
        purpose: check.purpose,
        reason: `reviewed mapping for ${subsystem.id}`,
        knownLimits: check.knownLimits,
        command: [check.executable, ...check.args],
        prerequisites: check.prerequisites,
        sideEffects: check.sideEffects,
        resources: check.resources,
        ...readiness(check),
      }
    }),
    unresolved: subsystem.unresolved,
    sourceExcerpts: [],
    omissions: [],
    contextBytes: budget,
    budgetBytes: budget,
    executesChecks: false,
  }
  if (role) {
    packet.subsystem =
      role === 'reviewer'
        ? { id: subsystem.id, title: subsystem.title, mappingStatus: subsystem.mappingStatus }
        : {
            id: subsystem.id,
            title: subsystem.title,
            mappingStatus: subsystem.mappingStatus,
            implementationPaths: subsystem.implementationPaths,
            sharedPaths: subsystem.sharedPaths,
            entrySymbols: subsystem.entrySymbols,
            risks: subsystem.risks,
            ...(role === 'native'
              ? {
                  researchPaths: subsystem.researchPaths ?? [],
                  nativeAddresses: subsystem.nativeAddresses,
                }
              : {}),
          }
    if (role === 'reviewer') packet.unresolved = []
    packet.parityScope = packet.parityScope.map(({ evidence: _evidence, ...entry }) => entry)
    packet.checks = packet.checks.map(
      ({ id, kind, knownLimits, command, resources, status, reason }) => ({
        id,
        kind,
        knownLimits,
        command,
        resources,
        status,
        reason,
      })
    )
    const goalPath = 'GOAL.md'
    const goalSource = index.sources.find(source => source.path === goalPath)
    const goalText = sectionText(repo, goalPath, currentGoal)
    const policyPaths = [
      'AGENTS.md',
      ...(role === 'performance' ? ['references/modern-performance.md'] : []),
    ]
    packet.role = role
    packet.status = 'complete'
    packet.assignment = {
      identity: {
        taskId: contract.identity.taskId,
        parent: contract.ownership.implementationOwner,
        baseCommit: contract.identity.baseCommit,
        inputFingerprints: contract.identity.inputFingerprints,
        contract: {
          path: contractPath,
          sourceHash: hash(readFileSync(safeRepoPath(repo, contractPath))),
        },
      },
      question: query,
      objective: contract.intent.objective,
      nonGoals: contract.intent.nonGoals,
      assumptions: contract.research.assumptions,
      deliverable: {
        scout: 'Answer the bounded question; for open priority triage compare at most five live candidates, return the top three, and recommend one.',
        native: 'State exactly what native evidence proves, supplied/intercepted leaves, and the live integration boundary.',
        performance: 'Define a comparable workload and report measurement evidence, corrections, noise, and limitations.',
        reviewer: 'Review the actual final changes and receipts, seek counterexamples, and return findings plus a stop decision.',
      }[role],
      responseBudgetWords: role === 'reviewer' ? 800 : 600,
      allowedWrites: [],
      forbiddenActions: [
        'edit source or ledgers',
        'delegate again',
        'publish, deploy, record, or regenerate evidence',
      ],
      prohibitedPaths: contract.ownership.prohibitedPaths,
      acceptance: contract.intent.acceptance,
      boundaries: contract.scope.boundaries,
      stoppingConditions: contract.completion.stoppingConditions,
      evidence: contract.research.evidence,
      nativeQuestions: contract.research.nativeQuestions,
      measurementNeeds: contract.modernization.measurementNeeds,
      ...(role === 'performance'
        ? { workloadEvidence: contract.modernization.workloadEvidence }
        : {}),
      corrections: contract.modernization.corrections,
      policySources: policyPaths.map(path => ({
        path,
        sourceHash: index.sources.find(source => source.path === path).hash,
      })),
      currentDirection: {
        headingTrail: currentGoal.headingTrail,
        excerpt: goalText.slice(0, 400),
        truncated: Buffer.byteLength(goalText) > 400,
        provenance: {
          path: goalPath,
          lineStart: currentGoal.lineStart,
          lineEnd: currentGoal.lineEnd,
          sourceHash: goalSource.hash,
          sectionHash: currentGoal.contentHash,
        },
      },
    }
    if (role === 'reviewer') {
      const plan = planChanges(repo, { base: contract.identity.baseCommit })
      const untrackedPaths = plan.changes
        .filter(change => change.source === 'untracked')
        .map(change => change.path)
      packet.assignment.review = {
        changes: plan.changes.map(({ hash: _hash, changeHash: _changeHash, endpoint, ...change }) => ({
          ...change,
          ...(endpoint === 'path' ? {} : { endpoint }),
        })),
        changedFingerprint: hash(JSON.stringify(plan.changes)),
        receipts: contract.verification.results,
        trackedDiffCommand: [
          'git',
          'diff',
          '--no-ext-diff',
          contract.identity.baseCommit,
          '--',
        ],
        untrackedPaths,
      }
    }
    const requiredBytes = jsonBytes(packet)
    if (requiredBytes > budget)
      return finishContextPacket({
        version: 1,
        status: 'incomplete',
        role,
        subsystem: { id: subsystem.id, title: subsystem.title },
        query,
        budgetBytes: budget,
        requiredBytes,
        omissions: [{ reason: 'mandatory assignment context exceeds budget', path: contractPath }],
        executesChecks: false,
      })
  }
  const relevant = new Set([
    ...(role ? [] : ['AGENTS.md', 'GOAL.md', 'engineering/README.md']),
    ...subsystem.implementationPaths,
    ...(!role || role === 'native' ? (subsystem.researchPaths ?? []) : []),
    ...(role === 'performance' ? ['references/modern-performance.md'] : []),
    ...subsystem.sharedPaths,
    ...evidenceReferences.map(entry => entry.path),
    ...checkIds.flatMap(id => checkById.get(id).inputs),
    ...(role === 'reviewer'
      ? packet.assignment.review.changes
          .filter(change => change.endpoint !== 'from')
          .map(change => change.path)
      : []),
  ])
  const declaredCheckInputs = checkIds.flatMap(id => checkById.get(id).inputs)
  const checkInputs = new Set(declaredCheckInputs)
  const implementationAnchor = subsystem.entrySymbols[0]?.path ?? subsystem.implementationPaths[0]
  const checkAnchor =
    declaredCheckInputs.find(
      path => path !== implementationAnchor && INDEX_EXTENSIONS.has(extname(path))
    ) ?? implementationAnchor
  const symbolByPath = new Map()
  for (const entry of subsystem.entrySymbols) {
    const list = symbolByPath.get(entry.path) ?? []
    list.push(entry.symbol)
    symbolByPath.set(entry.path, list)
  }
  const candidates = []
  const sources = index.sources.slice()
  for (const { path } of evidenceReferences) {
    if (sources.some(source => source.path === path)) continue
    const text = readFileSync(safeRepoPath(repo, path), 'utf8')
    sources.push({ path, hash: hash(text), sections: extname(path) === '.md' ? parseMarkdown(text, path) : [] })
  }
  for (const source of sources.filter(item => relevant.has(item.path))) {
    if (extname(source.path) !== '.md') {
      const item = sourceExcerpt(repo, source.path, queryTerms, symbolByPath.get(source.path) ?? [])
      const evidenceIndex = evidenceReferences.findIndex(reference => reference.path === source.path)
      const reserved = role
        ? ['scout', 'native'].includes(role) && source.path === implementationAnchor
        : source.path === implementationAnchor || source.path === checkAnchor
      const score =
        queryTerms.filter(term => item.excerpt.toLowerCase().includes(term)).length +
        (evidenceIndex >= 0 ? 10_000 - evidenceIndex : 0) +
        (symbolByPath.has(source.path) ? 80 : 0) +
        (checkInputs.has(source.path) ? 40 : 0) +
        (source.path === implementationAnchor ? 8_000 : source.path === checkAnchor ? 7_900 : 0)
      candidates.push({
        score,
        item,
        required: reserved || (evidenceIndex >= 0 && role !== 'reviewer'),
      })
      continue
    }
    for (const section of source.sections) {
      const content = sectionText(repo, source.path, section)
      const heading = section.headingTrail.join(' ').toLowerCase()
      const lower = content.toLowerCase()
      const evidenceIndex = evidenceReferences.findIndex(
        reference =>
          reference.path === source.path &&
          (role
            ? !reference.heading || headingAnchor(section.headingTrail.at(-1) ?? '') === headingAnchor(reference.heading)
            : headingMatches(section.headingTrail.at(-1) ?? '', reference.heading))
      )
      const policyIndex = requiredPolicyReferences.findIndex(
        reference =>
          reference.path === source.path &&
          headingAnchor(section.headingTrail.at(-1) ?? '') === headingAnchor(reference.heading)
      )
      const requiredEvidence = evidenceIndex >= 0 && role !== 'reviewer'
      const currentPolicy = !role && source.path === 'GOAL.md' && section.id === currentGoal.id
      const reserved = role
        ? ['scout', 'native'].includes(role) && source.path === implementationAnchor
        : source.path === implementationAnchor || source.path === checkAnchor
      const relevance = queryTerms.reduce(
        (sum, term) => sum + (heading.includes(term) ? 5 : lower.includes(term) ? 1 : 0),
        0
      )
      const score =
        relevance +
        (evidenceIndex >= 0 ? 10_000 - evidenceIndex : 0) +
        (policyIndex >= 0 ? 9_500 - policyIndex : 0) +
        (currentPolicy ? 9_000 : 0) +
        (checkInputs.has(source.path) ? 40 : 0) +
        (source.path === implementationAnchor ? 8_000 : source.path === checkAnchor ? 7_900 : 0)
      if (!score) continue
      candidates.push({
        score,
        required: requiredEvidence || policyIndex >= 0 || currentPolicy || reserved,
        item: sectionExcerpt(
          repo,
          source,
          section,
          queryTerms,
          evidenceIndex >= 0 || policyIndex >= 0
        ),
      })
    }
  }
  candidates.sort(
    (a, b) =>
      b.score - a.score ||
      a.item.path.localeCompare(b.item.path) ||
      a.item.lineStart - b.item.lineStart
  )
  const selectedCandidates = role
    ? candidates.filter(candidate => candidate.required).concat(
        candidates.filter(candidate => !candidate.required).slice(0, 1)
      )
    : candidates
  if (role)
    packet.retrievalBoundary = {
      strategy: 'all mandatory plus the highest-ranked optional section',
      candidatePaths: [...new Set(candidates.map(candidate => candidate.item.path))],
      headingIndex: {
        path: 'work/orchestration/index.json',
        contentHash: hash(JSON.stringify(index)),
      },
      refineQueryForAnotherProjection: true,
    }
  const candidateKey = item =>
    `${item.path}\0${item.headingTrail.join(' > ')}\0${item.lineStart}\0${item.contentHash}`
  const requiredKeys = new Set(
    selectedCandidates
      .filter(candidate => candidate.required)
      .map(candidate => candidateKey(candidate.item))
  )
  const perPath = new Map()
  let budgetOmissions = 0
  const optionalOmissions = []
  const requiredOmissions = selectedCandidates
    .slice(40)
    .filter(candidate => candidate.required)
    .map(({ item }) => ({ path: item.path, headingTrail: item.headingTrail }))
  for (const reference of [...evidenceReferences, ...requiredPolicyReferences]) {
    if (!candidates.some(({ item }) => item.path === reference.path &&
        (!reference.heading || (role
          ? headingAnchor(item.headingTrail.at(-1) ?? '') === headingAnchor(reference.heading)
          : headingMatches(item.headingTrail.at(-1) ?? '', reference.heading)))))
      requiredOmissions.push({ path: reference.path, headingTrail: [reference.heading].filter(Boolean) })
  }
  for (const { item, required } of selectedCandidates.slice(0, 40)) {
    if (!required && (perPath.get(item.path) ?? 0) >= 2) continue
    packet.sourceExcerpts.push(item)
    packet.contextBytes = jsonBytes(packet)
    if (packet.contextBytes > budget) {
      packet.sourceExcerpts.pop()
      budgetOmissions++
      if (required)
        requiredOmissions.push({ path: item.path, headingTrail: item.headingTrail })
      else optionalOmissions.push({ path: item.path, headingTrail: item.headingTrail })
    } else {
      perPath.set(item.path, (perPath.get(item.path) ?? 0) + 1)
      if (item.truncated)
        packet.omissions.push({
          path: item.path,
          headingTrail: item.headingTrail,
          reason: 'source section returned as a bounded window',
          retainedLines: [item.lineStart, item.lineEnd],
        })
    }
  }
  if (!role && candidates.length > 40)
    packet.omissions.push({ reason: 'lower-ranked source sections', count: candidates.length - 40 })
  if (!role && budgetOmissions)
    packet.omissions.push({ reason: 'context budget', count: budgetOmissions })
  while (jsonBytes(packet) > budget && packet.sourceExcerpts.length) {
    const removed = packet.sourceExcerpts.pop()
    if (requiredKeys.has(candidateKey(removed)))
      requiredOmissions.push({ path: removed.path, headingTrail: removed.headingTrail })
    else optionalOmissions.push({ path: removed.path, headingTrail: removed.headingTrail })
    packet.omissions = packet.omissions.filter(
      omission =>
        !(omission.path === removed.path && omission.retainedLines?.[0] === removed.lineStart)
    )
    if (!role) {
      const summary = packet.omissions.find(omission => omission.reason === 'context budget')
      if (summary) summary.count++
      else packet.omissions.push({ reason: 'context budget', count: 1 })
    }
  }
  if (role)
    packet.omissions.push(
      ...optionalOmissions.map(source => ({
        ...source,
        reason: 'optional source section excluded by context budget',
      }))
    )
  if (role && requiredOmissions.length) {
    packet.status = 'incomplete'
    packet.omissions.push({
      reason: 'mandatory source context exceeds budget',
      sources: requiredOmissions,
    })
  }
  if (role && jsonBytes(packet) > budget) {
    const requiredBytes = jsonBytes(packet)
    const sources = requiredOmissions.slice()
    const overflow = {
      version: 1,
      status: 'incomplete',
      role,
      subsystem: { id: subsystem.id, title: subsystem.title },
      query,
      budgetBytes: budget,
      contextBytes: budget,
      requiredBytes,
      omissions: [{ reason: 'mandatory source context exceeds budget', path: contractPath, sources, omittedSourceCount: 0 }],
      executesChecks: false,
    }
    while (jsonBytes(overflow) > budget && sources.length) {
      sources.pop()
      overflow.omissions[0].omittedSourceCount++
    }
    return finishContextPacket(overflow)
  }
  packet.contextBytes = jsonBytes(packet)
  assert(
    packet.contextBytes <= budget,
    `Core context exceeds budget (${packet.contextBytes} > ${budget}); choose a larger --budget`
  )
  return finishContextPacket(packet)
}

function parseNameStatus(raw, source) {
  const fields = nulList(raw)
  const records = []
  for (let index = 0; index < fields.length; ) {
    const status = fields[index++]
    if (/^[RC]/.test(status)) {
      const from = fields[index++]
      const to = fields[index++]
      records.push({ path: from, status, endpoint: 'from', source })
      records.push({ path: to, status, endpoint: 'to', source })
    } else {
      records.push({ path: fields[index++], status, endpoint: 'path', source })
    }
  }
  return records
}

function validateBase(repo, base) {
  string(base, 'base ref')
  assert(!base.startsWith('-') && !/[\0\r\n]/.test(base), `Unsafe base ref: ${base}`)
  try {
    return git(repo, ['rev-parse', '--verify', `${base}^{commit}`]).trim()
  } catch {
    throw new Error(`Base ref is not a commit: ${base}`)
  }
}

function fileHash(repo, path) {
  const absolute = safeRepoPath(repo, path, { mustExist: false })
  if (!existsSync(absolute)) return null
  if (lstatSync(absolute).isFile()) return hash(readFileSync(absolute))
  const paths = discoveredPaths(repo)
  const nested = [...paths]
    .filter(candidate => candidate.startsWith(`${path.replace(/\/$/, '')}/`))
    .sort()
  return hash(JSON.stringify(nested.map(candidate => [candidate, fileHash(repo, candidate)])))
}

export function fingerprintPaths(repo, paths) {
  return hash(JSON.stringify([...new Set(paths)].sort().map(path => [path, fileHash(repo, path)])))
}

export function changedPaths(repo = ROOT, base = 'HEAD') {
  const baseCommit = validateBase(repo, base)
  const records = [
    ...parseNameStatus(
      git(repo, ['diff', '--name-status', '-z', '--find-renames', `${baseCommit}..HEAD`, '--']),
      'branch'
    ),
    ...parseNameStatus(
      git(repo, ['diff', '--cached', '--name-status', '-z', '--find-renames', '--']),
      'staged'
    ),
    ...parseNameStatus(
      git(repo, ['diff', '--name-status', '-z', '--find-renames', '--']),
      'unstaged'
    ),
    ...nulList(git(repo, ['ls-files', '--others', '--exclude-standard', '-z'])).map(path => ({
      path,
      status: 'A',
      endpoint: 'path',
      source: 'untracked',
    })),
  ]
  for (const record of records) {
    safeRepoPath(repo, record.path, {
      mustExist: record.endpoint !== 'from' && !record.status.startsWith('D'),
    })
    record.hash = fileHash(repo, record.path)
    const args =
      record.source === 'branch'
        ? ['diff', '--binary', `${baseCommit}..HEAD`, '--', record.path]
        : record.source === 'staged'
          ? ['diff', '--cached', '--binary', '--', record.path]
          : record.source === 'unstaged'
            ? ['diff', '--binary', '--', record.path]
            : null
    record.changeHash = args ? hash(git(repo, args)) : record.hash
  }
  const seen = new Set()
  return {
    baseCommit,
    records: records.filter(record => {
      const key = `${record.source}\0${record.status}\0${record.endpoint}\0${record.path}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }),
  }
}

function pathMatches(path, rule) {
  const clean = rule.replace(/\/$/, '')
  return path === clean || path.startsWith(`${clean}/`)
}

function commandMatches(actual, check) {
  const expected = [check.executable, ...check.args]
  return (
    actual.length === expected.length &&
    expected.every((value, index) =>
      value.startsWith('$') ? Boolean(actual[index]?.trim()) : actual[index] === value
    )
  )
}

function workflowPath(path) {
  return [
    'AGENTS.md',
    'package.json',
    '.codex',
    '.agents/skills/populous-engineering',
    'engineering',
    'scripts/orchestration',
    'tests/orchestration.test.mjs',
    'tests/delivery-clock.test.mjs',
  ].some(rule => pathMatches(path, rule))
}

function readiness(check) {
  const missingEnv = check.env.filter(name => !process.env[name])
  if (missingEnv.length)
    return { status: 'blocked', reason: `missing environment: ${missingEnv.join(', ')}` }
  if (['browser', 'performance'].includes(check.kind))
    return {
      status: 'not-run',
      reason:
        'requires an inspected running server/browser setup; planning does not probe or execute it',
    }
  return { status: 'not-run', reason: 'selected only; planning never executes checks' }
}

export function planChanges(repo = ROOT, { base = 'HEAD' } = {}) {
  const { checks, project } = validateRepository(repo)
  const changes = changedPaths(repo, base)
  const selected = new Map()
  const affected = new Set()
  const unknown = new Set()
  const addCheck = (id, reason) => {
    const reasons = selected.get(id) ?? new Set()
    reasons.add(reason)
    selected.set(id, reasons)
  }
  for (const change of changes.records) {
    const matched = new Set()
    if (workflowPath(change.path)) {
      matched.add('workflow')
      addCheck('orchestration-tests', `workflow path changed: ${change.path}`)
      addCheck('orchestration-structural', `workflow path changed: ${change.path}`)
      addCheck('repository-check', `workflow integration changed: ${change.path}`)
      if (change.path === 'package.json') addCheck('production-build', 'package scripts changed')
    }
    for (const subsystem of project.subsystems) {
      const paths = [
        ...subsystem.implementationPaths,
        ...(subsystem.researchPaths ?? []),
        ...subsystem.sharedPaths,
      ]
      if (!paths.some(path => pathMatches(change.path, path))) continue
      matched.add(subsystem.id)
      affected.add(subsystem.id)
      for (const id of subsystem.checkIds)
        addCheck(id, `${subsystem.id} path changed: ${change.path}`)
    }
    for (const shared of project.crossCutting) {
      if (!pathMatches(change.path, shared.path)) continue
      matched.add('cross-cutting')
      for (const subsystem of shared.subsystemIds) affected.add(subsystem)
      for (const id of shared.checkIds) addCheck(id, `cross-cutting path changed: ${change.path}`)
    }
    if (change.path.startsWith('app/')) {
      addCheck('repository-check', `application source changed: ${change.path}`)
      addCheck('production-build', `application source changed: ${change.path}`)
    }
    if (!matched.size) {
      unknown.add(change.path)
      addCheck(
        'repository-check',
        `unmapped path requires conservative general validation: ${change.path}`
      )
    }
  }
  const checkById = new Map(checks.checks.map(check => [check.id, check]))
  return {
    version: 1,
    base: changes.baseCommit,
    head: git(repo, ['rev-parse', 'HEAD']).trim(),
    changes: changes.records,
    affectedSubsystems: [...affected].sort(),
    unknownPaths: [...unknown].sort(),
    checks: [...selected]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([id, reasons]) => {
        const check = checkById.get(id)
        return {
          id,
          kind: check.kind,
          command: [check.executable, ...check.args],
          reasons: [...reasons].sort(),
          knownLimits: check.knownLimits,
          prerequisites: check.prerequisites,
          sideEffects: check.sideEffects,
          resources: check.resources,
          ...readiness(check),
        }
      }),
    executesChecks: false,
  }
}

function validatePathRules(repo, values, label) {
  return array(values, label).map(path => {
    safeRepoPath(repo, path, { mustExist: false })
    return path
  })
}

// ponytail: only these two reviewed npm inclusions; extend after measured overlap.
export function repositoryCheckCoverage(repo, manifests = validateRepository(repo)) {
  const checks = new Map(manifests.checks.checks.map(check => [check.id, check]))
  const matches = (id, command) => {
    const check = checks.get(id)
    return check?.automation === 'safe' && check.cwd === '.' && !check.env.length &&
      check.expected.exitCode === 0 && !check.expected.artifacts.length &&
      JSON.stringify([check.executable, ...check.args]) === JSON.stringify(command)
  }
  const { scripts = {} } = readJson(repo, 'package.json')
  if (!matches('repository-check', ['npm', 'run', 'check']) ||
      scripts.check !== 'npm run typecheck && npm test && npm run parity:check && npm run orchestration:check') return []
  return [
    ...(scripts.test === 'node --test tests/*.test.mjs' &&
      matches('orchestration-tests', ['node', '--test', 'tests/orchestration.test.mjs', 'tests/delivery-clock.test.mjs'])
      ? ['orchestration-tests'] : []),
    ...(scripts['orchestration:check'] === 'node scripts/orchestration/cli.mjs check' &&
      matches('orchestration-structural', ['node', 'scripts/orchestration/cli.mjs', 'check'])
      ? ['orchestration-structural'] : []),
  ]
}

export function validateContract(repo, contract, manifests = validateRepository(repo)) {
  assert(contract.version === 1, 'Unsupported contract version')
  const identity = object(contract.identity, 'identity')
  assert(ID.test(string(identity.taskId, 'identity.taskId')), `Invalid task id: ${identity.taskId}`)
  validateBase(repo, identity.baseCommit)
  for (const entry of array(identity.baseline, 'identity.baseline')) {
    safeRepoPath(repo, entry.path, { mustExist: false })
    string(entry.status, `baseline status for ${entry.path}`)
    assert(
      ['branch', 'staged', 'unstaged', 'untracked'].includes(entry.source),
      `Invalid baseline source: ${entry.path}`
    )
    assert(
      ['from', 'to', 'path'].includes(entry.endpoint),
      `Invalid baseline endpoint: ${entry.path}`
    )
    assert(
      entry.hash === null || /^[0-9a-f]{64}$/.test(entry.hash),
      `Invalid baseline hash: ${entry.path}`
    )
    assert(
      entry.changeHash === null || /^[0-9a-f]{64}$/.test(entry.changeHash),
      `Invalid baseline change hash: ${entry.path}`
    )
  }
  for (const [path, expected] of Object.entries(
    object(identity.inputFingerprints, 'identity.inputFingerprints')
  )) {
    safeRepoPath(repo, path)
    assert(/^[0-9a-f]{64}$/.test(expected), `Invalid input fingerprint: ${path}`)
  }
  const intent = object(contract.intent, 'intent')
  string(intent.objective, 'intent.objective')
  array(intent.nonGoals, 'intent.nonGoals')
  array(intent.acceptance, 'intent.acceptance', { nonempty: true })
  assert(
    ['low', 'medium', 'high'].includes(intent.risk),
    'intent.risk must be low, medium, or high'
  )
  const scope = object(contract.scope, 'scope')
  for (const id of array(scope.subsystemIds, 'scope.subsystemIds', { nonempty: true }))
    assert(manifests.subsystemIds.has(id), `Unknown contract subsystem: ${id}`)
  const parity = parityEntries(manifests.ledger)
  for (const id of array(scope.parityIds, 'scope.parityIds'))
    assert(parity.has(id), `Unknown contract parity ID: ${id}`)
  array(scope.boundaries, 'scope.boundaries', { nonempty: true })
  const ownership = object(contract.ownership, 'ownership')
  string(ownership.implementationOwner, 'ownership.implementationOwner')
  validatePathRules(repo, ownership.allowedPaths, 'ownership.allowedPaths')
  validatePathRules(repo, ownership.prohibitedPaths, 'ownership.prohibitedPaths')
  validatePathRules(repo, ownership.generatedPaths, 'ownership.generatedPaths')
  const research = object(contract.research, 'research')
  array(research.nativeQuestions, 'research.nativeQuestions')
  for (const reference of array(research.evidence, 'research.evidence')) {
    string(reference, 'research evidence reference')
    const [path, ...headingParts] = reference.split('#')
    const heading = headingParts.join('#')
    safeRepoPath(repo, path)
    if (heading) {
      assert(extname(path) === '.md', `Evidence heading requires Markdown: ${reference}`)
      assert(
        headingExists(repo, { path, heading }, { exact: true }),
        `Unknown evidence heading: ${reference}`
      )
    }
  }
  array(research.assumptions, 'research.assumptions')
  const modernization = object(contract.modernization, 'modernization')
  array(modernization.risks, 'modernization.risks')
  array(modernization.measurementNeeds, 'modernization.measurementNeeds')
  array(modernization.corrections, 'modernization.corrections')
  if (modernization.workloadEvidence !== undefined) {
    const reference = string(modernization.workloadEvidence, 'modernization.workloadEvidence')
    const [path, ...headingParts] = reference.split('#')
    const heading = headingParts.join('#')
    assert(
      path === 'references/modern-performance.md' &&
        heading &&
        PERFORMANCE_WORKLOAD_HEADING.test(heading.replaceAll('-', ' ')) &&
        headingAnchor(heading) !== headingAnchor('Measurement rules'),
      'modernization.workloadEvidence must cite a distinct workload or measurement heading'
    )
    assert(
      research.evidence.includes(reference),
      'Workload evidence must also appear in research.evidence'
    )
  }
  const verification = object(contract.verification, 'verification')
  for (const id of array(verification.requiredCheckIds, 'verification.requiredCheckIds', {
    nonempty: true,
  }))
    assert(manifests.checkIds.has(id), `Unknown contract check: ${id}`)
  array(verification.rationale, 'verification.rationale', { nonempty: true })
  validatePathRules(repo, verification.artifacts, 'verification.artifacts')
  const coverage = array(verification.coverage ?? [], 'verification.coverage')
  const coveredIds = new Set()
  const supported = coverage.length ? repositoryCheckCoverage(repo, manifests) : []
  for (const { checkId, coveredBy } of coverage) {
    assert(coveredBy === 'repository-check' && supported.includes(checkId), `Unsupported check coverage: ${checkId}`)
    assert(verification.requiredCheckIds.includes(coveredBy), `Missing aggregate check: ${coveredBy}`)
    assert(!verification.requiredCheckIds.includes(checkId) && !coveredIds.has(checkId), `Duplicate covered check: ${checkId}`)
    coveredIds.add(checkId)
  }
  for (const result of array(verification.results, 'verification.results')) {
    assert(
      manifests.checkIds.has(result.checkId),
      `Unknown verification result check: ${result.checkId}`
    )
    assert(RESULT_STATES.has(result.status), `Invalid verification status: ${result.status}`)
    const check = manifests.checks.checks.find(item => item.id === result.checkId)
    const command = array(result.command, `${result.checkId} command`, { nonempty: true }).map(
      (value, index) => string(value, `${result.checkId} command[${index}]`)
    )
    assert(commandMatches(command, check), `Command does not match check: ${result.checkId}`)
    const inputPaths = array(result.inputPaths, `${result.checkId} inputPaths`, {
      nonempty: true,
    })
    inputPaths.forEach(path => safeRepoPath(repo, path))
    const resultCoverage = coverage.filter(item => item.coveredBy === result.checkId)
    const coveredInputs = resultCoverage
      .flatMap(item => manifests.checks.checks.find(entry => entry.id === item.checkId).inputs)
    if (resultCoverage.length) coveredInputs.push('package.json', 'engineering/checks.json')
    if (resultCoverage.length || result.coveredCheckIds !== undefined)
      assert.deepEqual(result.coveredCheckIds, result.status === 'passed'
        ? resultCoverage.map(item => item.checkId) : [], `Invalid covered check receipt: ${result.checkId}`)
    for (const input of [...check.inputs, ...coveredInputs])
      assert(
        inputPaths.some(path => pathMatches(input, path)),
        `Fingerprint inputs omit declared check input: ${result.checkId}#${input}`
      )
    array(result.artifacts, `${result.checkId} artifacts`).forEach(path =>
      safeRepoPath(repo, path, { mustExist: false })
    )
    assert(
      /^[0-9a-f]{64}$/.test(result.testedFingerprint),
      `Verification result needs fingerprint: ${result.checkId}`
    )
    if (result.status === 'passed') {
      assert(
        result.exitCode === check.expected.exitCode,
        `Passed result must have expected exitCode ${check.expected.exitCode}: ${result.checkId}`
      )
      for (const artifact of check.expected.artifacts) {
        assert(
          result.artifacts.includes(artifact),
          `Passed result omits artifact: ${result.checkId}#${artifact}`
        )
        safeRepoPath(repo, artifact)
      }
    } else {
      string(result.reason, `Non-passing result reason: ${result.checkId}`)
      if (result.status === 'failed')
        assert(Number.isInteger(result.exitCode), `Failed result needs exitCode: ${result.checkId}`)
    }
  }
  const completion = object(contract.completion, 'completion')
  string(completion.requiredReview, 'completion.requiredReview')
  array(completion.permittedBookkeeping, 'completion.permittedBookkeeping')
  array(completion.stoppingConditions, 'completion.stoppingConditions', { nonempty: true })
  return contract
}

function generatedOwnerFor(path, generated) {
  return generated.owners.flatMap(owner =>
    owner.outputs
      .filter(output => pathMatches(path, output.path))
      .map(output => ({ owner: owner.id, ...output }))
  )
}

export function auditContract(repo = ROOT, contract) {
  const manifests = validateRepository(repo)
  validateContract(repo, contract, manifests)
  const current = changedPaths(repo, contract.identity.baseCommit)
  const baselineKeys = new Set(
    contract.identity.baseline.map(
      entry =>
        `${entry.path}\0${entry.status}\0${entry.endpoint}\0${entry.source}\0${entry.hash}\0${entry.changeHash}`
    )
  )
  const preExisting = []
  const taskChanges = []
  const matchedBaseline = new Set()
  for (const record of current.records) {
    const key = `${record.path}\0${record.status}\0${record.endpoint}\0${record.source}\0${record.hash}\0${record.changeHash}`
    if (baselineKeys.has(key)) {
      matchedBaseline.add(key)
      preExisting.push(record)
    } else taskChanges.push(record)
  }
  const missingBaseline = contract.identity.baseline.filter(entry => {
    const key = `${entry.path}\0${entry.status}\0${entry.endpoint}\0${entry.source}\0${entry.hash}\0${entry.changeHash}`
    return !matchedBaseline.has(key)
  })
  const violations = missingBaseline.map(entry => ({
    type: 'baseline-entry-missing',
    path: entry.path,
    source: entry.source,
  }))
  for (const checkId of contract.verification.requiredCheckIds) {
    const count = contract.verification.results.filter(result => result.checkId === checkId).length
    if (count !== 1)
      violations.push({
        type: count ? 'duplicate-check-result' : 'missing-check-result',
        checkId,
        count,
      })
  }
  for (const change of taskChanges) {
    const allowed = contract.ownership.allowedPaths.some(rule => pathMatches(change.path, rule))
    if (!allowed)
      violations.push({ type: 'outside-allowed-paths', path: change.path, source: change.source })
    if (contract.ownership.prohibitedPaths.some(rule => pathMatches(change.path, rule)))
      violations.push({ type: 'prohibited-path', path: change.path, source: change.source })
    for (const generated of generatedOwnerFor(change.path, manifests.generated))
      if (
        generated.protected &&
        !contract.ownership.generatedPaths.some(rule => pathMatches(change.path, rule))
      )
        violations.push({
          type: 'protected-generated-output',
          path: change.path,
          owner: generated.owner,
        })
  }
  const changedInputs = []
  for (const [path, expected] of Object.entries(contract.identity.inputFingerprints)) {
    const actual = fileHash(repo, path)
    if (actual !== expected) changedInputs.push({ path, expected, actual })
  }
  const invalidatedResults = []
  for (const result of contract.verification.results) {
    const actual = fingerprintPaths(repo, result.inputPaths)
    if (actual !== result.testedFingerprint)
      invalidatedResults.push({
        checkId: result.checkId,
        expected: result.testedFingerprint,
        actual,
        inputPaths: result.inputPaths,
      })
  }
  return {
    version: 1,
    taskId: contract.identity.taskId,
    base: current.baseCommit,
    preExisting,
    missingBaseline,
    taskChanges,
    violations,
    changedInputs,
    invalidatedResults,
    status:
      violations.length || changedInputs.length || invalidatedResults.length ? 'failed' : 'passed',
    note: 'Audit reports workflow agreement violations; it does not enforce an operating-system sandbox or rewrite files.',
  }
}

export function parseOptions(args) {
  const options = {}
  for (let index = 0; index < args.length; index++) {
    const flag = args[index]
    assert(flag.startsWith('--'), `Unexpected argument: ${flag}`)
    const key = flag.slice(2)
    assert(!Object.hasOwn(options, key), `Duplicate option: ${flag}`)
    const value = args[++index]
    assert(value !== undefined && !value.startsWith('--'), `Missing value for ${flag}`)
    options[key] = value
  }
  return options
}

export function main(argv = process.argv.slice(2), repo = ROOT) {
  const [command = 'check', ...rest] = argv
  const options = parseOptions(rest)
  if (command === 'check') {
    assert(!Object.keys(options).length, 'check accepts no options')
    const result = validateRepository(repo)
    const mapped = new Set(
      result.project.subsystems.flatMap(item => [
        ...item.implementationPaths,
        ...(item.researchPaths ?? []),
        ...item.sharedPaths,
      ])
    )
    const sourceFiles = nulList(git(repo, ['ls-files', '-z', 'app']))
    const unmapped = sourceFiles.filter(path => ![...mapped].some(rule => pathMatches(path, rule)))
    return {
      status: 'passed',
      checks: result.checkIds.size,
      subsystems: result.subsystemIds.size,
      generatedOwners: result.generatedIds.size,
      unmappedSourceCount: unmapped.length,
      unmappedSources: unmapped,
      cacheRequired: false,
    }
  }
  if (command === 'index') {
    assert(!Object.keys(options).length, 'index accepts no options')
    const { index, cache } = loadOrBuildIndex(repo)
    return {
      status: 'passed',
      cache,
      version: index.version,
      sources: index.sources.length,
      path: 'work/orchestration/index.json',
    }
  }
  if (command === 'context') {
    assert(options.subsystem, 'context requires --subsystem')
    const budget = options.budget === undefined ? undefined : Number(options.budget)
    return contextPacket(repo, {
      subsystem: options.subsystem,
      query: options.query ?? '',
      budget,
      role: options.role ?? null,
      contract: options.contract ?? null,
    })
  }
  if (command === 'plan') {
    assert(options.base, 'plan requires --base')
    return planChanges(repo, { base: options.base })
  }
  if (command === 'audit') {
    assert(options.contract, 'audit requires --contract')
    const path = safeRepoPath(repo, options.contract)
    return auditContract(repo, JSON.parse(readFileSync(path, 'utf8')))
  }
  throw new Error(`Unknown orchestration command: ${command}`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    console.log(JSON.stringify(main(), null, 2))
  } catch (error) {
    console.error(`orchestration: ${error.message}`)
    process.exitCode = 1
  }
}
