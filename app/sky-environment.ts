type SkyEnvironment = {
  readonly backdrop: string
  readonly clouds: readonly [string, string]
  readonly typeOne: boolean
}
const defaultSky: SkyEnvironment = {
  backdrop: 'sky',
  clouds: ['clouds', 'clouds-high'],
  typeOne: false,
}
const environments: Readonly<Record<number, SkyEnvironment>> = {
  13: { backdrop: 'sky-d', clouds: ['clouds-d', 'clouds-high-d'], typeOne: false },
  // Bank g's missing backdrop uses the existing indexed type-1 lens.
  16: { ...defaultSky, typeOne: true },
  25: { backdrop: 'sky-p', clouds: ['clouds-p', 'clouds-high-p'], typeOne: false },
  28: { backdrop: 'sky-s', clouds: ['clouds-s', 'clouds-high-s'], typeOne: false },
}

/** Shipped, verified sky sets. See decomp/research/early-mission-skies.md.
 * Native 0042a140 chooses the bank's names only after its palette opens;
 * these assets represent that successful supplied-data path, not OS fallback.
 */
export function skyEnvironment(bank: number): SkyEnvironment {
  return environments[bank] ?? defaultSky
}
