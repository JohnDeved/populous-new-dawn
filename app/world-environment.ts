import { missionData } from './mission-data.ts'
import type { World } from './world-types.ts'

const landscapes = new Map<number, 'c' | 's' | 'p'>([
  [12, 'c'],
  [28, 's'],
  [25, 'p'],
])

// Authored landscape and object selectors are independent. Unsupported IDs
// retain the existing c/2 compatibility; this is not a native fallback claim.
export function environmentForHeader(header: { landscapeBank: number; objectBank: number }) {
  const bank = landscapes.get(header.landscapeBank) ?? 'c'
  return Object.freeze({
    landscape: Object.freeze({
      requested: header.landscapeBank,
      bank,
      supported: landscapes.has(header.landscapeBank),
      terrain: bank === 'c' ? 'landscape.bin' : `landscape-${bank}.bin`,
      modelAtlas: bank === 'c' ? 'atlas' : `atlas-${bank}`,
    }),
    objects: Object.freeze({
      requested: header.objectBank,
      bank: header.objectBank === 6 ? (6 as const) : (2 as const),
      supported: [0, 2, 6].includes(header.objectBank),
    }),
  })
}

export type WorldEnvironment = ReturnType<typeof environmentForHeader>
const selections = new Map<string, WorldEnvironment>()

export function worldEnvironment(world: Pick<World, 'outcome'>): WorldEnvironment {
  const header = missionData(world.outcome.level).level,
    key = `${header.landscapeBank}:${header.objectBank}`
  let environment = selections.get(key)
  if (!environment) {
    environment = environmentForHeader(header)
    selections.set(key, environment)
  }
  return environment
}

export const compatibilityEnvironment = environmentForHeader({ landscapeBank: 12, objectBank: 2 })
