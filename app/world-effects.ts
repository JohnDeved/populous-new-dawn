import { type World, type Point, type SoundEvent, type Effect } from './world-types.ts'
import constants from './original-constants.json' with { type: 'json' }
import { TURNS_PER_SECOND } from './world-rules.ts'
import { nativePosition } from './world-terrain-runtime.ts'
import { terrainPointHeight } from './native-terrain.ts'
import { setAnimationObject } from './animation.ts'
import { addTerrainLight, updateTerrainLights } from './terrain-light.ts'

// Presentation events have their own serial; they never consume simulation IDs or random values.
// ponytail: retain 128 recent cues; a streaming consumer is needed if a catch-up frame exceeds that history.
export function sound(w: World, cue: number, p: Point, owner?: number) {
  const event: SoundEvent = {
    serial: ++w.soundSerial,
    cue,
    x: p.x,
    z: p.z,
    turn: w.turn,
    ...(owner === undefined ? {} : { owner }),
  }
  w.sounds.push(event)
  if (w.sounds.length > 128) w.sounds.shift()
  return event
}
export function effect(w: World, kind: Effect['kind'], p: Point, silent = false) {
  // Browser allocation adapter; full native class-7 allocation ownership is pending.
  // Debris (class 10) and fire (class 5) have separate native counters.
  if (
    kind !== 'debris' &&
    kind !== 'fire' &&
    kind !== 'orderMarker' &&
    kind !== 'reincarnation' &&
    kind !== 'gift'
  )
    w.effectCounter = (w.effectCounter + 1) & 255
  const f: Effect = {
    x: p.x,
    z: p.z,
    kind,
    id: w.nextId++,
    age: 0,
    duration:
      kind === 'bridge'
        ? constants.LAND_BRIDGE_DURATION / TURNS_PER_SECOND
        : kind === 'hit'
          ? 0.5
          : 1.7,
  }
  if (
    kind === 'blast' ||
    kind === 'lightning' ||
    kind === 'splash' ||
    kind === 'birth' ||
    kind === 'orderMarker'
  ) {
    // Effect 38: 0x509c10 grounds the flash (0x445c20), sets draw 30/HFX1099;
    // state 0x24 in 0x50a750 removes its object after nine simulation turns.
    // Lightning starts hidden: one pending turn, then eight turns of upper flash.
    const position = nativePosition(w, p)
    f.height = (terrainPointHeight(w.land, position) + (kind === 'lightning' ? 1024 : 0)) / 45
    f.turnsRemaining = kind === 'splash' || kind === 'birth' ? 16 : 9
    f.duration = f.turnsRemaining / TURNS_PER_SECOND
    f.animation = {
      object: 0,
      draw: 0,
      morph: 0,
      palette: 0,
      renderFlags: 0,
      f1: 0,
      f2: 0,
      stamp: 0,
      flags3: 0,
      morphTimer: 0,
      morphFrames: 0,
    }
    if (kind === 'orderMarker') {
      // 0x4afff0 overrides class-7/model-61: grounded HFX1294, lowered 160,
      // four processor visits. Secondary allocation preserves the class counter.
      f.height -= 160 / 45
      f.turnsRemaining = 4
      f.duration = 4 / TURNS_PER_SECOND
      f.sprite = { sequence: 'hit', frame: 0 }
      setAnimationObject(f.animation, 46, 1294)
    } else if (kind === 'birth') {
      // 0x404c80 overrides effect 60's initial draw 44/HFX1288 with 41/HFX1441.
      setAnimationObject(f.animation, 44, 1288)
      setAnimationObject(f.animation, 41, 1441)
    } else if (kind === 'splash') {
      // Effect 65, 0x513830: grounded draw 44/HFX1304, cue 44, sixteen turns.
      setAnimationObject(f.animation, 44, 1304)
      f.animation.morph = 0xd3
      f.animation.flags3 |= 0x40400
      if (!silent) sound(w, 0x2c, p)
    } else {
      setAnimationObject(f.animation, kind === 'blast' ? 30 : 41, kind === 'blast' ? 1099 : 0x650)
    }
  }
  w.effects.push(f)
  if (kind === 'blast') registerTerrainLight(w, f, 4)
  return f
}
function lightPosition(w: World, f: Effect) {
  if (f.fire) return f.fire
  const position = nativePosition(w, f)
  if (f.height !== undefined) position.h = Math.round(f.height * 45)
  return position
}
export function registerTerrainLight(w: World, f: Effect, strength: number) {
  if (
    addTerrainLight(w.lights, {
      owner: f.id,
      strength,
      flicker: 4,
      flags: 0,
      position: lightPosition(w, f),
    })
  )
    refreshTerrainLights(w)
}
export function refreshTerrainLights(w: World) {
  if (
    updateTerrainLights(
      w.land,
      w.lights,
      id => {
        const f = w.effects.find(f => f.id === id)
        return f && lightPosition(w, f)
      },
      w.lightView,
      w.randomState,
      true // Desktop rendering enables native dynamic landscape lighting.
    )
  )
    w.lightRevision++
}
