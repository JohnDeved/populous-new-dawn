import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, tick } from '../app/model.ts'
import { createGift } from '../app/world-effects.ts'
import {
  startPendingWorshipAcquisitions,
  visitWorshipAcquisition,
} from '../app/worship-acquisition-runtime.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { missionData } from '../app/mission-data.ts'
import { AUDIO_CUES, cueVariant } from '../app/audio.ts'

const geometry = {
  viewport: { x: 100, y: 0, width: 540, height: 480 },
  origin: { x: 420, y: 180 },
  target: { x: 25, y: 286 },
  targetRect: { x: 2, y: 260, width: 46, height: 52 },
  targetHud: { x: 25, y: 286 },
  hudScale: 1,
}
const vault = world => world.shrines.find(head => head.kind === 'vault')

test('authored M1 Vault caller queues its camp gift on the sixth visit and starts the measured building target', () => {
  const world = createWorld(1),
    head = vault(world)
  // Caller fixture only: completion enters the real stepVaultWork → createGift path.
  head.reset = false
  head.forced = true
  tick(world, 1 / 12)
  const gift = world.gifts.find(gift => gift.reward === 'camp')
  assert.ok(gift, 'existing completion caller creates the authored gift')
  assert.equal(gift.phase, 6)
  for (let visit = 1; visit <= 6; visit++) {
    tick(world, 1 / 12)
    assert.equal(gift.phase, 6 - visit)
    assert.equal(gift.remaining, 82 - visit)
    assert.deepEqual(world.worshipAcquisition.requests, visit === 6 ? [gift.id] : [])
  }
  assert.deepEqual(gift.buildingAcquisition, {
    mission: 1,
    head: 1,
    reward: 2,
    slot: 0,
    rewardClass: 2,
    model: 7,
    completedTurn: 1,
    serial: gift.id,
  })
  assert.equal(gift.ordinaryWorship, undefined)
  const calls = []
  startPendingWorshipAcquisitions(world, {
    cue: cue => calls.push(['cue', cue]),
    geometry: candidate => {
      calls.push(['geometry', candidate.id])
      return geometry
    },
    failed: () => assert.fail('valid geometry'),
  })
  assert.deepEqual(calls, [
    ['cue', 0xcc],
    ['cue', 0xcb],
    ['geometry', gift.id],
  ])
  assert.equal(world.worshipAcquisition.controllers.building.giftId, gift.id)
  assert.deepEqual(world.worshipAcquisition.controllers.building.geometry, geometry)
  assert.equal(world.worshipAcquisition.controllers.spell, null)
  for (let ui = 0; ui < 150; ui++) visitWorshipAcquisition(world, () => {})
  assert.equal(gift.remaining, 76, 'building screen cannot borrow the spell arrival clamp')
  for (let visit = 7; visit <= 82; visit++) tick(world, 1 / 12)
  assert.equal(world.unlockedCamp, true)
  assert.ok(
    world.effects.some(effect => effect.kind === 'birth'),
    'building payout keeps its legacy effect'
  )
})

test('unrelated, nonlocal and legacy gifts never gain M1 screen eligibility', () => {
  const world = createWorld(1),
    head = vault(world)
  for (const point of [{ x: head.x, z: head.z }, { ...head }, { x: 40, z: 40 }])
    assert.equal(createGift(world, 'camp', point).buildingAcquisition, undefined)
  const originalMode = head.mode
  head.mode = 0
  assert.equal(createGift(world, 'camp', head).buildingAcquisition, undefined)
  head.mode = originalMode
  assert.equal(createGift(world, 'temple', head).buildingAcquisition, undefined)
  const other = createWorld(3)
  assert.equal(createGift(other, 'camp', vault(other)).buildingAcquisition, undefined)
  const gift = createGift(world, 'camp', head)
  gift.recipient = 1
  for (let i = 0; i < 6; i++) tick(world, 1 / 12)
  assert.equal(world.worshipAcquisition.requests.includes(gift.id), false)
  delete gift.buildingAcquisition
  delete world.worshipAcquisition.controllers.building
  const restored = migrateCheckpoint(structuredClone(world))
  assert.equal(
    restored.gifts.find(candidate => candidate.id === gift.id).buildingAcquisition,
    undefined
  )
  assert.equal(restored.worshipAcquisition.controllers.building, null)
})

test('active world checkpoint resumes faces, bindings and RNG without a second handoff; new world clears them', () => {
  const world = createWorld(1),
    gift = createGift(world, 'camp', vault(world))
  for (let visit = 0; visit < 6; visit++) tick(world, 1 / 12)
  let cues = 0
  const bridge = { cue: () => cues++, geometry: () => geometry, failed: () => assert.fail() }
  startPendingWorshipAcquisitions(world, bridge)
  for (let ui = 0; ui < 90; ui++) visitWorshipAcquisition(world, () => {})
  // Save/Load and IndexedDB preserve the typed World graph with structured clone.
  const saved = structuredClone(world)
  assert.ok(saved.buildingFootprints instanceof Map)
  assert.ok(saved.sceneryShadows instanceof Map)
  assert.ok(saved.land.flags instanceof Uint32Array)
  assert.deepEqual(saved.land.flags, world.land.flags)
  assert.notEqual(saved.land.flags, world.land.flags)
  const restored = migrateCheckpoint(saved)
  assert.deepEqual(restored.worshipAcquisition, structuredClone(world.worshipAcquisition))
  assert.deepEqual(restored.cosmeticRandom, world.cosmeticRandom)
  startPendingWorshipAcquisitions(restored, bridge)
  assert.equal(cues, 2)
  assert.equal(restored.gifts.find(candidate => candidate.id === gift.id).remaining, 76)
  for (let ui = 0; ui < 40; ui++) {
    world.paused = restored.paused = ui < 3
    visitWorshipAcquisition(world, () => {})
    visitWorshipAcquisition(restored, () => {})
    assert.deepEqual(restored.worshipAcquisition, world.worshipAcquisition)
    assert.deepEqual(restored.cosmeticRandom, world.cosmeticRandom)
  }
  const restarted = createWorld(1)
  assert.equal(restarted.worshipAcquisition.controllers.building, null)
  assert.equal(restarted.worshipAcquisition.controllers.companion, null)
  assert.deepEqual(restarted.worshipAcquisition.requests, [])
})

test(
  'creation rejects missing, redirected and duplicate authored reward links',
  { concurrency: false },
  () => {
    const world = createWorld(1),
      shrine = vault(world),
      settings = missionData(1).level.objects.find(object => object.index === 1).settings,
      saved = settings.slice(6, 10)
    assert.deepEqual(saved, [3, 0, 0, 0], 'pinned source is record1 → record2 in slot0')
    try {
      for (const links of [
        [0, 0, 0, 0],
        [4, 0, 0, 0],
        [3, 0, 3, 0],
      ]) {
        settings.splice(6, 4, ...links)
        const gift = createGift(world, 'camp', shrine)
        assert.equal(gift.buildingAcquisition, undefined)
        assert.equal(gift.ordinaryWorship, undefined)
        assert.deepEqual([gift.phase, gift.remaining], [6, 82])
      }
    } finally {
      settings.splice(6, 4, ...saved)
    }
    assert.equal(createGift(world, 'camp', shrine).buildingAcquisition.reward, 2)
  }
)

test('building start cues use existing preloaded samples through the audio owner', () => {
  for (const [cue, key] of [
    [0xcc, 'sound-439'],
    [0xcb, 'sound-436'],
  ]) {
    assert.ok(AUDIO_CUES.includes(cue), 'Soundscape.enable must load the cue before playback')
    assert.equal(cueVariant(cue, 1).key, key)
  }
})
