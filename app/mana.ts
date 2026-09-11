import rules from './original-rules.json' with { type: 'json' }
import constants from './original-constants.json' with { type: 'json' }
import { currentPersonOrder, type OrderedPerson, type OrderPool } from './person-orders.ts'

export type ManaBuilding = {
  id: number
  model: number
  flags3: number
  activity: number
  trainingCost: number
  storedMana: number
  manaNext: number
}
export type ManaTribe = {
  id: number
  spellOwner: number
  playerType: number
  mana: number
  pending: number
  available: number
  totalProgress: number
  previousRate: number
  estimatedRate: number
  releaseDelay: number
  releaseRate: number
  spellProgress: number[]
  shamanGuards: number
  shamanGuardChanged: number
}
export type SpellStock = { available: number; disabled: number; stocks: number[] }
export type ManaWorld = {
  playerTribe: number
  gameFlags: number
  loadFlags: number
  levelFlags: number
  manaFlags: number
  turn: number
  turnsPerSecond: number
  spells: SpellStock[]
}
export type ManaEffects = {
  notify: (flags: number, message: number) => void
  shouldNotifyFull: () => boolean
}
const short = (n: number) => (n << 16) >> 16
const divide = (a: number, b: number) => Math.trunc(a / b) | 0
const limit = (w: ManaWorld, model: number) =>
  w.gameFlags & 32
    ? rules.spellCharging[model].alternateLimit
    : rules.spellCharging[model].normalLimit
const enabled = (s: SpellStock, model: number) => !(s.disabled & (1 << (model - 1)))
const available = (s: SpellStock, model: number) =>
  !!rules.spellCharging[model].mode && !!(s.available & (1 << model))

export type ManaPerson = Pick<
  OrderedPerson,
  | 'model'
  | 'state'
  | 'flags2'
  | 'flags4'
  | 'assignment'
  | 'commandStatus'
  | 'commands'
  | 'commandCursor'
  | 'immediateCommand'
> & { class: number; tribe: number }

// 0x4df0e0. Cancelled immediate orders suppress queued orders here too.
export function executingPreacherOrder(pool: OrderPool, p: ManaPerson) {
  if (p.state !== 10 && p.state !== 33) return false
  const order = currentPersonOrder(pool, p)
  return !!order && !(order.flags & 1) && [17, 31, 32].includes(order.model)
}

// 0x41af80. Housed/training occupancy is the same inside bit; generation does
// not inspect the building's model, upgrade level, fighting state or animation.
export function personMana(pool: OrderPool, p: ManaPerson) {
  if (p.model === 7) return rules.personMana[7]
  const inside = !!(p.flags2 & 0x800000),
    commanded = !!(p.commandStatus & 255)
  if (p.model === 2) return inside || commanded ? rules.manaBusyBrave : rules.manaIdleBrave
  if (![3, 4, 5, 6].includes(p.model)) return 0
  if (inside) return rules.manaBusyWarrior
  if (!commanded || (p.model === 4 && executingPreacherOrder(pool, p) && !(p.assignment & 64)))
    return rules.manaIdleWarrior
  return rules.manaBusyWarrior
}

// Mana contribution scan in 0x4ecac0. Use native object registration and ghost
// flags; this scan does not apply an extra HP/dead-flag test. Sum before scaling.
export function generatedMana(
  pool: OrderPool,
  people: ManaPerson[],
  tribes: Pick<ManaTribe, 'playerType'>[]
) {
  const totals = [0, 0, 0, 0]
  for (const p of people)
    if (
      p.class === 1 &&
      p.flags4 & 0x20000000 &&
      !(p.flags4 & 0x800) &&
      p.model !== 1 &&
      p.model !== 8
    ) {
      totals[p.tribe] = (totals[p.tribe] + personMana(pool, p)) | 0
    }
  return totals.map((n, i) =>
    divide(
      Math.imul(n, tribes[i].playerType === 2 ? rules.humanManaFactor : rules.computerManaFactor),
      256
    )
  )
}

// 0x4ecac0 generation gate and commit. Other counter/list rebuild work is separate.
export function generateFollowerMana(
  w: Pick<ManaWorld, 'gameFlags' | 'turn'>,
  tribes: ManaTribe[],
  people: ManaPerson[],
  pool: OrderPool
) {
  if (w.gameFlags & 32 || w.turn & rules.manaUpdateMask) return
  const totals = generatedMana(pool, people, tribes)
  tribes.forEach((t, i) => {
    t.available = (t.available + totals[i]) | 0
    t.previousRate = totals[i]
    t.estimatedRate = 0
  })
}

// 0x41ad70 plus 0x4c2ca0/0x4c2d50. Tied costs retain the first spell.
export function chargingSpells(w: ManaWorld, owner: number) {
  const s = w.spells[owner]
  let active = 0,
    paused = 0,
    highest = 0,
    highestCost = 0
  for (let model = 1; model < 22; model++) {
    const d = rules.spellCharging[model]
    if (
      !available(s, model) ||
      (d.mode === 2 && !(w.gameFlags & 256)) ||
      (s.stocks[model] & 15) >= limit(w, model)
    )
      continue
    if (!enabled(s, model)) paused++
    else {
      active++
      if (highestCost < (d.cost | 0)) {
        highestCost = d.cost | 0
        highest = model
      }
    }
  }
  return { active, paused, highest }
}

// 0x41a590. Building iteration must follow the tribe's original linked-list order.
// Inactive refunds only occur when incoming mana is nonzero. Active huts are
// linked in reverse order for both allocation passes.
export function distributeMana(
  w: ManaWorld,
  t: ManaTribe,
  buildings: ManaBuilding[],
  effects: ManaEffects
) {
  const local = t.id === w.playerTribe
  if (local) w.manaFlags = (w.manaFlags & ~1) >>> 0
  if (short(t.releaseDelay)) t.releaseDelay = (t.releaseDelay - 1) & 65535
  else if (t.pending) {
    if (!short(t.releaseRate)) {
      t.releaseRate =
        divide(t.pending, 1500) < 24 ? Math.max(1, short(divide(t.pending, 24))) & 65535 : 1500
      if (divide(t.pending, 1500) > 240) t.releaseRate = divide(t.pending, 240) & 65535
    }
    const released = Math.min(t.pending, short(t.releaseRate))
    t.available = (t.available + released) | 0
    t.pending = (t.pending - released) | 0
    if (!t.pending) t.releaseRate = 0
  }
  if (!t.available) return
  const training: ManaBuilding[] = []
  for (const b of buildings) {
    if (!(rules.buildingFlags[b.model] & 1)) continue
    b.flags3 = (b.flags3 & ~0x1000) >>> 0
    if (!(b.activity & 128)) {
      const refund = Math.min(100, b.storedMana)
      t.available = (t.available + refund) | 0
      b.storedMana = (b.storedMana - refund) & 65535
    } else {
      b.manaNext = training.at(-1)?.id ?? 0
      training.push(b)
    }
  }
  training.reverse()
  let trainingCount = training.length
  const fund = (b: ManaBuilding, share: number) => {
    let used: number
    if (share < 1) used = Math.max(share, -b.storedMana)
    else {
      used = b.trainingCost - b.storedMana
      const capped = Math.min(share, b.trainingCost >> 5)
      if (capped <= used) {
        used = capped
        if (capped < 33) b.flags3 = (b.flags3 | 0x1000) >>> 0
      }
    }
    b.storedMana = (b.storedMana + used) & 65535
    t.available = (t.available - used) | 0
  }
  let half = 0
  if (trainingCount) {
    half = divide(Math.imul(t.available, 128), 256)
    const share = divide(half, trainingCount)
    if (share) for (const b of training) fund(b, share)
  }
  if (t.playerType === 1) {
    t.mana = Math.min(constants.MAX_MANA, Math.max(0, (t.mana + t.available) | 0))
    t.available = 0
    return
  }

  const s = w.spells[t.spellOwner],
    charging = chargingSpells(w, t.spellOwner)
  if (charging.active && charging.highest) {
    const d = rules.spellCharging[charging.highest],
      rate = short(d.rate)
    if (rate) {
      let estimate = 0
      const interval = divide(Math.imul(w.turnsPerSecond, rate), rules.manaUpdateMask + 1)
      if (interval) estimate = (divide(Math.imul(d.cost, charging.active), interval) + half) | 0
      t.estimatedRate = estimate
      if (
        !(w.loadFlags & 0x4000000) &&
        local &&
        t.previousRate <= divide(Math.imul(estimate, 38), 256) &&
        w.turn > 1439
      )
        effects.notify(0x800000, 0x25d)
    }
  }
  if (t.available < 1) {
    if (t.available < 0) {
      t.available = -t.available | 0
      let retry = t.available > 0
      while (retry) {
        retry = false
        const charged: number[] = []
        for (let model = 1; model < 22; model++)
          if (available(s, model) && t.spellProgress[model] > 0) charged.push(model)
        if (!charged.length) t.available = 0
        else if (charged.length < t.available) {
          const share = divide(t.available, charged.length)
          for (const model of charged) {
            t.spellProgress[model] = (t.spellProgress[model] - share) | 0
            t.available = (t.available - share) | 0
            if (t.spellProgress[model] < 0) {
              retry = true
              t.available = (t.available - t.spellProgress[model]) | 0
              t.spellProgress[model] = 0
            }
          }
        }
      }
    }
  } else {
    let retry = true
    while (retry) {
      retry = false
      const { active, paused } = chargingSpells(w, t.spellOwner)
      if (!active) {
        if (trainingCount) {
          trainingCount = training.filter(b => b.storedMana < b.trainingCost).length
          const share = trainingCount ? divide(t.available, trainingCount) : 0
          if (share > 0) for (const b of training) if (b.storedMana < b.trainingCost) fund(b, share)
        }
        t.available = 0
        if (local && trainingCount < 1 && paused > 0) {
          w.manaFlags = (w.manaFlags | 1) >>> 0
          if (effects.shouldNotifyFull()) {
            w.levelFlags = (w.levelFlags | 0x1000000) >>> 0
            effects.notify(0x4000000, 0x4a3)
          }
        }
      } else if (active < t.available) {
        const share = divide(t.available, active)
        for (let model = 1; model < 22; model++) {
          const d = rules.spellCharging[model]
          if (!available(s, model) || (d.mode === 2 && !(w.gameFlags & 256)) || !enabled(s, model))
            continue
          const maximum = limit(w, model)
          let stock = s.stocks[model] & 15,
            added = false
          if (stock < maximum) {
            t.spellProgress[model] = (t.spellProgress[model] + share) | 0
            t.available = (t.available - share) | 0
            while (stock < maximum && t.spellProgress[model] >= (d.cost | 0)) {
              if (stock === 15 || !d.cost)
                throw new RangeError('Native spell charging cannot progress with this descriptor')
              stock++
              s.stocks[model] = (s.stocks[model] & 240) | stock
              added = true
              t.spellProgress[model] = (t.spellProgress[model] - d.cost) | 0
            }
          }
          if (added && stock >= maximum) {
            retry = true
            t.available = (t.available + t.spellProgress[model]) | 0
            t.spellProgress[model] = 0
          }
        }
      }
    }
  }
  t.totalProgress = 0
  for (let model = 1; model < 22; model++)
    if (available(s, model)) t.totalProgress = (t.totalProgress + t.spellProgress[model]) | 0
  t.available = 0
}
