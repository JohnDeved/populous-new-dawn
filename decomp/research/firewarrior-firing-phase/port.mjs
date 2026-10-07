// Expose the existing private caller for a bounded comparison. No body is replaced.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { registerHooks } from 'node:module'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = new URL('../../../', import.meta.url)
const caller = new URL('app/live-building-combat.ts', root).href
const expectedCaller = 'edb6d91de5b0eb9d9dda26670bf566c2f3b26b1a3e4c8574b394f14c208467a5'
const raw = readFileSync(fileURLToPath(caller))
assert.equal(createHash('sha256').update(raw).digest('hex'), expectedCaller)
let exposures = 0
registerHooks({
  load(url, context, nextLoad) {
    const result = nextLoad(url, context)
    if (url !== caller) return result
    assert.equal(String(result.source), raw.toString())
    exposures++
    return { ...result, source: `${result.source}\nexport { stepAreaAttack as probeStepAreaAttack }\n` }
  },
})
const { probeStepAreaAttack } = await import(caller)
const { createNativeTerrain } = await import(new URL('app/native-terrain.ts', root))
const { browserPosition } = await import(new URL('app/world-coordinates.ts', root))
const { TURNS_PER_SECOND } = await import(new URL('app/world-rules.ts', root))
assert.equal(exposures, 1)
assert.equal(TURNS_PER_SECOND, 12)
let input = ''
for await (const part of process.stdin) {
  input += part
  assert.ok(input.length <= 100_000)
}
const cases = JSON.parse(input)
assert.equal(cases.length, 16)
const result = []
for (const fixture of cases) {
  const p = structuredClone(fixture.person)
  const u = {
    id: 1, kind: 'firewarrior', team: 'blue', hp: 50, inside: null,
    native: p, ...browserPosition(p), heading: 0, fighting: false,
    cooldown: fixture.spec.cooldown / TURNS_PER_SECOND,
  }
  const target = { id: 2, kind: fixture.targetClass === 2 ? 'tower' : 'brave',
    team: 'red', hp: 50, progress: 1, inside: null,
    ...browserPosition({ x: 0x2600, y: 0x2400 }) }
  const w = {
    land: createNativeTerrain(new Int16Array(16384).fill(128)),
    landVersion: 0, terrainVersion: 0,
    buildings: fixture.targetClass === 2 ? [target] : [], fights: [],
    units: fixture.targetClass === 2 ? [u] : [u, target],
    effects: fixture.spec.projectile ? [{ id: 4, kind: 'firewarriorShot' }] : [],
    nextId: 3, effectCounter: 0, soundSerial: 0, sounds: [], turn: 0,
    randomState: 0x12345678, musicActivity: 0, combatMarches: [],
    manaWorld: { playerTribe: 0, gameFlags: 0 },
    manaTribes: Array.from({ length: 4 }, () => ({ playerType: 0 })),
    castingTribes: Array.from({ length: 4 }, () => ({ flags: 0 })),
  }
  const snapshot = () => ({
    person: structuredClone(p),
    unit: { cooldown: u.cooldown, target: u.target ?? null, heading: u.heading,
      fighting: u.fighting },
    world: { randomState: w.randomState, musicActivity: w.musicActivity,
      nextId: w.nextId, effectCounter: w.effectCounter,
      effects: structuredClone(w.effects), sounds: structuredClone(w.sounds) },
    fields: Object.fromEntries(fixture.compareFields.map(name => [name,
      name === 'trackedProjectile' ? p.stateObject
        : name === 'cooldown' ? Math.round(u.cooldown * TURNS_PER_SECOND) : p[name]])),
  })
  const visits = []
  for (let visit = 0; visit < fixture.spec.visits; visit++) {
    const before = snapshot()
    const complete = probeStepAreaAttack(w, u, p, fixture.order)
    visits.push({ visit, before, after: snapshot(), complete })
    if (complete) break
  }
  result.push({ name: fixture.spec.name, visits })
}
console.log(JSON.stringify({ callerHash: expectedCaller, exposures, cases: result }))
