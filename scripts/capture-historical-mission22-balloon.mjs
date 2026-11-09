// Reproduce a historical browser-port checkpoint; never executes the original game.
// The supplied mana-focus mask matches the historical maintained acquisition test.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import cp from 'node:child_process'
import crypto from 'node:crypto'
import v8 from 'node:v8'
import { gzipSync } from 'node:zlib'
const historicalRoot = path.resolve(process.argv[2] ?? '')
assert.ok(process.argv[2], 'provide an existing clean c44 historical source tree')
const output = path.resolve(process.argv[3] ?? 'work/m9-transport/historical-m22-capture')
const expected = 'c44dadfc91ba5bdca9b97552c84e42ebff63d62f'
const git = (...args) =>
  cp.execFileSync('git', ['-C', historicalRoot, ...args], { encoding: 'utf8' }).trim()
assert.equal(git('rev-parse', 'HEAD'), expected)
assert.equal(git('diff', 'HEAD', '--', 'app', 'public', 'package.json', 'package-lock.json'), '')
const source = Object.fromEntries(
  ['app', 'public', 'package.json', 'package-lock.json'].map(p => [
    p,
    git('rev-parse', `HEAD:${p}`),
  ])
)
const { browserPosition, cast, command, tick, selectUnit } = await import(
  pathToFileURL(path.join(historicalRoot, 'app/model.ts'))
)
const { createGameStore } = await import(
  pathToFileURL(path.join(historicalRoot, 'app/game-store.ts'))
)
const stepUntil = (w, done, limit) => {
    for (let i = 0; i < limit; i++) {
      tick(w, 1 / 12)
      if (done()) return
    }
    throw Error('timed out ' + w.turn)
  },
  focusCharging = (w, m) => {
    w.charging = true
    w.manaWorld.spells[0].disabled = 0xffffffff & ~(1 << (m - 1))
  },
  moveShaman = (w, s, p) => {
    selectUnit(w, s.id, false)
    assert.ok(command(w, p))
    stepUntil(w, () => Math.hypot(s.x - p.x, s.z - p.z) < 2, 1000)
  }
function prepareFlight() {
  const store = createGameStore()
  store.startMission(22)
  let world = store.getWorld(),
    shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman'),
    balloon = world.vehicles.find(vehicle => vehicle.model === 3),
    boat = world.vehicles.find(vehicle => vehicle.model === 1),
    south = world.shrines.find(shrine => shrine.rewardMana === 600_000),
    north = world.shrines.find(shrine => shrine.rewardMana === 1_000_000)

  focusCharging(world, 5)
  stepUntil(world, () => world.shots.swarm > 0, 1_500)
  moveShaman(world, shaman, { x: 0, z: -45 })
  moveShaman(world, shaman, { x: 20, z: -45 })
  assert.ok(cast(world, 'swarm', { x: 27, z: -29 }))
  stepUntil(world, () => world.effects.some(effect => effect.swarm?.applied), 100)

  selectUnit(world, shaman.id, false)
  assert.ok(command(world, { ...browserPosition(boat), id: boat.id }))
  stepUntil(world, () => boat.passengerCount === 1, 500)
  assert.ok(command(world, { x: -25, z: -63 }))
  stepUntil(world, () => boat.passengerCount === 0, 2_000)

  world.charging = true
  world.manaWorld.spells[0].disabled = 0xffffffff & ~(1 << 4) & ~(1 << 11)
  selectUnit(world, shaman.id, false)
  assert.ok(command(world, { ...south, id: south.id }))
  stepUntil(world, () => south.rewardDelay === 50, 500)
  stepUntil(world, () => south.uses === 1, 150)
  stepUntil(world, () => world.shots.swarm > 0 && world.shots.bridge > 0, 2_000)

  selectUnit(world, shaman.id, false)
  assert.ok(command(world, { ...browserPosition(boat), id: boat.id }))
  stepUntil(world, () => boat.passengerCount === 1, 500)
  assert.ok(command(world, { x: -83, z: -57 }))
  stepUntil(world, () => boat.passengerCount === 0, 2_000)
  assert.ok(cast(world, 'bridge', { x: -83, z: -69 }))
  stepUntil(world, () => !shaman.casting, 100)
  for (let turn = 0; turn < 160; turn++) tick(world, 1 / 12)

  selectUnit(world, shaman.id, false)
  assert.ok(command(world, { ...browserPosition(balloon), id: balloon.id }))
  stepUntil(world, () => balloon.passengerCount === 1, 1_000)
  assert.deepEqual(
    [balloon.team, balloon.passengers, shaman.native.vehicle],
    ['blue', [shaman.id], balloon.id]
  )

  return { store, world, shaman, balloon, north }
}

const { world, shaman, balloon } = prepareFlight()
assert.equal(world.turn, 2206)
assert.equal(shaman.native.counter, 158)
assert.equal(shaman.native.state, 30)
assert.equal(shaman.hp, 100.6)
assert.equal(world.objectCells.objects.get(shaman.id), shaman.native)
assert.deepEqual(balloon.passengers, [shaman.id])
const raw = v8.serialize(world),
  compressed = gzipSync(raw),
  hash = b => crypto.createHash('sha256').update(b).digest('hex')
assert.equal(git('rev-parse', 'HEAD'), expected)
assert.equal(git('diff', 'HEAD', '--', 'app', 'public', 'package.json', 'package-lock.json'), '')
for (const [p, oid] of Object.entries(source)) assert.equal(git('rev-parse', `HEAD:${p}`), oid)
fs.mkdirSync(output, { recursive: true })
fs.writeFileSync(path.join(output, 'mission22-balloon-c44.v8.gz'), compressed)
const metadata = {
  version: 1,
  scope:
    'Historical campaign-derived browser-port acquisition with supplied spell-focus setup; subsequent tests are current-runtime checkpoint continuations, not fresh acquisition.',
  sourceHead: expected,
  sourceObjects: source,
  producer: 'scripts/capture-historical-mission22-balloon.mjs',
  producerSha256: hash(fs.readFileSync(new URL(import.meta.url))),
  historicalSetupPath: 'tests/balloon-worship.test.mjs',
  historicalSetupSha256: hash(
    cp.execFileSync('git', [
      '-C',
      historicalRoot,
      'show',
      `${expected}:tests/balloon-worship.test.mjs`,
    ])
  ),
  compression: 'gzip',
  encoding: 'node:v8 serialization',
  serializedBytes: raw.length,
  serializedSha256: hash(raw),
  compressedBytes: compressed.length,
  compressedSha256: hash(compressed),
  turn: world.turn,
  shamanId: shaman.id,
  balloonId: balloon.id,
  personCounter: shaman.native.counter,
  randomState: world.randomState,
  allowedSetup: [
    'Existing spell charging mask only; no actor, terrain, outcome, counter or RNG edits.',
  ],
  nativeExecutableExecuted: false,
}
fs.writeFileSync(
  path.join(output, 'mission22-balloon-c44.json'),
  JSON.stringify(metadata, null, 2) + '\n'
)
console.log(JSON.stringify(metadata, null, 2))
