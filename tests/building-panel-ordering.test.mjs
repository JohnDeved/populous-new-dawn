import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
const parse=f=>ts.createSourceFile(f,fs.readFileSync(new URL('../app/'+f,import.meta.url),'utf8'),ts.ScriptTarget.Latest,true)
const source=parse('building-panels.ts'), sceneSource=parse('scene.ts')
const names=['createPanel','currentPanelBuilding','currentPanelOccupant']
const nodes=source.statements.filter(n=>ts.isFunctionDeclaration(n)&&names.includes(n.name?.text));assert.equal(nodes.length,3)
const cls=sceneSource.statements.find(n=>ts.isClassDeclaration(n)&&n.name?.text==='GameScene')
const drain=cls.members.find(n=>ts.isMethodDeclaration(n)&&n.name.getText(sceneSource)==='advanceInputTime');assert.ok(drain)
const compile=s=>ts.transpileModule(s,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText
function fixture(kind,effect='live') {
 const calls=[],building={id:3,team:'blue',hp:100,progress:1,admission:{occupants:[7]}},person={id:7,team:'blue',hp:100,inside:3}
 const world={buildings:[building],units:[person],inputMask:0,selected:[],dismantling:false,cameras:{phase:'idle'}}
 const element=()=>({hidden:false,children:[],dataset:{person:'7'},listeners:{},setAttribute(){},appendChild(c){this.children.push(c)},addEventListener(n,f){this.listeners[n]=f}})
 const panelBuildings=new WeakMap()
 const bindings={document:{createElement:element},rules:{buildingMaxWorkers:[1]},buildingModel:()=>0,buildingOccupantPanelProfile:()=>({kind:'resident'}),panelBuildings,
 selectBuildingOccupants(w,b,id,shift){calls.push(['select',id,shift]);w.selected=[id]},dismantleBuilding(w,b){calls.push(['dismantle',b.id]);w.dismantling=true}}
 const create=new Function(...Object.keys(bindings),compile(nodes.map(n=>n.getText(source)).join('\n'))+';return createPanel')(...Object.values(bindings))
 const Scene=new Function('performance','advanceGame','previewGroundZoom',compile('class Scene {'+drain.getText(sceneSource)+'}')+';return Scene')({now:()=>100},(w,c,seconds)=>{
  calls.push(['drain',seconds,[...w.selected],w.dismantling])
  if(effect==='retire')scene.disposed=true
  if(effect==='mask')w.inputMask=1
  if(effect==='replace')w.buildings=[{...building}]
  if(effect==='depart')w.units=[]
 },()=>{})
 const scene=new Scene();Object.assign(scene,{world,disposed:false,started:true,inputDepth:0,previous:0,gameClock:{},modalSuspended:false,overviewActive:false,buildingPanels:new Map(),container:element(),isCurrent(){return !this.disposed},onSound(id){calls.push(['sound',id])},onChange(){calls.push(['change'])},renderBuildingPanels(){calls.push(['render'])}})
 const panel=create(scene,building);panelBuildings.set(panel,building)
 return {calls,world,run(){panel.children[kind==='select'?1:2].listeners.click({shiftKey:true})}}
}
for(const kind of ['select','dismantle']) {
 test(`${kind}: elapsed work sees old state before mutation`,()=>{const f=fixture(kind);f.run();assert.deepEqual(f.calls,[['drain',.1,[],false],kind==='select'?['select',7,true]:['dismantle',3],['sound',106],['change'],['render']])})
 for(const effect of ['retire','mask','replace'])test(`${kind}: ${effect} during drain refuses stale action`,()=>{const f=fixture(kind,effect);f.run();assert.deepEqual(f.calls,[['drain',.1,[],false]]);assert.deepEqual(f.world.selected,[]);assert.equal(f.world.dismantling,false)})
}
test('selection revalidates occupant membership after drain',()=>{const f=fixture('select','depart');f.run();assert.deepEqual(f.calls,[['drain',.1,[],false]])})
