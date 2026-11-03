import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
const read=path=>ts.createSourceFile(path,fs.readFileSync(new URL('../app/'+path,import.meta.url),'utf8'),ts.ScriptTarget.Latest,true,path.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS)
const compile=s=>ts.transpileModule(s,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText
const page=read('page.tsx');let click
function walk(n){if(ts.isJsxOpeningElement(n)&&n.attributes.properties.some(a=>ts.isJsxAttribute(a)&&a.name.getText(page)==='aria-label'&&a.initializer?.text==='Select and focus shaman')){assert.equal(click,undefined);click=n.attributes.properties.find(a=>ts.isJsxAttribute(a)&&a.name.getText(page)==='onClick').initializer.expression}ts.forEachChild(n,walk)}walk(page);assert.ok(click)
const sceneTree=read('scene.ts'),owner=sceneTree.statements.find(n=>ts.isClassDeclaration(n)&&n.name?.text==='GameScene'),advance=owner.members.find(n=>ts.isMethodDeclaration(n)&&n.name.getText(sceneTree)==='advanceInputTime');assert.ok(advance)
const camera=read('scene-camera-runtime.ts'),focus=camera.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='focus');assert.ok(focus)
const storeTree=read('game-store.ts'),factory=storeTree.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='createGameStore'),returned=factory.body.statements.find(ts.isReturnStatement).expression,change=returned.properties.find(n=>ts.isPropertyAssignment(n)&&n.name.getText(storeTree)==='change');assert.ok(change)
function fixture({retire=false,replacePerson=false,noScene=false}={}) {
 const calls=[],old={id:7,kind:'shaman',team:'blue',x:1},fresh={id:8,kind:'shaman',team:'blue',x:2},world={units:[old],selected:[],cameras:{phase:'idle'},mode:'old'}
 const presentationToken=Symbol();const update=()=>calls.push(['update'])
 const storeFactory=new Function('world','update','presentationToken',compile('let inputClock; const change='+change.initializer.getText(storeTree))+';return {change,setClock(c){inputClock=c}}')
 const store=storeFactory(world,update,presentationToken)
 const advanceFn=new Function('advanceGame','previewGroundZoom','performance',compile('class S {'+advance.getText(sceneTree)+'}')+';return S.prototype.advanceInputTime')((w,_c,seconds)=>{calls.push(['drain',seconds,[...w.selected]]);if(replacePerson)w.units=[fresh];if(retire){scene.disposed=true;store.setClock(null)}},()=>{}, {now:()=>100})
 const focusFn=new Function('withSimulationCamera','nativePosition','requestCameraFocus',compile(focus.getText(camera).replace(/^export /,''))+';return focus')((_c,cb)=>cb(),(_w,p)=>p,(_m,_c,p)=>calls.push(['camera',p.id]))
 const scene={world,disposed:false,started:true,inputDepth:0,previous:0,modalSuspended:false,gameClock:{},cameraMotion:{},cameraPosition:{},tooltip:{draw:1},captureCamera(){},cancelOverview(){},advanceInputTime(){advanceFn.call(this)},focus(p,o){calls.push(['focus',p.id]);focusFn(this,p,o)}}
 if(!noScene)store.setClock({token:presentationToken,advance:()=>scene.advanceInputTime()})
 const bindings={world,shaman:old,engine:{current:noScene?null:scene},audio:{current:{cue:id=>calls.push(['cue',id])}},store,update,HOME:{id:0},isShaman:u=>u.kind==='shaman',select(w,mode){calls.push(['select',mode]);w.selected=w.units.filter(u=>u.kind==='shaman').map(u=>u.id)}}
 const run=new Function(...Object.keys(bindings),compile('const click='+click.getText(page))+';return click')(...Object.values(bindings))
 return {calls,world,run,old,fresh}
}
test('portrait drains elapsed old selection before selection/cue/focus',()=>{
 const f=fixture();f.run();assert.deepEqual(f.calls[0],['drain',.1,[]]);assert.deepEqual(f.world.selected,[7]);assert.equal(f.calls.filter(x=>x[0]==='update').length,1)
})
test('retirement during store input drain cancels entire portrait action',()=>{
 const f=fixture({retire:true});f.run();assert.deepEqual(f.calls,[['drain',.1,[]]]);assert.deepEqual(f.world.selected,[])
})
test('portrait focuses the current shaman after elapsed simulation replaces the person',()=>{
 const f=fixture({replacePerson:true});f.run();assert.deepEqual(f.world.selected,[8]);assert.ok(f.calls.some(x=>x[0]==='focus'&&x[1]===8));assert.equal(f.calls.some(x=>x[0]==='focus'&&x[1]===7),false)
})
test('live action preserves selection, one cue, camera focus and one publication',()=>{
 const f=fixture();f.run();assert.deepEqual(f.calls.filter(x=>!['drain','update'].includes(x[0])),[['select','shaman'],['cue',0x18],['focus',7],['camera',7]]);assert.equal(f.calls.filter(x=>x[0]==='update').length,1)
})
test('no presentation retains ordinary selection/cue/publication without camera',()=>{
 const f=fixture({noScene:true});f.run();assert.deepEqual(f.calls,[['select','shaman'],['cue',0x18],['update']])
})
