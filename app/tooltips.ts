import native from './original-tooltips.json' with { type: 'json' }
import { missionData } from './mission-data.ts'
import {
  nativeCellPoint,
  browserPosition,
  buildingModel,
  distance,
  type World,
  type Point,
} from './model.ts'
import { tribeForTeam } from './world-types.ts'

export type TooltipObject = Point & {
  id: number
  type: number
  model: number
  owner: number
  tutorial: number
  head: { type: number; flags: number } | null
}
export type TooltipState = {
  target: number
  flags: number
  remaining: number
  text: string
  fixed: number
  draw: number
  hold: number
  scroll: number
}
export const createTooltip = (): TooltipState => ({
  target: 0,
  flags: 0,
  remaining: 0,
  text: '',
  fixed: 0,
  draw: 0,
  hold: 0,
  scroll: 0,
})

// 0x4f0f90. An exhausted/absent linked head has no worship description.
export function tooltipName(object: TooltipObject, player = 0, multiplayer = false) {
  let stringId = 0,
    tribe = false
  const names = native.names as Record<number, number[][]>
  if ((object.type === 2 && object.model === 18) || (object.type === 5 && object.model === 9)) {
    if (object.head) {
      stringId =
        object.tutorial >= 1 && object.tutorial <= 3
          ? 890 + object.tutorial
          : object.head.type === 3
            ? 889
            : object.head.type === 5
              ? 899
              : object.head.flags & 32
                ? 898
                : object.head.flags & 16
                  ? 897
                  : 888
    }
  } else if (names[object.type]) {
    const record = names[object.type][object.model]
    if (!record) throw new RangeError('Unimported native tooltip model')
    stringId = record[0]
    if (record[1] && (multiplayer || object.owner !== player)) {
      stringId = record[1] + Number(multiplayer)
      tribe = true
    }
  } else if (object.type === 10 && object.model === 16) stringId = 848
  return { stringId, tribe }
}

export function clearTooltip(state: TooltipState) {
  Object.assign(state, { target: 0, flags: 0, remaining: 0, text: '', fixed: 0 })
}

// Object modes 1/2 of 0x44d7f0. The caller supplies the original cell lookup.
export function showObjectTooltip(
  state: TooltipState,
  object: TooltipObject | null,
  duration: number,
  player = 0,
  multiplayer = false
) {
  clearTooltip(state)
  if (!object) return
  Object.assign(state, { target: object.id, flags: 6, remaining: (duration << 16) >> 16 })
  const name = tooltipName(object, player, multiplayer)
  if (!name.stringId) return
  state.text = (native.strings as Record<number, string>)[name.stringId]
  if (name.tribe && object.owner !== -1)
    state.text = state.text.replace('%s', ['Blue', 'Dakini', 'Chumara', 'Matak'][object.owner])
}

// 0x44db60; called from 0x4aa4e0 after flyby events, once per presentation frame.
// draw is consumed/reset by the renderer, as in 0x44a2f0.
export function stepTooltip(state: TooltipState, targetValid: boolean, frameRate: number) {
  if (state.remaining === 0) return false
  state.remaining = ((state.remaining - 1) << 16) >> 16
  if (state.remaining < 1 || (!(state.flags & 8) && (!targetValid || !(state.flags & 4))))
    clearTooltip(state)
  else {
    state.draw = 1
    state.scroll = 0
    state.hold = Math.imul(frameRate, 2)
  }
  return true
}

export function worldTooltipObject(world: World, id: number): TooltipObject | null {
  const level = missionData(world.outcome.level).level
  const vehicle = world.vehicles.find(v => v.id === id && v.active)
  if (vehicle)
    return {
      id,
      ...browserPosition(vehicle),
      type: 4,
      model: vehicle.model,
      owner: tribeForTeam(vehicle.team),
      tutorial: 0,
      head: null,
    }
  const b = world.buildings.find(b => b.id === id && b.hp > 0)
  if (b)
    return {
      ...b,
      type: 2,
      model: buildingModel(b),
      owner: tribeForTeam(b.team),
      tutorial: 0,
      head: null,
    }
  const shrine = world.shrines.find(s => s.id === id)
  if (!shrine) return null
  const trigger = level.objects.find(
    o => o.type === 6 && o.model === 6 && distance(o, shrine) < 0.01
  )
  const settings = trigger?.settings
  if (!settings) throw new Error('Missing original tooltip head')
  let flags = 0
  // 0x4851e0 derives the worship object's category from its linked reward objects.
  for (let i = 6; i < 26; i += 2) {
    const reward = level.objects.find(
      o => o.index + 1 === (settings[i] | (settings[i + 1] << 8)) && o.type === 6 && o.model === 2
    )
    if (reward?.settings?.[2] === 1) flags |= 16
    if (reward?.settings?.[2] === 3) flags |= 32
  }
  const vault =
    shrine.kind === 'vault'
      ? level.objects.find(o => o.type === 2 && o.model === 18 && distance(o, shrine) < 3)
      : null
  const point = vault ?? shrine
  return {
    id,
    x: point.x,
    z: point.z,
    type: vault ? 2 : 5,
    model: vault ? 18 : 9,
    owner: -1,
    tutorial: 0,
    head: shrine.active ? { type: settings[0], flags } : null,
  }
}

export function forcedTooltipObject(world: World, mode: number, packed: number) {
  const point = nativeCellPoint(packed)
  if (mode === 1) {
    const shrine = world.shrines.find(
      s =>
        s.kind !== 'vault' &&
        distance(nativeCellPoint((((-s.z - 8) & 255) << 8) | ((s.x + 8) & 255)), point) === 0
    )
    return shrine ? worldTooltipObject(world, shrine.id) : null
  }
  if (mode !== 2) throw new Error(`Unported forced tooltip mode ${mode}`)
  // ponytail: the browser has no native cell occupancy table yet. Its existing
  // building footprint resolves the first-mission cells; native occupancy is pending.
  for (const b of [...world.buildings, ...world.shrines.filter(s => s.kind === 'vault')]) {
    const object = worldTooltipObject(world, b.id)
    if (object && Math.abs(object.x - point.x) <= 2 && Math.abs(object.z - point.z) <= 2)
      return object
  }
  return null
}

export const tooltipPalette = native
