import assert from 'node:assert/strict'
import test from 'node:test'
import vectors from '/workspace/scratch/69fd8163d94e/cloud-dev-20261004/native-shaman-guard-fix/tests/fixtures/shaman-guard-native.json' with { type: 'json' }
import { stepShamanGuard } from '/workspace/scratch/69fd8163d94e/cloud-dev-20261004/integration-publish-recovered/app/live-movement.ts'
for(const c of vectors.distances) test(c.label,()=>{
const p={x:c.person[0],y:c.person[1],goalX:c.goal[0],goalY:c.goal[1],counter:0,substate:1,flags2:0x2000000,assignment:8,speed:1};let destination=false;
stepShamanGuard(p,{x:c.target[0],y:c.target[1]},{recover:()=>assert.fail('unexpected recovery'),destination:()=>{destination=true}});
assert.deepEqual({pursuit:!!(p.flags2&0x2000000),formation:!!(p.assignment&8),destination},c.native);
})
