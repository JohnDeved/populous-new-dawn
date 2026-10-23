import { canOrder } from '../app/model.ts'
import { hudPeople } from '../app/selection-runtime.ts'
import { isShaman } from '../app/world-rules.ts'

// Plain primary portrait activation, not H/select(), Shift-all or secondary focus.
// hudPeople reads the actual occupied/route owner without taking selection ownership.
export function campaignPortraitReadiness(world) {
  const shaman = world.units.find(unit => unit.team === 'blue' && isShaman(unit))
  const person = shaman?.hp > 0 && hudPeople(world).find(person => person.id === shaman.id && person.model === 7)
  const source = person?.source
  const selectable = !!person && !(person.flags4 & 0x880)
  return {
    ready: world.status === 'playing' && !world.paused && !world.inputMask &&
      !(world.manaWorld.gameFlags & 32) && selectable,
    turn: world.turn,
    inputMask: world.inputMask,
    selected: [...world.selected],
    levelStartPhase: world.levelStart?.find(site => site.shaman === shaman?.id)?.phase,
    shaman: shaman && { id: shaman.id, hp: shaman.hp, canOrder: canOrder(shaman), selectable,
      state: source?.state, flags2: source?.flags2, flags4: person?.flags4, commandStatus: source?.commandStatus },
  }
}
