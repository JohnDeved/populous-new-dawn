// Frozen original adapter from e9f0b67be2079f1c5a1d443aba47070af52baa48.
// Only TypeScript annotations removed and exports added for differential tests.
import { nativePosition, nativeCellIndex } from '../../app/world-terrain-runtime.ts'
import { unitAnimationSource } from '../../app/selection-runtime.ts'
import { nativePersonModel } from '../../app/live-combat.ts'
import { tribeForTeam } from '../../app/world-types.ts'

export function computerSpellPerson(w, u) {
  const p = nativePosition(w, u),
    live = unitAnimationSource(u)
  return {
    class: 1,
    model: nativePersonModel(u),
    state: live?.state ?? 0,
    tribe: tribeForTeam(u.team),
    x: p.x,
    y: p.y,
    flags2: u.inside === null ? 0 : 0x800000,
    flags4: live?.flags4 ?? (u.invisibility ? 0x1000 : 0),
    assignment: live?.assignment ?? 0,
    disguise: 0,
  }
}
export function computerSpellWorld(w, tribe) {
  const cells = new Map()
  for (const u of w.units)
    if (u.hp > 0 && u.inside === null) {
      const p = computerSpellPerson(w, u)
      const cell = ((p.x >>> 8) & 254) | (p.y & 0xfe00)
      const objects = cells.get(cell) ?? []
      objects.push(p)
      cells.set(cell, objects)
    }
  return {
    tribe,
    alliances: w.outcome.alliances[tribe],
    cells,
    terrainFlags: cell => w.land.flags[nativeCellIndex(cell)],
  }
}
