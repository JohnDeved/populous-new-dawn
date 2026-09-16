import levelOne from './level-one.ts'
import levelTwo from './level-two.ts'
import levelThree from './level-three.ts'
import levelFour from './level-four.ts'
import levelFive from './level-five.ts'
import levelSix from './level-six.ts'
import levelSeven from './level-seven.ts'
import levelEight from './level-eight.ts'
import levelNine from './level-nine.ts'
import levelTen from './level-ten.ts'
import levelEleven from './level-eleven.ts'
import levelTwelve from './level-twelve.ts'
import scriptOne from './original-script.json' with { type: 'json' }
import scriptTwo from './original-script-two.json' with { type: 'json' }
import scriptThree from './original-script-three.json' with { type: 'json' }
import scriptFour from './original-script-four.json' with { type: 'json' }
import scriptFive from './original-script-five.json' with { type: 'json' }
import scriptSix from './original-script-six.json' with { type: 'json' }
import scriptSeven from './original-script-seven.json' with { type: 'json' }
import scriptEight from './original-script-eight.json' with { type: 'json' }
import scriptNine from './original-script-nine.json' with { type: 'json' }
import scriptTen from './original-script-ten.json' with { type: 'json' }
import scriptEleven from './original-script-eleven.json' with { type: 'json' }
import scriptTwelve from './original-script-twelve.json' with { type: 'json' }
import { teamForTribe, tribeForTeam, type TribeTeam } from './world-types.ts'

const missions = [
  { number: 1, level: levelOne, script: scriptOne },
  { number: 2, level: levelTwo, script: scriptTwo },
  { number: 3, level: levelThree, script: scriptThree },
  { number: 4, level: levelFour, script: scriptFour },
  { number: 5, level: levelFive, script: scriptFive },
  { number: 6, level: levelSix, script: scriptSix.tribes[2] },
  { number: 7, level: levelSeven, script: scriptSeven },
  { number: 8, level: levelEight, script: scriptEight },
  { number: 9, level: levelNine, script: scriptNine },
  { number: 10, level: levelTen, script: scriptTen },
  { number: 11, level: levelEleven, script: scriptEleven.tribes[2] },
  { number: 12, level: levelTwelve, script: scriptTwelve.tribes[1] },
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

export function missionPosition(number: number, team: TribeTeam) {
  const { level } = missionData(number),
    shamans = level.objects.filter(object => object.type === 1 && object.model === 7),
    object = shamans.find(object => object.owner === tribeForTeam(team))
  if (!object) throw new Error(`Missing ${team} shaman in campaign mission ${number}`)
  return { x: object.x, z: object.z }
}

export function missionScript(number: number, tribe = missionEnemyTribe(number)) {
  if (number !== 6 && number !== 11 && number !== 12) return missionData(number).script
  const scripts =
      number === 6 ? scriptSix.tribes : number === 11 ? scriptEleven.tribes : scriptTwelve.tribes,
    script = scripts[tribe as 1 | 2 | 3]
  if (!script)
    throw new Error(`Missing ${teamForTribe(tribe)} script in campaign mission ${number}`)
  return script
}

export const missionComputerTribes = (number: number) =>
  number === 6 || number === 12 ? [1, 2, 3] : number === 11 ? [2, 3] : [missionEnemyTribe(number)]

export function missionEnemyTribe(number: number) {
  const shaman = missionData(number).level.objects.find(
    object => object.type === 1 && object.model === 7 && object.owner > 0 && object.owner < 4
  )
  if (!shaman) throw new Error(`Missing enemy shaman in campaign mission ${number}`)
  return shaman.owner
}
