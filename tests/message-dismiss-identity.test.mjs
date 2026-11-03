import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
const pageText=fs.readFileSync(new URL('../app/page.tsx',import.meta.url),'utf8')
const page=ts.createSourceFile('page.tsx',pageText,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX)
const callbacks=[]
function hasRemove(node){let found=false;function visit(n){if(ts.isCallExpression(n)&&ts.isIdentifier(n.expression)&&n.expression.text==='removeMessage')found=true;ts.forEachChild(n,visit)}visit(node);return found}
function visit(node){if(ts.isArrowFunction(node)&&hasRemove(node)&&!ts.isArrowFunction(node.parent))callbacks.push(node);ts.forEachChild(node,visit)}visit(page)
const handler=callbacks.filter(n=>!callbacks.some(other=>other!==n&&other.pos>n.pos&&other.end<n.end));assert.equal(handler.length,1)
const compile=s=>ts.transpileModule(s,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText
const messageText=fs.readFileSync(new URL('../app/messages.ts',import.meta.url),'utf8'),tree=ts.createSourceFile('messages.ts',messageText,ts.ScriptTarget.Latest,true)
const names=['addMessage','stepMessages','removeMessage'],nodes=tree.statements.filter(n=>ts.isFunctionDeclaration(n)&&names.includes(n.name?.text));assert.equal(nodes.length,3)
const native=JSON.parse(fs.readFileSync(new URL('../app/original-messages.json',import.meta.url),'utf8'))
const {addMessage,stepMessages,removeMessage}=new Function('native',compile(nodes.map(n=>n.getText(tree).replace(/^export /,'')).join('\n'))+';return {addMessage,stepMessages,removeMessage}')(native)
function fixture(){
 const state={slots:Array(32).fill(null),nextSerial:0},world={messages:state};let updates=0
 const slot=addMessage(state,123,()=>0),message=state.slots[slot]
 const dismiss=new Function('world','slot','message','update','removeMessage',compile('const dismiss='+handler[0].getText(page))+';return dismiss')(world,slot,message,()=>updates++,removeMessage)
 return {state,slot,message,dismiss,updates:()=>updates}
}
test('expiry and actual slot reuse cannot dismiss a newer notification',()=>{
 const f=fixture();f.message.lifetime=1;stepMessages(f.state);assert.equal(f.state.slots[f.slot],null)
 assert.equal(addMessage(f.state,456,()=>0),f.slot);const replacement=f.state.slots[f.slot]
 f.dismiss();assert.equal(f.state.slots[f.slot],replacement);assert.equal(f.updates(),0)
})
test('full native slot pool replacement survives the old rendered dismiss',()=>{
 const f=fixture();f.message.age=500
 for(let i=1;i<32;i++){const slot=addMessage(f.state,123+i,()=>0);f.state.slots[slot].age=1}
 assert.equal(addMessage(f.state,456,()=>0),f.slot);const replacement=f.state.slots[f.slot]
 f.dismiss();assert.equal(f.state.slots[f.slot],replacement);assert.equal(f.updates(),0)
})
test('serial wrap/alias cannot substitute for exact notification identity',()=>{
 const f=fixture();removeMessage(f.state,f.slot);f.state.nextSerial=f.message.serial
 addMessage(f.state,456,()=>0);const replacement=f.state.slots[f.slot];assert.equal(replacement.serial,f.message.serial)
 f.dismiss();assert.equal(f.state.slots[f.slot],replacement);assert.equal(f.updates(),0)
})
test('same live notification remains dismissible after ordinary motion',()=>{
 const f=fixture();stepMessages(f.state);assert.equal(f.state.slots[f.slot],f.message)
 assert.equal(f.dismiss(),undefined);assert.equal(f.state.slots[f.slot],null);assert.equal(f.updates(),1)
})
test('a repeated old callback is a no-op after its notification was dismissed',()=>{
 const f=fixture();f.dismiss();f.dismiss();assert.equal(f.state.slots[f.slot],null);assert.equal(f.updates(),1)
})
