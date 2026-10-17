import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { deserialize } from 'node:v8'
import { gunzipSync } from 'node:zlib'
import { createGameStore, migrateCheckpoint } from '../app/game-store.ts'
import { tick } from '../app/model.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { computerPhase } from '../app/computer.ts'
import { buildingModel } from '../app/building-shapes.ts'
const sha = value => createHash('sha256').update(value).digest('hex')
// Complete historical world produced from exact9f7a4758 before the newborn scheduler.
// The producer receipt retains the unchanged original8016→8702 natural witness.
test('historical pre-newborn M6 whole checkpoint retains casualty and slot reuse through public Save Load', async () => {
  const provenanceBytes=readFileSync(new URL('./fixtures/mission6-historical/provenance.json',import.meta.url))
  assert.equal(sha(provenanceBytes),'2d68f961a06f902f41bc01b4d1a3889898ee5b8be5c7f16d5409f5b03c917652')
  const provenance=JSON.parse(provenanceBytes)
  assert.equal(provenance.head,'9f7a4758aaabd11b0b57e89d150265c313d9a13a')
  assert.equal(provenance.inputs['tests/mission6.test.mjs'],'2859ebbf26f3786ad272b7ffc2b4999bda5d71baff5577cdb65aa1872d353765')
  assert.equal(provenance.validatedOriginalLifecycleThrough,8702)
  assert.deepEqual(provenance.originalMembers,[386,415,445,398])
  assert.equal(provenance.raidSlot,0)
  assert.equal(provenance.preacherId,398)
  assert.equal(sha(readFileSync(new URL('../scripts/capture-historical-mission6-raid.mjs',import.meta.url))),provenance.producerSha256)
  const compressed=readFileSync(new URL('./fixtures/mission6-historical/raid-8529.v8.gz',import.meta.url))
  assert.equal(sha(compressed),'5dffbaa507061aac80e3ca7da5aed06f189c54103a816e7b3054fae9c8564aff')
  const serialized=gunzipSync(compressed)
  assert.equal(sha(serialized),'f7fd8ab133ae00a02d43b296fd714148a28faae2d3733ef87b4446f17922557c')
  const historical=deserialize(serialized),store=createGameStore()
  store.startMission(6)
  Object.assign(store.getWorld(),historical)
  assert.deepEqual(store.getWorld(),historical)
  await store.saveCheckpoint()
  const replay=migrateCheckpoint(structuredClone(store.getWorld()))
  assert.ok(store.loadCheckpoint())
  const raiding=store.getWorld()
  assert.deepEqual(raiding,replay)
  const originalMembers=[386,415,445,398], preacherId=398, raidSlot=0,
    warriors=originalMembers.filter(id=>id!==preacherId),
    restoredAttack=raiding.campaignAIs[2].tasks[raidSlot]
  assert.deepEqual(restoredAttack.members,originalMembers)
  assert.equal(restoredAttack.flags&1,1)
  assert.equal(restoredAttack.type,20)
  assert.equal(raiding.turn, 8529)
  assert.deepEqual(
    [restoredAttack.phase, restoredAttack.target, restoredAttack.damage, restoredAttack.retries],
    [16, 14394, 2, 0]
  )
  assert.ok(originalMembers.every(id => {
    const unit = raiding.units.find(unit => unit.id === id)
    return unit && unit.hp > 0 && Math.hypot(unit.x - 51, unit.z + 65) < 8
  }))
  for (const id of warriors) {
    const person = raiding.objectCells.objects.get(id)
    assert.deepEqual([person.anchorX, person.anchorY], [15104, 14592])
  }
  assert.equal(currentPersonOrder(raiding.buildingOrders,
    raiding.objectCells.objects.get(preacherId))?.model, 17)

  // The real returning Shaman's reincarnation wave now reaches these local
  // attackers. Observe its casualties, retirement and first producer-slot reuse.
  let retired = false, reusedForTraining = false
  while (raiding.turn < 8702) {
    const phase = restoredAttack.phase,
      active = !retired && !!(restoredAttack.flags & 1),
      firstFreeSlot = raiding.campaignAIs[2].tasks.findIndex(task => !(task.flags & 1))
    tick(raiding, 1 / 12)
    tick(replay, 1 / 12)
    assert.deepEqual(replay, raiding)
    const activeRaids = raiding.campaignAIs[2].tasks.filter(task => task.flags & 1 && task.type === 20)
    assert.ok(activeRaids.length <= 1)
    if (activeRaids.length) assert.equal(activeRaids[0], restoredAttack)
    if (raiding.turn === 8668) {
      assert.ok(raiding.units.some(unit => unit.kind === 'shaman' && unit.team === 'blue' && unit.hp > 0))
      assert.ok(raiding.effects.some(effect => effect.reincarnationWave?.tribe === 0))
    }
    if (raiding.turn === 8678) {
      assert.equal(restoredAttack.phase, 23)
      assert.equal(restoredAttack.flags & 1, 1)
      assert.deepEqual(restoredAttack.members, originalMembers)
      assert.ok(originalMembers.every(id => !raiding.units.some(unit => unit.id === id)))
      assert.ok(originalMembers.every(id => !raiding.objectCells.objects.has(id)))
      assert.equal(raiding.killCredits[0][2], 4)
    }
    if (active && !(restoredAttack.flags & 1)) {
      assert.equal(raiding.turn, 8680)
      assert.equal(phase, 23)
      assert.equal(restoredAttack.phase, 23)
      assert.equal(restoredAttack.elapsed, 305)
      assert.equal(restoredAttack.fallback, 14)
      assert.equal(restoredAttack.flags & 3, 0)
      assert.deepEqual(restoredAttack.members, [])
      retired = true
    }
    if (retired) {
      assert.equal(activeRaids.length, 0)
      if (!reusedForTraining && restoredAttack.flags & 1) {
        assert.equal(raiding.turn, 8702)
        assert.equal(computerPhase(raiding.turn - 1, 2), 'produce')
        assert.equal(firstFreeSlot, raidSlot)
        assert.equal(raiding.campaignAIs[2].tasks[raidSlot], restoredAttack)
        assert.equal(restoredAttack.type, 6)
        assert.equal(restoredAttack.phase, 0)
        assert.equal(restoredAttack.requested, 0)
        assert.deepEqual(restoredAttack.members, [])
        const camp = raiding.buildings.find(building => building.id === restoredAttack.target)
        assert.ok(camp && camp.hp > 0 && camp.team === 'yellow')
        assert.equal(camp.id, 354)
        assert.equal(camp.progress, 1)
        assert.equal(buildingModel(camp), 7)
        reusedForTraining = true
      } else if (!reusedForTraining) {
        assert.equal(restoredAttack.flags & 1, 0)
        assert.deepEqual(restoredAttack.members, [])
      }
    }
  }
  assert.ok(retired)
  assert.ok(reusedForTraining)
  assert.ok(originalMembers.every(id => !raiding.units.some(unit => unit.id === id)))
})
