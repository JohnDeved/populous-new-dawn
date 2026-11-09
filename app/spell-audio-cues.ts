import type { Spell } from './world-types.ts'

// Keep the live cast emitter and audio preloading on the same existing cue rows.
export const SPELL_CAST_VOICES = {
  blue: {
    blast: 0x76,
    convertWild: 0x85,
    hypnotise: 0x7b,
    ghostArmy: 0x7d,
    lightning: 0x77,
    bridge: 0x80,
    flatten: 0x83,
    erosion: 0x7e,
    swamp: 0x7f,
    firestorm: 0x7c,
    earthquake: 0x82,
    angel: 0x81,
    volcano: 0x84,
    tornado: 0x78,
    shield: 0x87,
    invisibility: 0x7a,
    armageddon: 0x86,
    bloodlust: 0x88,
    teleport: 0x89,
    swarm: 0x79,
  },
  other: {
    blast: 0x8c,
    convertWild: 0x9b,
    hypnotise: 0x91,
    ghostArmy: 0x93,
    lightning: 0x8d,
    bridge: 0x96,
    flatten: 0x99,
    erosion: 0x94,
    swamp: 0x95,
    firestorm: 0x92,
    earthquake: 0x98,
    angel: 0x97,
    volcano: 0x9a,
    tornado: 0x8e,
    shield: 0x9d,
    invisibility: 0x90,
    armageddon: 0x9c,
    bloodlust: 0x9e,
    teleport: 0x9f,
    swarm: 0x8f,
  },
} satisfies Record<'blue' | 'other', Record<Spell, number>>

export const SPELL_CAST_CUES = [
  ...new Set(Object.values(SPELL_CAST_VOICES).flatMap(voices => Object.values(voices))),
]
