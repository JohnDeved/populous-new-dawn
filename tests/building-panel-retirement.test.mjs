// Exact createPanel callback body; supplied DOM, owners and action leaves only.
import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import ts from 'typescript'
const source=ts.createSourceFile('building-panels.ts',readFileSync(new URL('../app/building-panels.ts',import.meta.url),'utf8'),ts.ScriptTarget.Latest,true)
const nodes=source.statements.filter(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='createPanel')
assert.equal(nodes.length,1)
const js=ts.transpileModule(nodes[0].getText(source),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText
const camera=ts.createSourceFile('camera.ts',readFileSync(new URL('../app/scene-camera-runtime.ts',import.meta.url),'utf8'),ts.ScriptTarget.Latest,true)
const focusNodes=camera.statements.filter(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='focus')
assert.equal(focusNodes.length,1)
const focusJs=ts.transpileModule(focusNodes[0].getText(camera).replace(/^export /,''),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText
const focus=new Function(focusJs+';return focus')()
function fixture(kind,retire) {
 const calls=[],building={id:3},person={id:7},world={}
 const element=()=>({children:[],listeners:{},dataset:{person:'7'},setAttribute(){},appendChild(c){this.children.push(c)},addEventListener(n,f){this.listeners[n]=f}})
 const scene={disposed:false,world,buildingPanels:new Map(),container:element(),objectPanels:{open(id,explicit){calls.push(['open',id,explicit])}},
 advanceInputTime(){if(kind==='focus')this.disposed=true;else calls.push(['drain'])},focus(p,options){calls.push(['focus',p,options]);if(retire==='focus')focus(this,p,options)},
 onSound(cue){calls.push(['sound',cue]);if(retire==='sound')this.disposed=true},
 onChange(){calls.push(['change']);if(retire==='change')this.disposed=true},renderBuildingPanels(){calls.push(['render'])}}
 const bindings={document:{createElement:element},rules:{buildingMaxWorkers:[1]},buildingModel:()=>0,
 currentPanelBuilding:()=>building,currentPanelOccupant:()=>person,
 selectBuildingOccupants:(...a)=>calls.push(['select',...a]),dismantleBuilding:(...a)=>calls.push(['dismantle',...a])}
 const create=new Function(...Object.keys(bindings),js+';return createPanel')(...Object.values(bindings))
 const panel=create(scene,building),button=panel.children[kind==='dismantle'?2:1]
 return {calls,scene,world,person,building,run:()=>button.listeners[kind==='focus'?'contextmenu':'click']({shiftKey:true,preventDefault(){}})}
}
for(const [kind,retire] of [['focus','focus'],['select','sound'],['select','change'],['dismantle','sound'],['dismantle','change'],['focus','live'],['select','live'],['dismantle','live']])test(`${kind} continuation: ${retire}`,()=>{
 const {calls,world,person,building,run}=fixture(kind,retire);run()
 let expected
 if(kind==='focus') expected=[['focus',person,{animate:true}],...(retire==='focus'?[]:[['open',7,true],['sound',0x6a]])]
 else {
  expected=[['drain'],kind==='select'?['select',world,building,7,true]:['dismantle',world,building],['sound',0x6a]]
  if(retire!=='sound')expected.push(['change'])
  if(retire==='live')expected.push(['render'])
 }
 assert.deepEqual(calls,expected)
})
