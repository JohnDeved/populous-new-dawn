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
test('actual Page never restores an old pause state or queued camera request into a replacement world',()=>{
 const {world,scene,page,replace}=fixture(false)
 page.openMenu()
 let cameraCalls=0
 page.bindings.pendingMenuCamera.current.push(()=>cameraCalls++)
 const next={paused:true};replace(next)
 page.closeMenu();assert.equal(next.paused,true);assert.equal(world.paused,true)
 assert.equal(cameraCalls,0);assert.equal(page.bindings.pendingMenuCamera.current.length,0)
 assert.equal(scene.modalSuspended,true,'obsolete scene remains suspended until disposed')
})
test('actual Page applies queued camera conveniences only on final same-world close',()=>{
 const {scene,page}=fixture(false)
 page.openMenu()
 let cameraCalls=0
 page.bindings.pendingMenuCamera.current.push(s=>{assert.equal(s,scene);assert.equal(s.modalSuspended,false);cameraCalls++})
 page.openMenu();assert.equal(cameraCalls,0)
 page.closeMenu();assert.equal(cameraCalls,1)
 page.closeMenu();assert.equal(cameraCalls,1)
})
