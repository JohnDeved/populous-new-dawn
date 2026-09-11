import test from 'node:test'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import captures from './fixtures/player-order-append.json' with {type:'json'}
import inputs from './fixtures/ground-order-input.json' with {type:'json'}
import {appendPersonOrders,emptyPersonOrder,groundOrderInput} from '../app/person-orders.ts'

test('player append matches native shared references, cursor wrap, full queues, eligibility and pool exhaustion',()=>{
 for(const capture of captures){
  const c=structuredClone(capture.case),expected=capture.expected
  const pool={records:Array.from({length:800},(_,i)=>({...emptyPersonOrder(),references:c.full&&i?1:0})),cursor:c.cursor,active:c.active}
  for(const [id,order] of c.orders)pool.records[id]=order
  const actions=[];let spellCount=3,spellChanged=0
  const result=appendPersonOrders(pool,c.group[0],c.people,{
   prepare:(o,model,a,b,flags)=>{actions.push(['prepare',pool.records.indexOf(o),model,a,b,flags]);Object.assign(o,{model,a,b,flags})},
   stopWork:p=>{if(p.workTarget===100)actions.push(['work',100])},
   releaseSpell:()=>{spellChanged=1;spellCount=Math.max(0,spellCount-1)},
   deleteObject:id=>actions.push(['delete',id]),releaseFight:p=>actions.push(['fight',p.id]),
   acknowledge:(first,counts)=>actions.push(['acknowledge',first,counts]),
   special:model=>{actions.push(['special',model]);return c.special},
  })
  const bytes=Buffer.alloc(8000)
  pool.records.forEach((o,i)=>{bytes.writeUInt8(o.model,i*10);bytes.writeUInt8(o.flags,i*10+1);['references','object','a','b'].forEach((k,n)=>bytes.writeUInt16LE(o[k],i*10+2+n*2))})
  assert.equal(createHash('sha256').update(bytes).digest('hex'),expected.poolHash)
  assert.deepEqual({result,people:c.people,cursor:pool.cursor,active:pool.active,actions,spellCount,spellChanged},
   {result:expected.result,people:expected.people,cursor:expected.cursor,active:expected.active,actions:expected.actions,spellCount:expected.spellCount,spellChanged:expected.spellChanged})
 }
})

test('ground click modifiers and the eighth-order deselection match complete native player packets',()=>{
 for(const c of inputs)assert.deepEqual(groundOrderInput(c.slot,c.ctrl,c.shift,c.alt),c.expected)
})
