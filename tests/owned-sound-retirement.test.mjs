import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { short } from '../app/native-math.ts'

// Execute only these two actual pure function bodies, never the audio/model imports.
const source = readFileSync(new URL('../app/audio.ts', import.meta.url), 'utf8')
const ast = ts.createSourceFile('audio.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
const functions = ['soundAttenuation', 'playWorldSounds'].map(name => {
  const nodes = ast.statements.filter(n => ts.isFunctionDeclaration(n) && n.name?.text === name)
  assert.equal(nodes.length, 1)
  return nodes[0].getText(ast).replace(/^export /, '')
}).join('\n')
const { playWorldSounds } = new Function('short', ts.transpileModule(functions, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
}).outputText + ';return { playWorldSounds }')(short)

function fixture({ synchronous = false } = {}) {
  const owner = 17, voices = []
  const fire = { soundPlaying: true }, burn = { soundPlaying: true }
  const person = { id: owner, native: { flags4: 48 }, flight: { flags4: 48 } }
  const scene = {
    world: { sounds: [], effects: [{ id: owner, fire }], buildings: [{ id: owner, burn }], units: [person] },
    ownedSounds: new Map(), soundSerial: 0, viewPoint: { x: 0, z: 0 },
    screen: () => ({ x: 0.25 }),
    onSound(cue, attenuation, pan, finished) {
      if (synchronous) { finished?.(); return }
      const voice = { cue, attenuation, pan, finished, stops: 0 }
      voice.stop = () => { voice.stops++ }
      voices.push(voice)
      return voice.stop
    },
  }
  let serial = 0
  const emit = (extra = {}) => {
    scene.world.sounds.push({ serial: ++serial, cue: 7, owner, x: 0, z: 0, ...extra })
    playWorldSounds(scene)
  }
  const flags = () => [fire.soundPlaying, burn.soundPlaying, person.native.flags4, person.flight.flags4]
  return { scene, owner, voices, emit, flags }
}

test('a late ended callback cannot remove a newer same-owner stop handle or flags', () => {
  const f = fixture()
  f.emit(); f.emit()
  const [old, current] = f.voices
  old.finished()
  assert.equal(f.scene.ownedSounds.get(f.owner), current.stop)
  assert.deepEqual(f.flags(), [true, true, 48, 48])
  current.finished()
  assert.equal(f.scene.ownedSounds.has(f.owner), false)
  assert.deepEqual(f.flags(), [false, false, 32, 32])
})

test('a stop/restart followed by delayed ended still allows stopping the successor', () => {
  const f = fixture()
  f.emit(); const old = f.voices[0]
  f.emit({ stop: true }); assert.equal(old.stops, 1)
  f.emit(); const current = f.voices[1]
  old.finished()
  f.emit({ stop: true })
  assert.equal(current.stops, 1)
})

test('out-of-order retirement of multiple voices preserves the latest owner', () => {
  const f = fixture()
  f.emit(); f.emit(); f.emit()
  f.voices[1].finished(); f.voices[0].finished()
  assert.equal(f.scene.ownedSounds.get(f.owner), f.voices[2].stop)
})

test('ordinary owner completion clears only its voice and sound-playing bit', () => {
  const f = fixture()
  f.emit(); f.voices[0].finished()
  assert.deepEqual(f.flags(), [false, false, 32, 32])
  assert.equal(f.scene.ownedSounds.size, 0)
})

test('stopped voice without replacement retains existing eventual flag cleanup', () => {
  const f = fixture()
  f.emit(); f.emit({ stop: true }); f.voices[0].finished()
  assert.deepEqual(f.flags(), [false, false, 32, 32])
  assert.equal(f.scene.ownedSounds.size, 0)
})

test('synchronous no-playback completion retains cleanup without a temporal-dead-zone error', () => {
  const f = fixture({ synchronous: true })
  assert.doesNotThrow(() => f.emit())
  assert.deepEqual(f.flags(), [false, false, 32, 32])
  assert.equal(f.scene.ownedSounds.size, 0)
})

test('unowned and nonpositional notification playback remain unchanged', () => {
  const f = fixture()
  f.emit({ owner: undefined }); f.emit({ cue: 225 })
  assert.equal(f.voices[0].finished, undefined)
  assert.equal(f.voices[1].finished, undefined)
  assert.deepEqual([f.voices[1].attenuation, f.voices[1].pan], [1, 0])
  assert.equal(f.scene.ownedSounds.size, 0)
})

test('replaying an already-consumed sound list does not start duplicate voices', () => {
  const f = fixture()
  f.emit(); playWorldSounds(f.scene)
  assert.equal(f.voices.length, 1)
  assert.equal(f.scene.soundSerial, 1)
})

test('actual playSample stop handles survive a delayed ended event from a replaced source', () => {
  const soundClass = ast.statements.find(n => ts.isClassDeclaration(n) && n.name?.text === 'Soundscape')
  const methods = soundClass.members.filter(n => ts.isMethodDeclaration(n) && n.name.getText(ast) === 'playSample')
  assert.equal(methods.length, 1)
  const body = ts.transpileModule('class Playback { ' + methods[0].getText(ast) + ' }', {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
  }).outputText
  const playSample = new Function(body + ';return Playback.prototype.playSample')()
  const nodes = [], noop = () => {}
  const plainNode = () => ({ connect: noop, disconnect: noop })
  const sound = {
    buffers: new Map([['sample', {}]]), master: {}, active: new Set(),
    context: {
      createGain: () => ({ ...plainNode(), gain: { value: 0 } }),
      createStereoPanner: () => ({ ...plainNode(), pan: { value: 0 } }),
      createBufferSource() {
        const node = { ...plainNode(), playbackRate: { value: 0 }, stops: 0,
          addEventListener(_name, callback) { this.ended = callback }, start: noop,
          stop() { this.stops++ } }
        nodes.push(node); return node
      },
    },
  }
  const f = fixture()
  f.scene.onSound = (_cue, attenuation, pan, finished) =>
    playSample.call(sound, { key: 'sample', pitch: 1, volume: 1 }, attenuation, pan, finished)?.stop
  f.emit(); f.emit({ stop: true }); f.emit()
  nodes[0].ended()
  assert.deepEqual(f.flags(), [true, true, 48, 48])
  f.emit({ stop: true })
  assert.equal(nodes[1].stops, 1)
  nodes[1].ended()
  assert.deepEqual(f.flags(), [false, false, 32, 32])
  assert.equal(sound.active.size, 0)
})
