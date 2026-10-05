import test from 'node:test'
import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
const source=execFileSync('git',['show','ddef3caa522d45168b16f290cc5b5a4d1541fce2:qa/campaign-continuity/observation.mjs'],{encoding:'utf8'})
const extract=(name,next)=>source.slice(source.indexOf(`export function ${name}(`),source.indexOf(`export function ${next}(`)).replace('export ','')
const actorStop=new Function(`${extract('requiredActorStop','selectSermonAnchor')}; return requiredActorStop`)()
const progress=new Function(`${extract('progressKey','objectiveProgress')}; return progressKey`)()
const condition={type:'shrine-used',id:101,workerId:5000}
test('baseline must promptly detect the lost named worship worker',()=>assert.ok(actorStop({units:[],shrines:[{id:101,uses:0}]},condition)))
test('baseline must promptly detect worship order loss',()=>assert.ok(actorStop({units:[{id:5000,hp:50,kind:'brave',team:'blue',order:{model:3,a:0}}],shrines:[{id:101,uses:0}]},condition)))
test('unrelated Temple unlock must not renew the named worship wait',()=>{
 const state={unlockedTemple:false,shrines:[{id:101,work:0,uses:0}],units:[{id:5000,x:1,z:2,work:101}],buildings:[]}
 assert.equal(progress(state,'worship',[101,5000]),progress({...state,unlockedTemple:true},'worship',[101,5000]))
})
