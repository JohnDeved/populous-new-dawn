import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {selectionRoute,selectionAdmission,assertSelectionReceipt,observeFirstSelection,observeDeselection,assertDeselectionReceipt} from './firewarrior-selection.mjs'
const brave={id:121,kind:'brave',team:'blue',hp:50,inside:null,identityMatches:true}
test('outside to indoor transition invalidates stale branch and admits actual occupant owner',()=>{
 const outside=selectionRoute(brave),indoors={...brave,inside:100}
 const stale=selectionAdmission(outside,indoors,{owned:true,id:121})
 assert.equal(stale.ready,false);assert.equal(stale.reason,'location changed');assert.deepEqual(stale.current,{kind:'occupant',id:121,buildingId:100})
 assert.equal(selectionAdmission(stale.current,indoors,{owned:true,id:100}).ready,true)
 assert.equal(selectionAdmission(stale.current,indoors,{owned:true,id:98}).ready,false)
})
test('same numeric handle cannot replace authored object identity',()=>{
 assert.throws(()=>selectionRoute({...brave,identityMatches:false}),/identity/)
 assert.throws(()=>selectionRoute({...brave,hp:0}),/identity/)
})
const receipt=()=>({route:selectionRoute(brave),restored:true,errors:[],events:['pointerdown','pointerup','click'].map(type=>({type,trusted:true,button:0,modified:false,before:{owned:true,identityMatches:true},after:{owned:true,identityMatches:true}})),final:{selected:[121]},pointer:{restored:true,errors:[],events:['pickUnit','pickPerson'].map((name,i)=>({type:['pointerdown','pointerup'][i],trusted:true,canvasOwned:true,canvasTarget:true,picks:[{name,id:121,receiverMatches:true}]}))}})
test('delivered down and up require actual picked121 even when final selection looks correct',()=>{
 assertSelectionReceipt(receipt())
 for(const i of [0,1]) {const r=receipt();r.pointer.events[i].picks[0].id=63;assert.throws(()=>assertSelectionReceipt(r),/picker/)}
 const r=receipt();r.events[1].before.identityMatches=false;assert.throws(()=>assertSelectionReceipt(r),/identity/)
})
test('indoor selection requires live exact control owner on down/up/click, no final selected-only credit',()=>{
 const r=receipt();r.route={kind:'occupant',id:121,buildingId:100};r.pointer=null;assertSelectionReceipt(r)
 r.events[1].after.owned=false;assert.throws(()=>assertSelectionReceipt(r),/owner/)
})
test('real scenario delegates before training and no longer caches stale inside branch',()=>{
 const s=readFileSync(new URL('./firewarrior-public-witness.mjs',import.meta.url),'utf8')
 assert(s.includes('await selectAuthoredBrave('));assert(!s.includes('if (inside === null) await page.mouse.click'))
 assert(s.indexOf('await selectAuthoredBrave(')<s.indexOf('window.firewarriorPublicEpoch.armInput(121)'))
})

test('actual indoor observer sees button handler before panel stops pointer bubbling',()=>{
 const listeners=()=>{const map=new Map();return{map,addEventListener(type,fn,capture){map.set(type+!!capture,fn)},removeEventListener(type,fn,capture){assert.equal(map.get(type+!!capture),fn);map.delete(type+!!capture)}}}
 const unit={...brave,inside:100},building={id:100,admission:{occupants:[121]}},world={turn:66,units:[unit],buildings:[building],selected:[63]},panel={hidden:false}
 const button={...listeners(),isConnected:true,dataset:{person:'121'},closest:()=>panel,contains:value=>value===button}
 const doc={...listeners(),elementFromPoint:()=>button},scene={world,isCurrent:()=>true,buildingPanels:new Map([[100,panel]])},store={getWorld:()=>world}
 const prior=globalThis.window;globalThis.window={firewarriorPublicEpoch:{traineeObject:unit}}
 try{const observer=observeFirstSelection({scene,store,route:selectionRoute(unit),button,doc})
 for(const type of ['pointerdown','pointerup','click']){const e={type,target:button,clientX:1,clientY:2,isTrusted:true,button:0};doc.map.get(type+'true')(e);if(type==='click')world.selected=[121];button.map.get(type+'false')(e)}
 assertSelectionReceipt(observer.finish());assert.equal(doc.map.size,0);assert.equal(button.map.size,0)
 }finally{if(prior===undefined)delete globalThis.window;else globalThis.window=prior}
})

test('pinned CommonJS transform rejects old local require name but leaves renamed ES module unchanged',async()=>{
 const {default:commonjs}=await import('vite-plugin-commonjs')
 const plugin=commonjs()
 plugin.configResolved({resolve:{alias:[]},optimizeDeps:{},createResolver:()=>async()=>undefined})
 const id=new URL('./firewarrior-selection.mjs',import.meta.url).pathname,source=readFileSync(id,'utf8')
 assert(source.includes('const requireSelection ='))
 const legacy=source.replace(/\brequireSelection\b/g,'require')
 await assert.rejects(plugin.transform(legacy,id),/invalid import.*require\(unit/)
 assert.equal(await plugin.transform(source,id),undefined)
})

test('actual Home Escape caller deselects real authored M10 World without clock, pause, orders or modal changes',async()=>{
 const {default:ts}=await import('typescript'),api=await import('../../app/model.ts'),{advanceGame}=await import('../../app/game-clock.ts'),{tutorialLevel}=await import('../../app/mission-data.ts')
 const source=ts.createSourceFile('page.tsx',readFileSync(new URL('../../app/page.tsx',import.meta.url),'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX)
 let node
 const visit=n=>{if(ts.isVariableDeclaration(n)&&n.name.getText(source)==='key'&&n.initializer?.getText(source).includes('store.change(cancelInteraction)'))node=n.initializer;ts.forEachChild(n,visit)};visit(source);assert(node)
 const world=api.createWorld(10),clock={animationTime:0,animationFrame:0};advanceGame(world,clock,1/12)
 assert.equal(world.mode,null);assert.equal(world.inputMask,0);assert(world.selected.length);assert.notEqual(world.outcome.level,tutorialLevel)
 const before=structuredClone(world),expected=structuredClone(world);api.cancelInteraction(expected)
 let calls=0,updates=0
 const bindings={ready:true,menu:false,world,store:{getWorld:()=>world,change:fn=>{assert.equal(fn,api.cancelInteraction);calls++;fn(world)}},SPELLS:api.SPELLS,spellHudVisibility:()=>{throw Error('unexpected spell path')},tutorialLevel,openMenu:()=>{throw Error('unexpected menu')},cancelInteraction:api.cancelInteraction,update:()=>updates++}
 const expression=ts.transpileModule(`(${node.getText(source)})`,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText
 const key=Function(...Object.keys(bindings),`return ${expression}`)(...Object.values(bindings))
 const listeners=[],win={addEventListener:(type,fn,capture)=>listeners.push({type,fn,capture}),removeEventListener:(type,fn,capture)=>{const index=listeners.findIndex(l=>l.type===type&&l.fn===fn&&l.capture===capture);assert(index>=0);listeners.splice(index,1)}}
 const observer=observeDeselection({scene:{world,gameClock:clock,isCurrent:()=>true},store:bindings.store,win,doc:{querySelector:()=>null}})
 const event={key:'Escape',code:'Escape',isTrusted:true,ctrlKey:false,metaKey:false,altKey:false,target:{closest:()=>null},preventDefault(){throw Error('unexpected modal/flyby path')}}
 listeners.find(l=>l.capture).fn(event);key(event);listeners.find(l=>!l.capture).fn(event)
 const receipt=observer.finish();assert.equal(listeners.length,0);assertDeselectionReceipt(receipt)
 const changed=structuredClone(receipt);changed.events[0].after.turn++;assert.throws(()=>assertDeselectionReceipt(changed),/clock/)
 const ignored=structuredClone(receipt);ignored.events[0].after.selected=[63];assert.throws(()=>assertDeselectionReceipt(ignored),/clear selection/)
 const untrusted=structuredClone(receipt);untrusted.events[0].trusted=false;assert.throws(()=>assertDeselectionReceipt(untrusted),/trusted/)
 assert.throws(()=>observeDeselection({scene:{world,gameClock:clock,isCurrent:()=>true},store:bindings.store,win,doc:{querySelector:()=>null}}),/prerequisite/)
 assert.equal(listeners.length,0)
 assert.equal(calls,1);assert.equal(updates,1);assert.deepEqual(world,expected)
 assert.deepEqual(world.selected,[]);assert.equal(world.mode,null);assert.equal(world.paused,before.paused);assert.equal(world.turn,before.turn);assert.equal(world.pendingTime,before.pendingTime)
 assert.deepEqual(world.buildingOrders,before.buildingOrders);assert.equal(clock.animationFrame,2)
})
