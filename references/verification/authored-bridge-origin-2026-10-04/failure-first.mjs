import assert from 'node:assert/strict'
import { createWorld, select, command, tick } from '../../../../mission-two-controls/app/model.ts'
const world=createWorld(2)
while(world.turn<122)tick(world,1/12)
const head=world.shrines.find(h=>h.kind==='bridgeEffect')
select(world,'shaman');assert.ok(command(world,head))
while(!head.uses&&world.turn<1000)tick(world,1/12)
const effect=world.effects.find(f=>f.bridge)
console.log(JSON.stringify({baseline:'f0f8880127409df0c2aee569c48cfad45351faf0',runtimeParent:'b8465001a618b97ded7d7a7cd4afc4a1fc7240f5',turn:world.turn,uses:head.uses,shrine:{x:head.x,z:head.z},bridge:effect?.bridge},null,2))
assert.deepEqual(effect.bridge.start,{x:47872,y:24832},'Authored native origin must match ordinary Mission2 reward')
