import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
function method(path,name,bindings={}) {
 const text=fs.readFileSync(new URL(path,import.meta.url),'utf8'),tree=ts.createSourceFile(path,text,ts.ScriptTarget.Latest,true)
 const nodes=tree.statements.filter(ts.isClassDeclaration).flatMap(c=>c.members).filter(n=>ts.isMethodDeclaration(n)&&n.name.getText(tree)===name)
 assert.equal(nodes.length,1)
 const js=ts.transpileModule('class Owner {'+nodes[0].getText(tree)+'}',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText
 return new Function(...Object.keys(bindings),js+`;return Owner.prototype.${name}`)(...Object.values(bindings))
}
function fixture(action='select',{drain=()=>{},sound=()=>{},unload=true,blocked=false}={}) {
 const trace=[],person={id:7,tribe:0},vehicle={id:3,active:true},world={vehicles:[vehicle],cameras:{phase:'idle'},inputMask:blocked?1:0,order:'old'}
 const advance=method('../app/scene.ts','advanceInputTime',{advanceGame(w,c,seconds){trace.push(['drain',w.order,seconds]);drain(scene,vehicle)},previewGroundZoom(){trace.push(['preview'])}})
 const scene={disposed:false,started:true,inputDepth:0,previous:0,modalSuspended:false,overviewActive:false,world,gameClock:{},
 advanceInputTime(){return advance.call(this,100)},onSound(cue){trace.push(['sound',cue]);sound(this)},onChange(){trace.push(['change'])}}
 const run=method('../app/object-panels.ts','vehicleAction',{
 liveVehiclePassengers:()=>[{person}],vehiclePanelInput:()=>action,canUnloadVehicle:()=>true,
 selectVehiclePassenger(w,v,id,all){trace.push(['select',id,all]);w.order='selected'},
 unloadLiveVehicle(w,v){trace.push(['unload']);if(unload)w.order='unloaded';return unload}
 })
 const panel={scene,open(...args){trace.push(['open',...args])}}
 return {scene,world,vehicle,trace,run:()=>run.call(panel,3,7,action==='unload',action==='focus',true)}
}
for(const action of ['select','unload']) test(`${action}: catch-up observes old order before command mutation`,()=>{
 const {trace,world,run}=fixture(action);run()
 assert.deepEqual(trace[0],['drain','old',0.1]);assert.deepEqual(trace[1],['preview'])
 assert.equal(world.order,action==='select'?'selected':'unloaded')
})
test('vehicle removed by elapsed simulation is revalidated before command',()=>{
 const {trace,world,run}=fixture('select',{drain:(_s,v)=>{v.active=false}});run()
 assert.deepEqual(trace,[['drain','old',0.1],['preview']]);assert.equal(world.order,'old')
})
test('retirement during input drain prevents commands and callbacks',()=>{
 const {trace,world,run}=fixture('select',{drain:s=>{s.disposed=true}});run()
 assert.deepEqual(trace,[['drain','old',0.1]]);assert.equal(world.order,'old')
})
test('retirement during sound prevents later publication',()=>{
 const {trace,run}=fixture('select',{sound:s=>{s.disposed=true}});run()
 assert.deepEqual(trace.filter(x=>!['drain','preview'].includes(x[0])),[['select',7,true],['sound',0x6a]])
})
for(const action of ['select','unload','focus']) test(`${action}: live command effects and callback order preserved`,()=>{
 const {trace,run}=fixture(action);run()
 const expected=action==='focus'?[['open',7,true]]:[action==='select'?['select',7,true]:['unload'],['sound',0x6a],['change']]
 assert.deepEqual(trace.filter(x=>!['drain','preview'].includes(x[0])),expected)
})
test('blocked input keeps command leaves untouched',()=>{
 const {trace,world,run}=fixture('select',{blocked:true});run()
 assert.deepEqual(trace.filter(x=>!['drain','preview'].includes(x[0])),[]);assert.equal(world.order,'old')
})
test('failed unload keeps sound and change callbacks untouched',()=>{
 const {trace,world,run}=fixture('unload',{unload:false});run()
 assert.deepEqual(trace.filter(x=>!['drain','preview'].includes(x[0])),[['unload']]);assert.equal(world.order,'old')
})
