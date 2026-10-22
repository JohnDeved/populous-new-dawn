/** Original model identifiers, not browser labels. Source tables and switch:
 * 0045ed10, 0059d7f4, 0059d814. Model zero is not a generic fallback. */
const personTopics: readonly (number | null)[] = [
  null, 992, 1024, 1025, 1027, 1028, 1026, 1023, 1020,
]
const buildingTopics: readonly (number | null)[] = [
  null, 996, 996, 996, 997, 999, 1000, 998, 1001, 996,
  996, 996, 996, 1002, 1002, 1003, 1003, 1004, 990,
]

export interface HelpObject {
  type: number
  model: number
  /** Native object flags at +0x0c; bit zero marks an invalid/deleted object. */
  flags: number
  vehicleFlags?: number
  shrineType?: number
}

export interface HelpContext {
  /** null: HUD background, object: a control, undefined: not over the HUD. */
  hud?: { topic: number } | null
  picked?: HelpObject | null
  fallback?: HelpObject | null
  cell?: {
    flags: number
    terrainFlags: number
    building?: HelpObject | null
  } | null
}

export function helpObjectTopic(object: HelpObject): number | null {
  const { type, model } = object
  if (type === 1) return personTopics[model] ?? null
  if (type === 2) return buildingTopics[model] ?? null
  if (type === 4) return object.vehicleFlags === undefined ? null : object.vehicleFlags & 1 ? 994 : 993
  if (type !== 5) return null
  if ((model >= 1 && model <= 6) || model === 11) return 986
  if (model !== 9) return null
  switch (object.shrineType) {
    case 1: return 1070
    case 2: return 989
    case 4: return 991
    default: return null
  }
}

/** null retains the existing/default article. An unrecognized valid object
 * still wins over terrain; ordinary land must not invent a new topic. */
export function helpContextTopic(context: HelpContext): number | null {
  if (context.hud !== undefined) return context.hud === null ? null : context.hud.topic || 1046
  const valid = (object: HelpObject | null | undefined) => object && object.type !== 0 && !(object.flags & 1)
  const object = [context.picked, context.fallback, context.cell?.building].find(valid)
  if (object) return helpObjectTopic(object)
  if (!context.cell) return null
  if (context.cell.flags & 0x10000) return 988
  return context.cell.terrainFlags & 1 ? null : 987
}
