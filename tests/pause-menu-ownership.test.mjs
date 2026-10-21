import test from 'node:test'
import assert from 'node:assert/strict'
import {pageNearby} from './support/follower-nearby-page.mjs'

function fixture(paused) {
 let world={paused,manaWorld:{gameFlags:0},inputMask:0,castingTribes:[{flags:0}]}
 const scene={world,canRequestNearbyFollowers:()=>true,cancelNearbyFollowers(){},setModalSuspended(value){this.modalSuspended=value}}
 const store={getWorld:()=>world,change:action=>action(world)}
 const page=pageNearby(scene,{store})
 return {world,scene,page,replace(next){world=next}}
}
test('actual Page captures original pause once, holds it across panel return and restores same-world close',()=>{
 for(const paused of [false,true]){
  const {world,scene,page}=fixture(paused)
  page.openMenu();assert.equal(world.paused,true);assert.equal(scene.modalSuspended,true)
  page.openMenu();assert.equal(page.bindings.menuSession.current.paused,paused)
  page.closeMenu();assert.equal(world.paused,paused);assert.equal(scene.modalSuspended,false)
  assert.equal(page.bindings.menuSession.current,null)
 }
})
test('actual Page never restores an old pause state into a replacement world',()=>{
 const {world,scene,page,replace}=fixture(false)
 page.openMenu()
 const next={paused:true};replace(next)
 page.closeMenu();assert.equal(next.paused,true);assert.equal(world.paused,true)
 assert.equal(scene.modalSuspended,true,'obsolete scene remains suspended until disposed')
})
test('actual Page closes same-world menu once without deferred camera conveniences',()=>{
 const {world,scene,page}=fixture(false)
 page.openMenu();page.openMenu();page.closeMenu()
 assert.equal(world.paused,false);assert.equal(scene.modalSuspended,false)
 // Closing again cannot restore stale pause state or re-enter the world.
 world.paused=true;page.closeMenu();assert.equal(world.paused,true)
})
