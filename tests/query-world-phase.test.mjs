import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {queryWorldOperation,captureQueryWorld,assertQueryWorld} from '../scripts/local-render/query-world-phase.mjs'

const fresh=()=>({paused:true,turn:84,time:7,inputMask:0,selected:[],units:[{id:30,nested:{hp:100}}],random:{seed:7},cosmeticRandom:{seed:8},unknownFuture:{keep:9},
  worshipAcquisition:{controllers:{building:null,spell:null,companion:null,pulse:null,drawCommands:[]},requests:[],previousDrawCommands:[],
    clock:{elapsed:1000,nextVisit:1025,lastVisit:1000,limiter:0,normalRate:40}}})
function dialog({pause=true,modal=true,open=true,label='Game menu',connected=true}={}) {
  return {open,isConnected:connected,hasAttribute:key=>pause&&key==='data-original-pause-menu',matches:s=>s===':modal'&&modal,
    getAttribute:key=>key==='aria-label'?label:null}
}
export async function fixture(fn,world=fresh()) {
  const old=Object.fromEntries(['window','document','performance'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]))
  const env={world,now:2000,dialogs:[],shadow:[],hidden:false};env.scene={world,previous:1990,modalSuspended:false}
  Object.defineProperty(globalThis,'window',{configurable:true,value:{testStore:{getWorld:()=>env.world},testSceneRef:{get current(){return env.scene}}}})
  Object.defineProperty(globalThis,'performance',{configurable:true,value:{now:()=>env.now}})
  Object.defineProperty(globalThis,'document',{configurable:true,value:{get visibilityState(){return env.hidden?'hidden':'visible'},
    querySelectorAll:s=>s==='dialog'?env.dialogs:s==='*'?env.shadow:[]}})
  env.capture=()=>{const state=queryWorldOperation({kind:'capture'});assert.equal(state.captureObservation.valid,true,state.captureObservation.reason);return state}
  env.observe=(state,phase='ordinary')=>queryWorldOperation({kind:'observe',state,phase})
  env.advance=(elapsed,next,last)=>{Object.assign(env.world.worshipAcquisition.clock,{elapsed,nextVisit:next,lastVisit:last});env.now+=100}
  env.menu=()=>{env.scene.modalSuspended=true;env.scene.previous=null;env.dialogs=[dialog()]}
  env.close=()=>{env.scene.modalSuspended=false;env.dialogs=[]}
  try{return await fn(env)}finally{for(const k of Object.keys(old)){if(old[k])Object.defineProperty(globalThis,k,old[k]);else delete globalThis[k]}}
}
const pass=result=>{assert.equal(result.ok,true,result.reason);return result}
const fail=result=>{assert.equal(result.ok,false);return result}

test('original complete setup string and owner references are immutable',()=>fixture(e=>{
  const state=e.capture(),expected=JSON.stringify(e.world);assert.equal(state.setup,expected)
  assert.throws(()=>{state.setup='replaced'},TypeError);assert.throws(()=>{state.world={}},TypeError)
  pass(e.observe(state));assert.equal(state.setup,expected)
}))
test('ordinary pause permits only valid source clock motion and never mutates World',()=>fixture(e=>{
  const state=e.capture();e.advance(1074,1075,1050);const actual=JSON.stringify(e.world)
  const result=pass(e.observe(state));assert.equal(result.guarantee,'all-World-except-three-source-clock-fields');assert.equal(JSON.stringify(e.world),actual)
}))
test('cadence derives from normalRate rather than observed25ms',()=>fixture(e=>{
  Object.assign(e.world.worshipAcquisition.clock,{normalRate:50,elapsed:1000,nextVisit:1020,lastVisit:1000})
  const state=e.capture();e.advance(1059,1060,1040);pass(e.observe(state))
}))
test('source normalRate clamp/truncation is preserved',()=>fixture(e=>{
  Object.assign(e.world.worshipAcquisition.clock,{normalRate:100.5,elapsed:1000,nextVisit:1008,lastVisit:992})
  const state=e.capture();e.advance(1039,1040,1024);pass(e.observe(state))
}))
for(const [name,mutate] of [
  ['nested unit',w=>w.units[0].nested.hp--],['simulation turn',w=>w.turn++],['simulation time',w=>w.time++],
  ['game RNG',w=>w.random.seed++],['cosmetic RNG',w=>w.cosmeticRandom.seed++],['input mask',w=>w.inputMask=1],
  ['selection',w=>w.selected.push(30)],['future unknown field',w=>w.unknownFuture.keep++],['new World field',w=>w.newField=1],
  ['missing World field',w=>delete w.time],['new clock field',w=>w.worshipAcquisition.clock.extra=1],
  ['normal rate',w=>w.worshipAcquisition.clock.normalRate=41],['limiter',w=>w.worshipAcquisition.clock.limiter=4],
  ['queued request',w=>w.worshipAcquisition.requests.push(1)],['draw commands',w=>w.worshipAcquisition.controllers.drawCommands.push({id:1})],
  ['previous draw output',w=>w.worshipAcquisition.previousDrawCommands.push({id:1})],['controller initialization',w=>w.worshipAcquisition.controllers.companion={active:false,step:1}],
])test(`ordinary pause rejects ${name}`,()=>fixture(e=>{const state=e.capture(),before=state.previousClock;mutate(e.world);fail(e.observe(state));assert.equal(state.previousClock,before);assert.equal(state.menu,null)}))
for(const key of ['elapsed','nextVisit','lastVisit'])for(const value of [null,'1000',-1,Infinity,NaN])
  test(`clock ${key} rejects ${String(value)}`,()=>fixture(e=>{const state=e.capture();e.world.worshipAcquisition.clock[key]=value;fail(e.observe(state))}))
test('clock cannot go backwards between successful observations',()=>fixture(e=>{const state=e.capture();e.advance(1074,1075,1050);pass(e.observe(state));e.advance(1049,1050,1025);fail(e.observe(state))}))
test('finite jump cannot exceed available source RAF elapsed time',()=>fixture(e=>{const state=e.capture();e.advance(99999,100000,99975);fail(e.observe(state))}))
test('visit phase cannot shift off the original cadence',()=>fixture(e=>{const state=e.capture();e.advance(1048,1049,1024);fail(e.observe(state))}))
test('unsettled overdue visit is rejected',()=>fixture(e=>{const state=e.capture();e.world.worshipAcquisition.clock.elapsed=1026;fail(e.observe(state))}))
test('elapsed preceding last visit is rejected',()=>fixture(e=>{const state=e.capture();e.world.worshipAcquisition.clock.elapsed=999;fail(e.observe(state))}))
test('idle fixture must hold at baseline, including inactive retained controllers',()=>fixture(e=>{e.world.worshipAcquisition.controllers.spell={active:false};assert.throws(e.capture,/idle-acquisition/)}))
test('missing prior RAF timestamp is not replaced with invented timing',()=>fixture(e=>{e.scene.previous=null;assert.throws(e.capture,/RAF timestamp/)}))
test('observer time cannot regress',()=>fixture(e=>{const state=e.capture();e.now--;fail(e.observe(state))}))
test('Menu entry installs a new full baseline only after transition invariants pass',()=>fixture(e=>{
  const state=e.capture(),original=state.setup;e.advance(1074,1075,1050);e.menu();const current=JSON.stringify(e.world)
  const result=pass(e.observe(state,'enter-menu'));assert.equal(result.menuSnapshotCaptured,true);assert.equal(state.menu,current);assert.equal(state.setup,original)
  assert.equal(pass(e.observe(state,'menu')).guarantee,'full-serialized-World-equality')
}))
test('entry cannot absorb a simulation mutation',()=>fixture(e=>{const state=e.capture();e.world.units[0].nested.hp--;e.menu();fail(e.observe(state,'enter-menu'));assert.equal(state.menu,null);assert.equal(state.mode,'ordinary')}))
test('duplicate/reentrant entry cannot replace the Menu baseline',()=>fixture(e=>{const state=e.capture();e.menu();pass(e.observe(state,'enter-menu'));const before=state.menu;e.world.time++;fail(e.observe(state,'enter-menu'));assert.equal(state.menu,before)}))
test('Menu observation is never an implicit entry',()=>fixture(e=>{const state=e.capture();e.menu();fail(e.observe(state,'menu'));assert.equal(state.menu,null)}))
for(const key of ['elapsed','nextVisit','lastVisit'])test(`Menu rejects any ${key} movement`,()=>fixture(e=>{const state=e.capture();e.menu();pass(e.observe(state,'enter-menu'));e.world.worshipAcquisition.clock[key]++;fail(e.observe(state,'menu'));fail(e.observe(state,'before-menu-close'))}))
test('Menu rejects nested non-clock mutation',()=>fixture(e=>{const state=e.capture();e.menu();pass(e.observe(state,'enter-menu'));e.world.units[0].nested.hp--;fail(e.observe(state,'menu'))}))
test('Menu exit requires immediate full check and positive ordinary owner',()=>fixture(e=>{
  const state=e.capture();e.menu();pass(e.observe(state,'enter-menu'));const baseline=state.menu
  e.close();fail(e.observe(state));assert.equal(state.menu,baseline)
  e.scene.modalSuspended=true;e.dialogs=[state.menuOwner];pass(e.observe(state,'before-menu-close'))
  fail(e.observe(state));assert.equal(state.menu,baseline)
  e.close();pass(e.observe(state));assert.equal(state.menu,null);assert.equal(state.menuOwner,null)
  e.advance(1049,1050,1025);e.menu();pass(e.observe(state,'enter-menu'));assert.notEqual(state.menu,baseline)
}))
test('a duplicate close-check does not silently refresh state',()=>fixture(e=>{const state=e.capture();e.menu();pass(e.observe(state,'enter-menu'));pass(e.observe(state,'before-menu-close'));fail(e.observe(state,'before-menu-close'))}))
for(const [name,change] of [
  ['missing modal',e=>e.dialogs=[]],['not top-layer',e=>e.dialogs[0]=dialog({modal:false})],['closed',e=>e.dialogs[0]=dialog({open:false})],
  ['wrong label',e=>e.dialogs[0]=dialog({label:'Other'})],['wrong owner',e=>e.dialogs[0]=dialog({pause:false})],
  ['duplicate pause',e=>e.dialogs.push(dialog())],['other modal',e=>e.dialogs.push(dialog({pause:false}))],
  ['detached Menu',e=>e.dialogs[0]=dialog({connected:false})],['Scene not suspended',e=>e.scene.modalSuspended=false],
  ['different Scene',e=>e.scene={...e.scene}],['different World',e=>{e.world=structuredClone(e.world);e.scene.world=e.world}],
  ['Scene World mismatch',e=>e.scene.world={}],['unpaused',e=>e.world.paused=false],['hidden document',e=>e.hidden=true],
])test(`Menu rejects ${name}`,()=>fixture(e=>{const state=e.capture();e.menu();change(e);fail(e.observe(state,'enter-menu'));assert.equal(state.menu,null)}))
test('replaced Menu cannot inherit the old entry snapshot',()=>fixture(e=>{const state=e.capture();e.menu();pass(e.observe(state,'enter-menu'));e.dialogs=[dialog()];fail(e.observe(state,'menu'))}))
test('open-shadow modal ambiguity is included in the atomic owner witness',()=>fixture(e=>{
  const state=e.capture();e.menu();e.shadow=[{shadowRoot:{querySelectorAll:s=>s==='dialog'?[dialog({pause:false})]:[]}}];fail(e.observe(state,'enter-menu'))
}))
test('ordinary phase rejects mounted or modal owner ambiguity',()=>fixture(e=>{const state=e.capture();e.dialogs=[dialog({open:false,modal:false})];fail(e.observe(state))}))
test('all non-exempt synthetic leaves are checked, not a curated projection',()=>fixture(e=>{
  const original=structuredClone(e.world),paths=[]
  function leaves(value,path=[]){if(value&&typeof value==='object'){for(const key of Object.keys(value))leaves(value[key],[...path,key])}else paths.push(path)}
  leaves(original)
  const exemptions=new Set(['worshipAcquisition/clock/elapsed','worshipAcquisition/clock/nextVisit','worshipAcquisition/clock/lastVisit'])
  for(const path of paths){if(exemptions.has(path.join('/')))continue;e.world=structuredClone(original);e.scene.world=e.world;const state=e.capture();let node=e.world;for(const key of path.slice(0,-1))node=node[key];node[path.at(-1)]='unexpected-change';fail(e.observe(state))}
}))
test('real wrapper invokes the exact synchronous browser operation and preserves complete mismatch',()=>fixture(async e=>{
  const calls=[];const page={evaluateHandle:async(fn,arg)=>{calls.push(fn);const state=fn(arg);return {state,evaluate:async inspect=>inspect(state),dispose:async()=>{}}},evaluate:async(fn,arg)=>{calls.push(fn);return fn({...arg,state:arg.state.state})}}
  const state=await captureQueryWorld(page);await assertQueryWorld(page,state,'ordinary');e.world.units[0].nested.hp--
  await assert.rejects(assertQueryWorld(page,state,'ordinary'),error=>error.actual===JSON.stringify(e.world)&&error.expected===state.state.setup&&error.queryWorldWitness.sameWorld)
  assert.ok(calls.every(fn=>fn===queryWorldOperation))
}))
test('equal raw strings do not bypass phase ownership failure',()=>fixture(async e=>{const state=e.capture();e.hidden=true;const page={evaluate:async(fn,arg)=>fn(arg)};await assert.rejects(assertQueryWorld(page,state,'ordinary'),error=>error.actual===error.expected&&/owner/.test(error.message))}))
test('falsy transport failures remain primary without a new read',async()=>{for(const value of [undefined,null,false,0,'']){let calls=0,seen=false;try{await assertQueryWorld({evaluate:async()=>{calls++;throw value}},null,'ordinary')}catch(error){seen=true;assert.equal(error,value)}assert.ok(seen);assert.equal(calls,1)}})


test('serialized key-order changes are not hidden by the three-value normalization',()=>fixture(e=>{const state=e.capture(),time=e.world.time;delete e.world.time;e.world.time=time;fail(e.observe(state))}))
test('nonfinite performance time cannot establish a baseline',()=>fixture(e=>{e.now=NaN;assert.throws(e.capture,/RAF timestamp/)}))

test('invalid capture retains original bounded observations before asserting and disposes its handle',()=>fixture(async e=>{
  e.world.worshipAcquisition.requests=[1];let captures=0,disposed=0,retained
  const page={evaluateHandle:async(fn,arg)=>{captures++;const state=fn(arg);return {evaluate:async inspect=>inspect(state),dispose:async()=>{disposed++}}}}
  await assert.rejects(captureQueryWorld(page,{publish:observation=>{retained=observation}}),/idle-acquisition/)
  assert.equal(captures,1);assert.equal(disposed,1);assert.equal(retained.idle.requests,1);assert.equal(retained.clock.elapsed.value,1000);assert.equal(retained.raf.previous.value,1990)
}))
test('failed capture observation read still disposes independently',async()=>{let disposed=0;const primary=new Error('read failed');await assert.rejects(captureQueryWorld({evaluateHandle:async()=>({evaluate:async()=>{throw primary},dispose:async()=>{disposed++}})}),error=>error===primary);assert.equal(disposed,1)})
test('falsy or frozen capture publication failures remain primary through failing disposal',()=>fixture(async e=>{
  for(const primary of [null,undefined,false,0,'',Object.freeze(new Error('frozen primary'))]){
    let disposed=0,seen=false,secondarySeen=false
    const page={evaluateHandle:async(fn,arg)=>{const state=fn(arg);return {evaluate:async inspect=>inspect(state),dispose:async()=>{disposed++;throw Error('dispose failed')}}}}
    try{await captureQueryWorld(page,{publish:()=>{throw primary},secondary:(error,original)=>{secondarySeen=true;assert.equal(original,primary);throw Error('secondary failed')}})}catch(error){seen=true;assert.equal(error,primary)}
    assert.ok(seen&&secondarySeen);assert.equal(disposed,1)
  }
}))

for(const stopAt of [1,2,3,4])test(`capture checks live deadline at boundary ${stopAt} and owns late handles`,()=>fixture(async e=>{
  let checks=0,created=0,read=0,published=0,disposed=0;const primary=new Error('deadline')
  const page={evaluateHandle:async(fn,arg)=>{created++;const state=fn(arg);return {evaluate:async inspect=>{read++;return inspect(state)},dispose:async()=>{disposed++}}}}
  await assert.rejects(captureQueryWorld(page,{check:()=>{if(++checks===stopAt)throw primary},publish:()=>{published++}}),error=>error===primary)
  assert.equal(created,stopAt===1?0:1);assert.equal(disposed,created);assert.equal(read,stopAt<3?0:1);assert.equal(published,stopAt<4?0:1)
}))

test('canonical native UI checks execute and bind the phase helper and its portable suite',()=>{
  const registry=JSON.parse(readFileSync(new URL('../engineering/checks.json',import.meta.url),'utf8'))
  const entry=registry.checks.find(value=>value.id==='native-ui-evidence-tests')
  assert.equal(entry.args.filter(value=>value==='tests/query-world-phase.test.mjs').length,1)
  for(const key of ['inputs','triggerPaths'])for(const file of ['scripts/local-render/query-world-phase.mjs','tests/query-world-phase.test.mjs','app/game-clock.ts','app/worship-acquisition.ts','app/worship-acquisition-runtime.ts','app/scene.ts'])assert.ok(entry[key].includes(file),`${key} must bind ${file}`)
})

test('ordinary exit cannot catch up a frozen five-second Menu interval',()=>fixture(e=>{
  const state=e.capture();e.menu();pass(e.observe(state,'enter-menu'));e.now=7000
  pass(e.observe(state,'before-menu-close'));e.close()
  Object.assign(e.world.worshipAcquisition.clock,{elapsed:6000,nextVisit:6025,lastVisit:6000})
  fail(e.observe(state));assert.equal(state.mode,'menu');assert.ok(state.closeChecked)
}))
test('a later ordinary read cannot consume a previously frozen Menu interval',()=>fixture(e=>{
  const state=e.capture();e.menu();pass(e.observe(state,'enter-menu'));e.now=7000
  pass(e.observe(state,'before-menu-close'));e.close();pass(e.observe(state));e.now++
  Object.assign(e.world.worshipAcquisition.clock,{elapsed:6000,nextVisit:6025,lastVisit:6000})
  fail(e.observe(state));assert.equal(state.activeClockTime,7000);assert.equal(state.activeClockElapsed,1000)
}))
test('valid post-close clock advances use the new resume-time bound',()=>fixture(e=>{
  const state=e.capture();e.menu();pass(e.observe(state,'enter-menu'));e.now=7000
  pass(e.observe(state,'before-menu-close'));e.close();e.now=7030
  Object.assign(e.world.worshipAcquisition.clock,{elapsed:1029,nextVisit:1050,lastVisit:1025});pass(e.observe(state))
  e.now=7060;Object.assign(e.world.worshipAcquisition.clock,{elapsed:1059,nextVisit:1075,lastVisit:1050});pass(e.observe(state))
}))
test('initial ordinary reads preserve the actual pre-snapshot RAF tail allowance',()=>fixture(e=>{
  const state=e.capture();e.now=2005;e.world.worshipAcquisition.clock.elapsed=1014
  pass(e.observe(state));assert.equal(state.activeClockTime,1990)
}))

test('the next Menu entry also cannot spend the old suspended interval',()=>fixture(e=>{
  const state=e.capture();e.menu();pass(e.observe(state,'enter-menu'));e.now=7000
  pass(e.observe(state,'before-menu-close'));e.close();pass(e.observe(state));e.now++
  Object.assign(e.world.worshipAcquisition.clock,{elapsed:6000,nextVisit:6025,lastVisit:6000});e.menu()
  fail(e.observe(state,'enter-menu'));assert.equal(state.menu,null);assert.equal(state.mode,'ordinary')
}))
