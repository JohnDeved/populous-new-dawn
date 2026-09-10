import rules from './original-rules.json' with { type: 'json' }
import { availableFightSlot } from './combat-targets.ts'
import { random } from './native-math.ts'

export interface MeleeMember {
  id: number
  model: number
  tribe: number
  flags2: number
  substate: number
  workFlags: number
  workTarget: number
}
export interface MeleeGroup {
  id: number
  members: number[] // Six persistent slots; empty slots retain their position.
  tribes: number[]
  count: number
  center: number
  angle: number
}
interface GroupWorld {
  randomState: number
  objects: ReadonlyMap<number, MeleeMember>
}
interface GroupEffects {
  enter: (p: MeleeMember) => void
  allocate: (parent: MeleeGroup) => MeleeGroup | undefined
}

// 0x4a3920: request ordinary state recovery without discarding the command queue.
function detach(p: MeleeMember) {
  p.workFlags = 0
  p.workTarget = 0
  p.flags2 = (p.flags2 | 16) >>> 0
}

// 0x51df90: use the last occupied slot of each tribe, not the closest fighters.
export function splitMeleeGroup(w: GroupWorld, group: MeleeGroup, e: GroupEffects) {
  const sides = group.tribes.map(tribe =>
    group.members.flatMap((id, slot) => (id && w.objects.get(id)!.tribe === tribe ? [slot] : []))
  )
  if (sides.some(slots => slots.length < 2)) return
  const slots = sides.map(side => side.at(-1)!)
  const people = slots.map(slot => w.objects.get(group.members[slot])!)
  const split = e.allocate(group)
  if (split) {
    split.count = 2
    split.tribes = [...group.tribes]
    split.members = [people[0].id, people[1].id, 0, 0, 0, 0]
    group.center = 0
    for (const p of people) {
      p.workFlags = split.id
      p.substate = 0
      p.flags2 = (p.flags2 | 0x40000000) >>> 0
    }
    split.angle = random(w) % 360
  } else for (const p of people) detach(p)
  group.count -= 2
  for (const slot of slots) group.members[slot] = 0
  return split
}

// 0x51ddc0: admission and target selection share the exact same slot decision.
export function joinMeleeGroup(w: GroupWorld, group: MeleeGroup, p: MeleeMember, e: GroupEffects) {
  const slot = availableFightSlot(w, group, p) - 1
  if (slot < 0 || slot >= 6) return false // Includes the specialist sentinel 255.
  const previous = group.members[slot]
  if (previous) detach(w.objects.get(previous)!)
  else group.count++
  if (!(p.flags2 & 0x100000)) e.enter(p)
  group.members[slot] = p.id
  p.workFlags = group.id
  splitMeleeGroup(w, group, e)
  return true
}

export interface FightParticipant {
  id: number
  class: number
  tribe: number
  state: number
  flags2: number
  life: number
  workFlags: number
  x: number
  y: number
}
export interface FightRoster {
  id: number
  members: number[]
  tribes: number[]
  count: number
  winner: number
  flags4: number
  reactionTimer: number
  x: number
  y: number
}

// 0x519a70: persistent membership and the packed processing list are distinct.
export function cleanFightRoster(
  group: FightRoster,
  objects: ReadonlyMap<number, FightParticipant>
) {
  const people: number[] = []
  for (const [slot, id] of group.members.entries()) {
    if (!id) continue
    const p = objects.get(id)
    const alive = p && p.class !== 0 && !(p.flags2 & 1)
    if (
      alive &&
      (p.workFlags << 16) >> 16 === group.id &&
      rules.personStateFlags[p.state] & 16 &&
      p.life > 0
    ) {
      people.push(id)
      continue
    }
    group.members[slot] = 0
    if (alive) p.workFlags = 0
    group.flags4 = (group.flags4 & ~0x100000) >>> 0
    if (group.reactionTimer) group.reactionTimer = (group.reactionTimer - 1) & 255
  }
  group.count = people.length
  while (people.length < 6) people.push(0)
  if (group.count < 2) {
    if (group.count) group.winner = objects.get(people[0])!.tribe
    return { active: false, people }
  }
  let separated = false
  const { count } = group
  for (let i = 0; i < count; i++) {
    const p = objects.get(people[i])!
    const dx = ((p.x - group.x) << 16) >> 16,
      dy = ((p.y - group.y) << 16) >> 16
    if (((dx * dx + dy * dy) | 0) <= 0x400000) continue
    p.workFlags = 0
    // Native indexes the persistent array by packed index in this second pass,
    // even if a prior invalid member left a hole. Keep that observable behavior.
    group.members[i] = 0
    people[i] = 0
    group.count--
    separated = true
  }
  if (group.count < 2) {
    if (group.count) group.winner = objects.get(people.find(Boolean)!)!.tribe
    return { active: false, people }
  }
  group.tribes = [255, 255]
  for (const id of people) {
    if (!id) continue
    const { tribe } = objects.get(id)!
    if (group.tribes[0] === 255) group.tribes[0] = tribe
    else if (group.tribes[0] !== tribe) group.tribes[1] = tribe
  }
  if (group.tribes.includes(255)) {
    group.winner = group.tribes[0] === 255 ? group.tribes[1] : group.tribes[0]
    return { active: false, people }
  }
  if (separated)
    for (let i = 0; i < 5; i++)
      if (!people[i]) {
        people.splice(i, 1)
        people.push(0)
      }
  return { active: true, people }
}

// 0x5199f0: last member of the first side unless that side has reinforcements.
export function fightCenter(
  group: Pick<FightRoster, 'members' | 'tribes' | 'count'>,
  people: number[],
  objects: ReadonlyMap<number, Pick<FightParticipant, 'tribe'>>
) {
  let index = 0
  if (group.count > 2) {
    const side = people.slice(0, group.count).map(id => objects.get(id)!.tribe)
    const tribe =
      side.filter(t => t === group.tribes[0]).length > 1 ? group.tribes[1] : group.tribes[0]
    index = side.lastIndexOf(tribe)
  }
  return { id: group.members[index], index }
}

// 0x518fb0's terminal tail. The person dispatcher performs state recovery later.
export function releaseFightRoster(
  group: FightRoster,
  objects: ReadonlyMap<number, FightParticipant>
) {
  for (const id of group.members.slice(0, group.count)) {
    const p = objects.get(id)
    if (p && p.class && !(p.flags2 & 1)) p.workFlags = 0
  }
}
