import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, statSync } from 'node:fs'
import { isDeepStrictEqual } from 'node:util'
import { safeRepoFile } from './review-bundle.mjs'

const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const HASH = /^[a-f0-9]{64}$/
const text = value => typeof value === 'string' && value.trim().length > 0
const strings = value => Array.isArray(value) && value.every(text) && new Set(value).size === value.length
const LIMIT = 16 * 1024 * 1024

// Reuse the portable bundle's canonical, regular-file and sensitive-path guard.
export function readResearchFile(repo, path) {
  const file = safeRepoFile(repo, path)
  assert(statSync(file).size <= LIMIT, 'Research source exceeds 16 MiB')
  return readFileSync(file)
}

function identity(value) {
  assert(value && HASH.test(value.sourceFingerprint) && text(value.query) && text(value.adapterVersion),
    'Research identity requires sourceFingerprint, exact query and adapterVersion')
  return { sourceFingerprint: value.sourceFingerprint, query: value.query, adapterVersion: value.adapterVersion }
}

function requireIdentity(actual, expected) {
  assert.deepEqual(identity(actual), identity(expected), 'Research source/query/version mismatch')
}

function sourceMap(sources) {
  assert(Array.isArray(sources) && sources.length, 'Research sources are required')
  const map = new Map()
  for (const source of sources) {
    assert(source && text(source.id) && text(source.path) && HASH.test(source.sha256), 'Invalid research source')
    assert(!map.has(source.id), 'Duplicate research source ID')
    map.set(source.id, source)
  }
  return map
}

function readSources(repo, sources) {
  const map = sourceMap(sources), files = new Map(), values = new Map()
  for (const [id, source] of map) {
    if (!files.has(source.path)) files.set(source.path, readResearchFile(repo, source.path))
    const bytes = files.get(source.path)
    assert.equal(sha(bytes), source.sha256, `Research source hash mismatch: ${id}`)
    values.set(id, bytes)
  }
  return values
}

function rawValue(pointer, sources, dossierId, field) {
  assert(pointer && text(pointer.sourceId) && sources.has(pointer.sourceId), 'Missing raw source ID')
  const context = `dossier ${JSON.stringify(dossierId)}, field ${JSON.stringify(field)}, source ${JSON.stringify(pointer.sourceId)}`
  const raw = sources.get(pointer.sourceId).toString('utf8')
  if (pointer.format === 'text') return raw
  assert(pointer.format === 'json' && Array.isArray(pointer.keys) && pointer.keys.every(text), `Invalid raw selector: ${context}`)
  const selection = `${context}, selector ${JSON.stringify(pointer.keys)}`
  let value
  try { value = JSON.parse(raw) } catch {
    throw new Error(`Invalid raw JSON: ${selection}; inspect the backing source JSON`)
  }
  for (const key of pointer.keys) {
    assert(value !== null && typeof value === 'object' && Object.hasOwn(value, key), `Missing raw selector: ${selection}; missing key ${JSON.stringify(key)}`)
    value = value[key]
  }
  return value
}

// This is a lossless navigation projection, never a native FunctionDossier or proof.
export function compactResearch(repo, packet, expected) {
  assert(packet.version === 1 && Array.isArray(packet.dossiers) && packet.dossiers.length, 'Invalid research packet')
  requireIdentity(packet.identity, expected)
  assert(!Object.hasOwn(packet, 'view') && !Object.hasOwn(packet, 'rawOmissions'), 'Reserved navigation fields already present')
  const sources = readSources(repo, packet.sources)
  const ids = new Set()
  const dossiers = packet.dossiers.map(dossier => {
    assert(text(dossier.id) && !ids.has(dossier.id), 'Missing/duplicate dossier ID')
    ids.add(dossier.id)
    assert(dossier.facts && Array.isArray(dossier.inferences) && Array.isArray(dossier.unknowns), 'Dossier conclusions are required')
    assert(dossier.raw && typeof dossier.raw === 'object' && !Array.isArray(dossier.raw), 'Dossier raw fields are required')
    assert(dossier.rawSources && isDeepStrictEqual(Object.keys(dossier.raw).sort(), Object.keys(dossier.rawSources).sort()), 'Raw fields require exact source pointers')
    for (const [name, value] of Object.entries(dossier.raw)) {
      assert(['pseudocode', 'assembly'].includes(name), 'Only pseudocode/assembly can be omitted')
      assert(isDeepStrictEqual(value, rawValue(dossier.rawSources[name], sources, dossier.id, name)), `Raw source differs from dossier: ${name}`)
    }
    const retained = { ...dossier }
    delete retained.raw
    return retained
  })
  return { ...packet, view: 'hash-linked-navigation', dossiers,
    rawOmissions: 'Raw fields omitted. Retrieve and inspect original bytes before judging instruction semantics. This view is not exhaustive proof.' }
}

export function retrieveResearch(repo, view, expected, dossierId, field) {
  assert(view.version === 1 && view.view === 'hash-linked-navigation', 'Not a research navigation view')
  requireIdentity(view.identity, expected)
  const dossier = view.dossiers.find(item => item.id === dossierId)
  assert(dossier && Object.hasOwn(dossier.rawSources, field), 'Unknown dossier/raw field')
  // Verify every declared backing source, not just the selected excerpt.
  return rawValue(dossier.rawSources[field], readSources(repo, view.sources), dossierId, field)
}

export function claimContractSha256(claim) {
  assert(claim && text(claim.id) && text(claim.authority) && strings(claim.dimensions) && claim.dimensions.length &&
    strings(claim.requiredClaims) && strings(claim.sourceIds) && claim.sourceIds.length && Number.isSafeInteger(claim.maxAgeMs) && claim.maxAgeMs >= 0, 'Invalid research claim contract')
  return sha(JSON.stringify({ id: claim.id, authority: claim.authority, dimensions: [...claim.dimensions].sort(),
    requiredClaims: [...claim.requiredClaims].sort(), sourceIds: [...claim.sourceIds].sort(), maxAgeMs: claim.maxAgeMs }))
}

// Authors review mappings; a hash is integrity, not independent evidence authority.
export function evaluateResearchClaims(repo, packet, expected, now = Date.now()) {
  assert(packet.version === 1 && Array.isArray(packet.claims) && packet.claims.length &&
    Array.isArray(packet.results) && strings(packet.requiredClaims) && packet.requiredClaims.length, 'Invalid claim packet')
  assert(Number.isSafeInteger(now), 'Invalid evaluation time')
  requireIdentity(packet.identity, expected)
  const sources = readSources(repo, packet.sources)
  const claims = new Map()
  for (const claim of packet.claims) {
    claimContractSha256(claim)
    assert(!claims.has(claim.id), 'Duplicate claim ID')
    claims.set(claim.id, claim)
  }
  const results = new Map()
  for (const result of packet.results) {
    assert(result && claims.has(result.claimId) && Number.isSafeInteger(result.observedAtMs), 'Invalid claim result/time')
    assert(['passed', 'failed', 'unknown', 'blocked', 'not-run'].includes(result.status), 'Invalid claim result status')
    const group = results.get(result.claimId) ?? []
    group.push(result)
    results.set(result.claimId, group)
  }
  const required = new Set(packet.requiredClaims)
  // Dependencies must be actual claims, not merely inventoried callback names.
  for (const id of required) for (const dependency of claims.get(id)?.requiredClaims ?? []) required.add(dependency)
  const checks = [...required].map(id => {
    const claim = claims.get(id)
    let reason = null
    if (!claim) return { id, status: 'failed', reason: 'required-claim-missing' }
    const attempts = results.get(id) ?? []
    const latest = Math.max(...attempts.map(result => result.observedAtMs))
    const tied = attempts.filter(result => result.observedAtMs === latest)
    if (!tied.length) reason = 'result-missing'
    // Every latest tied attempt must pass all checks: failure/unknown/stale cannot hide behind a pass.
    for (const result of tied) {
      if (result.status !== 'passed') { reason = `result-${result.status}`; break }
      if (result.observedAtMs > now || now - result.observedAtMs > claim.maxAgeMs) { reason = 'result-stale-or-future'; break }
      try { requireIdentity(result.identity, expected) } catch { reason = 'result-identity-mismatch'; break }
      if (result.contractSha256 !== claimContractSha256(claim) || result.authority !== claim.authority ||
        !strings(result.dimensions) || !claim.dimensions.every(value => result.dimensions.includes(value))) {
        reason = 'result-contract-incompatible'; break
      }
      if (!strings(result.sourceIds) || !result.sourceIds.length || result.sourceIds.some(id => !sources.has(id)) || !claim.sourceIds.every(id => result.sourceIds.includes(id))) {
        reason = 'result-source-missing'; break
      }
      if (!result.sourceSha256s || result.sourceIds.some(id => result.sourceSha256s[id] !== sha(sources.get(id)))) {
        reason = 'result-source-mismatch'; break
      }
    }
    return { id, status: reason ? 'failed' : 'passed', reason }
  })
  return { version: 1, status: checks.every(check => check.status === 'passed') ? 'passed' : 'failed',
    identity: identity(expected), checks,
    limits: 'Only the reviewed finite claim mapping is checked. No native, pixel, gameplay or parity credit is inferred.' }
}
