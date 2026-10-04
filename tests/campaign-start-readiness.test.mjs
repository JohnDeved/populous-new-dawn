import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createWorld, tick, select } from '../app/model.ts'
import { animateLiveObjects } from '../app/live-people.ts'
import { campaignShamanReadiness } from '../scripts/campaign-start-readiness.mjs'

const advance = (world, turns) => {
  for (let i = 0; i < turns; i++) { tick(world, 1 / 12); animateLiveObjects(world); animateLiveObjects(world) }
}

test('camera release alone does not make the startup Shaman selectable; observation is read-only', () => {
  const world = createWorld(3)
  advance(world, 21)
  // Portable fixture mirrors Skip introduction's camera-input release only.
  world.inputMask = 0
  const before = structuredClone(world), readiness = campaignShamanReadiness(world)
  assert.deepEqual(world, before)
  assert.equal(readiness.levelStartPhase, 2)
  assert.equal(readiness.shaman.canOrder, true)
  assert.equal(readiness.shaman.flags4 & 128, 128)
  assert.equal(readiness.shaman.selectable, false)
  assert.equal(readiness.ready, false)
  const selected = structuredClone(world)
  select(selected, 'shaman')
  assert.deepEqual(selected.selected, [])
  advance(world, 49)
  const after = structuredClone(world), completed = campaignShamanReadiness(world)
  assert.deepEqual(world, after)
  assert.equal(completed.levelStartPhase, 4)
  assert.equal(completed.shaman.flags4 & 128, 0)
  assert.equal(completed.ready, true)
  select(world, 'shaman')
  assert.deepEqual(world.selected, [completed.shaman.id])
})

test('readiness still rejects absent actors, global input locks and paused play', () => {
  const original = createWorld(3)
  advance(original, 70)
  original.inputMask = 0
  for (const mutate of [world => { world.units = [] }, world => { world.inputMask = 64 }, world => { world.paused = true }]) {
    const world = structuredClone(original)
    mutate(world)
    const before = structuredClone(world)
    assert.equal(campaignShamanReadiness(world).ready, false)
    assert.deepEqual(world, before)
  }
})

test('Continue readiness waits on real RAF before suspension with the existing timeout', () => {
  const checker = readFileSync(new URL('../scripts/check-browser-campaign-natural-victory.mjs', import.meta.url), 'utf8')
  assert.match(checker, /await waitForSelectableShaman\(page, 'Mission 3 after Continue'\)\s+await suspendOwnedFrame\(page\)\s+await missionThree\(page\)/)
  const wait = checker.slice(checker.indexOf('async function waitForSelectableShaman'), checker.indexOf('async function suspendOwnedFrame'))
  assert.ok(wait.includes('page.waitForFunction(sample, true)'))
  assert.ok(!wait.includes('tick(') && !wait.includes('cancelAnimationFrame'))
})


test('the production wait polls synchronous false until native selection readiness', async () => {
  const { default: vm } = await import('node:vm')
  const checker = readFileSync(new URL('../scripts/check-browser-campaign-natural-victory.mjs', import.meta.url), 'utf8')
  const source = checker.slice(checker.indexOf('async function waitForSelectableShaman'), checker.indexOf('async function suspendOwnedFrame'))
  let ready = false, evaluations = 0, waited = false
  const sandbox = { assert, console: { log() {} }, testScene: { world: {} },
    campaignObserveShaman: () => ({ ready, turn: ready ? 52 : 21 }) }
  vm.runInNewContext(source + '\nglobalThis.waitForShaman = waitForSelectableShaman', sandbox)
  const page = {
    async evaluate(fn, arg) {
      if (++evaluations === 1) {
        assert.ok(fn.toString().includes('globalThis.campaignObserveShaman = campaignShamanReadiness'))
        return // Fixture supplies the imported observer above; no browser module is loaded.
      }
      return fn(arg)
    },
    async waitForFunction(predicate, arg) {
      assert.notEqual(predicate.constructor.name, 'AsyncFunction')
      // Match the installed Playwright's synchronous truthy check.
      assert.equal(predicate(arg), false)
      waited = true; ready = true
      const result = predicate(arg)
      assert.equal(result.ready, true)
      return { async jsonValue() { return result }, async dispose() {} }
    },
  }
  await sandbox.waitForShaman(page, 'fixture')
  assert.equal(waited, true)
  assert.equal(sandbox.campaignStartupReadiness[0].before.ready, false)
  assert.equal(sandbox.campaignStartupReadiness[0].after.ready, true)
})
