import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { runInNewContext } from 'node:vm'
import test from 'node:test'
import {
  createWorshipAcquisitionRuntime,
  startPendingWorshipAcquisitions,
  visitWorshipAcquisition,
} from '../app/worship-acquisition-runtime.ts'
import { getWorshipAcquisitionDrawCommands } from '../app/worship-acquisition.ts'
import { worshipHandoffGeometry } from '../app/worship-acquisition-layout.ts'

const page = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8')
const presentation = readFileSync(new URL('../app/scene-worship-acquisition.ts', import.meta.url), 'utf8')
const bounds = (x, y, width, height) => ({ x, y, width, height })
const element = rectangle => ({
  isConnected: true,
  offsetWidth: rectangle.width,
  getBoundingClientRect: () => rectangle,
})
const geometry = {
  viewport: bounds(100, 0, 540, 480),
  origin: { x: 420, y: 180 },
  target: { x: 25, y: 286 },
  targetRect: bounds(2, 260, 46, 52),
  targetHud: { x: 25, y: 286 },
  hudScale: 1,
}
const hudGeometry = {
  viewport: geometry.viewport,
  targetRect: geometry.targetRect,
  targetHud: geometry.targetHud,
  hudScale: 1,
}

// Execute the actual page callbacks with supplied DOM rectangles and React/store
// leaves. This is bounded callback coverage, not mounting React or browser QA.
function pageCallbacks() {
  const cards = {
    tornado: element(bounds(20, 40, 46, 52)),
    tower: element(bounds(80, 40, 46, 52)),
    camp: element(bounds(140, 40, 46, 52)),
    temple: element(bounds(200, 40, 46, 52)),
    lightning: element(bounds(260, 40, 46, 52)),
    bridge: element(bounds(320, 40, 46, 52)),
  }
  cards.tower.disabled = true
  const world = { mode: 'hut', selectedSpell: 4 }
  const events = []
  const context = {
    useCallback: callback => callback,
    spellButtons: { current: new Map([[3, cards.lightning], [4, cards.tornado], [12, cards.bridge]]) },
    campButton: { current: cards.camp },
    templeButton: { current: cards.temple },
    towerButton: { current: cards.tower },
    shell: { current: element(bounds(0, 0, 640, 480)) },
    hudPanel: { current: element(bounds(0, 0, 100, 480)) },
    viewport: { current: element(bounds(100, 0, 540, 480)) },
    world,
    store: { getWorld: () => world },
    disposed: false,
    flushSync: callback => callback(),
    setTab: tab => events.push(['tab', tab]),
    setHover: hover => events.push(['hover', hover]),
    update: () => events.push(['update']),
  }
  const start = page.indexOf('  const measureWorshipHud = useCallback(')
  const end = page.indexOf('\n  useEffect(', start)
  const selectStart = page.indexOf('    const selectAcquisitionPanel = ')
  const selectEnd = page.indexOf('\n    if (window.innerWidth', selectStart)
  assert.ok(start >= 0 && end > start && selectStart >= 0 && selectEnd > selectStart)
  const source = `${page.slice(start, end)}\n${page.slice(selectStart, selectEnd)}\n({ measureWorshipHud, selectAcquisitionPanel })`
  return { ...runInNewContext(stripTypeScriptTypes(source), context), context, cards, events, world }
}

test('actual Home callbacks distinguish locked Tower from Tornado model 4', () => {
  const { measureWorshipHud, selectAcquisitionPanel, cards, events, world } = pageCallbacks()
  for (const [model, family, card] of [
    [4, 'building', 'tower'], [4, 'spell', 'tornado'],
    [7, 'building', 'camp'], [5, 'building', 'temple'],
    [3, 'spell', 'lightning'], [12, 'spell', 'bridge'],
  ]) {
    assert.equal(measureWorshipHud(model, family).targetRect.x, cards[card].getBoundingClientRect().x)
    events.length = 0
    assert.equal(selectAcquisitionPanel(model, family).targetRect.x, cards[card].getBoundingClientRect().x)
    assert.deepEqual(events, [['tab', family === 'building' ? 'buildings' : 'spells'], ['hover', null], ['update']])
  }
  assert.deepEqual(world, { mode: 'hut', selectedSpell: 4 }, 'automatic acquisition cannot change the command')
  assert.match(page, /\['tower', towerButton\]/)
  assert.match(page, /ref=\{buildingButtonRefs\.get\(b\.id\)\}/)
})

test('family-aware Home measurement preserves detached-tab fallback, resize and stale-world rejection', () => {
  const { measureWorshipHud, selectAcquisitionPanel, context, cards } = pageCallbacks()
  const measured = measureWorshipHud(4, 'building')
  const reference = worshipHandoffGeometry(measured)
  cards.tower.isConnected = false
  context.hudPanel.current.getBoundingClientRect = () => bounds(0, 0, 200, 960)
  const resized = measureWorshipHud(4, 'building', reference)
  assert.equal(resized.hudScale, 2)
  assert.equal(resized.targetRect.x, reference.targetRect.x * 2)
  assert.equal(resized.targetRect.width, reference.targetRect.width * 2)
  assert.equal(measureWorshipHud(4, 'building'), null, 'do not borrow the mounted Tornado button')
  assert.ok(measureWorshipHud(4, 'spell'))
  context.disposed = true
  assert.equal(selectAcquisitionPanel(4, 'building'), null)
  context.disposed = false
  context.store.getWorld = () => ({})
  assert.equal(selectAcquisitionPanel(4, 'spell'), null)
})

function runtimeWorld(model, family) {
  const source = { model, completedTurn: 1, head: 1, slot: 0, serial: 0 }
  return {
    turn: 6,
    paused: false,
    land: { landFlags: 0 },
    manaWorld: { playerTribe: 0 },
    cosmeticRandom: { randomState: 1 },
    gifts: [{ id: 42, recipient: 0, remaining: 82, [family === 'building' ? 'buildingAcquisition' : 'ordinaryWorship']: source }],
    worshipAcquisition: { ...createWorshipAcquisitionRuntime(), requests: [42] },
  }
}

function scenePresentation(world, bridge) {
  const canvas = {
    dataset: {},
    setAttribute() {},
    getContext: () => ({ setTransform() {}, clearRect() {} }),
  }
  const context = {
    document: { createElement: () => canvas },
    devicePixelRatio: 1,
    startPendingWorshipAcquisitions,
    visitWorshipAcquisition,
    getWorshipAcquisitionDrawCommands,
    worshipHandoffGeometry,
  }
  const start = presentation.indexOf('export class WorshipAcquisitionPresentation')
  assert.ok(start >= 0)
  const source = presentation.slice(start).replace('export class ', 'class ')
  const Presentation = runInNewContext(`${stripTypeScriptTypes(source)}\nWorshipAcquisitionPresentation`, context)
  return new Presentation({
    world,
    onSound() {},
    container: { parentElement: { appendChild() {}, clientWidth: 640, clientHeight: 480 } },
  }, bridge)
}

for (const [model, family] of [[3, 'spell'], [4, 'spell'], [12, 'spell'], [5, 'building'], [7, 'building']]) {
  test(`actual Scene handoff and runtime reselection preserve ${family} model ${model}`, () => {
    const world = runtimeWorld(model, family)
    const selected = []
    const instance = scenePresentation(world, {
      select: (...args) => { selected.push(args); return hudGeometry },
      measure: () => null,
    })
    instance.handoffs()
    assert.deepEqual(selected, [[model, family]])
    for (let i = 0; i < 350; i++) instance.visit()
    // With this fixed target the existing spell controller emits arrivals on
    // visits 29 and 30; the building controller reopens once, on visit 74.
    assert.deepEqual(selected, Array.from({ length: family === 'spell' ? 3 : 2 }, () => [model, family]))
    assert.equal(world.gifts[0].remaining, family === 'building' ? 82 : 1)
    assert.equal(instance.diagnostics.length, 0)
  })
}

test('runtime keeps family through paused visits and retains bit-8 payout ownership', () => {
  const world = runtimeWorld(4, 'spell')
  startPendingWorshipAcquisitions(world, { geometry: () => geometry, cue() {}, failed: () => assert.fail('valid geometry') })
  world.paused = true
  const events = []
  for (let i = 0; i < 12; i++) visitWorshipAcquisition(world, (...args) => events.push(args))
  assert.deepEqual(events, [])
  world.paused = false
  world.land.landFlags = 8
  for (let i = 0; i < 350; i++) visitWorshipAcquisition(world, (...args) => events.push(args))
  assert.deepEqual(events, [[4, 'spell'], [4, 'spell']])
  assert.equal(world.gifts[0].remaining, 82)
})

test('actual Scene draw passes family with each measured draw binding', () => {
  const world = runtimeWorld(4, 'spell')
  world.worshipAcquisition.controllers.drawCommands = [
    { kind: 'sprite', family: 'spell', model: 4, geometry },
    { kind: 'sprite', family: 'building', model: 4, geometry: structuredClone(geometry) },
  ]
  const measured = []
  const instance = scenePresentation(world, { measure: (...args) => { measured.push(args); return null } })
  instance.draw()
  assert.equal(measured.length, 2)
  assert.deepEqual(measured.map(args => args.slice(0, 2)), [[4, 'spell'], [4, 'building']])
  assert.equal(measured[0][2], geometry)
})

test('actual Scene failure diagnostics retain family without changing payout behavior', () => {
  for (const [model, family] of [[4, 'spell'], [7, 'building']]) {
    const world = runtimeWorld(model, family)
    let selected = 0
    const instance = scenePresentation(world, { select: () => ++selected === 1 ? hudGeometry : null })
    instance.handoffs()
    for (let i = 0; i < 350; i++) instance.visit()
    assert.equal(instance.diagnostics.length, 1)
    assert.equal(instance.diagnostics[0].family, family)
    assert.equal(instance.diagnostics[0].gift, 42)
    assert.equal(instance.diagnostics[0].model, model)
    assert.equal(instance.diagnostics[0].reason, 'arrival geometry')
    assert.equal(world.gifts[0].remaining, family === 'building' ? 82 : 1)
    const failedWorld = runtimeWorld(model, family)
    const failed = scenePresentation(failedWorld, { select: () => null })
    failed.handoffs()
    assert.equal(failed.diagnostics[0].family, family)
    assert.equal(failed.diagnostics[0].reason, 'handoff geometry')
  }
})
