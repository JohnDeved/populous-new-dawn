import { withoutCampaignPopup } from './support/world-input-page.mjs'
import { worldPauseState } from '../scripts/browser-world-input.mjs'
import { spyDeliveryFixture, corruptSpyDelivery } from './support/spy-delivery-fixture.mjs'
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { matchesGlob } from 'node:path'
import yaml from 'js-yaml'
import { checkpointCodec } from '../scripts/tutorial-browser/checkpoint-codec.mjs'
import { createSpySourceFixture } from '../scripts/tutorial-browser/spy-source-fixture.mjs'
import { resumeSpySourceInput } from '../scripts/tutorial-browser/spy-source.mjs'
import { admitSpySourceEpisode, withSpySourceBrowser, spySourceBudgetMs } from '../scripts/tutorial-browser/spy-source-budget.mjs'
import { validateSpySourceObservation, validateSpySourceSample } from '../scripts/tutorial-browser/spy-source-evidence.mjs'
import { awaitSpySourceReadiness, readSpySourceReadiness, spySourceReadinessMs } from '../scripts/tutorial-browser/spy-source-readiness.mjs'
import { runProfileEpisode } from '../scripts/tutorial-browser/profile-episodes.mjs'
import { browserCapMs, browserScenarios } from '../scripts/tutorial-browser/scenario-policy.mjs'
import units from '../app/original-units.json' with { type: 'json' }
import witness from './fixtures/follower-source-witness.json' with { type: 'json' }

function sample(f2 = 0) {
  const frame = units.frames.findIndex(frame => frame.source === witness.sources[136][0].frames[f2])
  return { spyId: 100, targetId: 101, target: 101, turn: 20 + f2 * 2, stamp: 30 + f2 * 4,
    object: 136, draw: 22, renderedDraw: 22, owner: 1, disguise: 0x40, substate: 2, timer: 23 - f2 * 2,
    f2, entryArmed: false, heading: Math.PI, cameraBearing: 0x380 * Math.PI / 1024, direction: 0,
    frame, flip: false, missingNativeSource: null,
    pieces: units.frames[frame].layers.filter(layer => {
      const type = layer.flags >> 4 & 31, choice = layer.flags >> 9
      return !type || (type === 1 ? choice === 1 : type === 2 && choice === 3)
    }).map(layer => layer.piece),
    visible: true, canvasConnected: true, documentVisible: true, sceneStoreMatch: true, speed: 1,
    bodyInCanvas: true, bodyCanvasOwned: true, cropOverlayClear: true,
    cropFile: `spy-source-frame-${f2}.png` }
}
function report() {
  const samples = [sample(), sample(1)]
  samples.forEach(row => { row.submittedLayers = row.pieces.length })
  return { evidenceVersion: 3, delivery: spyDeliveryFixture(),
    inputs: { 'scripts/controlled-scene-frames.mjs': spyDeliveryFixture().sha256 }, budget: { deadlineAt: 45000 },
    capture: { version: 2, method: 'controlled-full-scene', frameMs: 1000 / 24,
      maxFrames: 384, maxTurns: 192, frames: 8, turns: 4, startTurn: 18,
      suppliedElapsedMilliseconds: 8 * (1000 / 24), deadlineAt: 45000,
      installed: true, released: true, rafRestored: true, cancelRestored: true,
      resumedRAF: true, foreign: false, error: null,
      handback: { previous: 1000, timestamp: 1500, turn: 22, stamp: 40,
        spyAndAnimationUnchanged: true, evidence: false } },
    spyId: 100, targetId: 101, order: { target: 101, selected: [100], lastOrderTurn: 10 },
    holdBefore: { paused: true, turn: 22 },
    holdAfter: { paused: true, turn: 22 }, resumed: { paused: false, turn: 23 },
    observation: { error: null, done: true, nonAdvancingCallbacks: 0,
      turns: [
      { turn: 18, substate: 1, timer: 1, object: 48, entryArmed: false, f2: 0 },
      { turn: 19, substate: 2, timer: 0, object: 48, entryArmed: true, f2: 0 },
      { turn: 20, substate: 2, timer: 23, object: 136, entryArmed: false, f2: 0 },
    ].map(row => ({ ...row, spyId: 100, targetId: 101, target: 101, speed: 1, paused: false, sceneStoreMatch: true })),
      hook: { installed: true, restored: true, foreign: false },
      turnSamples: [19, 20, 21, 22].map(turn => ({ spyId: 100, targetId: 101, target: 101,
        turn, speed: 1, paused: false, substate: 2, entryArmed: turn === 19,
        object: turn === 19 ? 48 : 136, timer: turn === 19 ? 0 : 43 - turn,
        f2: turn === 19 || turn === 20 ? 0 : 1 })), samples: [
      { substate: 1, target: 101 },
      { substate: 2, entryArmed: true, object: 48, timer: 0, turn: 19 }, ...samples],
    crops: samples.map(row => ({ filename: row.cropFile, spyId: row.spyId,
      turn: row.turn, stamp: row.stamp, frame: row.frame, f2: row.f2, opaqueColors: 3, sha256: 'a'.repeat(64) })) } }
}

test('Spy browser evidence admits actual source136 identity and rejects substituted or incomplete render observations', () => {
  assert.deepEqual(validateSpySourceObservation(report()).croppedFrames, [0, 1])
  const catchUp = report(); catchUp.observation.samples.splice(1, 1)
  assert.deepEqual(validateSpySourceObservation(catchUp).croppedFrames, [0, 1],
    'Pending entry witnessed by its real logical visit need not have its own rendered frame')
  for (const change of [
    ...corruptSpyDelivery,
    r => { delete r.evidenceVersion },
    r => { r.capture.resumedRAF = false },
    r => { r.capture.handback.evidence = true },
    r => { r.capture.foreign = true },
    r => { r.capture.frames = 385 },
    r => { r.captureCleanupFailure = 'restore failed' },
    r => { r.observation.hook.restored = false },
    r => { r.observation.turnSamples.splice(1, 1) },
    r => { r.observation.turnSamples[1].timer = 22 },
    r => { r.observation.turnSamples[1].f2 = 1 },
    r => { r.observation.turnSamples[1].object = 48 },
    r => { r.observation.crops[0].f2 = 1 },
    r => { r.observation.error = 'Page failed' },
    r => { r.order.target = 102 },
    r => { r.order.selected = [102] },
    r => { r.observation.samples[2].spyId++ },
    r => { r.observation.done = false },
    r => { r.observation.samples = r.observation.samples.filter(row => row.substate !== 1) },
    r => { delete r.observation.turns },
    r => { r.observation.turns.splice(1, 1) },
    r => { r.observation.turns[1].spyId++ },
    r => { r.observation.turns[1].object = 136 },
    r => { r.observation.turns[1].turn++ },
    r => { r.observation.turns[0].timer = 2 },
    r => { r.observation.turns[2].timer = 22 },
    r => { r.observation.turns[2].f2 = 1 },
    r => { r.observation.turns[2].target++ },
    r => { r.observation.samples[2].timer = 24 },
    r => { r.observation.samples[2].turn++ },
    r => { r.observation.samples[2].frame = 0 },
    r => { r.observation.samples[2].draw = 17 },
    r => { r.observation.samples[2].owner = 0 },
    r => { r.observation.samples[2].flip = true },
    r => { r.observation.samples[2].submittedLayers = 0 },
    r => { r.observation.samples[2].pieces.pop() },
    r => { r.observation.samples[2].missingNativeSource = 136 },
    r => { r.observation.samples[2].cropOverlayClear = false },
    r => { r.observation.crops.pop() },
    r => { r.observation.crops[0].stamp++ },
    r => { r.observation.crops[0].opaqueColors = 1 },
    r => { r.observation.crops[0].sha256 = 'missing' },
    r => { r.holdAfter.turn++ },
    r => { r.resumed.paused = true },
  ]) {
    const candidate = report(); change(candidate)
    assert.throws(() => validateSpySourceObservation(candidate))
  }
  const malformed = sample(); malformed.submittedLayers = malformed.pieces.length; malformed.f2 = 999
  assert.throws(() => validateSpySourceSample(malformed))
})

test('Spy45s admission retains the original180s host deadline and never skips short budgets', () => {
  const signal = new AbortController().signal
  assert.equal(spySourceBudgetMs, 45000)
  assert.deepEqual(admitSpySourceEpisode({ signal, deadlineAt: 180000, now: 135000 }),
    { startedAt: 135000, deadlineAt: 180000, hostDeadlineAt: 180000, capMs: 45000 })
  assert.throws(() => admitSpySourceEpisode({ signal, deadlineAt: 180000, now: 135001 }), /Full 45-second/)
  assert.throws(() => admitSpySourceEpisode({ signal, deadlineAt: NaN, now: 0 }), /Original/)
  const controller = new AbortController(); controller.abort(Error('host deadline'))
  assert.throws(() => admitSpySourceEpisode({ signal: controller.signal, deadlineAt: 180000, now: 0 }), /host deadline/)
})

test('owned Spy browser closes on success, scenario failure and abort during launch without replacement', async () => {
  for (const mode of ['success', 'scenario-failed', 'launch-aborted', 'cleanup-failed']) {
    const calls = [], controller = new AbortController(), report = {}
    let connected = true
    const browser = { isConnected: () => connected, close: async () => {
      calls.push('close')
      if (mode === 'cleanup-failed') throw Error('cleanup-failed')
      connected = false
    } }
    const chromium = { launch: async options => {
      calls.push('launch')
      assert.equal(options.chromiumSandbox, true)
      assert.ok(options.timeout > 0 && options.timeout <= 45000)
      if (mode === 'launch-aborted') controller.abort(Error('launch-aborted'))
      return browser
    } }
    const run = withSpySourceBrowser({ chromium, launch: { chromiumSandbox: true },
      signal: controller.signal, deadlineAt: Date.now() + 180000, report }, async () => {
      calls.push('scenario')
      if (mode === 'scenario-failed') throw Error('scenario-failed')
      return 'passed'
    })
    if (mode === 'success') assert.equal(await run, 'passed')
    else await assert.rejects(run, new RegExp(mode))
    assert.equal(calls.filter(value => value === 'launch').length, 1)
    assert.equal(calls.filter(value => value === 'close').length, 1)
    assert.equal(report.cleanupVerified, mode === 'cleanup-failed' ? undefined : true)
    assert.equal(report.budget.capMs, 45000)
  }
})

test('current checkpoint supplies a truly trained Spy but never seeds disguise or the source136 animation', async () => {
  const fixture = await createSpySourceFixture('a'.repeat(40))
  const { world } = checkpointCodec(fixture.transfer, true)
  const spy = world.units.find(unit => unit.id === fixture.spyId)
  const target = world.buildings.find(building => building.id === fixture.targetId)
  assert.equal(spy.kind, 'spy'); assert.equal(spy.inside, null)
  assert.notEqual(spy.native?.object, 136)
  assert.equal(spy.native?.disguise ?? 0, 0)
  assert.deepEqual(world.selected, [])
  assert.equal(world.paused, true)
  assert.equal(world.inputMask, 64, 'simulation-only training does not finish the presentation-owned introduction')
  assert.equal(world.flyby.flags & 17, 17, 'the saved original flyby is active and interruptible')
  assert.equal(world.flyby.frame, 0)
  assert.equal(world.flyby.warmup, 6)
  assert.equal(target.team, 'red')
  assert.equal(fixture.receipt.stages.map(stage => stage.stage).join(','), 'admitted,trained,departed')
  const { loadSceneFixture } = await import('./support/bloodlust-scene.mjs')
  const api = await loadSceneFixture()
  const { currentPersonOrder } = await import('../app/person-orders.ts')
  api.select(world, 'spy')
  const actions = [], page = withoutCampaignPopup({
    evaluate: async fn => { assert.equal(fn, worldPauseState); return { paused: world.paused, inputMask: 0, turn: world.turn } },
    keyboard: { press: async key => { assert.equal(key, 'Space'); world.paused = false; actions.push('resume') } },
    waitForFunction: async () => { assert.equal(world.paused, false); actions.push('running') },
  }), action = async (_name, run) => run()
  assert.equal(api.disguiseSelectedSpies(world, 1), false, 'the actual shipped command rejects paused input')
  await resumeSpySourceInput(page, action, 'Disguise as Dakini', async () => {
    assert.equal(api.disguiseSelectedSpies(world, 1), true); actions.push('disguise')
  })
  for (let n = 0; spy.native?.disguise !== 0x40 && n < 100; n++) api.tick(world, 1 / 12)
  assert.equal(spy.native.disguise, 0x40)
  world.paused = true
  assert.equal(api.command(world, target), false, 'sabotage also rejects paused input')
  await resumeSpySourceInput(page, action, 'Canvas sabotage command', async () => {
    assert.equal(api.command(world, target), true); actions.push('sabotage')
  })
  assert.deepEqual(actions, ['resume', 'running', 'disguise', 'resume', 'running', 'sabotage'])
  assert.equal(spy.target, target.id, 'Canvas command exposes its target before the next ordinary turn')
  assert.equal(currentPersonOrder(world.buildingOrders, spy.native).model, 15)
  const clock = { animationTime: 0, animationFrame: 0 }, stages = []
  for (let visit = 0; spy.native.object !== 136 && visit < 180; visit++) {
    api.advanceGame(world, clock, 1 / 24)
    stages.push({ turn: world.turn, substate: spy.native.substate, armed: !!(spy.native.flags2 & 0x40000000),
      timer: spy.native.timer, object: spy.native.object, f2: spy.native.f2 })
  }
  const armed = stages.find(stage => stage.substate === 2 && stage.armed)
  assert.ok(armed)
  assert.notEqual(armed.object, 136)
  assert.equal(spy.native.object, 136)
  assert.equal(spy.native.f2, 0)
  assert.equal(spy.native.timer, 23)
  assert.equal(world.turn, armed.turn + 1)
})

test('the exact Spy checkpoint introduction outlasts 8s but the production native interruption releases its own input bit', async () => {
  const fixture = await createSpySourceFixture('a'.repeat(40)),
    world = checkpointCodec(fixture.transfer, true).world,
    { skipIntroduction, updateFlyby } = await import('../app/scene-camera-runtime.ts'),
    spy = world.units.find(unit => unit.id === fixture.spyId)
  // The actual public Load sets paused=false. Presentation visits, unlike the
  // fixture's simulation ticks, own this preserved timeline.
  world.paused = false
  let notifications = 0
  // Supplied introduction fixture retains one live Scene owner throughout.
  const scene = { world, wasFlying: true, flybyTime: 0, isCurrent: () => true,
    flybyCamera: { x: 0, y: 0, angle: 0, zoom: 0 },
    onChange: () => notifications++,
    updateTooltipController() {}, acquireForcedTooltip() {}, commitSky() {}, updateView() {},
    camera: { up: { set() {} } } }
  for (let frame = 0; frame < 8 * 24; frame++) updateFlyby(scene, 1 / 24)
  assert.equal(world.flyby.flags & 1, 1, 'eight seconds cannot naturally finish this introduction')
  assert.equal(world.inputMask, 64)
  const before = structuredClone(spy), turn = world.turn
  skipIntroduction(scene)
  assert.equal(notifications, 1)
  for (let frame = 0; frame < 3 * 24 && world.inputMask; frame++)
    updateFlyby(scene, 1 / 24)
  assert.equal(world.flyby.flags & 1, 0, 'native interruption finishes within the existing readiness budget')
  assert.equal(world.inputMask, 0, 'the real Scene consumer releases the presentation mask')
  assert.equal(notifications, 1, 'no second Skip or direct mask write is required')
  assert.deepEqual(spy, before, 'Skip cannot seed or advance the animation under test')
  assert.equal(world.turn, turn)
})

test('Spy readiness observes actual owners and presses Space only for an interruptible introduction within the same 8s cap', async () => {
  await assert.rejects(awaitSpySourceReadiness({ deadlineAt: NaN }), /Original Spy episode deadline/)
  const original = { window: globalThis.window, document: globalThis.document,
    getComputedStyle: globalThis.getComputedStyle }
  try {
    for (const mode of ['skip', 'ready', 'short-host', 'blocked', 'wrong-scene', 'loading', 'disconnected',
      'inactive', 'unrelated-lock', 'uninterruptible', 'already-skipping', 'skip-failed']) {
      const world = { outcome: { level: 1 }, turn: 116, paused: false,
        inputMask: ['ready', 'short-host'].includes(mode) ? 0 : mode === 'blocked' ? 4 : mode === 'unrelated-lock' ? 192 : 64,
        flyby: { flags: mode === 'uninterruptible' ? 1 : mode === 'inactive' ? 16 : mode === 'already-skipping' ? 85 : 21,
          frame: 0, warmup: 6 } },
        before = structuredClone(world),
        scene = { world: mode === 'wrong-scene' ? {} : world,
          renderer: { domElement: { isConnected: mode !== 'disconnected' } } },
        report = {}, calls = []
      globalThis.window = { testSceneRef: { current: scene }, testStore: { getWorld: () => world } }
      globalThis.document = { querySelector: selector => {
        assert.equal(selector, '.loading-world', 'readiness cannot depend on a removed Skip control')
        return mode === 'loading' ? {} : null
      } }
      const snapshot = readSpySourceReadiness()
      assert.deepEqual(world, before, 'observation is read-only')
      const page = {
        evaluate: async (fn, arg) => fn(arg),
        waitForFunction: async (fn, arg, options) => {
          assert.ok(options.timeout > 0 && options.timeout <= 8000)
          const result = fn(arg)
          if (!result) throw Error('readiness predicate blocked')
          return { jsonValue: async () => result, dispose: async () => calls.push('dispose') }
        },
        keyboard: { press: async key => {
          assert.equal(key, 'Space')
          calls.push('press')
          if (mode === 'skip-failed') throw Error('public Space failed')
          // Keyboard unit boundary only. Rendered execution sends the real key.
          world.inputMask = 0; world.flyby.flags &= ~1
        } },
      }
      const deadlineAt = Date.now() + (mode === 'short-host' ? 500 : 45000),
        run = awaitSpySourceReadiness({ page: withoutCampaignPopup(page), report,
        action: async (name, run) => { calls.push(name); await run() },
        save: () => calls.push('save'), deadlineAt })
      if (['skip', 'ready', 'short-host'].includes(mode)) {
        await run
        assert.equal(report.readiness.after.action, 'ready')
        assert.equal(report.readiness.after.sceneStoreMatch, true)
        assert.equal(calls.filter(call => call === 'press').length, mode === 'skip' ? 1 : 0)
      } else {
        await assert.rejects(run, mode === 'skip-failed' ? /public Space failed/ : /predicate blocked/)
        assert.deepEqual(report.readiness.failed, snapshot, 'failure retains bounded owner diagnostics')
        assert.equal(report.readiness.after, undefined)
        assert.equal(calls.filter(call => call === 'press').length, mode === 'skip-failed' ? 1 : 0)
      }
      assert.equal(report.readiness.capMs, spySourceReadinessMs)
      assert.equal(report.readiness.deadlineAt, Math.min(report.readiness.startedAt + 8000, deadlineAt))
      assert.deepEqual(report.readiness.before, snapshot)
      assert.ok(report.readiness.endedAt)
    }
  } finally {
    for (const [key, value] of Object.entries(original))
      if (value === undefined) delete globalThis[key]
      else globalThis[key] = value
  }
})

test('M10 dispatch refuses a short Spy budget before launch, without skipping either episode', async () => {
  const calls = [], signal = new AbortController().signal
  const mission10 = { status: 'passed', phases: ['created', 'reused'].map(mode => ({ mode, status: 'passed', cleanupVerified: true })) }
  await assert.rejects(runProfileEpisode('mission10-profile', {
    signal, deadlineAt: Date.now() + 44999,
    closeProbe: async () => { calls.push('close') },
    runMission10: async () => { calls.push('created', 'reused'); return mission10 },
    runSpySource: options => withSpySourceBrowser({ ...options, report: {}, launch: {},
      chromium: { launch: () => assert.fail('No launch after failed full-budget admission') } }, () => assert.fail('No reduced episode')),
    runRecovery: () => assert.fail('No unrelated recovery'),
  }), /Full 45-second/)
  assert.deepEqual(calls, ['close', 'created', 'reused'])
})

test('the wired Spy witness retains the M10 artifact root and existing job cap with read-only observation', () => {
  const runner = readFileSync(new URL('../scripts/tutorial-browser/run.mjs', import.meta.url), 'utf8')
  assert.match(runner, /const spySourceScenario = resolve\(root, 'scripts\/tutorial-browser\/spy-source.mjs'\)/)
  assert.equal(browserCapMs('mission10-profile'), 180000)
  assert.equal(browserScenarios.includes('spy-source'), false, 'No new scenario or workflow job')
  const workflow = yaml.load(readFileSync(new URL('../.github/workflows/tutorial-browser.yml', import.meta.url), 'utf8'))
  const job = workflow.jobs['tutorial-browser']
  assert.equal(job.strategy.matrix.include.filter(item => item.scenario === 'mission10-profile').length, 1)
  assert.equal(job.strategy.matrix.include.find(item => item.scenario === 'mission10-profile').artifact, 'mission10-crew-persistence-browser')
  const globs = job.steps.find(step => step.name === 'Retain bounded validation receipts and screenshots').with.path.trim().split(/\s+/)
  for (const name of ['spy-source.json', 'spy-source-context.png', 'spy-source-frame-0.png', 'spy-source-frame-1.png'])
    assert.ok(globs.some(glob => matchesGlob(`outputs/tutorial-browser/${name}`, glob)), name)
  const observer = readFileSync(new URL('../scripts/tutorial-browser/spy-source-observer.mjs', import.meta.url), 'utf8')
  assert.doesNotMatch(observer, /(?:world|p|spy)\.(?:paused|substate|timer|object|f1|f2)\s*=(?!=)/)
  assert.doesNotMatch(observer, /scene\.animate|tick\(|advanceGame|stepLiveBuildingAttack/)
})

test('ordinary catch-up keeps exact Spy logical entry even when the next rendered state is frame1', async () => {
  const fixture = await createSpySourceFixture('a'.repeat(40)),
    { world } = checkpointCodec(fixture.transfer, true),
    { loadSceneFixture } = await import('./support/bloodlust-scene.mjs'), api = await loadSceneFixture(),
    spy = world.units.find(u => u.id === fixture.spyId), target = world.buildings.find(b => b.id === fixture.targetId)
  // CPU setup, not a public browser input or pixel claim.
  api.select(world, 'spy'); world.paused = false
  assert.equal(api.disguiseSelectedSpies(world, 1), true)
  for (let n = 0; spy.native.disguise !== 0x40 && n < 100; n++) api.tick(world, 1 / 12)
  assert.equal(spy.native.disguise, 0x40)
  assert.equal(api.command(world, target), true)
  const clock = { animationTime: 0, animationFrame: 0 }
  for (let n = 0; !(spy.native.substate === 2 && (spy.native.flags2 & 0x40000000)) && n < 360; n++)
    api.advanceGame(world, clock, 1 / 24)
  assert.equal(spy.native.substate, 2); assert.ok(spy.native.flags2 & 0x40000000)
  const armedTurn = world.turn, visits = []
  clock.afterTurn = () => visits.push({ turn: world.turn, object: spy.native.object,
    timer: spy.native.timer, f2: spy.native.f2 })
  api.advanceGame(world, clock, 1 / 6)
  assert.deepEqual(visits, [
    { turn: armedTurn + 1, object: 136, timer: 23, f2: 0 },
    { turn: armedTurn + 2, object: 136, timer: 22, f2: 0 },
  ]) // afterTurn precedes logical animation; do not relabel it as a rendered sample.
  assert.equal(world.turn, armedTurn + 2)
  assert.equal(spy.native.timer, 22)
  assert.equal(spy.native.f2, 1)
  const missingRaster = report()
  missingRaster.observation.samples.splice(2, 1)
  missingRaster.observation.crops.shift()
  assert.throws(() => validateSpySourceObservation(missingRaster), 'Logical entry never substitutes missing frame0 pixels')
})

test('Spy browser reader enforces all-three aggregate600 while retaining valid boundary evidence', () => {
  const value = report(), observation = value.observation
  const padding = 600 - observation.samples.length - observation.turnSamples.length - observation.turns.length
  observation.samples.unshift(...Array.from({ length: padding }, () => structuredClone(observation.samples[0])))
  assert.equal(observation.samples.length + observation.turnSamples.length + observation.turns.length, 600)
  assert.deepEqual(validateSpySourceObservation(value).croppedFrames, [0, 1])
  observation.samples.unshift(structuredClone(observation.samples[0]))
  assert.ok(observation.samples.length + observation.turnSamples.length <= 600, 'old two-ledger bound still passes')
  assert.throws(() => validateSpySourceObservation(value), /Spy aggregate observation bound/)
  for (const key of ['samples', 'turnSamples', 'turns']) {
    for (const malformed of [null, {}, 'not-an-array', undefined]) {
      const bad = report(); bad.observation[key] = malformed
      assert.throws(() => validateSpySourceObservation(bad))
    }
  }
})
