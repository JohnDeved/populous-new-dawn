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
