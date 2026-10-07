import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { random } from '../app/native-math.ts'
import {
  createWorshipAcquisitionState,
  getWorshipAcquisitionDrawCommands,
  startWorshipAcquisition,
  stepWorshipAcquisition,
} from '../app/worship-acquisition.ts'

// Reduced from the accepted, immutable probe-result.json files identified by
// their SHA256s in this fixture. Commands retain all meaningful raster arguments;
// native texture-context/bank pointers are deliberately outside the browser API.
const fixture = JSON.parse(readFileSync(new URL('./fixtures/worship-acquisition-controller.json', import.meta.url)))
const sha256 = value => createHash('sha256').update(value).digest('hex')
const geometry = (model = 12, visible = true, origin) => {
  const [x, y, right, bottom] = fixture.panelRects[model]
  const target = { x: x + Math.trunc((right - x) / 2), y: y + Math.trunc((bottom - y) / 2) }
  return {
    viewport: { x: 100, y: 0, width: 540, height: 480 },
    origin: origin ?? (visible ? { x: 420, y: 180 } : { x: 370, y: 240 }),
    target,
    targetRect: { x, y, width: right - x, height: bottom - y },
    targetHud: { ...target },
    hudScale: 1,
  }
}

function particleBytes(particles) {
  const bytes = Buffer.alloc(200 * 18)
  particles.forEach((p, i) => {
    for (const [j, field] of ['x', 'y', 'speed', 'angle', 'turn', 'life'].entries()) {
      bytes.writeInt16LE(p[field], i * 18 + j * 2)
    }
    bytes.writeUInt16LE(p.baseFrame, i * 18 + 12)
    bytes.writeUInt8(p.frame, i * 18 + 14)
    bytes.writeUInt8(p.frameCount, i * 18 + 15)
    bytes.writeInt8(p.palette, i * 18 + 16)
  })
  return bytes
}

function snapshot(state, rng, limiter) {
  const c = state.companion, s = state.spell, p = state.pulse
  return {
    companionActive: Number(c?.active ?? false),
    companionStep: c?.step ?? 0,
    companionVisits: c?.visits ?? 0,
    companionNext: Number(c?.next ?? false),
    activeParticles: c?.particles.filter(p => p.baseFrame).length ?? 0,
    particlesSha256: sha256(particleBytes(c?.particles ?? [])),
    cosmeticRng: rng.randomState,
    spellActive: Number(s?.active ?? false),
    spellStep: s?.step ?? 0,
    spellVisits: s?.visits ?? 0,
    spellPosition: s ? [s.position.x, s.position.y] : [0, 0],
    spellRotation: s?.rotation ?? 0,
    spellScale: s?.scale ?? 0,
    pulseActive: Number(p?.active ?? false),
    pulseFrame: p?.frame ?? 0,
    pulseRemaining: p?.remaining ?? 0,
    limiter: limiter ? 4 : 0,
  }
}

function commands(state) {
  return getWorshipAcquisitionDrawCommands(state).map(d => d.kind === 'sprite'
    ? ['sprite', d.frame, d.x, d.y, d.palette, d.rgb, d.flags]
    : ['spell-raster', d.x, d.y, d.frame, d.flags, d.radians, d.scale])
}

for (const c of fixture.presentation) {
  test(`native controller, particles, palette and ordered draw arguments: ${c.name}`, () => {
    const state = createWorshipAcquisitionState(), rng = { randomState: c.seed }
    startWorshipAcquisition(state, { giftId: 900, model: c.model, geometry: geometry(c.model, c.visible) })
    if (!c.combined) state.spell = null
    for (const [i, expected] of c.rows.entries()) {
      const result = stepWorshipAcquisition(state, { paused: expected.paused, random: () => random(rng) })
      assert.deepEqual(snapshot(state, rng, result.limiterActive), expected.state, `visit ${i + 1}`)
      assert.deepEqual(result.arrivals, expected.arrival ? [{ giftId: 900, model: c.model }] : [], `arrival visit ${i + 1}`)
      const actual = commands(state)
      assert.equal(actual.length, expected.commandCount, `command count visit ${i + 1}`)
      assert.equal(sha256(JSON.stringify(actual)), expected.commandsSha256, `commands visit ${i + 1}`)
    }
    assert.equal(state.companion.active, false)
    assert.equal(state.spell?.active ?? false, false)
    assert.equal(state.pulse?.active ?? false, false)
  })
}

for (const c of fixture.handoff) {
  test(`native spell kinematics and pending transitions: ${c.name}`, () => {
    const state = createWorshipAcquisitionState(), rng = { randomState: 1 }
    startWorshipAcquisition(state, { giftId: 900, model: c.model, geometry: geometry(c.model, c.name !== 'offscreen-bit') })
    for (const expected of c.rows) {
      stepWorshipAcquisition(state, { paused: false, random: () => random(rng) })
      const s = state.spell
      assert.deepEqual({
        active: Number(s.active), step: s.step, stepVisits: s.visits, nextStep: Number(s.next),
        position: [s.position.x, s.position.y], speed: s.speed, angle: s.angle,
        rotation: s.rotation, rotationSpeed: s.spin, scale: s.scale,
      }, expected)
    }
  })
}

for (const c of fixture.replacement) {
  test(`native singleton replacement and independent pulse: ${c.name}`, () => {
    const state = createWorshipAcquisitionState(), rng = { randomState: 1 }
    const step = () => stepWorshipAcquisition(state, { paused: false, random: () => random(rng) })
    startWorshipAcquisition(state, { giftId: 900, model: 12, geometry: geometry(12) })
    for (const expected of c.beforeRows) {
      const result = step()
      assert.deepEqual(snapshot(state, rng, result.limiterActive), expected)
    }
    const pulse = structuredClone(state.pulse)
    startWorshipAcquisition(state, { giftId: 902, model: 3, geometry: geometry(3, true, { x: 250, y: 300 }) })
    assert.deepEqual(state.pulse, pulse)
    assert.equal(state.spell.giftId, 902)
    assert.deepEqual(snapshot(state, rng, true), c.immediatelyAfter)
    const allCommands = []
    for (const expected of c.secondUiRows) {
      const result = step()
      assert.deepEqual(snapshot(state, rng, result.limiterActive), expected)
      assert.ok(result.arrivals.every(arrival => arrival.giftId === 902))
      allCommands.push(...commands(state))
    }
    assert.equal(allCommands.length, c.commandCount)
    assert.equal(sha256(JSON.stringify(allCommands)), c.commandsSha256)
  })
}

test('handoff geometry is an owned snapshot; rendering is read-only and draws the last pulse once', () => {
  const state = createWorshipAcquisitionState(), rng = { randomState: 1 }, supplied = geometry()
  startWorshipAcquisition(state, { giftId: 900, model: 12, geometry: supplied })
  const frozen = structuredClone(state.spell.geometry)
  supplied.origin.x += 100
  supplied.target.y += 100
  supplied.viewport.width *= 2
  supplied.hudScale = 2
  assert.deepEqual(state.spell.geometry, frozen)
  for (let i = 0; i < 34; i++) stepWorshipAcquisition(state, { paused: false, random: () => random(rng) })
  assert.equal(state.pulse.active, false)
  assert.equal(getWorshipAcquisitionDrawCommands(state).length, 1)
  const saved = structuredClone({ state, rng })
  for (let i = 0; i < 144; i++) getWorshipAcquisitionDrawCommands(state)
  assert.deepEqual({ state, rng }, saved)
  stepWorshipAcquisition(state, { paused: false, random: () => { throw Error('inactive visit must not use RNG') } })
  assert.deepEqual(getWorshipAcquisitionDrawCommands(state), [])
})

test('structured-clone restores all particles, trails, pending phases, draws and independent pulse', () => {
  for (const saveVisit of [0, 1, 2, 10, 19, 24, 28, 30, 31, 33]) {
    const state = createWorshipAcquisitionState(), rng = { randomState: 0x12345678 }
    startWorshipAcquisition(state, { giftId: 900, model: 12, geometry: geometry() })
    for (let i = 0; i < saveVisit; i++) stepWorshipAcquisition(state, { paused: false, random: () => random(rng) })
    const restored = structuredClone({ state, rng })
    for (let i = saveVisit; i < 38; i++) {
      const paused = i === 20 || i === 21
      const a = stepWorshipAcquisition(state, { paused, random: () => random(rng) })
      const b = stepWorshipAcquisition(restored.state, { paused, random: () => random(restored.rng) })
      assert.deepEqual(a, b)
      assert.deepEqual({ state, rng }, restored)
    }
  }
})

test('spell motion, arrival and retirement do not depend on intervening shared cosmetic consumers', () => {
  const a = createWorshipAcquisitionState(), b = createWorshipAcquisitionState()
  const ra = { randomState: 1 }, rb = { randomState: 1 }
  for (const state of [a, b]) startWorshipAcquisition(state, { giftId: 900, model: 4, geometry: geometry(4) })
  for (let i = 0; i < 38; i++) {
    for (let n = 0; n < (i % 5); n++) random(rb)
    const resultA = stepWorshipAcquisition(a, { paused: i === 7, random: () => random(ra) })
    const resultB = stepWorshipAcquisition(b, { paused: i === 7, random: () => random(rb) })
    assert.deepEqual(resultA, resultB)
    assert.deepEqual(a.spell, b.spell)
    assert.equal(a.companion.active, b.companion.active)
    assert.equal(a.companion.step, b.companion.step)
    assert.equal(a.companion.visits, b.companion.visits)
  }
  assert.notEqual(ra.randomState, rb.randomState)
})
