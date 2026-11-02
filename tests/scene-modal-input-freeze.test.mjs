import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {runInNewContext} from 'node:vm';
const root=new URL('../',import.meta.url);
const s=readFileSync(new URL('app/scene.ts',root),'utf8'),r=readFileSync(new URL('app/scene-input-runtime.ts',root),'utf8');
assert.ok(s.includes('  private publishCameraInput() {') && s.includes('  private neutralCursor:'));
assert.ok(s.includes('  listen(target: EventTarget,') && s.includes('  setSize() {'));
assert.ok(r.includes('  const trackNavigation =') && r.includes("  for (const event of ['pointermove'"));
const publish=s.slice(s.indexOf('  private publishCameraInput() {'),s.indexOf('  private neutralCursor:')).replace('private publishCameraInput','publishCameraInput');
const listen=s.slice(s.indexOf('  listen(target: EventTarget,'),s.indexOf('  setSize() {')).replace('target: EventTarget, name: string, handler: EventListener','target, name, handler').replace('const ordered: EventListener','const ordered');
const nav=r.slice(r.indexOf('  const trackNavigation ='),r.indexOf("  for (const event of ['pointermove'",r.indexOf('  const trackNavigation ='))).replace('(event: Event)','(event)').replace('event as PointerEvent','event');
const Factory=runInNewContext(`(class Subject { ${publish}\n${listen} })`,{performance:{now:()=>100}});
const track=runInNewContext(`(scene)=>{${nav};return trackNavigation}`);
function fixture(){const o=new Factory();Object.assign(o,{disposed:false,modalSuspended:false,inputDepth:0,disposeListeners:[],world:{cameras:{elapsed:9,input:{time:9,cursor:24,buttons:0,pointer:null}}},advanceInputTime(){},navigationButtons:()=>0,captureCamera:()=>{}});Object.defineProperty(o,'navigationPointer',{get(){return this.world.cameras.input.pointer},set(v){this.world.cameras.input.pointer=v}});return o;}
function bind(o,handler){let ordered;const target={addEventListener(n,f){ordered=f},removeEventListener(){}};o.listen(target,'pointermove',handler);return (extra={})=>ordered({timeStamp:10,pointerType:'mouse',clientX:400,clientY:219,buttons:0,...extra});}
test('modal Retry/Save pointer delivery preserves complete supplied world',()=>{const o=fixture();o.modalSuspended=true;const before=JSON.stringify(o.world);bind(o,track(o))();assert.equal(JSON.stringify(o.world),before)});
test('modal keyboard delivery cannot alter authoritative keys or cursor',()=>{const o=fixture();o.world.cameras.keys={};o.modalSuspended=true;const before=JSON.stringify(o.world);bind(o,()=>{o.world.cameras.keys.shift=true})({key:'Shift'});assert.equal(JSON.stringify(o.world),before)});
test('suspension arising during drain stops handler and publication',()=>{const o=fixture();o.advanceInputTime=()=>{o.modalSuspended=true};const before=JSON.stringify(o.world);bind(o,track(o))();assert.equal(JSON.stringify(o.world),before)});
test('handler opening a modal cannot publish after suspension',()=>{const o=fixture();bind(o,()=>{o.modalSuspended=true})();assert.equal(o.world.cameras.input.cursor,24);assert.equal(o.inputDepth,0)});
test('ordinary unsuspended pointer preserves handler and publication order',()=>{const o=fixture(),events=[];o.advanceInputTime=()=>events.push('drain');o.navigationButtons=()=>{events.push('publish');return 0};bind(o,e=>{events.push('handler');track(o)(e)})();assert.deepEqual(events,['drain','handler','publish']);assert.equal(o.world.cameras.input.cursor,25);assert.equal(o.world.cameras.input.pointer.x,400)});
test('resume permits a fresh input, not ignored modal pointer',()=>{const o=fixture();const send=bind(o,track(o));o.modalSuspended=true;send();o.modalSuspended=false;send({clientX:12});assert.equal(o.world.cameras.input.cursor,25);assert.equal(o.world.cameras.input.pointer.x,12)});
test('unsuspended listener failure still propagates and restores depth',()=>{const o=fixture();const failure={};assert.throws(bind(o,()=>{throw failure}),e=>e===failure);assert.equal(o.inputDepth,0);assert.equal(o.world.cameras.input.cursor,25)});
test('disposed listener still refuses callbacks',()=>{const o=fixture();o.disposed=true;bind(o,()=>assert.fail())();assert.equal(o.world.cameras.input.cursor,24)});

const modalBody=s.slice(s.indexOf('  setModalSuspended(suspended: boolean) {'),s.indexOf('  uiTimer =')).replace('suspended: boolean','suspended');
const advanceBody=s.slice(s.indexOf('  advanceInputTime(timestamp ='),s.indexOf('  private publishCameraInput() {'));
const cancelBody=r.slice(r.indexOf('export function cancelPointerGesture('),r.indexOf('export function installInputListeners(')).replace('export function','function').replace('scene: GameScene, pointerId?: number','scene, pointerId');
const keyup=r.slice(r.indexOf("  scene.listen(window, 'keyup'"),r.indexOf('  const trackNavigation =')).replace('e as KeyboardEvent','e');
const lifecycle=r.slice(r.indexOf('  const pause = () => {'),r.indexOf("  scene.listen(minimap, 'pointerdown'"));
assert.ok(modalBody.startsWith('  setModalSuspended('));assert.ok(advanceBody.startsWith('  advanceInputTime('));assert.ok(cancelBody.startsWith('function cancelPointerGesture('));assert.ok(lifecycle.startsWith('  const pause'));
function lifecycleFixture(){
 const events=[],listeners={},win={},doc={hidden:false};
 const C=runInNewContext(`${cancelBody};(class Subject { ${publish}\n${listen}\n${modalBody}\n${advanceBody} })`,{performance:{now:()=>100},advanceGame:(w,c,seconds)=>events.push(['advance',seconds]),previewGroundZoom:()=>events.push(['preview']),cancelTooltipInspection:()=>events.push(['inspection'])});
 const o=new C();Object.assign(o,{disposed:false,started:true,modalSuspended:false,inputDepth:0,disposeListeners:[],previous:0,gameClock:{},keys:new Set(['w','shift']),pointerGesture:{pointerId:7},pointerButtons:1,drag:{held:true},dragActive:{value:true},selectionOverlay:{visible:true},globeMotion:{dragging:true,velocity:{x:2,y:3}},world:{paused:false,cameras:{phase:'idle',elapsed:9,input:{time:9,cursor:24,buttons:1,pointer:{x:1,y:2,buttons:1}}}},renderer:{domElement:{hasPointerCapture:id=>id===7,releasePointerCapture:id=>events.push(['release',id])}},neutralCursor:{reset:()=>events.push(['neutral'])},updateTooltipFrame:()=>events.push(['tooltip']),updateUnitsFrame:()=>events.push(['units']),cancelNearbyFollowers:()=>events.push(['nearby']),cancelTooltipInspection:()=>events.push(['cancelInspection']),navigationButtons:()=>0,captureCamera:()=>events.push(['camera']),fpsGraph:{reset:message=>events.push(['fps',message])},onChange:()=>events.push(['change'])});
 Object.defineProperty(o,'navigationPointer',{get(){return this.world.cameras.input.pointer},set(v){this.world.cameras.input.pointer=v}});
 for(const target of [win,doc]){target.addEventListener=(name,fn)=>{listeners[name]=fn};target.removeEventListener=()=>{}}
 const actualCancel=runInNewContext(`${cancelBody};cancelPointerGesture`,{cancelTooltipInspection:()=>events.push(['pause-cancel'])});
 runInNewContext(`(scene)=>{${keyup}\n${lifecycle}}`,{window:win,document:doc,cancelPointerGesture:actualCancel})(o);
 return {o,events,listeners,doc};
}
test('actual modal lifecycle clears held input, freezes events and resumes without stale catch-up',()=>{
 const {o,events,listeners,doc}=lifecycleFixture();o.setModalSuspended(true);
 assert.equal(o.modalSuspended,true);assert.equal(o.previous,null);assert.equal(o.keys.size,0);assert.equal(o.pointerGesture,null);assert.equal(o.pointerButtons,0);assert.equal(o.drag,null);assert.equal(o.dragActive.value,false);assert.equal(o.selectionOverlay.visible,false);assert.equal(o.globeMotion.dragging,false);assert.equal(o.navigationPointer,null);assert.equal(o.world.cameras.input.buttons,0);assert.ok(events.some(e=>e[0]==='release'&&e[1]===7));assert.equal(events.filter(e=>e[0]==='advance').length,1);
 assert.deepEqual(events.filter(e=>['advance','tooltip','units'].includes(e[0])).map(e=>e[0]),['advance','tooltip','units']);
 const frozen=JSON.stringify(o.world),before=events.length;
 bind(o,track(o))();listeners.keyup({timeStamp:199,key:'Shift',code:'ShiftLeft',ctrlKey:false,shiftKey:true});listeners.blur({timeStamp:200});doc.hidden=true;listeners.visibilitychange({timeStamp:201});
 assert.equal(JSON.stringify(o.world),frozen);assert.equal(o.keys.size,0);assert.equal(events.length,before);
 o.setModalSuspended(false);assert.equal(events.filter(e=>e[0]==='units').length,1);assert.equal(o.previous,null);assert.equal(o.navigationPointer,null);bind(o,track(o))({clientX:42});assert.equal(o.navigationPointer.x,42);assert.equal(o.world.cameras.input.cursor,25);assert.equal(events.filter(e=>e[0]==='advance').length,1);
});
test('actual unsuspended blur and hidden visibility preserve pause/reset callbacks',()=>{
 for(const name of ['blur','visibilitychange']){const {o,events,listeners,doc}=lifecycleFixture();doc.hidden=true;listeners[name]({timeStamp:30});assert.equal(o.world.paused,true);assert.equal(o.previous,null);assert.equal(o.keys.size,0);assert.equal(o.pointerGesture,null);assert.ok(events.some(e=>e[0]==='fps'));assert.ok(events.some(e=>e[0]==='change'));assert.equal(o.world.cameras.input.cursor,25)}
});
