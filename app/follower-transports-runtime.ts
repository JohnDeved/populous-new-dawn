import { tribeForTeam, vehicleApparentTribe, type World } from './world-types.ts'
import { hudTaskPeople } from './follower-tasks-runtime.ts'
import { selectTransportPassengers, type TransportKind } from './hud-transports.ts'
import type { HudSelectionMode } from './hud-selection.ts'
import { sound } from './world-effects.ts'

export function hudTransports(w: World) {
  return w.vehicles.map(v => ({
    ...v,
    active: v.active || !!v.destructionState,
    owner: vehicleApparentTribe(v),
    countOwner: tribeForTeam(v.team),
  }))
}

export function selectFollowerTransport(
  w: World,
  kind: TransportKind,
  model: number,
  point: { x: number; y: number },
  mode: HudSelectionMode
) {
  const people = hudTaskPeople(w, false),
    result = selectTransportPassengers(
      hudTransports(w),
      people,
      kind,
      model,
      point,
      mode,
      !!(w.castingTribes[0].flags & 128)
    )
  for (const p of people)
    if (p.source) {
      p.source.flags3 = p.flags3
      p.source.selectionFlags = p.selectionFlags
    }
  w.selected = people.filter(p => p.selectionFlags & 128).map(p => p.id)
  w.mode = null
  const speaker = w.units.find(u => u.id === result.speaker)
  if (speaker) for (const cue of result.cues) sound(w, cue, speaker)
}
