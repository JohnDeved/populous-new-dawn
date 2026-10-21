import test from 'node:test'
import assert from 'node:assert/strict'
import { tooltipCallerFixture } from './support/tooltip-scene.mjs'
import { pageNearby } from './support/follower-nearby-page.mjs'

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
