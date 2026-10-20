import assert from 'node:assert/strict'
import { readFileSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { createStartedWorld } from './level-start-fixture.mjs'
import { interruptFlyby } from '../app/flyby.ts'
import { dismantleBuilding } from '../app/live-building-entry.ts'
import {
  createBoundary,
  replaceBetweenPaints,
  advanceDismantle,
} from '../scripts/tutorial-browser/building-panel-fixture.mjs'
import {
  assertReplacement,
  assertCompletion,
  buildingPanelIdentityLimitMs,
  finishBuildingPanelIdentity,
} from '../scripts/tutorial-browser/building-panel-identity.mjs'
import { browserCapMs } from '../scripts/tutorial-browser/scenario-policy.mjs'

test('hosted fixture uses actual allocation, admission and phased worker dismantling without disabling world callbacks', () => {
  const world = createStartedWorld()
  // Source fixture's supplied public-Skip boundary; browser uses the visible button.
  interruptFlyby(world.flyby, { x: 0, y: 0, angle: 0, zoom: 0 })
  world.inputMask = 0
  world.paused = true
  const flags = world.manaWorld.gameFlags
  const scene = {
    world,
    isCurrent: () => true,
    focus() {},
    startGroundView() {},
    updateCameraMotion() {},
    onChange() {},
    renderer: { info: { render: { frame: 5 } } },
    previous: 12,
    buildingPanels: new Map(),
  }
  const witness = createBoundary(scene)
  const panel = { hidden: false, isConnected: true, children: [{}, { dataset: { person: '' } }] }
  scene.buildingPanels.set(witness.old.id, panel)
  const replacement = replaceBetweenPaints(witness)
  assertReplacement(replacement)
  assert.equal(world.paused, true)
  assert.equal(world.manaWorld.gameFlags, flags, 'No computer/gameplay suppression flags')
  assert.equal(world.selected.length, 0)
  assert.equal(witness.unit.inside, witness.building.id)
  assert.equal(scene.buildingPanels.get(witness.building.id), panel)
  assert.throws(() => advanceDismantle(witness, false), /Visible button/)
  // Source-only fixture contract: browser episode must obtain this via a real
  // visible locator click. This test is not that rendered acceptance.
  dismantleBuilding(world, witness.building)
  const partial = advanceDismantle(witness, false)
  assert.ok(partial.hp > 0 && partial.progress > 0 && partial.progress < 1)
  assert.equal(partial.removed, false)
  const completed = advanceDismantle(witness, true)
  assertCompletion(completed)
  assert.equal(world.paused, true)
  assert.equal(world.manaWorld.gameFlags, flags)
})

test('browser receipt rejects intervening paint, deletion shortcut and missing real timber', () => {
  const replacement = {
    oldHp: 0,
    samePanel: true,
    frameBefore: 5,
    frameAfter: 5,
    personBefore: '',
    personAfter: '',
    entryTurns: 3,
    id: 1023,
    person: 1100,
  }
  assertReplacement(replacement)
  for (const change of [
    { frameAfter: 6 },
    { samePanel: false },
    { personAfter: '1100' },
    { oldHp: 1 },
    { entryTurns: 0 },
  ])
    assert.throws(() => assertReplacement({ ...replacement, ...change }))
  const completed = {
    hp: 0,
    removed: true,
    dismantled: true,
    personAlive: true,
    inside: null,
    recoveredTimber: 5,
    expectedTimber: 5,
  }
  assertCompletion(completed)
  for (const change of [
    { dismantled: false },
    { removed: false },
    { personAlive: false },
    { inside: 1023 },
    { recoveredTimber: 0 },
  ])
    assert.throws(() => assertCompletion({ ...completed, ...change }))
})

test('hosted building witness is query-gated and preserves finite cases within Tutorial aggregate headroom', () => {
  const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
  const fixture = read('scripts/tutorial-browser/fixture/main.tsx'),
    runner = read('scripts/tutorial-browser/run.mjs'),
    scenario = read('scripts/tutorial-browser/building-panel-identity.mjs')
  assert.match(fixture, /get\('building-panel-identity'\) === '1'/)
  assert.match(fixture, /import\('\.\.\/building-panel-fixture\.mjs'\)/)
  assert.equal(buildingPanelIdentityLimitMs, 35000)
  assert.equal(browserCapMs('tutorial'), 240000)
  for (const name of [
    'result',
    'selectorInspection',
    'sceneryPlacement',
    'm2PointerF8',
    'spellProjection',
    'buildingPanelIdentity',
  ])
    assert.match(runner, new RegExp(`receipt\\.${name} = await`))
  assert.match(
    runner,
    /if \(selectedScenario === 'tutorial'\) receipt\.buildingPanelIdentity = await/
  )
  assert.match(runner, /buildingIdentityScenarioSha256: hash\(buildingIdentityScenario\)/)
  assert.match(scenario, /await occupant\.click\(\)/)
  assert.match(scenario, /await panel\.locator\('\.dismantle-control'\)\.click\(\)/)
  assert.doesNotMatch(scenario, /force: true|dispatchEvent|\.evaluate\([^\n]*\.click\(/)
})

test('browser witness cleanup preserves failures instead of passing timeouts or console errors', async t => {
  const output = mkdtempSync(join(tmpdir(), 'pnd-building-identity-'))
  t.after(() => rmSync(output, { recursive: true, force: true }))
  for (const boundary of [
    { timedOut: true },
    { errors: ['boom'] },
    { failure: Error('assertion') },
  ]) {
    let closed = false
    const report = { errors: [], ...boundary }
    await assert.rejects(
      finishBuildingPanelIdentity({
        context: {
          async close() {
            closed = true
          },
        },
        report,
        output,
        failure: boundary.failure,
      })
    )
    assert.equal(closed, true)
    assert.equal(report.status, 'failed')
    assert.ok(report.failures.length > 0)
  }
})
