import test from 'node:test'
import assert from 'node:assert/strict'
import fixture from './fixtures/move-eligibility.json' with {type:'json'}
import {moveCommandAllowed} from '../app/command-context.ts'
import {createWorld,addUnit,command,nativePosition,syncLandscapeObjects} from '../app/model.ts'

test('move input eligibility matches native category, strict-land and quarter-mask captures',()=>{
 for(const c of fixture.cases){
  const walk=new Uint8Array(8192),x=c.point&254,y=(c.point>>8)&254
  ;[y*256+x,y*256+x+1,(y+1)*256+x,(y+1)*256+x+1].forEach((bit,i)=>{if(c.bits&(1<<i))walk[bit>>3]|=1<<(bit&7)})
  assert.equal(moveCommandAllowed(c,walk,{x:((c.point&255)<<8)+128,y:(c.point&0xff00)+128},c.tribe),c.enabled,JSON.stringify(c))
 }
})

test('blocked move clicks preserve the whole selected group, shared orders, markers and RNG',()=>{
 const w=createWorld();w.units=[];w.buildings=[];w.trees=[];w.shrines=[]
 w.terrain.fill(3);w.terrainVersion++;w.manaWorld.gameFlags=32
 for(let i=0;i<8;i++)addUnit(w,'blue','brave',{x:-12+i*.25,z:8})
 w.selected=w.units.map(u=>u.id);assert.equal(command(w,{x:8,z:8}),true)
 const point={x:14,z:12},n=nativePosition(w,point),index=((n.y&65535)>>9)*128+((n.x&65535)>>9)
 syncLandscapeObjects(w)
 const before=structuredClone(w)
 w.land.flags[index]|=4
 assert.equal(command(w,point),false)
 // The injected blocked flag is the only intentional world difference.
 w.land.flags[index]=before.land.flags[index]
 assert.deepEqual(w,before)
 const bit=(((n.y>>8)&254)+1)*256+((n.x>>8)&254)+1
 const previous=w.land.walkMasks[0][bit>>3]
 w.land.walkMasks[0][bit>>3]&=~(1<<(bit&7))
 assert.equal(command(w,point),false)
 w.land.walkMasks[0][bit>>3]=previous
 assert.deepEqual(w,before)
 assert.equal(command(w,point),true,'removing the obstruction restores input without reselection')
})
