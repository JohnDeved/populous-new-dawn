export type UnitKind = 'shaman' | 'brave' | 'warrior' | 'preacher' | 'firewarrior'

const models: Record<UnitKind, number> = {
  brave: 2,
  warrior: 3,
  preacher: 4,
  firewarrior: 6,
  shaman: 7,
}
const kinds: Partial<Record<number, UnitKind>> = {
  3: 'warrior',
  4: 'preacher',
  6: 'firewarrior',
  7: 'shaman',
}

export const nativeUnitModel = (kind: UnitKind) => models[kind]
export const unitKindFromModel = (model: number): UnitKind => kinds[model] ?? 'brave'
