import { canOrder, unitAnimationSource } from '../app/model.ts'

// Observe the exact portrait select() -> setSelection() eligibility. Calling
// selectionPeople() here would mutate selection flags, so only read its sources.
export function campaignShamanReadiness(world) {
  const shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman' && unit.hp > 0)
  const source = shaman && (unitAnimationSource(shaman) ?? shaman.native ?? shaman.entry?.person ?? shaman.builder?.person)
  const orderable = !!shaman && canOrder(shaman)
  const selectable = orderable && !((source?.flags4 ?? 0) & 128)
  return {
    ready: world.status === 'playing' && !world.paused && !world.inputMask && selectable,
    turn: world.turn,
    inputMask: world.inputMask,
    selected: [...world.selected],
    levelStartPhase: world.levelStart?.find(site => site.shaman === shaman?.id)?.phase,
    shaman: shaman && { id: shaman.id, hp: shaman.hp, canOrder: orderable, selectable,
      state: source?.state, flags2: source?.flags2, flags4: source?.flags4, commandStatus: source?.commandStatus },
  }
}
