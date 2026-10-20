// Opt-in hosted acceptance adapter. Never imported by the shipped game entry.
// These are the same production functions used by the real cast/controller path;
// the checker controls the existing fixed clock, not Tornado state or artwork.
export { nativePosition } from '../../app/model.ts'
export { spellInRange } from '../../app/spell-casting.ts'
export { tornadoCell } from '../../app/tornado-appearance.ts'
export { advanceGame } from '../../app/game-clock.ts'
export { default as rules } from '../../app/original-rules.json' with { type: 'json' }
export { tornadoGraphicsMetadata } from '../lib/tornado-browser-evidence.mjs'
