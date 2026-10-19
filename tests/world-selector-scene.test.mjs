import assert from 'node:assert/strict'
import test from 'node:test'
import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {selectorWorlds} from '../app/world-selector-data.ts'
import {sceneTrig,bodyPositions,desiredCamera,advanceCamera,cameraBasis,projectPoint,bodyDepth,SelectorMotion,sceneStep} from '../app/world-selector-motion.ts'
import {sceneGlobeMesh,sceneOrbits,orbitState,orbitRibbon,roundEven,createPointStars,projectStar,SunWobble,sunAnnulus} from '../app/world-selector-geometry.ts'
const close=(a,b,tolerance=1e-7)=>assert.ok(Math.abs(a-b)<=tolerance,`${a} != ${b}`)
const authored=()=>bodyPositions(selectorWorlds.map(b=>b.startAngle))
test('authored quantized body hierarchy and selected focus preserve native mapping',()=>{
 const positions=authored()
 for(const [mission,index,z] of [[1,24,-1250],[2,23,-1290],[3,22,-1330]]){
  assert.equal(selectorWorlds[index].mission,mission);close(positions[index].z,z,1e-4)
  const desired=desiredCamera(positions,index)
  close(desired.eye.y,66.6666666667)
  close(desired.eye.z,z-200,2e-4)
  const camera=cameraBasis(desired.eye,desired.target),p=projectPoint(positions[index],camera)
  close(p.x,320);close(p.y,240)
  const depth=bodyDepth(8,p.depth,camera)
  close(depth.base,.0127130,1e-7);close(depth.delta,.000154408,1e-9)
  assert.notEqual(depth.base,(p.depth-8)/16384)
 }
 assert.deepEqual(sceneTrig(90.01),sceneTrig(90))
 assert.notDeepEqual(sceneTrig(90.0625),sceneTrig(90))
})
test('smoother retains speed on reselection, accelerates twice, and has exact snap branches',()=>{
 const track={current:{x:0,y:0,z:0},lastSelected:24,speed:2,acceleration:3,mode:2}
 advanceCamera(track,{x:100,y:0,z:0},23,.1,30)
 close(track.acceleration,6);close(track.speed,2.6);close(track.current.x,.234)
 advanceCamera(track,{...track.current},23,.1,30)
 assert.equal(track.mode,2);assert.equal(track.acceleration,0);close(track.speed,2.08)
 advanceCamera(track,{x:101,y:7,z:8},23,.1,30)
 assert.deepEqual(track.current,{x:101,y:7,z:8})
 const near={current:{x:0,y:0,z:0},lastSelected:24,speed:10,acceleration:6,mode:1}
 advanceCamera(near,{x:.01,y:0,z:0},24,.1,30);assert.equal(near.mode,2);assert.equal(near.speed,8)
})
test('source orbital positions precede advancement and elapsed velocity includes factor ten',()=>{
 const motion=new SelectorMotion(), initial=authored()
 motion.advance(sceneStep,24)
 assert.deepEqual(motion.positions,initial)
 close(motion.angles[24],90+13/120)
 motion.advance(sceneStep,24)
 assert.notDeepEqual(motion.positions,initial)
 assert.equal(new SelectorMotion().advance(0,24).camera.eye.y,2500)
})
test('fixed integration gives same state across 30/60/120/144 Hz and irregular presentation',()=>{
 const run=schedule=>{
  const motion=new SelectorMotion();let elapsed=0,i=0
  while(elapsed<12-1e-9){const dt=Math.min(schedule[i++%schedule.length],12-elapsed);motion.advance(dt,elapsed<6-1e-9?24:22);elapsed+=dt}
  return motion
 }
 // Bound selection to a common exact event boundary for all presentation schedules.
 const baseline=run([1/120])
 for(const schedule of [[1/30],[1/60],[1/144],[.01,.015,.025]]){
  const result=run(schedule)
  close(result.elapsed,12,1e-9)
  for(const key of ['x','y','z'])close(result.eye.current[key],baseline.eye.current[key],1e-6)
  close(result.angles[24],baseline.angles[24],1e-7)
 }
 const capped=new SelectorMotion();capped.advance(100,24);close(capped.elapsed,1)
})
test('all orbit groups use progression anchor independently of camera selection',()=>{
 assert.equal(sceneOrbits.length,21)
 assert.equal(orbitState([5,6],5),2);assert.equal(orbitState([5,6],4),1);assert.equal(orbitState([5,6],7),0)
 assert.equal(orbitState([5,6],6),2)
 const before=sceneOrbits.map(o=>orbitState(o.members,24))
 assert.equal(before.filter(v=>v===2).length,1)
 const positions=authored(),desired=desiredCamera(positions,24),camera=cameraBasis(desired.eye,desired.target)
 const orbit=sceneOrbits.find(o=>o.members.includes(24)),ribbon=orbitRibbon(positions[orbit.parent],orbit.radius,2,camera)
 assert.equal(ribbon.vertices.length,202)
 assert.ok(ribbon.triangles.length>0&&ribbon.triangles.length<=600)
 assert.deepEqual(ribbon.vertices[0],ribbon.vertices[200])
 assert.ok(ribbon.vertices.every(v=>v.rhw===2&&v.u===Math.fround(.3)))
 assert.ok(ribbon.triangles.every(i=>ribbon.vertices[i].depth>10/16384))
 assert.ok(ribbon.vertices.some(v=>v.depth<=10/16384), "camera lies inside the orbit; unsubmitted vertices can be behind it")
 assert.deepEqual(sceneOrbits.map(o=>orbitState(o.members,24)),before)
 for(const [value,expected] of [[1.5,2],[2.5,2],[3.5,4],[-1.5,-2]])assert.equal(roundEven(value),expected)
})
test('ribbons omit near-plane crossings and flatten distant band UVs',()=>{
 const camera=cameraBasis({x:0,y:0,z:0},{x:0,y:0,z:1})
 const ribbon=orbitRibbon({x:0,y:0,z:0},100,0,camera)
 for(const index of ribbon.triangles)assert.ok(ribbon.vertices[index].depth>10/16384)
 const far=orbitRibbon({x:0,y:0,z:1000},100,1,camera)
 assert.ok(far.vertices.every(v=>v.v===.375))
})
test('point stars use source RNG cube, fixed depth, gray fade and viewport clipping',()=>{
 const stars=createPointStars(0);assert.equal(stars.length,1000)
 let state=0
 const expected=Array.from({length:3},()=>{state=(Math.imul(state,9377)+9439)>>>0;state=((state>>>13)|(state<<19))>>>0;return state%10000-5000})
 assert.deepEqual(stars[0],{x:expected[0],y:expected[1],z:expected[2]})
 assert.ok(stars.every(p=>Object.values(p).every(n=>n>=-5000&&n<=4999)))
 const camera=cameraBasis({x:0,y:0,z:0},{x:0,y:0,z:1})
 const star=projectStar({x:0,y:0,z:1000},camera)
 assert.equal(star.depth,.5);assert.equal(star.red,126)
 assert.equal(projectStar({x:0,y:0,z:10},camera),undefined)
 assert.equal(projectStar({x:1000,y:0,z:100},camera),undefined)
 assert.equal(projectStar({x:0,y:0,z:10000},camera).red,0)
})
test('sun retains per-index phases, zero-speed branch and source alpha annuli',()=>{
 const sun=new SunWobble(1),original=sun.phasesU[2]
 sun.advance(2,1/120);assert.equal(sun.phasesU[2],original);assert.ok(sun.phasesU[0]>0)
 const saved=sun.phasesU[1];sun.advance(1,1/120);assert.equal(sun.phasesU[1],saved)
 sun.speedsU[0]=0;sun.advance(1,1/120);assert.ok(sun.speedsU[0]>=0)
 const halo=sunAnnulus(320,240,.01,96,120,255,0,20)
 assert.equal(halo.vertices.length,42);assert.equal(halo.triangles.length,120)
 close(Math.hypot(halo.vertices[0].x-320,halo.vertices[0].y-240),96,1e-5)
 assert.equal(halo.vertices[0].red,128);assert.equal(halo.vertices[0].green,0)
 assert.equal(halo.vertices[0].alpha,255);assert.equal(halo.vertices[1].alpha,0)
 assert.ok(halo.vertices.every(v=>v.depth===.01))
 assert.equal(sceneGlobeMesh(1000),sceneGlobeMesh(255))
})
test('all scene textures retain importer ownership and exact independently reviewed sun/ribbon hashes',()=>{
 const root='public/original/world-selector/globes/',provenance=JSON.parse(readFileSync(root+'provenance.json'))
 assert.deepEqual(provenance.assets.filter(a=>a.mission).map(a=>a.mission),Array.from({length:24},(_,i)=>i+1))
 for(const [file,hash] of [['sun.png','67d20335b39471fa5c0be3799b8ae36e41ba857d77b5b804201c79c9d905a657'],['ring.png','6814e461c75a21d904132087a37eea8045d5d9d69a09f230e0b0ae6b1340245c']]){
  assert.equal(createHash('sha256').update(readFileSync(root+file)).digest('hex'),hash)
 }
})

test('widescreen star clipping expands symmetrically without changing native projection or depth',()=>{
 const camera=cameraBasis({x:0,y:0,z:0},{x:0,y:0,z:1})
 for(const x of [-900,900]){
  const point={x,y:0,z:1000}
  assert.equal(projectStar(point,camera),undefined)
  const wide=projectStar(point,camera,320/3)
  assert.ok(wide)
  assert.equal(wide.x,projectPoint(point,camera).x)
  assert.equal(wide.y,240)
  assert.equal(wide.depth,.5)
  assert.equal(projectStar({x:1400*Math.sign(x),y:0,z:1000},camera,320/3),undefined)
 }
 assert.equal(projectStar({x:0,y:900,z:1000},camera,320/3),undefined)
 assert.equal(projectStar({x:0,y:0,z:10},camera,320/3),undefined)
})
