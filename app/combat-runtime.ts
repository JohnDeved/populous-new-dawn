import { tribeForTeam, type Unit, type World, type Battle, type Building } from './world-types.ts'
import constants from './original-constants.json' with { type: 'json' }
import { maxHp } from './world-rules.ts'
import rules from './original-rules.json' with { type: 'json' }
import { type MeleeAttack, meleeDuration, chooseMeleeAttack } from './melee.ts'
import { nativeAngle, nativeStep, random, short } from './native-math.ts'
import { nativePersonTribe, nativePersonModel } from './live-combat.ts'
import { creditCampaignAttackTask } from './campaign-runtime.ts'
import { effect, sound } from './world-effects.ts'
import { nativePosition } from './world-terrain-runtime.ts'
import { relocateFight } from './melee-placement.ts'
import {
  collisionWorld,
  enterLiveCombat,
  setLivePersonAnimation,
  createMeleePerson,
  createLivePerson,
  stepLiveEncounter,
  startMeleeKnockback,
  approachLiveMelee,
} from './live-people.ts'
import { buildingOutsidePoint, buildingPose } from './building-shapes.ts'
import { terrainPointHeight } from './native-terrain.ts'
import { browserPosition } from './world-coordinates.ts'
import { EncounterPhase } from './melee-encounter.ts'
import { release, clearFightAssignment } from './world-tasks.ts'
import { stopPersonMovement, setPersonAnimationRow } from './person-state.ts'
import {
  type MeleeGroup,
  joinMeleeGroup,
  type FightParticipant,
  cleanFightRoster,
  releaseFightRoster,
  fightCenter,
} from './melee-groups.ts'

export function meleeDamage(u: Unit) {
  const base =
    u.kind === 'warrior'
      ? constants.FIGHT_DAMAGE_WARR
      : u.kind === 'shaman'
        ? constants.FIGHT_DAMAGE_SHAMAN
        : u.kind === 'preacher'
          ? constants.FIGHT_DAMAGE_PREACH
          : constants.FIGHT_DAMAGE_BRAVE
  const damage = Math.max(32, Math.floor((base * u.hp) / maxHp(u.kind)))
  return (u.bloodlust ? damage * constants.BLOODLUST_DAMAGE_X : damage) / 20
}
export function applyUnitDamage(u: Unit, damage: number, mode = 0) {
  if (!mode && u.shield) return false
  let amount = Math.round(damage * 20)
  if (u.bloodlust) amount >>= rules.bloodlustDamageShift & 31
  u.hp = Math.max(0, (Math.round(u.hp * 20) - amount) / 20)
  return true
}
function meleeExchange(w: World, u: Unit, target: Unit, action: MeleeAttack) {
  // 0x518fb0 states 2/3/4; 0x4a39c0 calculates both damages before applying either.
  const damage = meleeDamage(u),
    counter = meleeDamage(target)
  u.heading =
    Math.PI -
    (nativeAngle(Math.round((target.x - u.x) * 256), Math.round((target.z - u.z) * 256)) *
      Math.PI) /
      1024
  u.fight = {
    motion: u.fight!.motion,
    group: u.fight!.group,
    opponent: target.id,
    action,
    animation: action,
    started: w.turn,
    remaining: meleeDuration(u.kind, action) - 1,
  }
  // Busy opponents take damage without losing their current action or facing.
  const defending = target.fight?.action === 'ready'
  if (defending && target.fight) {
    const knockback =
      action === 'attack' && target.kind !== 'shaman' && !(w.manaWorld.gameFlags & 64)
    target.heading = u.heading + Math.PI
    target.fight = {
      motion: target.fight.motion,
      group: target.fight.group,
      opponent: u.id,
      action: 'recoil',
      animation: 'idle',
      started: w.turn,
      knockback,
    }
  }
  for (const fighter of defending ? [u, target] : [u]) {
    const p = fighter.fight?.motion
    if (p && fighter.fight!.action !== 'approach' && fighter.fight!.action !== 'ready') {
      p.speed = 0
      p.heading = p.angle = Math.round(((Math.PI - fighter.heading) * 1024) / Math.PI) & 2047
      p.turnAngle = p.heading
      p.flags2 = (p.flags2 | 0x1080) >>> 0
    }
  }
  const targetHp = target.hp
  if (target.fight?.motion) target.fight.motion.damageAttacker = nativePersonTribe(u)
  applyUnitDamage(target, damage, 1)
  if (targetHp > 0 && target.hp === 0)
    creditCampaignAttackTask(w, u.id, rules.personModels[nativePersonModel(target)].fightRank)
  const unitHp = u.hp
  if (action !== 'special') {
    if (u.fight?.motion) u.fight.motion.damageAttacker = nativePersonTribe(target)
    applyUnitDamage(u, counter, 1)
  }
  if (action !== 'special' && unitHp > 0 && u.hp === 0)
    creditCampaignAttackTask(w, target.id, rules.personModels[nativePersonModel(u)].fightRank)
  effect(w, 'hit', target)
  if (action !== 'special') effect(w, 'hit', u)
}
export function fightPosition(b: Battle, index: number) {
  return index === 0
    ? { x: b.x, z: b.z }
    : nativeStep(
        b,
        b.angle + (b.members.length === 3 ? [0, 0, 512][index] : [0, 0, 682, 1365][index]),
        180
      )
}
function relocateBattle(w: World, b: Battle, force = false) {
  const p = nativePosition(w, b),
    cell = (p: { x: number; y: number }) => ((p.y & 65535) >> 9) * 128 + ((p.x & 65535) >> 9)
  if (!force && w.turn & 31 && !(w.land.flags[cell(p)] & 512)) return
  // Only build the occupancy index on a relocation visit. Earlier groups have
  // already moved, so later groups see their current cells, as in the original.
  const occupied = new Set(w.fights.filter(a => a !== b).map(a => cell(nativePosition(w, a))))
  const fight = {
    ...p,
    id: b.id,
    angle: b.angle,
    counter: w.turn,
    model: 8,
    tribe: 255,
    flags2: 0,
    flags4: 0,
    workTarget: 0,
    target: 0,
  }
  // ponytail: class allocation/scheduler phase is still adapted to the world
  // turn; replace this phase when native mixed-class object ownership lands.
  relocateFight(
    {
      collision: collisionWorld(w),
      search: w.indexedSearch,
      occupied: p => occupied.has(cell(p)),
      outside: id => {
        const building = w.buildings.find(b => b.id === id)
        if (!building) throw new Error(`Missing fight-site building ${id}`)
        return buildingOutsidePoint(buildingPose(building))
      },
      height: p => terrainPointHeight(w.land, p),
    },
    fight,
    force
  )
  Object.assign(b, browserPosition(fight))
}
export function joinBattle(
  w: World,
  u: Unit,
  target: Unit,
  structure?: Building,
  mode = structure ? 1 : 0
) {
  if (u.ghost || target.ghost) {
    if (u.ghost) u.hp = 0
    if (target.ghost) target.hp = 0
    return
  }
  let b = w.fights.find(b => b.id === target.fight?.group)
  if (b) {
    if (b.encounter) return // A model-9 encounter already owns both participants.
    reinforceBattle(w, b, u)
    return
  } else {
    b = {
      id: w.nextId++,
      members: [u.id, target.id],
      encounter: [u.id, target.id],
      encounterBuilding: structure?.id,
      x: target.x,
      z: target.z,
      angle: 0,
    }
    w.fights.push(b)
    for (const [person, opponent, phase] of [
      [u, target, EncounterPhase.Approach],
      [target, u, EncounterPhase.Wait],
    ] as const) {
      const motion = enterLiveCombat(w, person, 29)
      release(w, person, true)
      if (person.native === motion) person.native = null
      motion.substate =
        mode === 1
          ? EncounterPhase.EjectDefender
          : mode === 2
            ? EncounterPhase.EnterBuilding
            : phase
      motion.flags2 = (motion.flags2 | 0x40000000) >>> 0
      motion.workFlags = b.id
      person.fight = {
        group: b.id,
        opponent: opponent.id,
        action: 'encounter',
        started: w.turn,
        motion,
      }
    }
    // 0x51e150 stops the defender before visiting the encounter immediately.
    stopPersonMovement(target.fight!.motion!, (_, object) =>
      setLivePersonAnimation(w, target.fight!.motion!, object)
    )
    processEncounter(w, b)
    return
  }
}

// Persistent native slots remain separate from the center-first presentation order.
function reinforceBattle(w: World, b: Battle, recruit: Unit) {
  b.slots ??= [...b.members, ...Array(6 - b.members.length).fill(0)]
  const units = new Map(
    w.units.filter(u => b.slots!.includes(u.id) || u === recruit).map(u => [u.id, u])
  )
  const people = new Map(
    [...units.values()].map(u => [
      u.id,
      u.fight
        ? (u.fight.motion ??= createMeleePerson(w, u))
        : (u.native ?? u.entry?.person ?? createLivePerson(w, u)),
    ])
  )
  b.tribes ??= [...new Set(b.members.map(id => people.get(id)!.tribe))]
  const group: MeleeGroup = {
    id: b.id,
    members: b.slots,
    tribes: b.tribes,
    center: b.center ?? b.members[0],
    count: b.slots.filter(Boolean).length,
    angle: b.angle,
  }
  const state = { randomState: w.randomState, objects: people }
  let created: MeleeGroup | undefined
  const admitted = joinMeleeGroup(state, group, people.get(recruit.id)!, {
    enter: p => {
      enterLiveCombat(w, recruit, 25, people.get(p.id)!)
      state.randomState = w.randomState
      release(w, recruit, true)
      recruit.native = null
    },
    // ponytail: browser group allocation is unbounded; replace with the native
    // mixed-class pool when its ownership/limits are integrated.
    allocate: () =>
      (created = {
        id: w.nextId++,
        members: [],
        tribes: [],
        count: 0,
        center: 0,
        angle: 0,
      }),
  })
  if (!admitted) return
  w.randomState = state.randomState
  b.center = group.center
  b.members = group.members.filter(Boolean)
  if (created)
    w.fights.push({
      id: created.id,
      x: b.x,
      z: b.z,
      angle: created.angle,
      center: 0,
      members: created.members.filter(Boolean),
      slots: created.members,
      tribes: created.tribes,
    })
  for (const [id, p] of people) {
    const u = units.get(id)!
    if (!p.workFlags) {
      clearFightAssignment(u)
      continue
    }
    if (u === recruit || p.workFlags !== u.fight?.group) {
      const battle = w.fights.find(fight => fight.id === p.workFlags)!
      const opponent = battle.members.find(id => people.get(id)!.tribe !== p.tribe)!
      u.fight = {
        group: battle.id,
        opponent,
        action: 'approach',
        animation: 'idle',
        started: w.turn,
        motion: p,
      }
    }
  }
}

function processEncounter(w: World, b: Battle) {
  const [attacker, defender] = b.encounter!.map(id => w.units.find(u => u.id === id)!)
  const outcome = stepLiveEncounter(w, attacker, defender, b.encounterBuilding)
  if (outcome === 'waiting') return
  if (outcome === 'cancelled') {
    for (const u of [attacker, defender]) clearFightAssignment(u)
    b.members = []
    return
  }
  // 0x51de60: the defender becomes the first member and original fight center.
  // Class allocation order/counter phase still belong to the browser adapter.
  b.id = w.nextId++
  b.members = [defender.id, attacker.id]
  b.slots = [...b.members, 0, 0, 0, 0]
  b.tribes = [defender.fight!.motion!.tribe, attacker.fight!.motion!.tribe]
  b.center = 0
  b.x = defender.x
  b.z = defender.z
  delete b.encounter
  delete b.encounterBuilding
  for (const [u, target] of [
    [attacker, defender],
    [defender, attacker],
  ]) {
    const motion = enterLiveCombat(w, u, 25)
    motion.workFlags = b.id
    u.fight = {
      group: b.id,
      opponent: target.id,
      action: 'approach',
      animation: 'idle',
      started: w.turn,
      motion,
    }
  }
  b.angle = random(w) % 360
  relocateBattle(w, b, true)
}
export function cleanBattles(w: World) {
  const rosters = new Map<number, number[]>()
  if (!w.fights.length) return rosters
  const units = new Map(w.units.map(u => [u.id, u])),
    people = new Map<number, FightParticipant>()
  for (const u of w.units) {
    const p = u.flight ?? u.fight?.motion ?? u.native ?? u.entry?.person
    people.set(u.id, {
      ...nativePosition(w, u),
      id: u.id,
      class: p?.class ?? 1,
      tribe: u.team === 'wild' ? 255 : tribeForTeam(u.team),
      state: p?.state ?? (u.fight ? 25 : 10),
      flags2: p?.flags2 ?? 0,
      life: short(Math.round(u.hp * 20)),
      workFlags: p?.workFlags ?? u.fight?.group ?? 0,
    })
  }
  for (const b of w.fights) {
    if (b.encounter) {
      // Model-9 encounters have their own two-person controller, not model-8 slots.
      if (
        b.members.every(id => {
          const u = units.get(id)
          return u && u.hp > 0 && u.fight?.group === b.id
        })
      )
        continue
      for (const id of b.members) {
        const u = units.get(id)
        if (u?.fight?.group === b.id) {
          clearFightAssignment(u)
          people.get(id)!.workFlags = 0
        }
      }
      b.members = []
      continue
    }
    const reservation = b.attackReservation ?? { flags4: 0, reactionTimer: 0, reactionDuration: 0 }
    const group = {
      ...nativePosition(w, b),
      ...reservation,
      id: b.id,
      members: b.slots ?? [...b.members, ...Array(6 - b.members.length).fill(0)],
      tribes: b.tribes ?? [255, 255],
      count: b.members.length,
      winner: b.winner ?? 255,
    }
    const result = cleanFightRoster(group, people)
    b.slots = group.members
    b.tribes = group.tribes
    b.winner = group.winner
    reservation.flags4 = group.flags4
    reservation.reactionTimer = group.reactionTimer
    if (result.active) rosters.set(b.id, result.people.filter(Boolean))
    b.members = result.active ? b.members.filter(id => result.people.includes(id)) : []
    if (!result.active) {
      releaseFightRoster(group, people)
      if (group.winner !== 255)
        w.stats.battlesWon[group.winner] = (w.stats.battlesWon[group.winner] + 1) | 0
    }
  }
  for (const [id, p] of people) {
    const u = units.get(id)!,
      motion = u.flight ?? u.fight?.motion ?? u.native ?? u.entry?.person
    if (motion) motion.workFlags = p.workFlags
    if (u.fight && motion && motion.state !== 29 && !(rules.personStateFlags[motion.state] & 16))
      u.fight = null
  }
  // An airborne encounter can finish its impulse during the cleanup pass above.
  // Drop that model-9 group before processBattles visits its now-released person.
  for (const b of w.fights) {
    if (
      !b.encounter ||
      b.members.every(id => {
        const u = units.get(id)
        return u?.fight?.group === b.id && u.fight.motion
      })
    )
      continue
    for (const id of b.members) {
      const u = units.get(id)
      if (u?.fight?.group === b.id) clearFightAssignment(u)
    }
    b.members = []
  }
  w.fights = w.fights.filter(b => b.members.length > 1)
  return rosters
}
export function processBattles(w: World) {
  const rosters = cleanBattles(w)
  for (const b of w.fights) {
    if (b.encounter) {
      processEncounter(w, b)
      continue
    }
    if (!w.attackAlert && b.tribes!.includes(w.manaWorld.playerTribe)) {
      const p = nativePosition(w, b)
      w.attackAlert = 1
      w.attackCell = ((p.x >>> 8) | (p.y & 0xff00)) & 0xfefe
      w.manaTribes[w.manaWorld.playerTribe].flags2 =
        (w.manaTribes[w.manaWorld.playerTribe].flags2 | 0x8000) >>> 0
    }
    const ids = rosters.get(b.id)!,
      members = ids.map(id => w.units.find(u => u.id === id)!)
    const center = fightCenter(
      { members: b.slots!, tribes: b.tribes!, count: members.length },
      ids,
      new Map(members.map(u => [u.id, { tribe: tribeForTeam(u.team) }]))
    )
    if (center.index > 0) [members[0], members[center.index]] = [members[center.index], members[0]]
    if ((b.center ?? b.members[0]) !== center.id) {
      b.x = members[0].x
      b.z = members[0].z
      b.angle = (b.angle + 1024) & 2047
    }
    b.center = center.id
    b.members = members.map(u => u.id)
    if ((w.turn & 31) === 0 && (random(w) & 1) === 0) {
      const r = (random(w) % 341) + 113
      b.angle = (b.angle + (r & 1 ? -r : r)) & 2047
    }
    relocateBattle(w, b)
    let recenter = false
    for (let i = 0; i < members.length; i++) {
      const u = members[i],
        f = u.fight!
      // Cleanup retains airborne/reaction states, but only state 25 takes fight actions.
      if (
        u.hp <= 0 ||
        !f ||
        ((u.flight ?? f.motion)?.state ?? 25) !== 25 ||
        f.action === 'encounter'
      )
        continue
      if (nativePersonTribe(u) === w.manaWorld.playerTribe) w.musicActivity = 2
      if (f.action === 'push') {
        if (f.remaining === undefined) {
          startMeleeKnockback(w, u)
          f.remaining = 2
        }
        const person = u.flight
        if (f.remaining > 0) {
          f.remaining--
          if (!f.remaining && person) {
            person.speed = 0
            setPersonAnimationRow(person, person.cargo ? 5 : 1, (_, object) =>
              setLivePersonAnimation(w, person, object)
            )
          }
        } else if (!person || !(person.flags2 & 0x80000)) {
          f.motion = u.flight
          u.flight = undefined
          f.action = 'approach'
          f.animation = 'walk'
          recenter = true
        }
        continue
      }
      if (f.action !== 'approach' && f.action !== 'ready') {
        if (f.remaining === undefined) {
          f.remaining = meleeDuration(u.kind, f.action, f.knockback)
          f.started = w.turn
          f.animation = f.action
        }
        f.remaining = short(f.remaining - 1)
        if (f.remaining > 0) continue
        // 0x518fb0 expires the action here; approach resumes next turn.
        if (f.action === 'attack' || f.action === 'special') sound(w, 0xd, u)
        if (f.action === 'strike') {
          const target = w.units.find(a => a.id === f.opponent)
          if (u.kind === 'warrior') {
            sound(w, target?.kind === 'warrior' ? 0x27 : 0x2b, u)
            if (target && target.kind !== 'warrior') sound(w, 0x32, target)
          } else sound(w, 0xe, u)
        }
        f.action = f.action === 'recoil' && f.knockback ? 'push' : 'approach'
        f.remaining = undefined
        continue
      }
      if (
        !approachLiveMelee(
          w,
          u,
          nativePosition(w, fightPosition(b, i)),
          nativePosition(w, b),
          i !== 0
        )
      )
        continue
      const choice = random(w) & 15,
        targetIndex = i === 0 ? 1 + (random(w) % (members.length - 1)) : 0,
        target = members[targetIndex]
      if (target.hp <= 0) continue
      const ready = target.fight?.action === 'ready'
      let slotDistanceSquared = 0
      if (!ready && choice < 4) {
        const slot = fightPosition(b, targetIndex),
          slotDx = short(Math.round((slot.x - target.x) * 256)),
          slotDz = short(Math.round((slot.z - target.z) * 256))
        slotDistanceSquared = (slotDx * slotDx + slotDz * slotDz) | 0
      }
      const action = chooseMeleeAttack(
        u.kind,
        choice,
        { ready, fighting: !!target.fight, slotDistanceSquared },
        members.length
      )
      if (action) meleeExchange(w, u, target, action)
    }
    if (recenter) {
      const p = nativePosition(w, b)
      Object.assign(b, browserPosition({ x: (p.x & 0xfe00) + 256, y: (p.y & 0xfe00) + 256 }))
    }
  }
  w.fights = w.fights.filter(b => b.members.length > 1)
}
