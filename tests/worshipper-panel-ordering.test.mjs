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
function fixture({drain=()=>{},sound=()=>{}}={}) {
 const trace=[],head={id:3,kind:'vault',required:1,tag:'original'},world={units:[],shrines:[head],vehicles:[],cameras:{phase:'idle'},selection:'old'}
 const element=()=>({children:[],listeners:{},dataset:{person:'7'},classList:{add(){}},setAttribute(){},insertBefore(child){this.children.push(child)},addEventListener(type,fn){this.listeners[type]=fn}})
 const advance=method('../app/scene.ts','advanceInputTime',{advanceGame(w,c,seconds){trace.push(['drain',w.selection,seconds]);drain(scene)},previewGroundZoom(){trace.push(['preview'])}})
 const scene={world,disposed:false,started:true,inputDepth:0,previous:0,modalSuspended:false,unitMeshes:new Map(),gameClock:{animationFrame:0},container:element(),
 advanceInputTime(){return advance.call(this,100)},onSound(cue){trace.push(['sound',cue]);sound(this)},onChange(){trace.push(['change'])}}
 const open=method('../app/object-panels.ts','open',{document:{createElement:element},syncSecondaryReservations(){},selectWorshippers(w,h,id,all){trace.push(['select',h,id,all]);w.selection='new'}})
 const panel={scene,panels:new Map(),focusWorshipper(...args){trace.push(['focus',...args])}}
 open.call(panel,3)
 const button=panel.panels.get(3).element.children[1]
 return {scene,head,world,trace,run:(shiftKey=true)=>button.listeners.click({shiftKey,detail:1}),context:()=>button.listeners.contextmenu({preventDefault(){trace.push(['prevent'])}})}
}
test('raw worshipper click drains elapsed old selection before mutation',()=>{
 const {trace,world,run}=fixture();run()
 assert.deepEqual(trace.slice(0,2),[['drain','old',0.1],['preview']]);assert.equal(world.selection,'new')
})
test('elapsed simulation replacing the shrine is resolved by current identity',()=>{
 const replacement={id:3,kind:'vault',tag:'replacement'}
 const {trace,run}=fixture({drain:s=>{s.world.shrines=[replacement]}});run()
 assert.equal(trace.find(x=>x[0]==='select')[1],replacement)
})
test('elapsed simulation removing the shrine prevents stale selection',()=>{
 const {trace,world,run}=fixture({drain:s=>{s.world.shrines=[]}});run()
 assert.deepEqual(trace,[['drain','old',0.1],['preview']]);assert.equal(world.selection,'old')
})
test('retirement during drain prevents selection, sound and publication',()=>{
 const {trace,world,run}=fixture({drain:s=>{s.disposed=true}});run()
 assert.deepEqual(trace,[['drain','old',0.1]]);assert.equal(world.selection,'old')
})
test('retirement during cue prevents later publication',()=>{
 const {trace,head,run}=fixture({sound:s=>{s.disposed=true}});run()
 assert.deepEqual(trace.filter(x=>!['drain','preview'].includes(x[0])),[['select',head,7,true],['sound',0x6a]])
})
for(const shift of [false,true])test(`live click preserves selection modifiers and feedback: ${shift}`,()=>{
 const {trace,head,run}=fixture();run(shift)
 assert.deepEqual(trace.filter(x=>!['drain','preview'].includes(x[0])),[['select',head,7,shift],['sound',0x6a],['change']])
})
test('raw contextmenu retains existing focus delegation',()=>{
 const {trace,context}=fixture();context();assert.deepEqual(trace,[['prevent'],['focus',3,7]])
})
