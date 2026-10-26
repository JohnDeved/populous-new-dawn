import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { observeGameplayResources, captureRetiredGameplayScene, summarizeResourceRestart, assertResourceScenario } from '../scripts/tutorial-browser/gameplay-resource-observer.mjs'
import { browserScenarios, browserCapMs, gameplayResourceSplitBudget } from '../scripts/tutorial-browser/scenario-policy.mjs'

const live = (turn, timestampMs) => ({ level: 2, turn, timestampMs, timeOriginUnixMs: 100, sceneUuid: timestampMs < 2000 ? 'old-scene' : 'replacement-scene',
  paused: false, inputMask: 0, speed: 1, visibility: 'visible', disposed: false,
  aborted: false, canvasConnected: true, connectedBattlefieldCanvases: 1, contextLost: false,
  rendererGeometries: 4, rendererTextures: 3, rendererPrograms: 2,
  reachableGeometryIds: ['shared-geometry', `owned-${timestampMs}`],
  reachableTextureIds: ['shared-texture'], reachableMaterialIds: [`material-${timestampMs}`] })
const retired = () => ({ disposed: true, aborted: true, canvasConnected: false,
  contextLost: true, ownedSoundCount: 0, buildingPanelCount: 0, fpsGraphReleased: true })

test('one live same-document restart reports identity reuse, not cache totals or bytes', () => {
  const result = summarizeResourceRestart(live(40, 1000), retired(), live(1, 2000), live(25, 4000))
  assert.equal(result.reusedReachableGeometryIdentities, 1)
  assert.equal(result.reusedReachableTextureIdentities, 1)
  assert.equal(result.memoryBytes, 'not-measured')
  assert.equal(result.cacheAccounting, 'not-measured-private-module-caches')
})

test('zero reuse remains zero observation, not an invented cache acceptance', () => {
  const before = live(40, 1000), after = live(1, 2000)
  after.reachableGeometryIds = ['other-geometry']; after.reachableTextureIds = ['other-texture']
  const result = summarizeResourceRestart(before, retired(), after, live(25, 4000))
  assert.equal(result.reusedReachableGeometryIdentities, 0)
  assert.equal(result.reusedReachableTextureIdentities, 0)
  assert.equal(result.cacheAccounting, 'not-measured-private-module-caches')
})

test('reject inactive/reloaded/nonadvancing/undisposed/duplicate-canvas evidence', () => {
  for (const mutate of [
    data => { data[1].disposed = false }, data => { data[1].canvasConnected = true },
    data => { data[1].contextLost = false }, data => { data[1].ownedSoundCount = 1 },
    data => { data[2].timeOriginUnixMs++ }, data => { data[3].turn = data[2].turn },
    data => { data[3].paused = true }, data => { data[2].connectedBattlefieldCanvases = 2 },
    data => { delete data[2].timeOriginUnixMs }, data => { data[2].timestampMs = NaN },
    data => { data[2].rendererTextures = null }, data => { data[2].rendererTextures = 0 },
    data => { data[2].sceneUuid = data[0].sceneUuid }, data => { data[3].sceneUuid = 'unexpected-scene' }, data => { data[2].reachableTextureIds = [{}] },
  ]) {
    const data = [live(40, 1000), retired(), live(1, 2000), live(25, 4000)]
    mutate(data); assert.throws(() => summarizeResourceRestart(...data))
  }
})

test('retirement sampling removes aliases on success and thrown resource read', () => {
  const original = globalThis.window
  try {
    for (const fail of [false, true]) {
      globalThis.window = { testSceneRef: {}, testStore: {}, testScene: {
        disposed: true, terrainLoad: { signal: { aborted: true } },
        renderer: { domElement: { isConnected: false }, getContext() {
          if (fail) throw Error('unavailable context'); return { isContextLost: () => true }
        } }, ownedSounds: new Map(), buildingPanels: new Map(), fpsGraph: null,
      } }
      if (fail) assert.throws(captureRetiredGameplayScene, /unavailable context/)
      else assert.deepEqual(captureRetiredGameplayScene(), retired())
      assert.deepEqual(globalThis.window, {})
    }
  } finally {
    if (original === undefined) delete globalThis.window
    else globalThis.window = original
  }
})

test('scene observer returns only serializable primitives, deduplicates shared identities', () => {
  const oldWindow = globalThis.window, oldDocument = globalThis.document
  const texture = { isTexture: true, uuid: 'shared-texture' }
  const object = { geometry: { uuid: 'geometry' }, material: { uuid: 'material', map: texture } }
  const world = { outcome: { level: 2 }, turn: 2, paused: false, inputMask: 0, speed: 1 }
  const scene = { world, disposed: false, terrainLoad: { signal: { aborted: false } },
    scene: { uuid: 'scene', traverse(fn) { fn(object); fn(object) } },
    renderer: { domElement: { isConnected: true }, getContext: () => ({ isContextLost: () => false }),
      info: { memory: { geometries: 1, textures: 1 }, programs: [] } } }
  try {
    globalThis.window = { testScene: scene, testSceneRef: { current: scene }, testStore: { getWorld: () => world } }
    globalThis.document = { visibilityState: 'visible', querySelectorAll: () => [1] }
    const result = observeGameplayResources()
    assert.deepEqual(result, JSON.parse(JSON.stringify(result)))
    assert.deepEqual(result.reachableTextureIds, ['shared-texture'])
    assert.deepEqual(result.reachableGeometryIds, ['geometry'])
    assert.deepEqual(Object.keys(window).sort(), ['testScene', 'testSceneRef', 'testStore'])
  } finally {
    if (oldWindow === undefined) delete globalThis.window; else globalThis.window = oldWindow
    if (oldDocument === undefined) delete globalThis.document; else globalThis.document = oldDocument
  }
})

test('resource mode is explicit boolean and requires all five original phases in order', () => {
  const phases = ['world-hover', 'camera-world', 'hud', 'world-recovery', 'menu-recovery']
  assertResourceScenario(false, phases.slice(0, 2), phases)
  assertResourceScenario(true, phases, phases)
  for (const value of [undefined, null, 1, 'true']) assert.throws(() => assertResourceScenario(value, phases, phases))
  for (const selection of [[], phases.slice(0, 4), [...phases].reverse(), [...phases, phases[0]]])
    assert.throws(() => assertResourceScenario(true, selection, phases), /all original phases/)
})

test('split declares two unchanged 180s browser caps and an extra build/job', () => {
  assert(browserScenarios.includes('gameplay-frames')); assert(browserScenarios.includes('gameplay-resources'))
  assert.equal(browserCapMs('gameplay-frames'), 180000)
  assert.equal(browserCapMs('gameplay-resources'), 180000)
  assert.deepEqual(gameplayResourceSplitBudget, { version: 1, gameplayMs: 180000,
    resourcesMs: 180000, totalBrowserMs: 360000, buildMsPerJob: 120000, hostedJobMs: 900000 })
  assert.throws(() => browserCapMs('gameplay-resource-typo'))
})

test('existing runner owns mandatory dedicated scenario and preserves complete old gameplay sequence', () => {
  const read = name => readFileSync(new URL(`../${name}`, import.meta.url), 'utf8')
  const runner = read('scripts/tutorial-browser/run.mjs'), frames = read('scripts/tutorial-browser/gameplay-frames.mjs')
  const dedicated = runner.split("} else if (selectedScenario === 'gameplay-resources') {")[1].split("} else if (selectedScenario === 'gameplay-frames') {")[0]
  assert.match(dedicated, /receipt\.gameplayResources = .*default\(\{ page, url, output: out, expectedRevision: receipt\.buildRevision, resourceLifecycle: true, resourceProfile: resourceArguments\.profile, ownershipProbe: resourceArguments\.ownershipProbe \}\)/)
  assert.doesNotMatch(dedicated, /measuredPhases|meleeScenario|followerCorpseScenario/)
  const original = runner.split("} else if (selectedScenario === 'gameplay-frames') {")[1].split("} else if (['profile-recovery'")[0]
  assert.match(original, /receipt\.gameplayFrames = .*default\(\{ page, url, output: out, expectedRevision: receipt\.buildRevision \}\)/)
  assert.doesNotMatch(original, /resourceLifecycle|measuredPhases/)
  assert(original.indexOf('receipt.gameplayFrames') < original.indexOf('await context.close()'))
  assert(original.indexOf('await context.close()') < original.indexOf('receipt.meleeAttack'))
  assert(original.indexOf('receipt.meleeAttack') < original.indexOf('receipt.followerCorpse'))
  assert.match(frames, /resourceLifecycle = false/)
  assert.match(frames, /assertResourceScenario\(resourceLifecycle, measuredPhases, plan\.phases\.map/)
  assert.match(frames, /report\.resources = \{ beforeWarmup: await page\.evaluate\(observeGameplayResources\)/)
  assert.match(frames, /await runCycle\(first, 'cycle-1-'\)/)
  assert.match(frames, /await runCycle\(second, 'cycle-2-'\)/)
  assert.equal((frames.match(/await heapSample\(/g) ?? []).length, 3)
  assert.match(frames, /if \(threeCycles\) \{\s+const third = \{ id: 'cycle-3', startup: await restartCycle\(second, 'cycle-3'\)/)
  assert.match(frames, /await runCycle\(third, 'cycle-3-'\)/)
  assert.match(frames, /await heapSample\('after-cycle-3-workload'\)/)
  assert.match(frames, /await heapSample\('after-cycle-1-workload'\)/)
  assert.match(frames, /await heapSample\('after-cycle-2-workload'\)/)
  assert.doesNotMatch(frames, /after-restart-settled/)
  assert.match(frames, /if \(resourceLifecycle\) \{\s+report\.resources\.afterWorkload/)
  assert.match(frames, /resourceLifecycle && !page\.isClosed\(\)/)
  assert.match(runner, /gameplayResourceObserverSha256: hash\(resolve\(root, 'scripts\/tutorial-browser\/gameplay-resource-observer\.mjs'\)\)/)
  assert.match(runner, /scenarioPolicySha256: hash\(resolve\(root, 'scripts\/tutorial-browser\/scenario-policy\.mjs'\)\)/)
  const workflow = read('.github/workflows/tutorial-browser.yml')
  assert.match(workflow, /scenario: gameplay-resources\s+timeoutMinutes: 15\s+name: Gameplay resource lifecycle browser\s+artifact: gameplay-resource-lifecycle-browser/)
  assert.match(workflow, /scenario: gameplay-frames\s+timeoutMinutes: 15/)
  assert.match(workflow, /types: \[ready_for_review\]/)
  assert.doesNotMatch(workflow, /continue-on-error|workflow_dispatch|no-sandbox/)
})

import { parseGameplayResourceArguments, gameplayThreeCycleArgument } from '../scripts/tutorial-browser/gameplay-resource-profile.mjs'
test('finite resource profile parsing leaves defaults alone and rejects arbitrary knobs before output creation', () => {
  for (const scenario of browserScenarios) {
    assert.deepEqual(parseGameplayResourceArguments([], scenario), { output: undefined, profile: undefined })
    assert.deepEqual(parseGameplayResourceArguments(['fresh-output'], scenario), { output: 'fresh-output', profile: undefined })
  }
  assert.deepEqual(parseGameplayResourceArguments(['fresh-output', gameplayThreeCycleArgument], 'gameplay-resources'),
    { output: 'fresh-output', profile: 'three-cycle-v1' })
  assert.deepEqual(parseGameplayResourceArguments([gameplayThreeCycleArgument], 'gameplay-resources'),
    { output: undefined, profile: 'three-cycle-v1' })
  for (const args of [
    ['fresh', '--gameplay-resource-profile=unknown'], ['fresh', '--cycles=3'], ['fresh', '3'],
    ['fresh', gameplayThreeCycleArgument, gameplayThreeCycleArgument], ['fresh', '--gameplay-resource-profile', 'three-cycle-v1'],
    [gameplayThreeCycleArgument, 'fresh'], ['--gameplay-resource-profile=two-cycle-v1'],
  ]) assert.throws(() => parseGameplayResourceArguments(args, 'gameplay-resources'))
  for (const scenario of browserScenarios.filter(name => name !== 'gameplay-resources'))
    assert.throws(() => parseGameplayResourceArguments([gameplayThreeCycleArgument], scenario))
  const runner = readFileSync(new URL('../scripts/tutorial-browser/run.mjs', import.meta.url), 'utf8')
  assert.ok(runner.indexOf('const resourceArguments = parseGameplayResourceArguments') < runner.indexOf('mkdirSync(out'))
  assert.doesNotMatch(runner, /process\.env\.(?:POPULOUS_RESOURCE|GAMEPLAY_RESOURCE|POPULOUS_BROWSER_CYCLES)/)
})

test('hosted opt-in changes only resource invocation and its accurate label, not the matrix or deadlines', () => {
  const workflow = readFileSync(new URL('../.github/workflows/tutorial-browser.yml', import.meta.url), 'utf8')
  const block = workflow.split('      - name: ${{ matrix.scenario')[1].split('      - name: Reject tracked input mutation')[0]
  assert.equal(block, ` == 'gameplay-resources' && 'Observe three full live Mission 2 workloads and two same-document resource restarts' || matrix.buildStep }}
        env:
          POPULOUS_GAMEPLAY_OWNERSHIP: \${{ matrix.scenario == 'gameplay-resources' && contains(github.event.pull_request.labels.*.name, format('weak-v1:{0}', github.event.pull_request.head.sha)) && 'weak-v1' || '' }}
        run: |
          if [ "$POPULOUS_BROWSER_SCENARIO" = gameplay-resources ]; then
            if [ "$POPULOUS_GAMEPLAY_OWNERSHIP" = weak-v1 ]; then
              node scripts/tutorial-browser/run.mjs outputs/tutorial-browser --gameplay-resource-profile=three-cycle-v1 --gameplay-ownership-probe=weak-v1
            else
              node scripts/tutorial-browser/run.mjs outputs/tutorial-browser --gameplay-resource-profile=three-cycle-v1
            fi
          else
            node scripts/tutorial-browser/run.mjs
          fi
`)
  assert.equal((workflow.match(/--gameplay-resource-profile=/g) ?? []).length, 2)
  assert.match(workflow, /buildStep: Observe full live Mission 2 workload and one same-document resource restart/)
  assert.match(workflow, /runs-on: ubuntu-24\.04/)
  assert.match(workflow, /permissions:\n  contents: read/)
  assert.match(workflow, /retention-days: 7/)
  const frames = readFileSync(new URL('../scripts/tutorial-browser/gameplay-frames.mjs', import.meta.url), 'utf8')
  const restart = frames.split('const restartCycle = async')[1].split("const ready = await restartCycle(first")[0]
  assert.ok(restart.indexOf('page.evaluate(captureRetiredGameplayScene)') < restart.indexOf('await bindGame(page)'))
  assert.equal((restart.match(/Restart Level/g) ?? []).length, 1)
  assert.match(restart, /await page\.waitForTimeout\(plan\.warmupMs\)/)
  assert.match(frames, /const ready = await restartCycle\(first, 'cycle-2'\)/)
  assert.doesNotMatch(frames, /oldScenes|retiredScenes|evaluateHandle|queryObjects/)
})
