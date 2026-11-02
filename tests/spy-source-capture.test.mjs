import assert from 'node:assert/strict'
import test from 'node:test'
import { installSpyCapture } from '../scripts/tutorial-browser/spy-source-capture.mjs'
import { runSceneFrames } from '../scripts/controlled-scene-frames.mjs'

// Supplied scheduler boundaries only: no World/controller/GPU/pixel claim.
function fixture(t) {
  const saved = new Map(['window', 'document'].map(k => [k, Object.getOwnPropertyDescriptor(globalThis, k)]))
  const scheduled = new Map(), canceled = [], spy = { id: 7, native: { object: 48 } }
  let handle = 10
  const world = { turn: 20, speed: 1, paused: true, units: [spy] }
  const clock = { animationTime: 0, animationFrame: 0 }
  const win = { requestAnimationFrame(callback) { scheduled.set(++handle, callback); return handle },
    cancelAnimationFrame(id) { canceled.push(id); scheduled.delete(id) },
    __pndSpySourceObservation: { result: { spyId: 7 } } }
  const scene = { world, gameClock: clock, started: true, disposed: false,
    previous: performance.now(), frame: 10,
    advanceInputTime() {},
    renderer: { domElement: { isConnected: true }, info: { render: { frame: 0 } },
      getContext: () => ({ isContextLost: () => false }) },
    animate(now) {
      if (!world.paused) { world.turn++; clock.animationFrame++ }
      this.previous = now
      this.renderer.info.render.frame++
      this.frame = win.requestAnimationFrame(this.animate)
    } }
  win.testSceneRef = { current: scene }; win.testStore = { getWorld: () => world }
  Object.defineProperty(globalThis, 'window', { configurable: true, writable: true, value: win })
  Object.defineProperty(globalThis, 'document', { configurable: true, writable: true, value: { hidden: false } })
  const raf = Object.getOwnPropertyDescriptor(win, 'requestAnimationFrame'),
    cancel = Object.getOwnPropertyDescriptor(win, 'cancelAnimationFrame'),
    input = Object.getOwnPropertyDescriptor(scene, 'advanceInputTime')
  t.after(() => {
    win.__pndSpyCapture?.abandon()
    for (const [k, descriptor] of saved)
      if (descriptor) Object.defineProperty(globalThis, k, descriptor)
      else delete globalThis[k]
  })
  const start = () => installSpyCapture({ deadlineAt: Date.now() + 45000 })
  return { win, world, clock, scene, scheduled, canceled, raf, cancel, start,
    capture: () => win.__pndSpyCapture,
    restored() {
      assert.deepEqual(Object.getOwnPropertyDescriptor(win, 'requestAnimationFrame'), raf)
      assert.deepEqual(Object.getOwnPropertyDescriptor(win, 'cancelAnimationFrame'), cancel)
      assert.deepEqual(Object.getOwnPropertyDescriptor(scene, 'advanceInputTime'), input)
    } }
}

test('Spy capture holds only the original Scene successor and forwards unrelated callbacks', t => {
  const f = fixture(t); f.start()
  const callback = () => {}, id = f.win.requestAnimationFrame(callback)
  assert.equal(f.scheduled.get(id), callback)
  f.win.cancelAnimationFrame(id); assert.equal(f.scheduled.has(id), false)
  assert.throws(() => f.win.requestAnimationFrame(f.scene.animate), /duplicate/)
  f.capture().abandon(); f.restored()
  assert.equal(f.capture().result.resumedRAF, false)
})

test('controlled full frames aggregate and paused handback resumes exactly one ordinary RAF', async t => {
  const f = fixture(t); f.start(); f.world.paused = false
  let samples = 0
  await f.capture().drive(runSceneFrames, () => { samples++ }, () => samples === 2)
  assert.equal(f.capture().result.frames, 2)
  assert.equal(f.capture().result.turns, 2)
  assert.equal(f.scheduled.size, 0)
  f.world.paused = true
  const before = structuredClone({ world: f.world, clock: f.clock })
  f.capture().release(); f.restored()
  assert.deepEqual({ world: f.world, clock: f.clock }, before)
  assert.equal(f.capture().result.handback.evidence, false)
  assert.equal(f.scheduled.size, 1)
  assert.equal(f.scheduled.get(f.scene.frame), f.scene.animate)
  f.capture().release(); f.capture().abandon()
  assert.equal(f.scheduled.size, 1, 'Cleanup never schedules a second successor')
})

test('capture refuses unpaused handback and changed ownership without restarting', t => {
  const f = fixture(t); f.start(); f.world.paused = false
  assert.throws(() => f.capture().release(), /Public Pause/)
  f.world.paused = true; f.win.testSceneRef.current = {}
  assert.throws(() => f.capture().release(), /original live/)
  f.capture().abandon(); f.restored(); assert.equal(f.scheduled.size, 0)
})

test('capture preserves foreign successor descriptors without invoking their accessors', t => {
  const f = fixture(t); f.start(); let reads = 0
  const foreign = { configurable: true, get() { reads++; throw Error('foreign') } }
  Object.defineProperty(f.win, 'requestAnimationFrame', foreign)
  const descriptor = Object.getOwnPropertyDescriptor(f.win, 'requestAnimationFrame')
  f.capture().abandon(); f.capture().abandon()
  assert.equal(reads, 0)
  assert.deepEqual(Object.getOwnPropertyDescriptor(f.win, 'requestAnimationFrame'), descriptor)
  assert.equal(f.capture().result.foreign, true)
  assert.equal(f.capture().result.released, false)
  assert.equal(f.capture().result.resumedRAF, false)
  assert.deepEqual(Object.getOwnPropertyDescriptor(f.win, 'cancelAnimationFrame'), f.cancel)
})

for (const kind of ['aggregate-bound', 'visibility', 'speed', 'multiple-turns', 'missing-successor'])
  test(`capture fails closed on ${kind} with no synthesized entry`, async t => {
    const f = fixture(t); f.start(); f.world.paused = false
    if (kind === 'visibility') document.hidden = true
    if (kind === 'speed') f.world.speed = 2
    if (kind === 'aggregate-bound') f.capture().result.frames = 384 // Exhaust aggregate, never reset per drive.
    const driver = kind === 'multiple-turns' ? async options => {
      f.world.turn += 2; f.scene.animate(f.scene.previous + 1); options.onFrame()
    } : kind === 'missing-successor' ? async options => {
      f.world.turn++; options.onFrame()
    } : runSceneFrames
    await assert.rejects(f.capture().drive(driver, () => assert.fail('No invalid observation'), () => false))
    f.capture().abandon(); f.restored(); assert.equal(f.scheduled.size, 0)
  })


test('partial RAF installation restores the first descriptor and leaves the original Scene callback alone', t => {
  const f = fixture(t)
  Object.defineProperty(f.win, 'cancelAnimationFrame', { ...f.cancel, configurable: false, writable: false })
  assert.throws(() => f.start())
  assert.deepEqual(Object.getOwnPropertyDescriptor(f.win, 'requestAnimationFrame'), f.raf)
  assert.equal(f.canceled.length, 0)
  assert.equal(f.capture().result.resumedRAF, false)
})

test('an exhausted existing wall deadline rejects acquisition without changing browser ownership', t => {
  const f = fixture(t)
  assert.throws(() => installSpyCapture({ deadlineAt: Date.now() - 1 }), /deadline/)
  f.restored(); assert.equal(f.canceled.length, 0)
})

for (const owner of ['world', 'clock', 'animate'])
  test(`capture abandons stale ${owner} without overwriting a successor`, t => {
    const f = fixture(t); f.start()
    if (owner === 'world') f.win.testStore.getWorld = () => ({})
    if (owner === 'clock') f.scene.gameClock = {}
    if (owner === 'animate') f.scene.animate = () => {}
    assert.throws(() => f.capture().release(), /original live/)
    f.capture().abandon(); f.restored(); assert.equal(f.scheduled.size, 0)
  })

// Production input-clock body extracted as text; no Scene/model construction.
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const sceneSource=readFileSync(new URL('../app/scene.ts',import.meta.url),'utf8');
const begin=sceneSource.indexOf('  advanceInputTime(timestamp ='),end=sceneSource.indexOf('  private publishCameraInput() {',begin);
assert.ok(begin>=0&&end>begin);
const ActualInput=runInNewContext(`(class Input { ${sceneSource.slice(begin,end)} })`,{performance:{now:()=>999999},advanceGame:(w,c,seconds)=>{w.turn+=Math.floor(seconds*12);c.animationFrame+=Math.floor(seconds*24)},previewGroundZoom:()=>{}}).prototype.advanceInputTime;

test('controlled public input invokes original clock at held timestamp, not real-event catch-up',t=>{
 const f=fixture(t);f.world.cameras={phase:'idle'};f.scene.advanceInputTime=ActualInput;const original=Object.getOwnPropertyDescriptor(f.scene,'advanceInputTime');f.start();f.world.paused=false;
 const before={turn:f.world.turn,previous:f.scene.previous,frame:f.clock.animationFrame};
 f.scene.advanceInputTime(f.scene.previous+5000);
 assert.deepEqual({turn:f.world.turn,previous:f.scene.previous,frame:f.clock.animationFrame},before);
 assert.equal(f.capture().result.inputCalls,1);
 f.world.paused=true;f.capture().release();assert.deepEqual(Object.getOwnPropertyDescriptor(f.scene,'advanceInputTime'),original);
 f.world.paused=false;f.scene.advanceInputTime(f.scene.previous+1100);assert.equal(f.world.turn,before.turn+13,'original chronological method restored');
});
test('inherited input method restored by deleting only owned shadow',t=>{
 const f=fixture(t);delete f.scene.advanceInputTime;const proto={advanceInputTime(){}};Object.setPrototypeOf(f.scene,proto);f.start();assert.ok(Object.hasOwn(f.scene,'advanceInputTime'));f.capture().abandon();assert.equal(Object.hasOwn(f.scene,'advanceInputTime'),false);assert.equal(f.scene.advanceInputTime,proto.advanceInputTime);assert.equal(f.capture().result.inputRestored,true);
});
test('foreign input accessor is not invoked or overwritten on abandonment',t=>{
 const f=fixture(t);f.start();let reads=0;Object.defineProperty(f.scene,'advanceInputTime',{configurable:true,get(){reads++;throw Error('foreign')}});const foreign=Object.getOwnPropertyDescriptor(f.scene,'advanceInputTime');assert.throws(()=>f.capture().release(),/owned/);f.capture().abandon();assert.equal(reads,0);assert.deepEqual(Object.getOwnPropertyDescriptor(f.scene,'advanceInputTime'),foreign);assert.equal(f.capture().result.inputRestored,false);assert.equal(f.capture().result.released,false);assert.equal(f.scheduled.size,0);
});
test('changed inherited predecessor blocks restart without overwriting it',t=>{
 const f=fixture(t);delete f.scene.advanceInputTime;const proto={advanceInputTime(){}};Object.setPrototypeOf(f.scene,proto);f.start();const next=()=>{};proto.advanceInputTime=next;assert.throws(()=>f.capture().release(),/owned/);f.capture().abandon();assert.equal(proto.advanceInputTime,next);assert.equal(f.capture().result.foreign,true);assert.equal(f.capture().result.resumedRAF,false);
});
test('input method failure is preserved and restoration remains available',t=>{
 const f=fixture(t);const failure={};f.scene.advanceInputTime=()=>{throw failure};const original=Object.getOwnPropertyDescriptor(f.scene,'advanceInputTime');f.start();assert.throws(()=>f.scene.advanceInputTime(),e=>e===failure);f.capture().abandon();assert.deepEqual(Object.getOwnPropertyDescriptor(f.scene,'advanceInputTime'),original);assert.equal(f.capture().result.inputRestored,true);
});

for (const kind of ['accessor','fixed-data']) test(`input ownership acquisition rejects ${kind} without invoking or changing it`,t=>{
 const f=fixture(t);let reads=0;Object.defineProperty(f.scene,'advanceInputTime',kind==='accessor'?{configurable:true,get(){reads++;throw Error('accessor')}}:{configurable:false,writable:false,value:()=>{}});const before=Object.getOwnPropertyDescriptor(f.scene,'advanceInputTime');assert.throws(()=>f.start(),/replaceable input/);assert.equal(reads,0);assert.deepEqual(Object.getOwnPropertyDescriptor(f.scene,'advanceInputTime'),before);assert.equal(f.canceled.length,0);assert.equal(f.capture().result.resumedRAF,false);
});

for (const kind of ['replacement-prototype','intermediate-method']) test(`inherited input ${kind} cannot be accepted as restored owner`,t=>{
 const f=fixture(t);delete f.scene.advanceInputTime;const proto={advanceInputTime(){}};Object.setPrototypeOf(f.scene,proto);f.start();let reads=0;const foreign={};Object.defineProperty(foreign,'advanceInputTime',{configurable:true,get(){reads++;throw Error('foreign')}});if(kind==='intermediate-method')Object.setPrototypeOf(foreign,proto);Object.setPrototypeOf(f.scene,foreign);const descriptor=Object.getOwnPropertyDescriptor(foreign,'advanceInputTime');assert.throws(()=>f.capture().release(),/owned/);f.capture().abandon();assert.equal(reads,0);assert.deepEqual(Object.getOwnPropertyDescriptor(foreign,'advanceInputTime'),descriptor);assert.equal(Object.hasOwn(f.scene,'advanceInputTime'),false);assert.equal(f.capture().result.foreign,true);assert.equal(f.capture().result.inputRestored,false);assert.equal(f.capture().result.released,false);assert.equal(f.capture().result.resumedRAF,false);assert.equal(f.scheduled.size,0);
});
