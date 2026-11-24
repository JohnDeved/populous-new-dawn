import assert from 'node:assert/strict'
import test from 'node:test'
import {createWorld,tick} from '../app/model.ts'

function episode() {
  const world=createWorld(2)
  const advance = target => { while(world.turn<target) tick(world,1/12) }
  advance(36)
  const site=world.levelStart.find(s=>s.tribe===0)
  assert.ok(site && site.stoneTurns.every(t=>t===null))
  const old=new Set(world.effects.map(e=>e.id))
  advance(37)
  assert.equal(site.stoneTurns[7],37)
  const fresh=world.effects.filter(e=>!old.has(e.id))
  return {world,advance, carriers:fresh.filter(e=>e.sprite?.sequence==='spellTrail'), burst:fresh.filter(e=>e.sprite?.sequence==='blastTrail')}
}
const state = a=>[a.object,a.draw,a.state,a.remaining]
test('authored M2 carriers emit model-4 trails with allocation-phase animation',()=>{
  const {carriers}=episode()
  assert.equal(carriers.length,20)
  for(const [i,e] of carriers.entries()){
    const a=e.animation
    assert.deepEqual(state(a),[322,1,5,0])
    assert.equal(a.flags2 & 0x40080,0x40080)
    assert.equal(a.f1,((i+2)&3)*4)
  }
})
test('authored M2 burst children retain model-3 trail object after the particle override',()=>{
  const {burst}=episode()
  assert.equal(burst.length,32)
  for(const e of burst){
    const a=e.animation
    assert.deepEqual([a.object,a.draw,a.state,a.f1],[314,1,3,0])
    assert.equal(a.flags2 & 0x40180,0x40180)
    assert.ok([1,2].includes(a.remaining))
  }
})
test('authored M2 carrier trails perform the in-place second-phase handoff',()=>{
  const {world,advance,carriers}=episode()
  assert.ok(carriers.length)
  for(const e of carriers)assert.equal(e.animation.state,5)
  const animations=carriers.map(e=>e.animation)
  for(const [t,n] of [[38,3]]){
    advance(t)
    for(const [i,e] of carriers.entries()){
      assert.ok(world.effects.includes(e))
      assert.equal(e.animation,animations[i])
      assert.deepEqual(state(e.animation),[326,1,4,n])
    }
  }
})
test('authored M2 carrier second phase retires at zero and not an earlier visit',()=>{
  const {world,advance,carriers}=episode()
  // Admit only the real handoff, asserted independently above; test the
  // decrement/delete body on those exact live objects once it is admitted.
  advance(38)
  const owned=carriers.filter(e=>e.animation.state===4 && e.animation.remaining===3)
  assert.equal(owned.length,carriers.length)
  for(const [target,remaining] of [[39,2],[40,1]]){
    advance(target)
    for(const e of owned){
      assert.ok(world.effects.includes(e))
      assert.equal(e.animation.remaining,remaining)
    }
  }
  advance(41)
  for(const e of owned)assert.ok(!world.effects.some(f=>f.id===e.id))
})
