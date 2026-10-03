// Original data/plsdata.dat, consumed by 00411790; see decomp/research/world-selector.md.
// These are native body/orbit data, not screen-space coordinates or a guessed star grid.
export type SelectorWorld = {
  index: number
  radius: number
  parent: number
  orbitRadius: number
  startAngle: number
  angularVelocity: number
  mission: number
}

export const selectorWorlds: readonly SelectorWorld[] = [
  {
    "index": 0,
    "radius": 150.0,
    "parent": -1,
    "orbitRadius": 0.0,
    "startAngle": 0.0,
    "angularVelocity": 0.0,
    "mission": 25
  },
  {
    "index": 1,
    "radius": 20.0,
    "parent": 0,
    "orbitRadius": 220.0,
    "startAngle": 90.0,
    "angularVelocity": 1.6,
    "mission": 24
  },
  {
    "index": 2,
    "radius": 20.0,
    "parent": 0,
    "orbitRadius": 290.0,
    "startAngle": 95.0,
    "angularVelocity": 1.5,
    "mission": 23
  },
  {
    "index": 3,
    "radius": 20.0,
    "parent": 0,
    "orbitRadius": 360.0,
    "startAngle": 0.0,
    "angularVelocity": 1.2,
    "mission": 22
  },
  {
    "index": 4,
    "radius": 10.0,
    "parent": 0,
    "orbitRadius": 500.0,
    "startAngle": 90.0,
    "angularVelocity": 1.1,
    "mission": 21
  },
  {
    "index": 5,
    "radius": 20.0,
    "parent": 4,
    "orbitRadius": 80.0,
    "startAngle": 225.0,
    "angularVelocity": 3.0,
    "mission": 18
  },
  {
    "index": 6,
    "radius": 20.0,
    "parent": 4,
    "orbitRadius": 80.0,
    "startAngle": 45.0,
    "angularVelocity": 3.0,
    "mission": 19
  },
  {
    "index": 7,
    "radius": 10.0,
    "parent": 0,
    "orbitRadius": 500.0,
    "startAngle": 270.0,
    "angularVelocity": 1.1,
    "mission": 20
  },
  {
    "index": 8,
    "radius": 20.0,
    "parent": 7,
    "orbitRadius": 80.0,
    "startAngle": 135.0,
    "angularVelocity": 3.0,
    "mission": 17
  },
  {
    "index": 9,
    "radius": 20.0,
    "parent": 7,
    "orbitRadius": 80.0,
    "startAngle": 315.0,
    "angularVelocity": 3.0,
    "mission": 16
  },
  {
    "index": 10,
    "radius": 10.0,
    "parent": 0,
    "orbitRadius": 800.0,
    "startAngle": 90.0,
    "angularVelocity": 0.8,
    "mission": 15
  },
  {
    "index": 11,
    "radius": 10.0,
    "parent": 10,
    "orbitRadius": 35.0,
    "startAngle": 270.0,
    "angularVelocity": 2.5,
    "mission": 14
  },
  {
    "index": 12,
    "radius": 10.0,
    "parent": 10,
    "orbitRadius": 70.0,
    "startAngle": 270.0,
    "angularVelocity": 2.1,
    "mission": 13
  },
  {
    "index": 13,
    "radius": 20.0,
    "parent": 10,
    "orbitRadius": 110.0,
    "startAngle": 270.0,
    "angularVelocity": 1.4,
    "mission": 12
  },
  {
    "index": 14,
    "radius": 20.0,
    "parent": 10,
    "orbitRadius": 150.0,
    "startAngle": 270.0,
    "angularVelocity": 3.0,
    "mission": 11
  },
  {
    "index": 15,
    "radius": 10.0,
    "parent": 0,
    "orbitRadius": 1100.0,
    "startAngle": 0.0,
    "angularVelocity": 0.8,
    "mission": 10
  },
  {
    "index": 16,
    "radius": 10.0,
    "parent": 15,
    "orbitRadius": 35.0,
    "startAngle": 180.0,
    "angularVelocity": 2.5,
    "mission": 9
  },
  {
    "index": 17,
    "radius": 20.0,
    "parent": 15,
    "orbitRadius": 70.0,
    "startAngle": 180.0,
    "angularVelocity": 2.1,
    "mission": 8
  },
  {
    "index": 18,
    "radius": 10.0,
    "parent": 15,
    "orbitRadius": 110.0,
    "startAngle": 180.0,
    "angularVelocity": 1.4,
    "mission": 7
  },
  {
    "index": 19,
    "radius": 20.0,
    "parent": 15,
    "orbitRadius": 150.0,
    "startAngle": 180.0,
    "angularVelocity": 3.0,
    "mission": 6
  },
  {
    "index": 20,
    "radius": 10.0,
    "parent": 0,
    "orbitRadius": 1400.0,
    "startAngle": 270.0,
    "angularVelocity": 0.8,
    "mission": 5
  },
  {
    "index": 21,
    "radius": 8.0,
    "parent": 20,
    "orbitRadius": 35.0,
    "startAngle": 90.0,
    "angularVelocity": 2.3,
    "mission": 4
  },
  {
    "index": 22,
    "radius": 8.0,
    "parent": 20,
    "orbitRadius": 70.0,
    "startAngle": 90.0,
    "angularVelocity": 2.5,
    "mission": 3
  },
  {
    "index": 23,
    "radius": 8.0,
    "parent": 20,
    "orbitRadius": 110.0,
    "startAngle": 90.0,
    "angularVelocity": 2.7,
    "mission": 2
  },
  {
    "index": 24,
    "radius": 8.0,
    "parent": 20,
    "orbitRadius": 150.0,
    "startAngle": 90.0,
    "angularVelocity": 1.3,
    "mission": 1
  }
]

export const openingCampaignMissions = [1, 2, 3] as const

// Native 00412960's opening sequential branch, restricted to this delivered slice.
// Existing completed worlds remain replayable; the separate all-missions view
// preserves this recreation's direct-access compatibility without calling it native.
export function openingMissionAvailable(mission: number, completed: readonly number[]) {
  return openingCampaignMissions.some(value => value === mission) &&
    (mission === 1 || completed.includes(mission) || completed.includes(mission - 1))
}

export function openingRecommendedMission(completed: readonly number[]) {
  return openingCampaignMissions.find(mission => !completed.includes(mission)) ?? 3
}

// 004125a0 starts each orbit at cos(angle)*radius, sin(angle)*radius
// relative to its parent. Modern UI uses this fixed opening pose; native motion
// and perspective are deliberately not claimed by this helper.
export function selectorWorldPosition(index: number): { x: number; z: number } {
  const body = selectorWorlds[index]
  if (!body) throw new RangeError('Unknown selector body')
  if (body.parent < 0) return { x: 0, z: 0 }
  const parent = selectorWorldPosition(body.parent)
  const angle = body.startAngle * Math.PI / 180
  return {
    x: parent.x + Math.cos(angle) * body.orbitRadius,
    z: parent.z + Math.sin(angle) * body.orbitRadius,
  }
}
