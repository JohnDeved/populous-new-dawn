import { tribeForTeam, type World } from './world-types.ts'
import { swampContainsPoint } from './swamp.ts'

// The caller owns trusted pointer admission and converts its terrain hit to native coordinates.
export function removeOwnedSwamp(
  w: World,
  point: { x: number; y: number },
  pickedId?: number | null
) {
  if (w.paused || w.status !== 'playing' || w.inputMask || w.mode || w.selected.length) return false
  const tribe = w.manaWorld.playerTribe
  if (tribe < 0 || tribe > 3 || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return false
  const cell = ((point.y & 65535) >>> 9) * 128 + ((point.x & 65535) >>> 9)
  // Native action 0x79 precedes Swamp removal for a valid owned cell building.
  if (w.land.flags[cell] & 0x400) {
    const building = w.buildings.find(b => b.id === (w.land.buildingIds[cell] & 1023) && b.hp > 0)
    if (building && tribeForTeam(building.team) === tribe) return false
  }
  // Preserve the earlier class-10/model-16 action when the live registry supplies it.
  const picked =
    pickedId === null || pickedId === undefined ? undefined : w.objectCells.objects.get(pickedId)
  if (
    picked &&
    !(picked.flags2 & 1) &&
    'class' in picked &&
    picked.class === 10 &&
    'model' in picked &&
    picked.model === 16
  )
    return false
  // Effects are appended oldest first; native lookup visits the most recent trap first.
  for (let i = w.effects.length - 1; i >= 0; i--) {
    const fx = w.effects[i],
      { swamp } = fx
    if (
      fx.age >= fx.duration ||
      !swamp ||
      swamp.tribe !== tribe ||
      !swampContainsPoint(swamp, point)
    )
      continue
    // Leave object/victim/renderer cleanup to the normal logical effect pass.
    swamp.remaining = 0
    return true
  }
  return false
}
