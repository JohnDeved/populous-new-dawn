import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { routeTooltipAnchor, drawRouteTooltip } from '../app/route-tooltip.ts'
import { tooltipLayout } from '../app/tooltip-layout.ts'
import { createTooltip, showRouteTooltip, stepTooltip } from '../app/tooltips.ts'
import { createWorld, command, nativePosition, requestTutorial, ROUTE_FAILURE_TEXT } from '../app/model.ts'
import { createGameStore, migrateCheckpoint } from '../app/game-store.ts'
import { createStartedWorld } from './level-start-fixture.mjs'

const land = { heights: new Int16Array(16384), flags: new Uint32Array(16384) }
const view = {
  center: { x: 256, y: 256 }, angle: 0,
  projection: { matrix: [16384,0,0,0,16384,0,0,0,16384], curvature: 0, depth: 4096,
    perspective: 12, scale: 4096, width: 640, height: 480, centerX: 320, centerY: 240,
    fractionX: 4, fractionY: 4, pixelScaleX: 1/16, pixelScaleY: 1/16 },
}

test('route layout uses full-screen height, raw F00T banks and the recovered width search', () => {
  for (const [width,height,font,w,h,lines] of [
    [640,480,4,102,30,['One or more of',"your people can't",'get to this point.']],
    [800,600,4,100,30,['One or more of',"your people can't",'get to this point.']],
    [1024,768,3,276,38,['One or more of your people',"can't get to this point."]],
    [1280,720,3,276,38,['One or more of your people',"can't get to this point."]],
  ]) {
    const layout = tooltipLayout(ROUTE_FAILURE_TEXT,width,height)
    assert.equal(layout.width,w); assert.equal(layout.height,h)
    assert.ok(layout.draws.every(d => d[0] === font))
    const grouped = Map.groupBy(layout.draws, d => d[3])
    assert.deepEqual([...grouped.values()].map(row => row.map(d => String.fromCharCode(d[1]+32)).join('')), lines)
  }
})

test('cell anchor centers before camera-relative offset, then uses projection and viewport origin', () => {
  const screen = { width:800,height:600 }, text = {width:100,height:30}
  // Cell0 -> (256,256), yaw0 offset -> (384,256), relative -> (64,0,0).
  // Identity basis/depth4096 gives +4 pixels horizontally, then viewport origin.
  assert.deepEqual(routeTooltipAnchor(0,land,view,{left:160,top:10},screen,text),{x:484,y:250})
  assert.deepEqual(routeTooltipAnchor(0,land,{...view,angle:512},{left:160,top:10},screen,text),{x:480,y:250})
  assert.equal(routeTooltipAnchor(undefined,land,view,{left:0,top:0},screen,text),null)
  assert.equal(routeTooltipAnchor(0,land,{...view,projection:{...view.projection,centerX:641}},
    {left:0,top:0},screen,text),null,'source clip flags suppress before fullscreen clamping')
})

test('fullscreen clamp constrains text, not its asymmetric 4/3 frame', () => {
  const edge = {...view,projection:{...view.projection,centerX:620,centerY:470}}
  assert.deepEqual(routeTooltipAnchor(0,land,edge,{left:160,top:100},{width:800,height:600},
    {width:100,height:30}),{x:700,y:570})
  const left = {...view,projection:{...view.projection,centerX:0,centerY:0}}
  assert.deepEqual(routeTooltipAnchor(0,land,left,{left:-10,top:-10},{width:800,height:600},
    {width:100,height:30}),{x:0,y:0})
})

test('native route frame submits W+7/H+7 and raw glyphs after the frame', () => {
  const draws=[], fills=[], context={ imageSmoothingEnabled:true,
    drawImage(...args){draws.push(args)}, fillRect(...args){fills.push(args)} }
  const canvas={dataset:{},getContext:()=>context}, atlas={complete:true,naturalWidth:1024},
    border={complete:true,naturalWidth:12}, screen={width:640,height:480}
  const layout=drawRouteTooltip(canvas,atlas,border,screen)
  assert.deepEqual({width:canvas.width,height:canvas.height},{width:109,height:37})
  assert.deepEqual(fills,[[0,0,109,37]])
  assert.equal(context.fillStyle,'#ff2500')
  assert.equal(context.imageSmoothingEnabled,false)
  const corner=draws.find(d=>d[0]===border && d[1]===8 && d[2]===8)
  assert.deepEqual(corner.slice(1),[8,8,4,4,105,33,4,4])
  assert.ok(draws.findIndex(d=>d[0]===atlas)>draws.findLastIndex(d=>d[0]===border))
  const count=draws.length
  assert.deepEqual(drawRouteTooltip(canvas,atlas,border,screen),{width:102,height:30})
  assert.equal(draws.length,count,'unchanged dimensions do not repaint or rewrap')
  assert.equal(layout.width,102)
  assert.equal(drawRouteTooltip(canvas,atlas,{complete:false},screen),null)
})

test('mode9 replaces shared text and expires after 72 eligible reference visits, without an entity', () => {
  const state=createTooltip()
  Object.assign(state,{target:99,text:'Object',remaining:900,flags:6})
  showRouteTooltip(state,0xfffe,24)
  assert.deepEqual({target:state.target,text:state.text,flags:state.flags,fixed:state.fixed,remaining:state.remaining},
    {target:0xfffe,text:ROUTE_FAILURE_TEXT,flags:8,fixed:1,remaining:72})
  for(let i=0;i<71;i++) { state.draw=0; assert.equal(stepTooltip(state,false,24),true); assert.equal(state.draw,1) }
  state.draw=0; assert.equal(stepTooltip(state,false,24),true)
  assert.equal(state.remaining,0); assert.equal(state.text,''); assert.equal(state.draw,0)
})

test('accepted command captures a scalar destination and each notice snapshots it', () => {
  const world=createStartedWorld(), point={x:10,z:8}
  world.selected=world.units.filter(u=>u.team==='blue').map(u=>u.id)
  const native=nativePosition(world,point), expected=((native.x>>>8)&255)|(native.y&0xff00)
  assert.equal(command(world,point),true)
  assert.equal(world.lastOrderCell,expected)
  requestTutorial(world,0x200000,603)
  const notice=world.routeNotice
  point.x=90; world.lastOrderCell=0xabcd
  assert.equal(notice.cell,expected)
  requestTutorial(world,0x200000,603)
  assert.equal(world.routeNotice.cell,0xabcd); assert.equal(notice.cell,expected)
  const restored=migrateCheckpoint(structuredClone(world))
  assert.deepEqual(restored.routeNotice,world.routeNotice)
  assert.equal(restored.lastOrderCell,0xabcd)
  world.paused=true; assert.equal(command(world,{x:30,z:5}),false)
  assert.equal(world.lastOrderCell,0xabcd,'rejected input does not move the anchor')
})

test('missing older presentation fields remain unknown rather than aliasing cursor or cell0', () => {
  const world=createWorld()
  delete world.lastOrderCell
  const restored=migrateCheckpoint(structuredClone(world))
  assert.equal(restored.lastOrderCell,undefined)
  requestTutorial(world,0x200000,603)
  assert.equal(world.routeNotice.cell,undefined)
  assert.equal(routeTooltipAnchor(world.routeNotice.cell,land,view,{left:0,top:0},
    {width:640,height:480},{width:102,height:30}),null)
})

test('the shipped page and CSS no longer contain a visible route card or fade timer', () => {
  const page=readFileSync(new URL('../app/page.tsx',import.meta.url),'utf8'),
    css=readFileSync(new URL('../app/globals.css',import.meta.url),'utf8')
  assert.doesNotMatch(page,/world-message route-notice|onAnimationEnd/)
  assert.doesNotMatch(css,/@keyframes route-notice|\.route-notice\{/)
})


test('current checkpoint save/load retains scalar anchors and tolerates a legacy missing anchor', async () => {
  const store=createGameStore(),world=store.getWorld()
  world.lastOrderCell=0x1234
  requestTutorial(world,0x200000,603)
  await store.saveCheckpoint()
  world.lastOrderCell=0x5678
  world.routeNotice.cell=0x5678
  assert.equal(store.loadCheckpoint(),true)
  assert.equal(store.getWorld().lastOrderCell,0x1234)
  assert.equal(store.getWorld().routeNotice.cell,0x1234)
  const legacy=store.getWorld()
  delete legacy.lastOrderCell
  delete legacy.routeNotice.cell
  await store.saveCheckpoint()
  assert.equal(store.loadCheckpoint(),true)
  assert.equal(store.getWorld().lastOrderCell,undefined)
  assert.equal(store.getWorld().routeNotice.cell,undefined)
})

const malformedCells=[-1,65536,4294967296,Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER+1,
  NaN,Infinity,-Infinity,1n,-1n,0.5,'0','65535',null,{},[],true,undefined]
for(const value of malformedCells) {
  test(`malformed route anchor stays unknown through producer, renderer and checkpoint recovery: ${String(value)}`,async()=>{
    const store=createGameStore(),world=store.getWorld()
    world.lastOrderCell=value
    requestTutorial(world,0x200000,603)
    assert.equal(world.routeNotice.cell,undefined,'producer never wraps or coerces untrusted anchor')
    assert.equal(routeTooltipAnchor(value,land,view,{left:0,top:0},{width:640,height:480},
      {width:102,height:30}),null,'consumer rejects malformed anchor before native arithmetic')
    world.routeNotice.cell=value // simulate a current-format checkpoint payload, not a producer
    await store.saveCheckpoint()
    assert.equal(store.loadCheckpoint(),true)
    const restored=store.getWorld()
    assert.equal(restored.lastOrderCell,undefined)
    assert.equal(restored.routeNotice.cell,undefined)
    assert.equal(Object.hasOwn(restored,'lastOrderCell'),false)
    assert.equal(Object.hasOwn(restored.routeNotice,'cell'),false)
    assert.deepEqual(world.lastOrderCell,value,'normalization never mutates old live/stored source')
    assert.deepEqual(world.routeNotice.cell,value)
    const state=createTooltip();showRouteTooltip(state,value,24)
    assert.equal(state.target,0,'unknown state sentinel is never a wrapped destination')
    for(let visit=0;visit<72;visit++){state.draw=0;stepTooltip(state,false,24)}
    assert.equal(state.remaining,0,'unknown anchors still have bounded presentation ownership')
  })
}
for(const value of [0,65535]) {
  test(`valid packed-cell endpoint ${value} survives current checkpoint save/load unchanged`,async()=>{
    const store=createGameStore(),world=store.getWorld()
    world.lastOrderCell=value;requestTutorial(world,0x200000,603)
    await store.saveCheckpoint();assert.equal(store.loadCheckpoint(),true)
    const restored=store.getWorld()
    assert.equal(restored.lastOrderCell,value);assert.equal(restored.routeNotice.cell,value)
    const endpointView={...view,center:value===0?{x:256,y:256}:{x:65280,y:65280}}
    assert.deepEqual(routeTooltipAnchor(value,land,endpointView,{left:0,top:0},
      {width:640,height:480},{width:102,height:30}),{x:324,y:240})
    const state=createTooltip();showRouteTooltip(state,value,24);assert.equal(state.target,value)
  })
}
