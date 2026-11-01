import test from 'node:test'
import assert from 'node:assert/strict'
import {FollowerNearbyMode} from '../app/follower-nearby.ts'
const world=()=>({castingTribes:[{flags:0}]})
for(const operation of ['cancel','reset']) test(`cue-triggered ${operation} cannot resurrect the request`,()=>{
 const mode=new FollowerNearbyMode(),w=world(),cues=[]
 mode.advance(w,0)
 const accepted=mode.request(w,10,id=>{cues.push(id);mode[operation]()})
 const visits=[mode.advance(w,100),mode.advance(w,200)]
 assert.deepEqual(cues,[0x6e])
 assert.deepEqual({accepted,visits,flags:w.castingTribes[0].flags},{accepted:false,visits:[false,false],flags:0})
})
test('a duplicate request cannot resurrect the pending request cancelled by its cue',()=>{
 const mode=new FollowerNearbyMode(),w=world();mode.advance(w,0)
 assert.equal(mode.request(w,10,()=>{}),true)
 const accepted=mode.request(w,20,()=>mode.cancel()),advanced=mode.advance(w,100)
 assert.deepEqual({accepted,advanced,flags:w.castingTribes[0].flags},{accepted:false,advanced:false,flags:0})
})
test('cancellation followed by a newer nested request preserves the newer owner',()=>{
 const mode=new FollowerNearbyMode(),old=world(),next=world();mode.advance(next,0)
 assert.equal(mode.request(old,10,()=>{mode.cancel();assert.equal(mode.request(next,20,()=>{}),true)}),false)
 assert.equal(mode.advance(next,100),true)
 assert.equal(old.castingTribes[0].flags,0)
 assert.equal(next.castingTribes[0].flags,128)
})
test('live duplicate cues and next eligible visit retain existing semantics',()=>{
 const mode=new FollowerNearbyMode(),w=world(),cues=[];mode.advance(w,0)
 assert.equal(mode.request(w,10,id=>cues.push(id)),true)
 assert.equal(mode.request(w,20,id=>cues.push(id)),false)
 assert.deepEqual(cues,[0x6e,0x6e])
 assert.equal(mode.advance(w,50),false)
 assert.equal(mode.advance(w,100),true)
 assert.equal(w.castingTribes[0].flags,128)
 assert.equal(mode.advance(w,200),false)
 assert.equal(mode.request(w,210,id=>cues.push(id)),true)
 assert.equal(mode.advance(w,300),true)
 assert.deepEqual(cues,[0x6e,0x6e,0x6f])
 assert.equal(w.castingTribes[0].flags,0)
})
test('a throwing cue preserves exact error identity and queues nothing',()=>{
 const mode=new FollowerNearbyMode(),w=world(),error={failure:1};mode.advance(w,0)
 assert.throws(()=>mode.request(w,10,()=>{throw error}),e=>e===error)
 assert.equal(mode.advance(w,100),false)
})
