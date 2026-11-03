import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
const source = fs.readFileSync(new URL('../app/object-panels.ts',import.meta.url),'utf8')
const tree = ts.createSourceFile('object-panels.ts',source,ts.ScriptTarget.Latest,true)
const owner = tree.statements.find(n=>ts.isClassDeclaration(n)&&n.name?.text==='ObjectPanels')
assert.ok(owner)
const names=['focusWorshipper','focusOrder']
const methods=owner.members.filter(n=>ts.isMethodDeclaration(n)&&names.includes(n.name.getText(tree)))
assert.equal(methods.length,2)
const js=ts.transpileModule('class Panel {'+methods.map(n=>n.getText(tree)).join('\n')+'}',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText
const cameraSource=fs.readFileSync(new URL('../app/scene-camera-runtime.ts',import.meta.url),'utf8')
const cameraTree=ts.createSourceFile('camera.ts',cameraSource,ts.ScriptTarget.Latest,true)
const focusNodes=cameraTree.statements.filter(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='focus')
assert.equal(focusNodes.length,1)
const cameraJs=ts.transpileModule(focusNodes[0].getText(cameraTree).replace(/^export /,''),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText
const reviewedFocus=new Function(cameraJs+';return focus')()
function fixture(kind,retire) {
 const calls=[]
 const unit={id:7,hp:1,team:'blue',native:{}}
 const world={inputMask:0,shrines:[{id:3}],units:[unit],buildings:[],vehicles:[],trees:[],objectCells:{objects:[]},buildingOrders:{records:{5:{a:7}}}}
 const point={x:1,y:2,target:kind==='ground'?0:7}
 const bindings={liveWorshippers:()=>[unit],browserPosition:x=>x,unitAnimationSource:()=>null,personOrderIcons:()=>[{id:5}],personOrderFocus:()=>point,nativePosition:(_w,x)=>x,effect:(...args)=>calls.push(['effect',...args])}
 const Panel=new Function(...Object.keys(bindings),js+'; return Panel')(...Object.values(bindings))
 const scene={disposed:false,world,overviewActive:false,advanceInputTime(){this.disposed=true},focus(p,opts){calls.push(['focus',p,opts]);if(retire==='focus')reviewedFocus(this,p,opts)},onSound(cue){calls.push(['sound',cue]);if(retire==='sound')this.disposed=true}}
 const panel=new Panel();panel.scene=scene;panel.open=(...args)=>calls.push(['open',...args])
 return {calls,point,unit,world,run:()=>kind==='worshipper'?panel.focusWorshipper(3,7):panel.focusOrder(7,5)}
}
for(const kind of ['worshipper','order','ground']) for(const retire of ['focus','sound','live']) test(`${kind}: ${retire} callback ownership`,()=>{
 const {calls,point,unit,world,run}=fixture(kind,retire);run()
 const expected=[['focus',kind==='worshipper'?unit:point,{animate:true}]]
 if(retire!=='focus')expected.push(['sound',0x6a])
 if(retire==='live') {
  if(kind==='ground')expected.push(['effect',world,'orderMarker',point],['sound',0x6a])
  else expected.push(['open',7,true])
 }
 assert.deepEqual(calls,expected)
})
