import levelOne from './level-one.ts'
import levelTwo from './level-two.ts'
import levelThree from './level-three.ts'
import levelFour from './level-four.ts'
import scriptOne from './original-script.json' with { type: 'json' }
import scriptTwo from './original-script-two.json' with { type: 'json' }
import scriptThree from './original-script-three.json' with { type: 'json' }
import scriptFour from './original-script-four.json' with { type: 'json' }

const missions = [
  { number: 1, level: levelOne, script: scriptOne },
  { number: 2, level: levelTwo, script: scriptTwo },
  { number: 3, level: levelThree, script: scriptThree },
  { number: 4, level: levelFour, script: scriptFour },
] as const

export const missionNumbers = missions.map(mission => mission.number)

export type Mission = (typeof missions)[number]

export function missionData(number = 1): Mission {
  const mission = missions.find(mission => mission.number === number)
  if (!mission) throw new RangeError(`Unsupported campaign mission ${number}`)
  return mission
}

const headerMask = (header: readonly number[], offset: number) =>
  (header[offset] |
    (header[offset + 1] << 8) |
    (header[offset + 2] << 16) |
    (header[offset + 3] << 24)) >>>
  0

export const missionAllowsBuilding = (number: number, model: number) =>
  !!(headerMask(missionData(number).level.header, 4) & (1 << model))

export const missionSpellMask = (number: number) => headerMask(missionData(number).level.header, 0)

export function campaignSpellModels(number: number) {
  const models = new Set<number>(),
    header = missionData(number).level.header,
    available = missionSpellMask(number)
  for (let model = 1; model < 22; model++) if (available & (1 << model)) models.add(model)
  for (const mission of missions) {
    if (mission.number > number) break
    for (const object of mission.level.objects)
      if (object.type === 6 && object.settings?.[0] === 11) models.add(object.settings[1])
  }
  return models
}

export function missionPosition(number: number, team: 'blue' | 'red') {
  const { level } = missionData(number),
    shamans = level.objects.filter(object => object.type === 1 && object.model === 7),
    object = shamans.find(object => (team === 'blue' ? object.owner === 0 : object.owner !== 0))
  if (!object) throw new Error(`Missing ${team} shaman in campaign mission ${number}`)
  return { x: object.x, z: object.z }
}

export function missionEnemyTribe(number: number) {
  const shaman = missionData(number).level.objects.find(
    object => object.type === 1 && object.model === 7 && object.owner > 0 && object.owner < 4
  )
  if (!shaman) throw new Error(`Missing enemy shaman in campaign mission ${number}`)
  return shaman.owner
}
