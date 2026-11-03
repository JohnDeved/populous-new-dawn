import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
function extract(path, names, bindings) {
  const source=fs.readFileSync(new URL(path,import.meta.url),'utf8')
  const tree=ts.createSourceFile(path,source,ts.ScriptTarget.Latest,true)
  const nodes=tree.statements.filter(n=>ts.isFunctionDeclaration(n)&&names.includes(n.name?.text))
  assert.equal(nodes.length,names.length)
  const js=ts.transpileModule(nodes.map(n=>n.getText(tree).replace(/^export /,'')).join('\n'),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText
  return new Function(...Object.keys(bindings),js+';return {'+names.join(',')+'}')(...Object.values(bindings))
}
function fixture(kind,retire=false,missing=false) {
  const calls=[], point={id:7,x:2,y:3}, people=missing?[]:[point]
  const world={inputMask:0,units:[],vehicles:people,manaWorld:{gameFlags:0},castingTribes:[{flags:0}],cameras:{},mode:'old'}
  const bindings={hudTaskPeople:()=>people,hudPeople:()=>people,hudTransports:()=>people,
    focusTaskFollower:()=>7,focusHudPerson:()=>7,focusTransport:()=>7,browserPosition:p=>p,
    selectFollowerTask:(...a)=>calls.push(['task',...a]),selectFollowers:(...a)=>calls.push(['followers',...a]),
    selectFollowerTransport:(...a)=>calls.push(['transport',...a])}
  const helpers=extract('../app/scene-input-runtime.ts',['chooseFollowers','chooseTransport'],bindings)
  const {focus}=extract('../app/scene-camera-runtime.ts',['focus'],{
    withSimulationCamera:(_c,cb)=>cb(),nativePosition:(_w,p)=>p,
    requestCameraFocus:(...a)=>calls.push(['request',...a])})
  const scene={world,disposed:false,overviewStage:0,overviewActive:false,hudFocus:[],hudTaskFocus:[],hudTransportFocus:[],cameraPosition:{x:0,y:0},cameraMotion:{},tooltip:{draw:1},
    advanceInputTime(){calls.push(['drain']);if(retire)this.disposed=true},
    captureCamera(value){calls.push(['capture',value])},cancelOverview(){calls.push(['cancelOverview'])},
    focus(p,options){calls.push(['focus',p,options]);focus(this,p,options)},
    objectPanels:{open(id){calls.push(['open',id])}},onChange(){calls.push(['change'])}}
  const modifiers={shiftKey:false,ctrlKey:false}
  const run=(focused=true)=>kind==='vehicle'?helpers.chooseTransport(scene,1,2,modifiers,focused):helpers.chooseFollowers(scene,2,modifiers,focused,kind==='task'?1:undefined)
  return {calls,scene,run,point,world,modifiers}
}
for(const kind of ['follower','task','vehicle']) {
  test(`${kind}: retirement during real focus stops panel and publication`,()=>{
    const {calls,scene,run,point}=fixture(kind,true)
    assert.equal(run(),undefined)
    assert.equal(scene.disposed,true)
    assert.deepEqual(calls,[['focus',point,{animate:true}],['drain']])
  })
  test(`${kind}: live focus retains camera, panel and publication order`,()=>{
    const {calls,scene,run,point}=fixture(kind)
    assert.equal(run(),undefined)
    assert.deepEqual(calls,[['focus',point,{animate:true}],['drain'],['capture',true],['cancelOverview'],['request',scene.cameraMotion,scene.cameraPosition,{...point,angle:-1},false],['open',7],['change']])
    assert.equal(scene.world.mode,null)
    assert.equal(scene.tooltip.draw,0)
  })
  test(`${kind}: missing target publishes without focus or panel`,()=>{
    const {calls,run}=fixture(kind,false,true)
    run();assert.deepEqual(calls,[['change']])
  })
  test(`${kind}: ordinary selection drains input without acquiring focus`,()=>{
    const {calls,run,world,scene}=fixture(kind)
    run(false)
    const selection=kind==='vehicle'?['transport',world,1,2,scene.cameraPosition,'single']:kind==='task'?['task',world,2,1,scene.cameraPosition,'single']:['followers',world,2,scene.cameraPosition,'single']
    assert.deepEqual(calls,[['drain'],selection,['change']])
  })
}
