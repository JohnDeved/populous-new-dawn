import assert from 'node:assert/strict'
import test from 'node:test'
import { createGameStore } from '../app/game-store.ts'
import { prepareEarnedHypnotise, hypnotiseTarget } from '../scripts/tutorial-browser/hypnotise-fixture.mjs'
import { spellTargetError } from '../app/live-command.ts'
import { readFileSync } from 'node:fs'

test('opt-in Hypnotise setup earns stock and walks the authored M22 Shaman without casting', async () => {
  const store = createGameStore()
  store.startMission(22)
  const world = store.getWorld()
  world.paused = true
  let focus, changes = 0
  const result = await prepareEarnedHypnotise({ world, isCurrent: () => true,
    focus: point => { focus = point }, onChange: () => { changes++ } })
  assert.equal(result.readyTurn, 6172)
  assert.equal(result.chargingVisits, 5948)
  assert.equal(world.shots.hypnotise, 1)
  assert.equal(world.paused, true)
  assert.equal(world.effects.some(f => f.kind === 'hypnotise'), false)
  assert.equal(world.projectiles.some(p => p.spell === 'hypnotise'), false)
  assert.equal(spellTargetError(world, 'hypnotise', hypnotiseTarget), null)
  assert.deepEqual(focus, hypnotiseTarget)
  assert.equal(changes, 1)
})

test('prepared episode is not activated and contains no production raw-source imports', () => {
  for (const path of ['scripts/tutorial-browser/run.mjs', 'scripts/tutorial-browser/fixture/main.tsx'])
    assert.ok(!readFileSync(path, 'utf8').includes('hypnotise'))
  const text = readFileSync('scripts/tutorial-browser/spell-hypnotise.mjs', 'utf8')
  assert.ok(!text.includes("import('/app/") && !text.includes('import("/app/'))
  assert.ok(text.includes("button('Save checkpoint').click()"))
  assert.ok(text.includes("button('Load checkpoint').click()"))
})

import { validateHypnotiseObservation } from '../scripts/tutorial-browser/hypnotise-observer.mjs'
import atlas from '../app/original-effects.json' with { type: 'json' }

function observation() {
  const sample = (offset, remaining, converted = []) => {
    const frame = atlas.animations.hypnotise[offset]
    return { id: 7, turn: 20 + 16 - remaining, stamp: offset + 1,
      remaining, converted, visible: true, object: 1264, draw: 44, f1: offset * 4,
      frame: 1264 + offset, sequence: 'hypnotise', flags: 0x104, palette: 0,
      opacity: 1, submitted: true, texture: 'http://localhost/original/effects.png',
      size: [100, 100, 1], center: [0.5, 0],
      uv: [100 / atlas.width, 100 / atlas.height, frame.index % 8 * 256 / atlas.width,
        1 - (Math.floor(frame.index / 8) * 256 + 100) / atlas.height] }
  }
  const samples = [sample(0, 16), sample(1, 16), sample(8, 12), sample(10, 11, [90, 91]),
    { object: 0x650, visible: false, remaining: 8, converted: [90, 91] }]
  const crops = samples.slice(0, 2).map((s, i) => {
    s.cropFile = `spell-hypnotise-frame-${i}.png`
    return { filename: s.cropFile, frame: s.frame, turn: s.turn, stamp: s.stamp, colors: 12 }
  })
  return { error: null, bornTurn: 20, birth: { id: 7, remaining: 16, stock: 0, cue: true },
    terminal: { reason: 'logical-expiry', turn: 36, present: false, meshPresent: false, remaining: 0 },
    samples, crops }
}

test('Hypnotise rendered contract requires authored frames, callback timing, real crop attribution and cleanup', () => {
  validateHypnotiseObservation(observation(), atlas)
  for (const breakWitness of [
    o => { o.samples[0].frame = 1288 },
    o => { o.samples[0].uv[0] = 1 },
    o => { o.samples[0].submitted = false },
    o => { o.samples[3].converted = [] },
    o => { o.samples[2].converted = [90] },
    o => { o.crops[0].stamp++ },
    o => { o.crops[0].colors = 1 },
    o => { o.terminal.turn-- },
    o => { o.terminal.meshPresent = true },
    o => { o.birth.cue = false },
  ]) {
    const damaged = observation()
    breakWitness(damaged)
    assert.throws(() => validateHypnotiseObservation(damaged, atlas))
  }
})
