// Research-only historical world reconstruction. Never imported by app/ or a
// shipping checkpoint reader. This preserves old fixture assertions, not old-save
// product support. Current-format persistence is tested through createGameStore.
import { restoreCapacityPolicy, createCapacityPolicy } from '../../app/capacity-policy.ts'
import { createSecondaryEffects, rebuildSecondaryLists } from '../../app/secondary-effects.ts'
import { registerSecondaryMarker, restoreSecondaryEffects } from '../../app/hut-smoke-runtime.ts'
import {
  campaignCommand,
  createGift,
  createWorld,
  syncLandscapeObjects,
  type Gift,
  type World,
} from '../../app/model.ts'
import { missionData, missionEnemyTribe } from '../../app/mission-data.ts'
import { teamForTribe, type Point } from '../../app/world-types.ts'
import { createComputerProducers } from '../../app/computer.ts'
import rules from '../../app/original-rules.json' with { type: 'json' }
import {
  WORSHIP_STONE_HEAD_MODEL,
  authoredWorshipMode,
  worshipAppearanceModel,
} from '../../app/worship-appearance.ts'
import { restoreOrdinaryWorshipSource } from '../../app/worship-acquisition-source.ts'
import { createWorshipAcquisitionRuntime } from '../../app/worship-acquisition-runtime.ts'
import { initializeVaultKnowledge } from '../../app/vault-appearance.ts'
import { discardInvalidResident } from '../../app/building-resident.ts'
import { initializeVaultKnowledgeGift } from '../../app/world-effects.ts'
import { createTribeCameras } from '../../app/tribe-camera.ts'

export function restoreHistoricalSecondaryEffects(world: World) {
  if (!world.secondaryEffects) {
    world.secondaryEffects = createSecondaryEffects(world.turn)
    world.effects = world.effects.filter(
      effect => effect.kind !== 'orderMarker' || registerSecondaryMarker(world, effect)
    )
  }
  restoreSecondaryEffects(world)
}

type LegacyGift = {
  x: number
  z: number
  kind: 'vault' | 'lightning' | 'bridge'
  remaining: number
}

export function migrateLegacyWorshipAppearance(world: World) {
  const migrate = (shrine: World['shrines'][number]) => {
    if (shrine.mode === undefined && shrine.model === WORSHIP_STONE_HEAD_MODEL) {
      const mode = authoredWorshipMode(world.outcome.level, shrine)
      if (mode !== undefined) {
        shrine.mode = mode
        if (mode === 3) shrine.model = worshipAppearanceModel(mode)
      }
    }
    if (shrine.mode === 5 && shrine.model === WORSHIP_STONE_HEAD_MODEL)
      shrine.model = worshipAppearanceModel(shrine.mode)
    if (shrine.linkedShrine) migrate(shrine.linkedShrine)
  }
  for (const shrine of world.shrines) migrate(shrine)
}

function migrateLegacyComputerTeam(world: World, tribe: number) {
  const team = teamForTribe(tribe),
    retag = (owner?: { tribe: number; damageAttacker?: number }) => {
      if (owner?.tribe === 1) owner.tribe = tribe
      if (owner?.damageAttacker === 1) owner.damageAttacker = tribe
    },
    retagEffect = (effect: World['effects'][number]) => {
      if (effect.team === 'red') effect.team = team
      if (effect.unit?.team === 'red') effect.unit.team = team
      if (effect.reincarnation?.team === 'red') effect.reincarnation.team = team
      for (const owner of [
        effect.lightning,
        effect.wave,
        effect.swamp,
        effect.firestorm,
        effect.earthquake,
        effect.volcano,
        effect.convertWild,
        effect.tornado,
        effect.swarm,
      ])
        retag(owner)
    }
  for (const unit of world.units) {
    if (unit.hypnotise?.originalTeam === 'red') unit.hypnotise.originalTeam = team
    if (unit.team === 'red') unit.team = team
    for (const person of [
      unit.native,
      unit.flight,
      unit.entry?.person,
      unit.builder?.person,
      unit.fight?.motion,
      unit.resident?.person,
    ])
      retag(person ?? undefined)
  }
  for (const building of world.buildings) {
    if (building.team === 'red') building.team = team
    if (building.damageState?.attacker === 1) building.damageState.attacker = tribe
    if (building.damageState?.plan.attacker === 1) building.damageState.plan.attacker = tribe
  }
  for (const vehicle of world.vehicles) if (vehicle.team === 'red') vehicle.team = team
  for (const effect of world.effects) retagEffect(effect)
  for (const projectile of world.projectiles) {
    if (projectile.team === 'red') projectile.team = team
    for (const effect of projectile.visuals) retagEffect(effect)
  }
  for (const formation of world.marching) retag(formation)
  for (const fight of world.fights)
    if (fight.tribes) fight.tribes = fight.tribes.map(id => (id === 1 ? tribe : id))
  for (const footprint of world.buildingFootprints.values()) retag(footprint)
  for (let index = 0; index < world.land.regions.length; index++)
    if (world.land.regions[index] & 0x20)
      world.land.regions[index] = (world.land.regions[index] & ~0x20) | (1 << (tribe + 4))
}

function migrateLegacyBridgeOrigins(world: World) {
  const { objects } = missionData(world.outcome.level).level
  for (const shrine of world.shrines) {
    if (shrine.kind !== 'bridgeEffect' || shrine.bridgeStart || !shrine.bridgeTarget) continue
    const heading = Math.round((shrine.angle * 2048) / (Math.PI * 2)) & 2047,
      starts = objects
        .filter(
          object =>
            object.type === 6 &&
            object.model === 6 &&
            object.x === shrine.x &&
            object.z === shrine.z &&
            object.settings?.[1] === shrine.range &&
            (object.angle & 2047) === heading
        )
        .flatMap(head =>
          Array.from({ length: 10 }, (_, slot) => {
            const token = head.settings![6 + slot * 2] | (head.settings![7 + slot * 2] << 8)
            return objects.find(object => object.index === token - 1)
          })
        )
        .flatMap(object => {
          if (object?.type !== 7 || object.model !== 24 || !('target' in object)) return []
          const target = object.target as Point
          return target.x === shrine.bridgeTarget!.x && target.z === shrine.bridgeTarget!.z
            ? [{ x: object.x, z: object.z }]
            : []
        })
    const [start] = starts
    if (start && starts.every(other => other.x === start.x && other.z === start.z))
      shrine.bridgeStart = start
  }
}

export function normalizeHistoricalFixture(world: World) {
  if (!world.cameras) {
    // Historical fixtures recorded no camera pose. Their port supplied neutral
    // tribe inputs; preserve that deterministic research context, without
    // inferring camera history from current Shamans or claiming native parity.
    world.cameras = createTribeCameras()
    for (const camera of world.cameras.tribes) camera.initialized = true
  }
  world.capacityPolicy ??= createCapacityPolicy('classic')
  restoreCapacityPolicy(world)
  // Preserve intact legacy cell order. This cannot recover a chain that an older
  // runtime already truncated after allocating a person handle above 0xffff.
  if (world.objectCells.heads instanceof Uint16Array)
    world.objectCells.heads = new Float64Array(world.objectCells.heads)
  for (const unit of world.units) discardInvalidResident(world, unit)
  world.worshipAcquisition ??= createWorshipAcquisitionRuntime()
  world.worshipAcquisition.controllers.building ??= null
  restoreHistoricalSecondaryEffects(world)
  world.outcome.level ??= 1
  world.drawMode ??= 0
  // An old checkpoint has already passed startup. Never replay terrain or conversion.
  world.levelStart ??= []
  world.levelStartStoneSound ??= 0
  world.reincarnationSites ??= []
  const computerTribe = missionEnemyTribe(world.outcome.level),
    legacySingleAI = !world.campaignAIs
  world.vehicles ??= []
  if (legacySingleAI && computerTribe !== 1) migrateLegacyComputerTeam(world, computerTribe)
  world.activeCampaignTribe ??= computerTribe
  world.campaignAIs ??= Array(4).fill(null)
  world.campaignAIs[computerTribe] ??= world.ai
  for (const ai of new Set([world.ai, ...world.campaignAIs]))
    if (ai) {
      ai.producers ??= createComputerProducers()
      // Compatibility only: an unestablished old owner has no accumulated
      // radius. Established or malformed history stays unknown. Membership is
      // retained by full-graph cloning, or waits for the next real object turn.
      if (
        [1, 2, 3].includes(world.outcome.level) &&
        ai.constructionBase === undefined &&
        !Object.hasOwn(ai, 'constructionRadius')
      )
        ai.constructionRadius = 0
    }
  world.spellScans ??= Array.from({ length: 4 }, (_, id) =>
    id === computerTribe
      ? world.spellScan
      : { cursor: 0, limit: 0, paused: 0, targets: [0, 0, 0, 0] }
  )
  world.respawns ??= Array.from({ length: 4 }, (_, id) =>
    id === 0 ? (world.respawn ?? 0) : id === computerTribe ? (world.redRespawn ?? 0) : 0
  )
  world.respawnPoints ??= Array.from({ length: 4 }, (_, id) =>
    id === 0 ? world.respawnPoint : id === computerTribe ? world.redRespawnPoint : undefined
  )
  if (legacySingleAI && computerTribe !== 1) {
    world.redRespawn = 0
    delete world.redRespawnPoint
  }
  for (const vehicle of world.vehicles) {
    vehicle.active ??= true
    vehicle.life ??= rules.vehicleLife[vehicle.model]
    vehicle.destructionState ??= 0
  }
  world.unlockedTower ??= false
  world.unlockedTemple ??= false
  world.unlockedSpyHut ??= false
  world.unlockedFirewarriorHut ??= false
  world.unlockedBoatHouse ??= false
  world.unlockedBalloonHut ??= false
  world.buildingDirections.balloonHut ??= 0
  if (!Object.hasOwn(world, 'campaignTimer')) world.campaignTimer = null
  const oldMissionTwo = world.outcome.level === 2 && !Object.hasOwn(world.ai, 'coordinateLatch')
  world.ai.coordinateLatch ??= 0
  if (oldMissionTwo) {
    world.manaTribes[3] = structuredClone(world.manaTribes[1])
    world.castingTribes[3] = structuredClone(world.castingTribes[1])
    world.manaWorld.spells[3] = structuredClone(world.manaWorld.spells[1])
    world.spellCasts[3] = [...world.spellCasts[1]]
    world.killCredits[3] = [...world.killCredits[1]]
    for (const row of world.killCredits) row[3] = row[1]
    world.tribeCount = 4
    world.manaTribes[1].active = false
    Object.assign(world.manaTribes[3], { id: 3, spellOwner: 3, active: true })
    world.ai.pendingCommands = world.ai.pendingCommands.filter(command => {
      if (![1069, 1097].includes(command.opcode)) return true
      campaignCommand(world, command.opcode, command.args)
      return false
    })
  }
  if (world.outcome.level === 2) {
    world.killCredits[0][3] = Math.max(world.killCredits[0][3], world.killCredits[0][1])
    world.killCredits[3][0] = Math.max(world.killCredits[3][0], world.killCredits[1][0])
  }
  migrateLegacyWorshipAppearance(world)
  for (const shrine of world.shrines)
    shrine.ordinarySpellReward ??= restoreOrdinaryWorshipSource(world.outcome.level, shrine)
  // Only recover immutable authored endpoints. Keep active effects and terrain intact.
  migrateLegacyBridgeOrigins(world)
  if (world.outcome.level === 5 && !world.shrines.some(shrine => shrine.kind === 'angel')) {
    const angel = createWorld(5).shrines.find(shrine => shrine.kind === 'angel')!
    world.shrines.push({ ...structuredClone(angel), id: world.nextId++ })
  }
  for (const shrine of world.shrines)
    if (
      !shrine.reward &&
      shrine.kind !== 'bridgeEffect' &&
      shrine.kind !== 'erosionEffect' &&
      shrine.kind !== 'flattenEffect' &&
      shrine.kind !== 'volcanoEffect' &&
      shrine.kind !== 'linkedEffects' &&
      shrine.kind !== 'boat' &&
      shrine.kind !== 'inert' &&
      !(shrine.kind === 'angel' && shrine.angelTarget)
    )
      shrine.reward = shrine.kind === 'vault' ? 'camp' : shrine.kind
  for (const gift of world.gifts) if ((gift.reward as string) === 'vault') gift.reward = 'camp'
  for (const unit of world.units)
    for (const person of [
      unit.native,
      unit.flight,
      unit.entry?.person,
      unit.builder?.person,
      unit.fight?.motion,
      unit.resident?.person,
    ])
      if (person) {
        // Legacy checkpoints predate the native ordinary-person animation gate.
        // Preserve the saved frame/stamp and every active controller alias.
        if (person.class === 1 && person.model >= 2 && person.model <= 7)
          person.flags3 = ((person.flags3 ?? 0) | 0x40000) >>> 0
        if (unit.shield && !unit.bloodlust && (person.flags3 ?? 0) & 0x80000)
          person.flags3 = (((person.flags3 ?? 0) & ~0x80000) | 0x8000) >>> 0
      }
  world.shots.convertWild ??= 0
  world.giftCounts.convertWild ??= 0
  world.shots.hypnotise ??= 0
  world.giftCounts.hypnotise ??= 0
  world.shots.ghostArmy ??= 0
  world.giftCounts.ghostArmy ??= 0
  world.shots.shield ??= 0
  world.giftCounts.shield ??= 0
  world.shots.swarm ??= 0
  world.giftCounts.swarm ??= 0
  world.shots.invisibility ??= 0
  world.giftCounts.invisibility ??= 0
  world.shots.bloodlust ??= 0
  world.giftCounts.bloodlust ??= 0
  world.shots.teleport ??= 0
  world.giftCounts.teleport ??= 0
  world.shots.armageddon ??= 0
  world.giftCounts.armageddon ??= 0
  world.shots.volcano ??= 0
  world.giftCounts.volcano ??= 0
  world.shots.angel ??= 0
  world.giftCounts.angel ??= 0
  // Retire stored legacy bank2 poses through their original shape before
  // registering the world's selected shape, before any restored scene draws.
  syncLandscapeObjects(world)
  const gifts = world.gifts as unknown as (Gift | LegacyGift)[]
  for (const shrine of world.shrines) initializeVaultKnowledge(shrine, world.outcome.level)
  for (const gift of gifts) if (gift.kind === 'gift') initializeVaultKnowledgeGift(world, gift)
  if (!gifts.some(gift => gift.kind !== 'gift')) return world
  world.gifts = []
  for (const saved of gifts) {
    if (saved.kind === 'gift') {
      world.gifts.push(saved)
      continue
    }
    const gift = createGift(world, saved.kind === 'vault' ? 'camp' : saved.kind, saved)
    gift.remaining = saved.remaining
    gift.phase = Math.max(0, Math.min(6, saved.remaining - 76))
  }
  return world
}

// In-memory clone/normalization harness for recorded classic gameplay. It has no
// IndexedDB, UI, profile or production store. Names match shared continuation
// callbacks, but these cases make no shipping Save/Load compatibility claim.
export function createHistoricalFixtureHarness(mission = 1) {
  let world = createWorld(mission, 'classic'),
    checkpoint: World | null = null
  return {
    getWorld: () => world,
    startMission: (level: number) => {
      world = createWorld(level, 'classic')
    },
    async saveCheckpoint() {
      world.capacityPolicy ??= createCapacityPolicy('classic')
      rebuildSecondaryLists(world.secondaryEffects)
      checkpoint = structuredClone(world)
      return true
    },
    loadCheckpoint() {
      if (!checkpoint) return false
      world = normalizeHistoricalFixture(structuredClone(checkpoint))
      return true
    },
  }
}
