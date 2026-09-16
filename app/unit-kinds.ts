export type UnitKind = 'shaman' | 'brave' | 'warrior' | 'preacher' | 'spy' | 'firewarrior'

const models: Record<UnitKind, number> = {
  brave: 2,
  warrior: 3,
  preacher: 4,
  spy: 5,
  firewarrior: 6,
  shaman: 7,
}
const kinds: Partial<Record<number, UnitKind>> = {
  3: 'warrior',
  4: 'preacher',
  5: 'spy',
  6: 'firewarrior',
  7: 'shaman',
}
const draws: Record<UnitKind, number> = {
  brave: 14,
  warrior: 15,
  preacher: 16,
  spy: 17,
  firewarrior: 18,
  shaman: 14,
}

export const nativeUnitModel = (kind: UnitKind) => models[kind]
export const nativeUnitDraw = (kind: UnitKind) => draws[kind]
export const unitKindFromModel = (model: number): UnitKind => kinds[model] ?? 'brave'
