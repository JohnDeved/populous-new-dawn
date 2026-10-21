import manifest from './original-world-selector.json' with { type: 'json' }
import art from '../public/original/world-selector/native/runtime.json' with { type: 'json' }

// This is a controlled rendering input, not a profile or progression model.
// No shipped caller supplies it yet. Available worlds and the orbit anchor must
// come from a separately reviewed caller; completing a world implies neither.
export interface NativeSelectorSelection {
  selected: number
  available: readonly number[]
  progressionMission: number
  onSelect: (mission: number) => void
}

export const nativeSelectorMissions = manifest.worlds.map(world => world.mission)

export function selectorWorld(mission: number) {
  const world = manifest.worlds.find(record => record.mission === mission)
  if (!world) throw new RangeError(`Unknown selector mission: ${mission}`)
  return world
}

export function selectorArt(mission: number) {
  const world = selectorWorld(mission)
  return art.banks[world.palette as keyof typeof art.banks]
}

export function selectorTitle(mission: number) {
  return {
    ...selectorWorld(mission).title,
    src: art.titles[String(mission) as keyof typeof art.titles],
  }
}

export function selectorTooltip(mission: number, id: '978' | '979' | '980') {
  return { ...manifest.tooltip.strings[id], file: selectorArt(mission).tooltips[id] }
}
