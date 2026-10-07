import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { createWorld, tick } from '../app/model.ts'
import { terrainPointHeight } from '../app/native-terrain.ts'

const nativeBytes = readFileSync(new URL('./fixtures/startup-burst-height-native.json', import.meta.url))
assert.equal(createHash('sha256').update(nativeBytes).digest('hex'), 'ff00dce327343372721d5b3183f78e7b4740a3cab1568539ff1d3d08175d55f9')
const native = JSON.parse(nativeBytes)
const authored = JSON.parse(readFileSync(new URL('./fixtures/startup-burst-height-authored.json', import.meta.url)))
const nativeHeight = record => Buffer.from(record.recordHex, 'hex').readInt16LE(0x41)
const nativeRoot = key => native.events.find(event => key in event)[key]
const nativeGround = nativeHeight(nativeRoot('rootAfterCommon'))
const nativeOffset = nativeHeight(nativeRoot('rootAfterOffset')) - nativeGround

// This oracle is decoded from accepted original bytes, not a browser helper.
test('retained original arrival grounds its root before the default height offset', () => {
  assert.equal(native.status, 'passed')
  assert.equal(nativeHeight(nativeRoot('rootBeforeCommon')), nativeGround - 240)
  assert.equal(nativeOffset, 90)
  assert.equal(native.births.length, 32)
  for (const birth of native.births)
    assert.equal(nativeHeight(birth.record) - nativeGround, nativeOffset)
})

// Extend the existing startup angle test's RNG-write observation. The effect is
// already allocated when its three gameplay draws occur. Observe the subsequent
// production animation assignment once, then restore an ordinary data property.
// No world/effect/RNG value is supplied, and observations precede particle motion.
function observeStartupBirths(world) {
  const particles = new Map(), errors = []
  const originalRandom = Object.getOwnPropertyDescriptor(world, 'randomState')
  assert.ok(originalRandom && 'value' in originalRandom && originalRandom.configurable && originalRandom.writable)
  let { randomState } = world
  const getRandom = () => randomState
  const setRandom = value => {
    randomState = value
    const effect = world.effects.at(-1)
    if (effect?.kind !== 'trail' || effect.animation) return
    let row = particles.get(effect.id)
    if (!row) {
      const descriptor = Object.getOwnPropertyDescriptor(effect, 'animation')
      if (descriptor && (!descriptor.configurable || !('value' in descriptor) || !descriptor.writable)) {
        errors.push(`Effect ${effect.id} has an unsupported existing animation descriptor`)
        return
      }
      row = { effect, draws: [], turn: world.turn, descriptor }
      particles.set(effect.id, row)
      row.getAnimation = () => descriptor?.value
      row.setAnimation = animation => {
        Object.defineProperty(effect, 'animation', descriptor
          ? { ...descriptor, value: animation }
          : { value: animation, writable: true, enumerable: true, configurable: true })
        try {
          row.birth = {
            turn: world.turn, age: effect.age,
            x: animation.x, y: animation.y, h: animation.h,
            ground: terrainPointHeight(world.land, animation),
            remaining: animation.remaining, speed: animation.speed, state: animation.state,
            velocity: { ...animation.velocity }, gameplay: world.randomState,
          }
        } catch (error) {
          errors.push(String(error))
        }
      }
      Object.defineProperty(effect, 'animation', {
        enumerable: descriptor?.enumerable ?? true, configurable: true,
        get: row.getAnimation, set: row.setAnimation,
      })
    }
    row.draws.push(value)
  }
  Object.defineProperty(world, 'randomState', {
    enumerable: originalRandom.enumerable, configurable: true, get: getRandom, set: setRandom,
  })
  return {
    particles, errors,
    restore() {
      const current = Object.getOwnPropertyDescriptor(world, 'randomState')
      if (current?.get === getRandom && current?.set === setRandom)
        Object.defineProperty(world, 'randomState', { ...originalRandom, value: randomState })
      else errors.push('Startup observer lost randomState descriptor ownership')
      for (const row of particles.values()) {
        const currentAnimation = Object.getOwnPropertyDescriptor(row.effect, 'animation')
        if (currentAnimation?.get !== row.getAnimation || currentAnimation?.set !== row.setAnimation) continue
        if (row.descriptor) Object.defineProperty(row.effect, 'animation', row.descriptor)
        else delete row.effect.animation
      }
    },
  }
}

for (const [level, siteCount] of [[1, 1], [2, 1], [3, 2]]) {
  test(`ordinary Mission ${level} startup births retain the original root height offset`, t => {
    const world = createWorld(level)
    assert.ok(world.levelStart.every(site => site.stoneTurns.every(turn => turn === null)))
    const observer = observeStartupBirths(world)
    const phaseHistory = []
    let phases = ''
    try {
      for (let turn = 1; turn <= 70; turn++) {
        tick(world, 1 / 12)
        const next = world.levelStart.map(site => `${site.tribe}:${site.phase}`).join(',')
        if (next !== phases) phaseHistory.push([turn, next])
        phases = next
      }
    } finally {
      observer.restore()
    }
    assert.deepEqual(observer.errors, [])
    const births = [...observer.particles.values()].filter(row => row.effect.sprite?.sequence === 'blastTrail')
    t.diagnostic(JSON.stringify({ level, births: births.length, gameplay: world.randomState,
      cosmetic: world.cosmeticRandom.randomState, effectCounter: world.effectCounter,
      nextId: world.nextId, stoneTurns: world.levelStart.map(site => [site.tribe, site.stoneTurns]), phaseHistory }))
    assert.equal(births.length, siteCount * 8 * 32)
    assert.ok(world.levelStart.every(site => site.phase === 4 && site.carriers.length === 0))
    assert.equal(world.levelStart.flatMap(site => site.stoneTurns).filter(turn => turn !== null).length, siteCount * 8)
    const expectedStones = new Map(authored.missions.find(mission => mission.mission === level).sites
      .filter(site => site.startupEnabled).flatMap(site => site.stones.map(stone => [stone.nativeXY.join(','), 0])))
    for (const { effect, draws, turn, birth } of births) {
      const context = `Mission ${level}, turn ${turn}, effect ${effect.id}`
      assert.ok(birth, `${context}: production animation assignment was observed`)
      assert.equal(birth.turn, turn, `${context}: same producer turn`)
      assert.equal(birth.age, 0, `${context}: no scheduled effect visit yet`)
      assert.deepEqual(birth.velocity, { x: 0, y: 0, z: 0 }, `${context}: unmoved birth`)
      assert.equal(birth.state, 3, `${context}: initialized model3`)
      assert.equal(draws.length, 3, `${context}: exactly three gameplay draws`)
      assert.equal(birth.gameplay, draws[2], `${context}: assignment follows the third draw`)
      assert.equal(birth.remaining, draws[0] % 2 + 1, `${context}: lifetime is still at birth`)
      assert.equal(birth.speed, 60)
      const point = [birth.x, birth.y].join(',')
      assert.ok(expectedStones.has(point), `${context}: enabled authored stone position`)
      expectedStones.set(point, expectedStones.get(point) + 1)
      assert.equal(birth.h - birth.ground, nativeOffset,
        `${context}: actual birth h=${birth.h}, sampled ground=${birth.ground}; original root-first offset=${nativeOffset}`)
    }
    assert.ok([...expectedStones.values()].every(count => count === 32), 'one 32-child burst per fresh stone')
  })
}
