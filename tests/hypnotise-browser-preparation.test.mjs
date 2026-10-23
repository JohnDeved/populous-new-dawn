import assert from 'node:assert/strict'
import test from 'node:test'
import { createGameStore } from '../app/game-store.ts'
import { prepareEarnedHypnotise, hypnotiseTarget } from '../scripts/tutorial-browser/hypnotise-fixture.mjs'
import { tick } from '../app/model.ts'
import { hypnotiseChargingVisitLimit } from '../scripts/tutorial-browser/hypnotise-fixture.mjs'
import { spellTargetError } from '../app/live-command.ts'
import { readFileSync } from 'node:fs'

for (const initialVisits of [0, 1, 20, 60]) test(`opt-in Hypnotise earns stock after ${initialVisits} ordinary startup visits`, async () => {
  const store = createGameStore()
  assert.equal(store.startDebugMission(22), true)
  const world = store.getWorld()
  world.paused = false
  for (let i = 0; i < initialVisits; i++) tick(world, 1 / 12)
  const initialProgress = [...world.manaTribes[0].spellProgress]
  world.paused = true
  let focus, changes = 0
  const result = await prepareEarnedHypnotise({ world, isCurrent: () => true,
    focus: point => { focus = point }, onChange: () => { changes++ } })
  assert.equal(result.startedTurn, initialVisits)
  assert.deepEqual(result.initialState.spellProgress, initialProgress)
  assert.equal(hypnotiseChargingVisitLimit, 9195)
  assert.ok(result.chargingVisits <= hypnotiseChargingVisitLimit)
  assert.equal(result.chargedTurn, initialVisits + result.chargingVisits)
  assert.ok(result.readyTurn > result.chargedTurn)
  if (!initialVisits) {
    assert.equal(result.readyTurn, 6172)
    assert.equal(result.chargingVisits, 5948)
    assert.equal(result.initialState.availableMana, 30000)
  } else {
    assert.ok(result.chargingVisits > 6100)
    assert.ok(initialProgress[7] >= 2142 && initialProgress[7] < 3000)
  }
  assert.equal(world.manaTribes[0].previousRate, 37)
  assert.equal(world.shots.hypnotise, 1)
  assert.equal(world.paused, true)
  assert.equal(world.effects.some(f => f.kind === 'hypnotise'), false)
  assert.equal(world.projectiles.some(p => p.spell === 'hypnotise'), false)
  assert.equal(spellTargetError(world, 'hypnotise', hypnotiseTarget), null)
  assert.deepEqual(focus, hypnotiseTarget)
  assert.equal(changes, 1)
})

test('Hypnotise is opt-in bundled after unchanged compact witnesses with existing deadline and output root', () => {
  const runner = readFileSync('scripts/tutorial-browser/run.mjs', 'utf8')
  const branch = runner.slice(runner.indexOf("} else if (selectedScenario === 'compact-message-layout')"), runner.indexOf("} else if (selectedScenario === 'm2-pointer-f8')"))
  assert.ok(branch.indexOf('runCompactDiagnosticEpisodes') < branch.indexOf('receipt.hypnotise'))
  assert.match(branch, /output: out, deadlineAt: browserDeadlineAt/)
  const fixture = readFileSync('scripts/tutorial-browser/fixture/main.tsx', 'utf8')
  assert.match(fixture, /get\('hypnotise-fixture'\) === '1'/)
  assert.match(fixture, /import\('\.\.\/hypnotise-fixture\.mjs'\)/)
  assert.match(fixture, /__pndHypnotiseFixture/)
  assert.ok(!readFileSync('app/page.tsx', 'utf8').includes('hypnotise-fixture'))
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
    hook: { installed: true, restored: true, foreign: false },
    turnSamples: [{ id: 7, turn: 24, remaining: 12, converted: [] },
      { id: 7, turn: 25, remaining: 11, converted: [90, 91] }],
    samples, crops }
}

test('Hypnotise rendered contract requires authored frames, callback timing, real crop attribution and cleanup', () => {
  validateHypnotiseObservation(observation(), atlas)
  for (const breakWitness of [
    o => { o.samples[0].frame = 1288 },
    o => { o.samples[0].uv[0] = 1 },
    o => { o.samples[0].submitted = false },
    o => { o.turnSamples[1].converted = [] },
    o => { o.turnSamples[0].converted = [90] },
    o => { o.turnSamples[1].remaining = 10 },
    o => { o.turnSamples[1].turn++ },
    o => { o.turnSamples[1].id++ },
    o => { o.hook.restored = false },
    o => { o.crops[0].stamp++ },
    o => { o.crops[0].colors = 1 },
    o => { o.terminal.turn-- },
    o => { o.terminal.turn++ },
    o => { o.terminal.meshPresent = true },
    o => { o.birth.cue = false },
  ]) {
    const damaged = observation()
    breakWitness(damaged)
    assert.throws(() => validateHypnotiseObservation(damaged, atlas))
  }
})
