import test from 'node:test'
import assert from 'node:assert/strict'
import { tooltipCallerFixture } from './support/tooltip-scene.mjs'
import { pageNearby, pageEffect, pageNode, pageSource, evaluatePage } from './support/follower-nearby-page.mjs'
import { createResultSession, createResultKeys, resultSpaceEligible } from '../app/result-session.ts'

// Execute actual Home handlers, scene animate, updateFlyby and shared tooltip
// controller. Glyph submission/DOM/projection are supplied by the controlled
// caller fixture; separate browser captures cover actual canvas pixels.
async function fixture(t, paused=false) {
  const f=await tooltipCallerFixture(t), {scene,world,hut,api}=f
  scene.view.painter.render=()=>{} // supplied GPU leaf, including the frozen modal render branch
  const native=api.nativePosition(world,hut)
  world.lastOrderCell=((native.x>>>8)&255)|(native.y&0xff00)
  world.paused=paused
  api.requestTutorial(world,0x200000,603)
  f.frame()
  assert.equal(scene.tooltip.remaining,71)
  assert.equal(scene.tooltip.flags,8)
  assert.equal(scene.tooltipElement.hidden,false)
  return {...f,page:pageNearby(scene)}
}

for(const paused of [false,true]) {
  test(`shared route lifetime survives menu/selector/reopen with prior pause=${paused}`,async t=>{
    const f=await fixture(t,paused), {scene,world,page,frame}=f,
      notice=world.routeNotice, remaining=scene.tooltip.remaining
    page.openMenu()
    const session=page.bindings.menuSession.current
    for(const transition of [()=>{},()=>page.openSelector(),()=>page.openMenu()]) {
      transition(); frame(4)
      assert.equal(page.bindings.menuSession.current,session)
      assert.equal(scene.modalSuspended,true)
      assert.equal(scene.tooltipElement.hidden,true)
      assert.equal(scene.tooltip.remaining,remaining)
      assert.equal(world.routeNotice,notice)
    }
    assert.deepEqual(page.selectorEntries,[world],'selection entry is requested for the retained scene, without a supplied victory')
    page.closeMenu()
    assert.equal(world.paused,paused)
    assert.equal(scene.modalSuspended,false)
    frame(0) // reset previous timestamp is not suspended wall-time catch-up
    assert.equal(scene.tooltip.remaining,remaining)
    for(let i=0;i<remaining;i++) frame()
    assert.equal(scene.tooltip.remaining,0)
    assert.equal(world.routeNotice,null)
    assert.equal(scene.tooltipElement.hidden,true)
  })
}

test('zero-tick repaints do not decrement and ordinary pause uses eligible route visits',async t=>{
  const {scene,world,frame}=await fixture(t,true), before=world.turn
  for(let i=0;i<20;i++) frame(0)
  assert.equal(scene.tooltip.remaining,71)
  frame(); assert.equal(scene.tooltip.remaining,70)
  assert.equal(world.turn,before,'presentation visits never advance paused simulation')
})

test('repeated requests replace the shared owner without stale expiry or serial aliasing',async t=>{
  const {scene,world,api,frame}=await fixture(t), first=world.routeNotice
  frame(1)
  assert.ok(scene.tooltip.remaining<71)
  world.lastOrderCell=first.cell+2
  api.requestTutorial(world,0x200000,603)
  const second=world.routeNotice
  frame()
  assert.equal(scene.tooltip.remaining,71)
  assert.equal(scene.tooltip.target,second.cell)
  assert.notEqual(second,first)
  for(let i=0;i<71;i++) frame()
  assert.equal(world.routeNotice,null)
  api.requestTutorial(world,0x200000,603)
  assert.equal(world.routeNotice.serial,1)
  frame()
  assert.equal(scene.tooltip.remaining,71,'object identity, not reused serial, owns acquisition')
})

test('route suppresses HUD/object hover and a new forced request replaces it',async t=>{
  const {scene,world,tooltipApi,hut,frame}=await fixture(t)
  scene.tooltipInput={pointer:{clientX:10,clientY:10},object:null,picked:null,cell:null,
    inspectionTarget:null,route:'hud',message:0,
    hud:{owner:'test-blast',text:'Not route text',repeatable:true,enabled:true}}
  scene.tooltipController.category='hud';scene.tooltipController.key='test-blast'
  scene.tooltipController.dwell=999
  scene.updateTooltipController(10000)
  assert.equal(scene.tooltip.text,"One or more of your people can't get to this point.")
  const object=tooltipApi.worldTooltipObject(world,hut.id)
  scene.acquireForcedTooltip(object,3)
  assert.equal(world.routeNotice,null)
  assert.equal(scene.tooltipController.routeNotice,null)
  frame()
  assert.equal(scene.tooltip.flags,6)
  assert.equal(scene.tooltip.remaining,2)
})

test('F9-style modal suspension freezes route ownership without mutating its countdown',async t=>{
  const {scene,world,frame}=await fixture(t), notice=world.routeNotice
  for(let i=0;i<3;i++) {
    scene.setModalSuspended(true);frame(4)
    assert.equal(scene.tooltip.remaining,71)
    assert.equal(world.routeNotice,notice)
    scene.setModalSuspended(false);frame(0)
    assert.equal(scene.tooltip.remaining,71)
  }
  frame();assert.equal(scene.tooltip.remaining,70)
})


test('paused route expiry cannot turn catch-up visits into ordinary tooltip or flyby advancement',async t=>{
  const {scene,world,frame}=await fixture(t,true)
  scene.tooltip.remaining=1
  const visits=scene.tooltipController.session.visits, flyby=structuredClone(world.flyby)
  frame(1)
  assert.equal(scene.tooltip.remaining,0)
  assert.equal(scene.tooltipController.session.visits,visits+1)
  assert.deepEqual(world.flyby,flyby)
})


test('a later forced request replaces even a pending route before its first visit',async t=>{
  const {scene,world,api,tooltipApi,hut,frame}=await tooltipCallerFixture(t)
  world.lastOrderCell=0x1234
  api.requestTutorial(world,0x200000,603)
  scene.acquireForcedTooltip(tooltipApi.worldTooltipObject(world,hut.id),3)
  assert.equal(world.routeNotice,null)
  frame()
  assert.equal(scene.tooltip.flags,6)
  assert.equal(scene.tooltip.remaining,2)
})

test('paused expiry and forced replacement notify Home to clear its accessibility announcement',async t=>{
  const {scene,world,api,tooltipApi,hut,frame}=await fixture(t,true)
  let notifications=0;scene.onChange=()=>notifications++
  scene.tooltip.remaining=1;frame()
  assert.equal(world.routeNotice,null);assert.equal(notifications,1)
  api.requestTutorial(world,0x200000,603)
  scene.acquireForcedTooltip(tooltipApi.worldTooltipObject(world,hut.id),3)
  assert.equal(world.routeNotice,null);assert.equal(notifications,2)
})


// Compose actual Home result/Back handlers with this fixture's real Scene modal
// boundary and route owner. Terminal status, selector storage admission and event
// delivery are supplied; this does not prove a naturally earned outcome or pixels.
function resultPage(t, { scene, world }, admitted = true) {
  const resultSession = createResultSession(), resultKeys = createResultKeys(),
    listeners = new Map()
  let admission = admitted, selector = false, entries = 0
  const events = {
    addEventListener(name, handler) { assert.equal(listeners.has(name), false); listeners.set(name, handler) },
    removeEventListener(name, handler) { assert.equal(listeners.get(name), handler); listeners.delete(name) },
  }
  const store = {
    getWorld: () => world,
    enterCampaignSelector(candidate) {
      assert.equal(candidate, world)
      entries++
      if (admission instanceof Error) throw admission
      return admission
    },
  }
  const bindings = {
    globalThis: events, world, store, engine: { current: scene }, ready: true,
    startup: 'playing', menu: false, cheatsOpen: false, selectorOpen: false, debugPicker: false,
    messageDetails: { current: new Map() }, resultSession, resultKeys, resultSpaceEligible,
    audio: { current: { reset() {} } }, setSelectorOpen(value) { selector = value },
    update() {}, openMenu() { assert.fail('a terminal Back must not open gameplay Menu') },
  }
  const cleanup = pageEffect('resultKeys.down(event)', bindings)()
  t.after(cleanup)
  const back = evaluatePage(
    pageNode(node => node.name?.getText(pageSource) === 'closeSelector').getText(pageSource),
    bindings
  )
  function press() {
    const event = { key: ' ', code: 'Space', repeat: false, ctrlKey: false, metaKey: false,
      altKey: false, shiftKey: false, target: { closest: () => null },
      preventDefault() {}, stopImmediatePropagation() {} }
    try { listeners.get('keydown')(event) }
    finally { listeners.get('keyup')(event) }
  }
  return { press, back, resultSession, admit(value) { admission = value },
    get selector() { return selector }, get entries() { return entries } }
}

test('actual statistics entry hides a retained route and freezes its lifetime while result blink advances', async t => {
  const f = await fixture(t), { scene, world, frame } = f,
    notice = world.routeNotice, remaining = scene.tooltip.remaining
  // Existing result-camera ownership can defer route visits, rather than spend
  // its remaining lifetime before result input is admitted.
  f.cameraOwns(true); frame(1)
  assert.equal(scene.tooltip.remaining, remaining)
  f.cameraOwns(false)
  world.status = 'won' // supplied terminal boundary after the authored opening
  const page = resultPage(t, f)
  assert.equal(scene.tooltipElement.hidden, false, 'positive visible-route precondition')
  page.press()
  assert.equal(page.resultSession.stage(world), 'statistics')
  assert.equal(world.paused, true)
  assert.equal(scene.modalSuspended, true)
  assert.equal(scene.tooltipElement.hidden, true, 'statistics hides before another RAF')
  const frozen = structuredClone(world), inputCycles = scene.resultClock.inputCycles,
    submissions = scene.tooltipCanvas.submissions.length
  frame(0); frame(0.5)
  assert.deepEqual(world, frozen, 'statistics must not advance simulation or presentation World state')
  assert.equal(world.routeNotice, notice)
  assert.equal(scene.tooltip.remaining, remaining)
  assert.equal(scene.tooltipElement.hidden, true)
  assert.equal(scene.tooltipCanvas.submissions.length, submissions, 'no world-tooltip painting behind statistics')
  assert.ok(scene.resultClock.inputCycles > inputCycles, 'result input/blink clock keeps its separate owner')
})

test('failed result exits and repeated selector Back preserve the statistics route hold', async t => {
  const f = await fixture(t), { scene, world, frame } = f,
    notice = world.routeNotice, remaining = scene.tooltip.remaining
  world.status = 'lost'
  const page = resultPage(t, f, false)
  page.press()
  assert.equal(page.resultSession.stage(world), 'statistics')
  for (const failure of [false, new Error('supplied selector rejection')]) {
    page.admit(failure)
    if (failure instanceof Error) assert.throws(() => page.press(), error => error === failure)
    else page.press()
    assert.equal(page.resultSession.stage(world), 'statistics')
    assert.equal(page.selector, false)
    assert.equal(world.paused, true)
    assert.equal(scene.modalSuspended, true)
    frame(0); frame(0.5)
    assert.equal(scene.tooltipElement.hidden, true)
    assert.equal(world.routeNotice, notice)
    assert.equal(scene.tooltip.remaining, remaining)
  }
  page.admit(true)
  for (let repeat = 0; repeat < 2; repeat++) {
    page.press()
    assert.equal(page.resultSession.stage(world), 'selector')
    assert.equal(page.selector, true)
    page.back()
    assert.equal(page.resultSession.stage(world), 'statistics')
    assert.equal(page.selector, false)
    assert.equal(world.paused, true)
    assert.equal(scene.modalSuspended, true, 'Back cannot release statistics presentation ownership')
    frame(0); frame(0.5)
    assert.equal(scene.tooltipElement.hidden, true)
    assert.equal(world.routeNotice, notice)
    assert.equal(scene.tooltip.remaining, remaining)
  }
  assert.equal(page.entries, 4)
})

test('statistics-bypass Back releases only the selector hold and resumes the retained terminal route', async t => {
  const f = await fixture(t), { scene, world, frame } = f,
    notice = world.routeNotice, remaining = scene.tooltip.remaining
  world.status = 'lost'
  world.manaWorld.loadFlags |= 0x04000000 // explicit native statistics-bypass input
  const page = resultPage(t, f, false)
  page.press()
  assert.equal(page.resultSession.stage(world), 'terminal-overlay')
  assert.notEqual(scene.modalSuspended, true, 'rejected bypass exit must not invent a statistics hold')
  assert.equal(world.paused, false)
  page.admit(true); page.press()
  assert.equal(page.resultSession.stage(world), 'selector')
  assert.equal(scene.modalSuspended, true)
  world.paused = true // supplied selector dialog showModal pause boundary
  frame(0); frame(0.5)
  page.back()
  assert.equal(page.resultSession.stage(world), 'terminal-overlay')
  assert.equal(world.paused, false, 'Back restores the pre-selector pause')
  assert.equal(scene.modalSuspended, false)
  frame(0)
  assert.equal(scene.tooltip.remaining, remaining, 'no suspended wall-time catch-up')
  frame()
  assert.equal(world.routeNotice, notice)
  assert.equal(scene.tooltip.remaining, remaining - 1)
  assert.equal(scene.tooltipElement.hidden, false, 'live terminal presentation resumes')
})
