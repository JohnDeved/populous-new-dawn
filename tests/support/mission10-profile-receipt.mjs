import { encodeMission10Query, decodeMission10Query, mission10ExpectedSelection, mission10Controls, mission10Modifiers, mission10OwnedIds } from '../../scripts/local-render/mission10-selection.mjs'
// Synthetic evidence for validator tests only, never rendered acceptance.
export function mission10QueryFixture(occupied) {
  return { point: [256, 256], nearby: false, boat: [occupied ? 5 : 0, ...(occupied ? [63, 111, 112, 113, 114] : [0, 0, 0, 0, 0])],
    people: mission10OwnedIds.map((id, i) => [id, i === 0 ? 7 : i < 5 ? 3 : i < 9 ? 4 : 2,
      256 + (i < 5 ? i * 2 : i * 100), 256, 0, 0, occupied && i < 5 ? 62 : 0]) }
}
export function mission10ReceiptFixture(mergeSha) {
  const h = 'a'.repeat(64), party = [63, 111, 112, 113, 114]
  // version, level, turn, time, checkpoint/actors/terrain/stock SHA-256.
  const saved = [2, 10, 100, 4, h, h, h, h]
  return { status: 'passed', sourceCommit: mergeSha, sourceFingerprint: h, runtimeSha256: h, reportSha256: h,
    artifacts: { path: 'mission10-artifacts.json', bytes: 4000, sha256: h },
    phases: ['created', 'reused'].map((mode, index) => ({
      mode, status: 'passed',
      binding: [0, 'identical', true, '11111111-1111-1111-1111-111111111111',
        index ? '33333333-3333-3333-3333-333333333333' : '22222222-2222-2222-2222-222222222222',
        index ? '22222222-2222-2222-2222-222222222222' : null, true, true],
      receiptName: `mission10-${mode}--receipt.json`, resultName: `mission10-${mode}--boat-checkpoint.json`, receiptSha256: h, resultSha256: h,
      checkpointAtStart: index ? h : null, checkpointAtEnd: h, saved: index ? 0 : [...saved], loaded: index ? [...saved] : null,
      selection: (index ? ['loaded', 'unloaded'] : ['boarded']).map(phase => ({
        phase, occupied: phase !== 'unloaded', query: encodeMission10Query(mission10QueryFixture(phase !== 'unloaded')),
        occupants: party.map(id => [id, 100, phase !== 'unloaded' ? 62 : 0]),
        checks: mission10Controls.flatMap((name, control) => mission10Modifiers.map((modifier, code) => [
          control, code, [], mission10ExpectedSelection(mission10QueryFixture(phase !== 'unloaded'), name, modifier).selected, true,
        ])),
      })),
      publicActions: index ? ['public Load Game', 'ordinary Boat right-click inspection', 'public Unload all passengers']
        : ['ordinary rally click', 'ordinary Boat boarding click', 'public Save single click'],
      screenshots: (index ? ['loaded-class-selected.png', 'unloaded-class-selected.png'] : ['boarded-class-selected.png', 'saved-occupied-boat.png'])
        .map(name => ({ name: `mission10-${mode}--${name}`, sha256: h })),
    })) }
}

export function compactMission10Fixture(value) {
  const compact = structuredClone(value)
  for (const phase of compact.phases) phase.selection = 0
  return compact
}
export function mission10EvidenceFixture(value) {
  const checkpoint = tuple => tuple === null ? null : Object.fromEntries(['version', 'level', 'turn', 'time',
    'checkpointSha256', 'actorsSha256', 'terrainSha256', 'stockSha256'].map((key, index) => [key, tuple[index]]))
  return value.phases.map(p => {
    const result = { status: 'passed', source: { commit: value.sourceCommit, fingerprint: value.sourceFingerprint }, observations: [],
      saved: p.mode === 'created' ? { checkpoint: checkpoint(p.saved) } : checkpoint(value.phases[0].saved), loaded: checkpoint(p.loaded),
      selection: p.selection.map(row => ({ ...row, query: decodeMission10Query(row.query),
        occupants: row.occupants.map(([id, hp, vehicle]) => ({ id, hp, vehicle })),
        checks: row.checks.map(([name, modifier, cleared, selected, preserved]) => ({ name: mission10Controls[name], modifier: mission10Modifiers[modifier], cleared, selected, preserved,
          primary: mission10ExpectedSelection(decodeMission10Query(row.query), mission10Controls[name], mission10Modifiers[modifier]).primary })),
      })), actions: p.publicActions.map(label => ({ label, phase: 'after' })) }
    for (const row of result.selection) {
      const q = row.query
      const state = selected => ({ paused: true, turn: 100, mode: null, orderCursor: 0, selected,
        point: { x: q.point[0], y: q.point[1] }, nearby: q.nearby,
        vehicles: [{ id: 62, active: true, model: 1, passengerCount: q.boat[0], passengers: q.boat.slice(1) }],
        people: q.people.map(([id, model, x, y, priority, flags4, vehicle]) => ({ id, model, x, y, assignment: priority << 12,
          flags4, vehicle, team: 'blue', hp: row.occupants.find(p => p.id === id)?.hp ?? 100, owners: { native: null, flight: null, fight: null, entry: null, builder: null, route: null },
      ownerAliases: { native: null, flight: null, fight: null, entry: null, builder: null, route: null } })) })
      const observe = (label, selected) => ({ label, paused: true, turn: 100, selected,
        party: row.occupants, boat: { passengers: q.boat.slice(1) }, orders: {}, randomState: 19, selectionState: state(selected) })
      result.observations.push(observe(`${row.phase}-strip-paused`, []))
      for (const check of row.checks) {
        const label = `${row.phase}: ${check.name} ${check.modifier}`
        result.observations.push(observe(`${label} cleared`, []), observe(`${label} selected`, check.selected))
      }
    }
    return result
  })
}

import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { mission10ExpectedArtifacts, retainMission10Artifacts } from '../../scripts/tutorial-browser/mission10-artifacts.mjs'
export function writeMission10Fixture(output, receipt, customize = () => {}) {
  const value = mission10ReceiptFixture(receipt.source.commit), json = value => JSON.stringify(value, null, 2) + '\n'
  customize(value)
  const hash = file => createHash('sha256').update(readFileSync(file)).digest('hex')
  const runtime = { browserSha256: receipt.browserSha256, browserVersion: receipt.browserVersion, node: receipt.node,
    launch: receipt.launch, packages: receipt.buildPackageVersions }
  const runtimeSha256 = createHash('sha256').update(JSON.stringify(runtime)).digest('hex')
  const report = { status: 'passed', sourceCommit: value.sourceCommit, sourceFingerprint: value.sourceFingerprint, runtimeSha256,
    phases: value.phases.map(p => {
      const [, sourceAfter, , profileId, runId, previousRunId, cleanupVerified, continuationVerified] = p.binding
      const { sourceCommit, sourceFingerprint } = value
      const dir = `mission10-${p.mode}`; mkdirSync(resolve(output, dir))
      const result = mission10EvidenceFixture(value)[p.mode === 'created' ? 0 : 1]
      const phase = { status: p.status, source: { commit: sourceCommit, fingerprint: sourceFingerprint },
        runtime, runtimeSha256, errors: [], sourceAfter, cleanupVerified,
        profile: { id: profileId, runId, previousRun: previousRunId && { runId: previousRunId },
          cleanupVerified, continuationVerified, checkpointAtStart: p.checkpointAtStart && { checkpointSha256: p.checkpointAtStart },
          checkpointAtEnd: { checkpointSha256: p.checkpointAtEnd } }, result }
      writeFileSync(resolve(output, dir, 'receipt.json'), json(phase))
      writeFileSync(resolve(output, dir, 'boat-checkpoint.json'), json(result))
      for (const name of mission10ExpectedArtifacts[p.mode].filter(name => name.endsWith('.png')))
        writeFileSync(resolve(output, dir, name), 'synthetic pixel bytes')
      return { mode: p.mode, receipt: `mission10-${p.mode}--receipt.json`, sourceReceipt: `${dir}/receipt.json`, receiptSha256: hash(resolve(output, dir, 'receipt.json')) }
    }) }
  writeFileSync(resolve(output, 'mission10-profile.json'), json(report))
  retainMission10Artifacts(output, report)
  return report
}
