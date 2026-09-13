import rules from './original-rules.json' with { type: 'json' }
import { random } from './native-math.ts'
import { buildingModel } from './building-shapes.ts'
import { buildingHp } from './world-rules.ts'
import type { Building } from './world-types.ts'

const short = (n: number) => (n << 16) >> 16
const byte = (n: number) => (n << 24) >> 24
export interface DefeatEntity {
  id: number
  class: number
  model: number
  tribe: number
  flags4: number
  hp: number
  buildingFlags: number
  damage: number
  internalModel: number
}

// Complete 0x41b8b0. Allocation owns the native initialization stack; its
// five-word record and the reveal request retain their original order.
export function defeatTribe<T extends DefeatEntity>(
  w: { turn: number; lastDefeated: number; skyCounter: number; units: T[] },
  tribe: number,
  flags: number,
  position: { x: number; y: number; h: number },
  effects: {
    allocate: (tribe: number, record: number[]) => void
    reveal: (position: { x: number; y: number; h: number }) => void
    remove: (p: T) => void
  }
) {
  tribe = byte(tribe)
  w.lastDefeated = tribe
  if (w.turn >>> 0 > 32) w.skyCounter = 20
  if (!(flags & 0x10000)) {
    effects.allocate(tribe, [tribe, 0, 0, 0, 0])
    effects.reveal(position)
  }
  // Removal callbacks may mutate the live list.
  const units = [...w.units]
  for (const p of units)
    if (p.tribe === tribe) {
      if (p.class === 1) {
        if (p.flags4 & 0x800) effects.remove(p)
        else if (p.model === 8) p.hp = 2
      } else if (p.class === 2) {
        p.buildingFlags |= 64
        p.damage = short(rules.buildingDamageThreshold[p.model] - (p.id & 15) * 16)
      } else if (p.class === 10 && p.model === 12 && p.internalModel === 7) effects.remove(p)
    }
}

export interface DamageBuilding {
  model: number
  state: number
  flags2: number
  flags3: number
  buildingFlags: number
  counter: number
  damage: number
  stage: number
  attacker: number
  occupants: number
}
export interface BuildingPlan {
  remaining: number
  repairDelay: number
  attacker: number
}
export interface BuildingBurn {
  remaining: number
  soundPlaying: boolean
}

// Complete 0x407810: renew shaking without resetting a shake already in progress.
export function shakeBuilding(
  b: {
    state: number
    buildingFlags: number
    renderFlags: number
    tilt: number
    roll: number
    remaining: number
  },
  duration: number
) {
  if (b.state === 4) return
  if (!(b.buildingFlags & 2)) {
    b.renderFlags &= ~32
    b.buildingFlags |= 2
    b.tilt = 0
    b.roll = 0
  }
  b.remaining = duration > 0 ? byte(duration) : 16
}

// 0x403280's fixed-turn defence gate and shake, before damage processing.
export function stepBuildingShake(
  b: { buildingFlags: number; renderFlags: number; tilt: number; roll: number; remaining: number },
  counter: number
) {
  if (!(counter & 31)) b.buildingFlags |= 4
  b.buildingFlags &= ~1
  if (!(b.buildingFlags & 2)) return
  b.remaining = byte(b.remaining - 1)
  if (b.remaining < 1) {
    b.renderFlags |= 32
    b.tilt = 0
    b.roll = 0
    b.buildingFlags &= ~2
  } else {
    b.roll = counter & 2 ? 2 : -2
    b.tilt = (counter + 1) & 2 ? 2 : -2
  }
}

// Complete 0x409140. Strikes accumulate damage; the building update applies it.
export function damageBuildingByPerson(
  w: {
    levelFlags2: number
    playerTribe: number
    attackAlert: number
    attackCell: number
    tribes: { flags: number }[]
  },
  b: { x: number; y: number; tribe: number; flags3: number; damage: number; attacker: number },
  p: { model: number; tribe: number }
) {
  if (w.levelFlags2 & 0x4000000 || b.flags3 & 128) return
  b.damage = short(b.damage + rules.personBuildingDamage[p.model])
  if (p.tribe !== -1) b.attacker = p.tribe & 255
  if (b.tribe === w.playerTribe && !w.attackAlert) {
    w.attackAlert = 1
    w.attackCell = ((b.x >>> 8) | (b.y & 0xff00)) & 0xfefe
    w.tribes[w.playerTribe].flags = (w.tribes[w.playerTribe].flags | 0x8000) >>> 0
  }
}

// 0x408cb0: protected models and buildings already burning ignore ignition.
export function igniteBuilding(b: DamageBuilding, attacker: number, start: () => void) {
  if (rules.buildingFlags[b.model] & 0x10000 || b.state === 4) return
  if (!(b.flags2 & 0x100000)) {
    b.state = 4
    b.buildingFlags &= ~2
    start()
  }
  if (byte(attacker) !== -1) b.attacker = attacker & 255
}

// 0x408ab0: eject at 119, remove one structural log at 79, finish at zero.
// Plan allocation, smoke, linked occupants and audio stay with their world owners.
export function stepBuildingBurn(
  b: DamageBuilding,
  burn: BuildingBurn,
  effects: { eject: () => void; sound: () => void; damage: () => void; finish: () => void }
) {
  burn.remaining = byte(burn.remaining - 1)
  if (burn.remaining < 1) {
    if (!(b.flags2 & 0x100000)) {
      b.state = 1
      effects.finish()
    }
    return
  }
  if (burn.remaining === 119 && b.occupants) effects.eject()
  if (burn.remaining >= 80) {
    if (!burn.soundPlaying) effects.sound()
  } else if (burn.remaining === 79) effects.damage()
}

export function buildingWorkStage(remaining: number, life: number) {
  if (remaining >= life) return 4
  if (remaining < 1) return 0
  return Math.max(0, Math.min(3, byte(Math.trunc((remaining * 4 - 1) / (life - 1)))))
}

export function ensureBuildingDamage(b: Building) {
  if (b.damageState) return b.damageState
  const model = buildingModel(b)
  const remaining = Math.trunc(
    Math.min(b.progress, b.hp / buildingHp(b.kind)) * rules.buildingLife[model]
  )
  return (b.damageState = {
    model,
    state: b.progress === 1 ? 2 : 1,
    flags2: 0,
    flags3: 0,
    buildingFlags: 0,
    counter: b.counter,
    damage: 0,
    renderFlags: 32,
    tilt: 0,
    roll: 0,
    remaining: 0,
    stage: buildingWorkStage(remaining, rules.buildingLife[model]),
    attacker: 255,
    occupants: 0,
    plan: { remaining, repairDelay: 0, attacker: 255 },
  })
}

// Complete 0x4ba2c0 with the caller's resolved live building and overlay.
// Positive work and negative damage share this routine and signed-short storage.
export function changeBuildingWork(
  plan: BuildingPlan,
  amount: number,
  b: DamageBuilding | null,
  overlay: { stage: number } | null,
  effects: {
    move: (b: DamageBuilding) => void
    release: (b: DamageBuilding) => void
    init: (b: DamageBuilding) => void
  }
) {
  if (!amount) return false
  plan.remaining = short(plan.remaining + short(amount))
  if (!b) return false
  const old = b.stage,
    life = rules.buildingLife[b.model]
  let destroyed = false
  b.stage = buildingWorkStage(plan.remaining, life)
  if (plan.remaining < life) {
    destroyed = plan.remaining < 1
    if (b.stage !== old) effects.move(b)
  } else {
    if (!(b.flags2 & 0x100000)) {
      effects.release(b)
      b.state = 2
      effects.init(b)
    }
  }
  const changed = destroyed || b.stage !== old
  if (changed && overlay) overlay.stage = b.stage
  if (amount > 0) {
    plan.attacker = 255
    b.attacker = 255
  }
  return changed
}

// Collapse accumulation in 0x403280, immediately before 0x4092a0.
export function advanceCollapse(w: { randomState: number }, b: DamageBuilding) {
  if (b.buildingFlags & 64) b.damage = short(b.damage + (random(w) & 127) + 24)
}

// Complete 0x4092a0. Plan creation/lookup, linked occupants, graphics, AI
// responder eligibility and removal remain explicit world consumers.
export function processBuildingDamage(
  w: { randomState: number; tribes: { playerType: number; people: number[] }[] },
  b: DamageBuilding,
  effects: {
    ensurePlan: () => void
    plan: () => BuildingPlan | null
    changeWork: (plan: BuildingPlan, amount: number) => boolean
    removeOccupant: () => void
    smoke: () => { duration: number } | null
    debris: (oldStage: number) => void
    canRespond: (person: number) => boolean
    reserve: (person: number) => void
    removePlan: (plan: BuildingPlan) => void
    removeBuilding: () => void
    notify: () => void
    sound: () => void
  }
) {
  if (b.flags3 & 128) return
  const { model } = b
  const threshold = rules.buildingDamageThreshold[model]
  if (!(b.counter & 3) && short(b.damage)) b.damage = short(b.damage - 1)
  if ((b.damage & 65535) < threshold) return
  const oldStage = byte(b.stage)
  effects.ensurePlan()
  const plan = effects.plan()
  if (!plan) return
  if (rules.buildingFlags[model] & 0x80000) plan.remaining = 0
  if (effects.changeWork(plan, -100)) {
    if (oldStage > 2) while (b.occupants) effects.removeOccupant()
    const smoke = effects.smoke()
    if (smoke) smoke.duration = short((random(w) & 255) + rules.buildingSmokeDuration)
    effects.debris(oldStage)
  }
  plan.repairDelay = short(rules.buildingRepairDelay)
  if (byte(b.attacker) !== -1) plan.attacker = b.attacker
  for (const t of w.tribes)
    if (t.playerType === 1)
      for (const person of t.people)
        if (effects.canRespond(person)) {
          effects.reserve(person)
          break
        }
  b.damage = short(b.damage - threshold)
  if (short(plan.remaining) < 1) {
    effects.removePlan(plan)
    effects.notify()
    effects.removeBuilding()
  }
  if (byte(b.stage) > 0) effects.sound()
}
