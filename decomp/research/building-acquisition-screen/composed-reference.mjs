// Finite source-only reference. Canonical EXE/FACS/PNTS are read as DATA only.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  createWorshipAcquisitionState, startWorshipAcquisition, stepWorshipAcquisition,
} from '../../../app/worship-acquisition.ts'
import { loadInputs, initializeBuilding, buildingVisit, sha } from './composed-geometry.mjs'

const [canonicalRoot, dataRoot] = process.argv.slice(2)
if (!canonicalRoot || !dataRoot) throw Error('Usage: node composed-reference.mjs CANONICAL_ROOT DATA_ROOT')
const data = loadInputs(canonicalRoot, dataRoot)
const fixture = JSON.parse(readFileSync(new URL('../../../tests/fixtures/worship-acquisition-controller.json', import.meta.url)))
const checksum = value => sha(JSON.stringify(value))
const makeRandom = seed => ({ seed, next() {
  const n = (Math.imul(this.seed, 0x24a1) + 0x24df) >>> 0
  return this.seed = ((n >>> 13) | (n << 19)) >>> 0
} })
const geometry = (target, origin = [420, 180]) => ({
  viewport: { x: 100, y: 0, width: 540, height: 480 },
  origin: { x: origin[0], y: origin[1] }, target: { x: target[0], y: target[1] },
  targetRect: { x: target[0] - 23, y: target[1] - 26, width: 46, height: 52 },
  targetHud: { x: target[0], y: target[1] }, hudScale: 1,
})
function particleHash(particles) {
  const bytes = Buffer.alloc(200 * 18)
  particles.forEach((p, i) => {
    for (const [j, key] of ['x', 'y', 'speed', 'angle', 'turn', 'life'].entries()) bytes.writeInt16LE(p[key], i * 18 + j * 2)
    bytes.writeUInt16LE(p.baseFrame, i * 18 + 12)
    bytes.writeUInt8(p.frame, i * 18 + 14); bytes.writeUInt8(p.frameCount, i * 18 + 15)
    bytes.writeInt8(p.palette, i * 18 + 16)
  })
  return sha(bytes)
}

// Reuse accepted source, not a second speculative companion port. Check it against
// the retained executed-original companion vectors before building composition.
const companionChecks = []
for (const sample of fixture.presentation.filter(c => !c.combined)) {
  const state = createWorshipAcquisitionState(), rng = makeRandom(sample.seed)
  startWorshipAcquisition(state, { giftId: 900, model: 12, geometry: geometry([48, 364]) })
  state.spell = null
  for (const [index, expected] of sample.rows.entries()) {
    stepWorshipAcquisition(state, { paused: expected.paused, random: () => rng.next() })
    const c = state.companion
    const actual = {
      companionActive: Number(c.active), companionStep: c.step, companionVisits: c.visits,
      companionNext: Number(c.next), activeParticles: c.particles.filter(p => p.baseFrame).length,
      particlesSha256: particleHash(c.particles), cosmeticRng: rng.seed,
    }
    assert.deepEqual(actual, Object.fromEntries(Object.keys(actual).map(key => [key, expected.state[key]])), `${sample.name}:${index + 1}`)
    const commands = state.drawCommands.map(d => ['sprite', d.frame, d.x, d.y, d.palette, d.rgb, d.flags])
    assert.equal(commands.length, expected.commandCount)
    assert.equal(checksum(commands), expected.commandsSha256)
  }
  companionChecks.push({ name: sample.name, visits: sample.rows.length, status: 'passed' })
}

function startBuilding(state, model, giftId, rng, origin) {
  const target = model === 103 ? [25, 286] : [71, 286]
  const retainedSpell = state.spell, retainedPulse = state.pulse
  state.building = initializeBuilding(model, giftId, origin, target, () => rng.next(), data)
  const temporary = createWorshipAcquisitionState()
  // The model12 value is the reused browser draw-binding tag only. The original
  // companion has no spell-model-dependent branch; geometry supplies its origin.
  startWorshipAcquisition(temporary, { giftId, model: 12, geometry: geometry(target, origin) })
  state.companion = temporary.companion
  assert.equal(state.spell, retainedSpell); assert.equal(state.pulse, retainedPulse)
}
function startSpell(state, rng, origin = [250, 300]) {
  const retainedBuilding = state.building, retainedPulse = state.pulse
  startWorshipAcquisition(state, { giftId: 950, model: 3, geometry: geometry([80, 364], origin) })
  assert.equal(state.building, retainedBuilding); assert.equal(state.pulse, retainedPulse)
}
function visit(state, rng, paused) {
  // Public accepted helper calls are isolated into their actual scheduler stages:
  // first pulse+companion, then building, then spell (without a second pulse visit).
  const first = { spell: null, companion: state.companion, pulse: state.pulse, drawCommands: [] }
  stepWorshipAcquisition(first, { paused, random: () => rng.next() })
  state.companion = first.companion; state.pulse = first.pulse
  const building = buildingVisit(state.building, data, paused)
  if (building?.pulse) state.pulse = {
    active: true, frame: 0, remaining: building.pulse, model: 12,
    geometry: geometry(state.building.target, [state.building.x, state.building.y]),
  }
  const last = { spell: state.spell, companion: null, pulse: null, drawCommands: [] }
  const spell = stepWorshipAcquisition(last, { paused, random: () => { throw Error('Spell must not consume cosmetic RNG') } })
  state.spell = last.spell
  if (last.pulse) state.pulse = last.pulse
  return { building, arrivals: spell.arrivals, commands: [...first.drawCommands, ...last.drawCommands],
    limiter: !!(state.companion?.active || state.building?.active || state.spell?.active) }
}

const cases = []
const inputs = []
for (const model of [103, 95]) {
  for (const seed of [1, 0x12345678]) for (const visible of [true, false])
    inputs.push({ name: `${model}-seed${seed}-${visible ? 'visible' : 'fallback'}`, model, seed, origin: visible ? [420, 180] : [370, 240] })
  for (const pause of ['initial', 'whole', 'flight']) inputs.push({ name: `${model}-pause-${pause}`, model, seed: 1, pause })
  for (const at of [10, 95]) inputs.push({ name: `${model}-building-replaced-${at}`, model, seed: 1, replacement: { at, kind: 'building' } })
  for (const at of [10, 95]) inputs.push({ name: `${model}-spell-overlap-${at}`, model, seed: 1, replacement: { at, kind: 'spell' } })
}
inputs.push({ name: 'active-spell-then-building', model: 95, seed: 1, initialSpell: true })

for (const config of inputs) {
  const rng = makeRandom(config.seed), state = { ...createWorshipAcquisitionState(), building: null }
  const origin = config.origin ?? [420, 180]
  let birthVisit = config.initialSpell ? 10 : 0, retiredAt = null
  if (config.initialSpell) startSpell(state, rng, origin)
  else startBuilding(state, config.model, 900, rng, origin)
  const rows = [], transitions = [], selection = [], replacement = [], timers = { buildings: { 900: 76 }, spell: 76 }
  let initialRng = rng.seed, previousPhase = 0, pauseRemaining = config.pause === 'initial' ? 3 : 0, pauseUsed = config.pause === 'initial'
  for (let ui = 1; ui <= 320; ui++) {
    if (config.initialSpell && ui === 10) {
      const spellIdentity = state.spell
      startBuilding(state, config.model, 900, rng, origin)
      assert.equal(state.spell, spellIdentity)
      initialRng = rng.seed
    }
    if (config.replacement?.at === ui) {
      const before = { building: state.building, spell: state.spell, pulse: state.pulse, companion: state.companion }
      if (config.replacement.kind === 'building') {
        startBuilding(state, config.model === 103 ? 95 : 103, 902, rng, origin)
        timers.buildings[902] = 76
        birthVisit = ui; previousPhase = 0; selection.length = 0
        assert.notEqual(state.building, before.building); assert.equal(state.spell, before.spell)
      } else { startSpell(state, rng); assert.equal(state.building, before.building) }
      assert.notEqual(state.companion, before.companion); assert.equal(state.pulse, before.pulse)
      replacement.push({ ui, kind: config.replacement.kind, buildingKept: state.building === before.building,
        spellKept: state.spell === before.spell, pulseKept: state.pulse === before.pulse,
        companionReplaced: true, pulseRemaining: state.pulse?.remaining ?? null })
    }
    if (!pauseUsed && (config.pause === 'whole' && state.building?.phase === 3 && state.building.visits === 2 ||
      config.pause === 'flight' && state.building?.faces.some(f => f.flags & 1))) { pauseRemaining = 3; pauseUsed = true }
    const paused = pauseRemaining-- > 0
    const before = state.building && { phase: state.building.phase, visits: state.building.visits, pending: state.building.pending }
    const result = visit(state, rng, paused), c = state.building
    for (const arrival of result.arrivals) { assert.equal(arrival.giftId, 950); timers.spell = 1 }
    assert.ok(Object.values(timers.buildings).every(timer => timer === 76), 'Screen work must not shorten either ordinary building timer')
    if (paused && before && !before.pending) { assert.equal(c.visits, before.visits); assert.equal(c.phase, before.phase) }
    if (result.building?.selected?.length) selection.push(...result.building.selected)
    assert.ok((result.building?.selected?.length ?? 0) <= 4)
    if (c && c.phase !== previousPhase) { transitions.push([ui, c.phase, c.visits]); previousPhase = c.phase }
    if (c && !c.active && retiredAt === null) retiredAt = ui
    rows.push([ui, paused ? 1 : 0, c?.phase ?? 0, c?.visits ?? 0,
      result.building?.whole ? 1 : 0, result.building?.selected ?? [],
      c?.faces.filter(f => f.flags & 1).length ?? 0, c?.allStarted ? 1 : 0,
      state.companion?.active ? 1 : 0, state.pulse?.active ? state.pulse.remaining : 0,
      state.spell?.active ? 1 : 0, result.limiter ? 1 : 0, rng.seed,
      checksum(c?.faces ?? []), checksum(result.building?.submissions ?? []),
      checksum(result.commands.map(d => [d.kind, d.frame, d.x, d.y, d.palette ?? null]))])
    if (c && !result.limiter && !state.pulse?.active) break
  }
  assert.ok(retiredAt !== null && rows.length < 320, config.name)
  assert.equal(state.building.faces.filter(f => f.flags & 1).length, state.building.faces.length)
  // Repeated paused draws can mark an already-pending face again; only its
  // later consumer starts flight. Unpaused cases admit each face once.
  if (!config.pause) assert.equal(new Set(selection).size, state.building.faces.length)
  const count = state.building.faces.length
  if (!config.pause && !config.replacement && !config.initialSpell)
    assert.equal(retiredAt, config.model === 103 ? 126 : 135)
  // Independent accepted object-countdown boundary, not a whole-world simulation.
  for (let objectVisit = 7; objectVisit <= 82; objectVisit++) {
    for (const id of Object.keys(timers.buildings)) {
      timers.buildings[id]--
      assert.equal(timers.buildings[id] === 0, objectVisit === 82)
    }
  }
  cases.push({ name: config.name, model: config.model, seed: config.seed, initialPostBuildingRng: initialRng,
    birthVisit, retiredAt, tailEndsAt: rows.length, finalFaceCount: count,
    firstSelection: rows.find(row => row[5].length)?.[0],
    allStartedAt: rows.find(row => row[7])?.[0], transitions, replacement,
    selectionOrder: selection, rows,
    finalStateSha256: checksum({ state, rng: rng.seed, timers }),
    timerBoundary: 'Supplied timer76 after hide; screen unchanged; object visit82 alone reaches0' })
}

const sourcePaths = ['composed-geometry.mjs', 'composed-reference.mjs']
console.log(JSON.stringify({ status: 'passed', kind: 'finite-source-derived-building-CPU-composition',
  acceptedBase: '5a1d7c779054d9f414657081ce7f3d65cb2c3fdf', node: process.version,
  nativeExecution: false, browserExecution: false, gpuOrClippingProof: false,
  originalWorldSchedulerExecuted: false, referenceNeedsIndependentReview: true,
  companionBoundary: 'Accepted unchanged application helper checked against four retained native companion cases; no new native execution',
  inputs: data.identities,
  sources: Object.fromEntries(sourcePaths.map(path => [path, sha(readFileSync(new URL(path, import.meta.url)))])),
  reusedCompanionSourceSha256: sha(readFileSync(new URL('../../../app/worship-acquisition.ts', import.meta.url))),
  acceptedFixtureSha256: sha(readFileSync(new URL('../../../tests/fixtures/worship-acquisition-controller.json', import.meta.url))),
  rowColumns: ['ui', 'paused', 'phase', 'phaseVisits', 'whole', 'selectedFaces', 'startedFaces', 'allStarted',
    'companionActive', 'pulseRemaining', 'spellActive', 'limiterActive', 'cosmeticRng',
    'faceStateSha256', 'cpuVerticesSha256', 'companionAndSpellDrawFieldsSha256'],
  companionChecks, cases,
}))
