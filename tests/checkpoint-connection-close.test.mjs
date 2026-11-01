import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import ts from 'typescript'

// Source-only extraction: do not execute model/world/presentation imports.
const source=readFileSync(new URL('../app/game-store.ts',import.meta.url),'utf8')
const ast=ts.createSourceFile('game-store.ts',source,ts.ScriptTarget.Latest,true)
const names=['openCheckpointDatabase','readStoredState','writeStoredValue']
const functions=ast.statements.filter(n=>ts.isFunctionDeclaration(n)&&names.includes(n.name?.text))
assert.equal(functions.length,3)
const constants=ast.statements.filter(n=>ts.isVariableStatement(n)&&n.declarationList.declarations.some(d=>['CHECKPOINT_DATABASE','checkpointDatabase'].includes(d.name.getText(ast))))
assert.equal(constants.length,2)
const code=ts.transpileModule([...constants,...functions].map(n=>n.getText(ast)).join('\n'),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText

function fixture({unavailable=false}={}){
 const databases=[],requests=[],records=new Map(),transactions=[]
 let nextError=null
 const indexedDB=unavailable?undefined:{open(name,version){
  assert.equal(name,'populous-new-dawn');assert.equal(version,1)
  const request=new EventTarget();requests.push(request)
  queueMicrotask(()=>{
   if(nextError){request.error=nextError;nextError=null;request.dispatchEvent(new Event('error'));return}
   const database=new EventTarget();database.closed=false;database.transaction=(storeName,mode)=>{
    assert.equal(storeName,'checkpoints')
    if(database.closed)throw new DOMException('Connection is closed','InvalidStateError')
    const transaction=new EventTarget();transactions.push({database,mode,transaction})
    const writes=[]
    transaction.objectStore=()=>({get:key=>({result:records.get(key)}),put:(value,key)=>writes.push([key,value])})
    queueMicrotask(()=>{for(const [key,value]of writes)records.set(key,value);transaction.dispatchEvent(new Event('complete'))})
    return transaction
   }
   database.forceClose=()=>{database.closed=true;database.dispatchEvent(new Event('close'))}
   databases.push(database);request.result=database;request.dispatchEvent(new Event('success'))
  })
  return request
 }}
 const api=new Function('indexedDB','CHECKPOINT_VERSION','missionNumbers',code+';return {open:openCheckpointDatabase,read:readStoredState,write:writeStoredValue}')(indexedDB,3,[1,2])
 return {...api,databases,requests,records,transactions,failNext(error){nextError=error}}
}

test('live and pending requests retain a single cached connection',async()=>{
 const f=fixture(),first=f.open(),second=f.open();assert.equal(first,second)
 const db=await first;assert.equal(await f.open(),db);assert.equal(f.requests.length,1)
})
test('abnormal close releases cached connection for the next explicit open',async()=>{
 const f=fixture(),old=await f.open();old.forceClose()
 const current=await f.open();assert.notEqual(current,old);assert.equal(f.requests.length,2)
})
test('the next explicit checkpoint write can commit after connection closes',async()=>{
 const f=fixture();assert.equal(await f.write('latest',{slot:1}),true)
 f.databases[0].forceClose()
 assert.equal(await f.write('latest',{slot:2}),true)
 assert.deepEqual(f.records.get('latest'),{slot:2});assert.equal(f.databases.length,2)
 assert.notEqual(f.transactions[0].database,f.transactions[1].database)
})
test('checkpoint and campaign reads resume through a new connection',async()=>{
 const f=fixture(),world={capacityPolicy:{version:1,mode:'scalable'}}
 f.records.set('latest',{version:3,world});f.records.set('profile',{version:1,completed:[1,999,2]})
 assert.equal((await f.read()).checkpoint,world);f.databases[0].forceClose()
 assert.deepEqual(await f.read(),{checkpoint:world,completed:[1,2],incompatible:false})
 assert.equal(f.databases.length,2)
})
test('an obsolete close notification cannot evict its replacement cache owner',async()=>{
 const f=fixture(),old=await f.open();old.forceClose();const replacement=await f.open()
 old.dispatchEvent(new Event('close'))
 assert.equal(await f.open(),replacement);assert.equal(f.requests.length,2)
})
test('concurrent operations after close share one replacement open',async()=>{
 const f=fixture();(await f.open()).forceClose()
 const one=f.open(),two=f.open();assert.equal(one,two);assert.equal(await one,await two)
 assert.equal(f.requests.length,2)
})
test('open failure still rejects and permits a later explicit retry',async()=>{
 const f=fixture(),failure=new Error('supplied open failure');f.failNext(failure)
 await assert.rejects(f.open(),error=>error===failure)
 assert.ok(await f.open());assert.equal(f.requests.length,2)
})
test('unavailable storage preserves null reads and false writes',async()=>{
 const f=fixture({unavailable:true});assert.equal(await f.open(),null);assert.equal(await f.read(),null);assert.equal(await f.write('latest',{}),false);assert.equal(f.requests.length,0)
})

// Qualify fixture connection contracts without importing their model-bearing suites.
for(const file of ['checkpoint-database-open-retry.test.mjs','campaign-profile-recovery.test.mjs','support/profile-storage.mjs','checkpoint-restore-ui.test.mjs','temple-training-checkpoint.test.mjs'])test(`${file}: supplied database implements the native EventTarget connection boundary`,()=>{
 const text=readFileSync(new URL(file,import.meta.url),'utf8'),tree=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),nodes=[]
 function visit(n){if(ts.isVariableDeclaration(n)&&n.name.getText(tree)==='database')nodes.push(n.initializer);ts.forEachChild(n,visit)}
 visit(tree);assert.equal(nodes.length,1)
 const database=new Function('return ('+nodes[0].getText(tree)+')')()
 assert.ok(database instanceof EventTarget)
 let closes=0;database.addEventListener('close',()=>closes++);database.dispatchEvent(new Event('close'));assert.equal(closes,1)
 assert.equal(typeof database.transaction,'function')
})
