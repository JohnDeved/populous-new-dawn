import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import campaignFixedTurn, { campaignAdapter } from '../scripts/local-render/campaign-fixed-turn.mjs'

const checker = readFileSync(new URL('../scripts/check-browser-campaign-natural-victory.mjs', import.meta.url), 'utf8')

test('sandbox adapter retains every existing assertion, turn bound and campaign action', () => {
  const adapted = campaignAdapter(checker)
  // The route bodies, including every numeric turn limit, remain byte-for-byte.
  for (const [start, end] of [['async function missionTwo(page)', 'async function swarmDiagnostic(page)'], ['async function missionThreeSwarm(page)', '\ntry {']]) {
    const section = source => source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start)))
    assert.equal(section(adapted), section(checker))
  }
  for (const pattern of [/assert\.(?:ok|equal|deepEqual|fail)\(/g, /tick\(world, 1 \/ 12\)/g, /await advance(?:Until)?\(/g, /await page\.mouse\.click\(/g])
    assert.equal([...adapted.matchAll(pattern)].length, [...checker.matchAll(pattern)].length)
  assert.ok(adapted.includes("{ type: 'status', status: 'won' }, 5000, 'natural Mission 2 victory'"))
  assert.ok(adapted.includes("{ type: 'status', status: 'won' }, 5000, 'natural Mission 3 victory'"))
  assert.ok(adapted.includes("name: 'Continue to Mission 3', exact: false }).click()"))
  assert.ok(adapted.includes("name: 'Continue to Mission 4', exact: false }).waitFor()"))
  assert.ok(adapted.includes('getCompletedMissions().includes(2)'))
  assert.ok(adapted.includes('getCompletedMissions().includes(3)'))
  assert.ok(!adapted.includes('chromium.launch'))
  assert.ok(adapted.includes('not real-clock gameplay'))
})

test('changed or duplicated maintained checker scaffold fails closed before browser execution', () => {
  assert.throws(() => campaignAdapter(checker.replace('await missionTwo(page)', 'await changedRoute(page)')), /scaffold changed/)
  assert.throws(() => campaignAdapter(checker + '\n    await missionTwo(page)'), /scaffold changed/)
})


test('late final screenshot completion cannot mark an aborted campaign scenario passed', async () => {
  const root = mkdtempSync(join(tmpdir(), 'campaign-abort-'))
  const output = join(root, 'output'), abort = new AbortController()
  mkdirSync(join(root, 'scripts')); mkdirSync(output)
  // Minimal checker scaffold exercises the production adapter/scenario only.
  // No real game, browser, victory, or image is produced by this fixture.
  const fixture = `import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'
const browser = await chromium.launch({ headless: !process.argv.includes('--headed') })
const captureCameraEvidence = async () => {}
async function missionTwo() {}
async function missionThree() {}
const result = { ready: true, turn: 1, status: 'playing' }, required = false, label = 'fixture'
  if (required) assert.ok(result.ready, \`\${label} timed out: \${JSON.stringify(result)}\`)
try {
    await missionTwo(page)
    await page.getByRole('button', { name: 'Continue to Mission 3', exact: false }).click()
    await missionThree(page)
    await page.getByRole('button', { name: 'Continue to Mission 4', exact: false }).waitFor()
    console.log('PASS: rendered player actions win Mission 2, continue, and naturally win Mission 3')
} finally { await browser.close() }
`
  writeFileSync(join(root, 'scripts/check-browser-campaign-natural-victory.mjs'), fixture)
  const page = {
    async evaluate() { return { level: 3, status: 'won', turn: 1, contextLost: false, population: {} } },
    getByRole() { return { async click() {}, async waitFor() {} } },
    async screenshot({ path }) {
      if (path.endsWith('mission-3-result.png')) abort.abort(Error('Aborted during final screenshot'))
    },
  }
  try {
    await assert.rejects(campaignFixedTurn({ root, page, openMission: async () => {}, output,
      receipt: { source: { commit: 'fixture-only' }, errors: [] }, signal: abort.signal }),
    /Aborted during final screenshot/)
    const report = JSON.parse(readFileSync(join(output, 'campaign.json'), 'utf8'))
    assert.equal(report.status, 'failed')
    assert.match(report.failure, /Aborted during final screenshot/)
    assert.equal(globalThis.campaignFixedTurnQA, undefined)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

// Execute the maintained candidate finder against test-only geometry outside its
// old anchor window. These tests never render or advance a game.
async function geometryPoint({ actualHit = 55, canvasOwnsPoint = true, stalePanel = false, changeWorldOnRefresh = false, changeSlotOnRefresh = false, changeMapOnRefresh = false, staleReservations = false } = {}) {
  let refreshed = false
  const { default: vm } = await import('node:vm')
  const start = checker.indexOf('async function entityPoint(')
  const source = checker.slice(start, checker.indexOf('\nasync function groundPoint(', start))
  const panel = { className: 'training-panel', getAttribute: () => 'Warrior Training Hut',
    getBoundingClientRect: () => ({ x: 200, y: 150, width: 120, height: 80 }) }
  const canvas = { closest: () => null }, child = { userData: { nativeModel: 149 }, visible: true }
  const mesh = { position: { toArray: () => [0, 1, 0] }, visible: true, traverse: fn => fn(child) }
  const scene = {
    world: { turn: 6734, selected: [], randomState: 123, buildingFootprints: new Map([[1, [42]]]),
      secondaryEffects: { slots: [null], free: [0], order: [], nextSerial: 1, animationFrame: 1, lastTurn: 6734,
        reservations: stalePanel && !staleReservations ? ['building-panel:7'] : [] },
      shrines: [{ id: 55, x: 0, z: 0, model: 45 }] },
    container: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 300 }) },
    buildingPanels: new Map(stalePanel ? [[7, { hidden: false }]] : []),
    animate() {
      refreshed = true
      if (stalePanel) { this.buildingPanels.get(7).hidden = true; this.world.secondaryEffects.reservations = [] }
      if (changeWorldOnRefresh) this.world.turn++
      if (changeMapOnRefresh) this.world.buildingFootprints.set(1, [99])
      if (changeSlotOnRefresh) this.world.secondaryEffects.slots[0] = { kind: 'unexpected allocation' }
    },
    focus() {}, onChange() {}, screen: () => ({ x: -0.75, y: 2 / 3 }),
    renderer: { domElement: canvas, render() {} },
    shrineMeshes: new Map([[55, { g: mesh }]]),
    cameraPosition: {}, viewPoint: {}, cameraBearing: 0,
    view: { projection: {}, painter: { source: () => ({}) } },
    picking: { pickPerson: () => null, model: () => [
      { kind: 'model', points: [{ x: 270, y: 190 }, { x: 290, y: 190 }, { x: 280, y: 210 }] },
      { kind: 'bounds', bounds: { x: 270, y: 190, width: 20, height: 20 } },
    ] },
    pickWorldObject: ({ clientX: x, clientY: y }) => x >= 275 && x <= 285 && y >= 195 && y <= 205 ? { id: actualHit } : null,
  }
  const sandbox = { testScene: scene, structuredClone, Map, Set, ArrayBuffer, Uint8Array, cancelAnimationFrame() {},
    document: { elementFromPoint: () => canvasOwnsPoint || (stalePanel && refreshed) ? canvas : { closest: () => stalePanel ? panel : null } } }
  vm.runInNewContext(source + '\nglobalThis.findPoint = entityPoint', sandbox)
  return sandbox.findPoint({ evaluate: (fn, args) => fn(args) }, 'shrines', 55)
}

test('actual native triangles supplement the historical fixed anchor scan', async () => {
  const point = await geometryPoint()
  assert.ok(point.x > point.pickingDiagnostic.legacyScan.right)
  assert.ok(point.y > point.pickingDiagnostic.legacyScan.bottom)
  assert.equal(point.pickingDiagnostic.models[0].model, 149)
  assert.equal(point.pickingDiagnostic.hit.clientX, point.x)
})

test('geometry candidates cannot bypass foreign object or DOM overlay ownership', async () => {
  await assert.rejects(geometryPoint({ actualHit: 56 }), /No rendered hit point/)
  await assert.rejects(geometryPoint({ canvasOwnsPoint: false }), /No rendered hit point/)
})


test('normal zero-dt frame refresh resolves stale panels while retaining simulation slots and clock', async () => {
  const point = await geometryPoint({ canvasOwnsPoint: false, stalePanel: true })
  assert.equal(point.pickingDiagnostic.nativeTargetHits[0].panel.className, 'training-panel')
  assert.equal(point.pickingDiagnostic.nativeTargetHits[0].canvasOwnsPoint, false)
  assert.equal(point.pickingDiagnostic.afterRefreshNativeTargetHits[0].canvasOwnsPoint, true)
  assert.equal(point.pickingDiagnostic.frameRefresh.reservations.before[0], 'building-panel:7')
  assert.equal(point.pickingDiagnostic.frameRefresh.reservations.after.length, 0)
  assert.equal(point.pickingDiagnostic.frameRefresh.reservations.valid, true)
  assert.equal(point.pickingDiagnostic.frameRefresh.changedWorldKeys.length, 0)
  assert.equal(point.pickingDiagnostic.frameRefresh.turnBefore, point.pickingDiagnostic.frameRefresh.turnAfter)
})

test('presentation refresh cannot conceal a simulation change', async () => {
  await assert.rejects(geometryPoint({ canvasOwnsPoint: false, stalePanel: true, changeWorldOnRefresh: true }),
    /Zero-dt presentation refresh changed world state/)
})


test('presentation reservation exception cannot conceal secondary slot allocation', async () => {
  await assert.rejects(geometryPoint({ canvasOwnsPoint: false, stalePanel: true, changeSlotOnRefresh: true }),
    /Zero-dt presentation refresh changed world state/)
})

test('stale pre-refresh reservations fail instead of being normalized by the checker', async () => {
  await assert.rejects(geometryPoint({ canvasOwnsPoint: false, stalePanel: true, staleReservations: true }),
    /Pre-refresh UI reservations do not match actual panel owners/)
})


test('presentation refresh cannot conceal changed world Map entries', async () => {
  await assert.rejects(geometryPoint({ canvasOwnsPoint: false, stalePanel: true, changeMapOnRefresh: true }),
    /Zero-dt presentation refresh changed world state.*buildingFootprints/)
})


test('occluded shrine fallback uses bounded ordinary camera drags and strict target re-probes', () => {
  const click = checker.slice(checker.indexOf('async function clickEntity'), checker.indexOf('async function dismissFlyby'))
  const rotate = checker.slice(checker.indexOf('async function rotateCameraWithPointer'), checker.indexOf('async function clickEntity'))
  assert.ok(click.includes("collection !== 'shrines' || attempt === 3"))
  assert.ok(click.includes('diagnostic.nativeTargetHits.length'))
  assert.ok(click.includes('await entityPoint(page, collection, id)'))
  assert.ok(rotate.includes("await page.mouse.down({ button: 'right' })"))
  assert.ok(rotate.includes("finally { await page.mouse.up({ button: 'right' }) }"))
  assert.ok(rotate.includes("['turn', 'time', 'random', 'selected', 'mode', 'viewPoint']"))
  assert.ok(!rotate.includes('tick(') && !rotate.includes('scene.animate('))
  assert.ok(!/camera(?:Bearing|Position\.angle)\s*=/.test(rotate))
})

test('the shipped right-drag mapping rotates 512 native angle units without panning', async () => {
  const { dragCamera } = await import('../app/camera-input.ts')
  for (const angle of [0, 256, 1537, 2000]) {
    const camera = { x: 256, y: 34048, angle }, velocity = { turn: 0, forward: 0, side: 0 }
    for (let step = 0; step < 8; step++) dragCamera(camera, velocity, true, 64, 0)
    assert.deepEqual(camera, { x: 256, y: 34048, angle: (angle + 512) & 2047 })
    assert.deepEqual(velocity, { turn: 0, forward: 0, side: 0 })
  }
})


test('Mission 3 trains a bounded Preacher group and retains identified HUD-reachable Braves', () => {
  assert.equal((checker.match(/await train\(page, temple, 5000, true\)/g) ?? []).length, 1)
  const train = checker.slice(checker.indexOf('async function train('), checker.indexOf('async function worship('))
  assert.ok(train.includes("preserveBraves ? 'Control' : 'Shift'"))
  assert.ok(train.includes("assert.equal(selected.length, 5"))
  assert.ok(train.includes('retainedBefore.includes(unit.id)'))
  assert.ok(train.includes("getByLabel('Select brave', { exact: true }).isEnabled()"))
  assert.ok(train.includes('await advance(page, turns)'))
  assert.ok(checker.includes("{ type: 'unit-count', team: 'blue', kind: 'preacher', count: 3 }"))
})


test('additive native Ctrl-five requires the ordinary cancel/deselect before reserving workers', async () => {
  const { createWorld, selectFollowers, cancelInteraction, nativePosition } = await import('../app/model.ts')
  const { advanceGame } = await import('../app/game-clock.ts')
  const world = createWorld(3)
  advanceGame(world, { animationTime: 0, animationFrame: 0 }, 70 / 12)
  const point = nativePosition(world, world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman'))
  selectFollowers(world, 2, point, 'all')
  const all = world.selected.length
  selectFollowers(world, 2, point, 'five')
  assert.equal(world.selected.length, all, 'Ctrl selection does not remove already selected builders')
  world.mode = 'hut'
  cancelInteraction(world)
  assert.equal(world.selected.length, all, 'first Escape cancels targeting only')
  cancelInteraction(world)
  assert.deepEqual(world.selected, [])
  selectFollowers(world, 2, point, 'five')
  assert.equal(world.selected.length, 5)
  const reserved = world.units.filter(unit => unit.team === 'blue' && unit.kind === 'brave' && !world.selected.includes(unit.id))
  assert.ok(reserved.length >= 1)
  const train = checker.slice(checker.indexOf('async function train('), checker.indexOf('async function worship('))
  assert.ok(train.indexOf("page.keyboard.press('Escape')") < train.indexOf("preserveBraves ? 'Control'"))
})
