import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
function tree(path) {return ts.createSourceFile(path,fs.readFileSync(new URL('../app/'+path,import.meta.url),'utf8'),ts.ScriptTarget.Latest,true,path.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS)}
function execute(source,bindings,tail) {const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;return new Function(...Object.keys(bindings),js+';'+tail)(...Object.values(bindings))}
const runtime=tree('scene-input-runtime.ts'), page=tree('page.tsx'), sceneTree=tree('scene.ts')
const names=['chooseFollowers','chooseTransport']
const runtimeNodes=runtime.statements.filter(n=>ts.isFunctionDeclaration(n)&&names.includes(n.name?.text));assert.equal(runtimeNodes.length,2)
let caller;function visit(n){if(ts.isFunctionDeclaration(n)&&n.name?.text==='followerControl'){assert.equal(caller,undefined);caller=n}ts.forEachChild(n,visit)}visit(page);assert.ok(caller)
const sceneClass=sceneTree.statements.find(n=>ts.isClassDeclaration(n)&&n.name?.text==='GameScene')
const methods=sceneClass.members.filter(n=>ts.isMethodDeclaration(n)&&['chooseFollowers','chooseTransport','advanceInputTime','listen'].includes(n.name.getText(sceneTree)));assert.equal(methods.length,4)
function fixture(kind,{retire=false,masked=false,disabled=false}={}) {
 const log=[], world={selected:[],inputMask:0,units:[],manaWorld:{gameFlags:0},castingTribes:[{flags:0}],cameras:{phase:'idle'}}
 const select=(type)=>(...args)=>{log.push(['select',type,args.at(-1)]);world.selected=[7]}
 const helpers=execute(runtimeNodes.map(n=>n.getText(runtime).replace(/^export /,'')).join('\n'),{selectFollowers:select('follower'),selectFollowerTask:select('task'),selectFollowerTransport:select('vehicle')},'return {chooseFollowers,chooseTransport}')
 const Scene=execute('class Scene {'+methods.map(n=>n.getText(sceneTree)).join('\n')+'}',{...helpers,performance:{now:()=>100},advanceGame(w,_clock,seconds){log.push(['drain',seconds,[...w.selected]]);if(retire)scene.disposed=true;if(masked)w.inputMask=1},previewGroundZoom(){}},'return Scene')
 const scene=new Scene();Object.assign(scene,{world,disposed:false,started:true,inputDepth:0,previous:0,modalSuspended:false,gameClock:{},overviewStage:0,overviewActive:false,cameraPosition:{x:0,y:0},disposeListeners:[],onChange(){log.push(['change'])},publishCameraInput(){}})
 const followerPress={current:null}, engine={current:scene}
 const followerControl=execute(caller.getText(page),{engine,followerPress},'return followerControl')
 const controls=followerControl(2,kind==='task'?1:undefined,kind==='vehicle'?1:undefined)
 const target={disabled,blur(){log.push(['blur'])}},event={button:0,ctrlKey:true,shiftKey:false,detail:1,currentTarget:target,timeStamp:90}
 let windowCallback;scene.listen({addEventListener(_n,cb){windowCallback=cb},removeEventListener(){}},'pointerup',()=>log.push(['window']))
 return {log,world,scene,controls,event,windowCallback}
}
for(const kind of ['follower','task','vehicle']) {
 test(`${kind}: React Ctrl-release selection follows elapsed work before bubbling window drain`,()=>{
  const f=fixture(kind);f.controls.onPointerDown(f.event);f.controls.onPointerUp(f.event);f.windowCallback(f.event)
  assert.deepEqual(f.log,[['drain',.1,[]],['select',kind,'five'],['change'],['blur'],['drain',0,[7]],['window']])
  assert.equal(f.scene.previous,100)
 })
 test(`${kind}: detail-zero accessible click drains before single selection`,()=>{
  const f=fixture(kind);f.controls.onClick({...f.event,ctrlKey:false,detail:0})
  assert.deepEqual(f.log,[['drain',.1,[]],['select',kind,'single'],['change']])
 })
 test(`${kind}: retirement during direct HUD drain cancels selection/publication`,()=>{
  const f=fixture(kind,{retire:true});f.controls.onClick({...f.event,ctrlKey:false,detail:0})
  assert.deepEqual(f.log,[['drain',.1,[]]]);assert.deepEqual(f.world.selected,[])
 })
 test(`${kind}: mask activated by elapsed work is observed before selection`,()=>{
  const f=fixture(kind,{masked:true});f.controls.onClick({...f.event,ctrlKey:false,detail:0})
  assert.deepEqual(f.log,[['drain',.1,[]]]);assert.deepEqual(f.world.selected,[])
 })
 test(`${kind}: disabled React control remains no-op`,()=>{
  const f=fixture(kind,{disabled:true});f.controls.onClick({...f.event,ctrlKey:false,detail:0});assert.deepEqual(f.log,[])
 })
}
