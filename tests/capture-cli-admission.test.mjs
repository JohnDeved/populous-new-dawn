import test from 'node:test'
import assert from 'node:assert/strict'
import { captureCommandExit, captureQueueArguments } from '../scripts/tutorial-browser/run-capture-protocol.mjs'
const env={PND_CAPTURE_PROTOCOL_WINDOW:'1',PND_QUEUE_JOB_ID:'owned',PND_QUEUE_OUTPUT:'/owned/out',PND_QUEUE_CLEANUP:'/owned/cleanup',POPULOUS_URL:'http://127.0.0.1:5198',PND_QUEUE_PORTS:'5198',PND_CAPTURE_NODE_SHA256:'a'.repeat(64),PND_CAPTURE_MANIFEST_SHA256:'b'.repeat(64)}
test('dedicated CLI admission requires explicit opt-in, owned queue, exact root/port and qualified Node hash',()=>{
 const result=captureQueueArguments(env,'/checkout','/node','/checkout')
 assert.equal(result.runner,'/checkout/scripts/tutorial-browser/run.mjs');assert.equal(result.trustedNodeSha256,env.PND_CAPTURE_NODE_SHA256)
 for(const key of Object.keys(env))assert.throws(()=>captureQueueArguments({...env,[key]:''},'/checkout','/node','/checkout'))
 assert.throws(()=>captureQueueArguments(env,'/other','/node','/checkout'))
 assert.throws(()=>captureQueueArguments(env,'/checkout','node','/checkout'))
 assert.throws(()=>captureQueueArguments({...env,POPULOUS_URL:'http://127.0.0.1:5000'},'/checkout','/node','/checkout'))
})
test('disabled, failed-runner and unusable-diagnostic results never produce passing queue exit',()=>{
 assert.equal(captureCommandExit({enabled:true,runnerSucceeded:true,usableObservation:true}),0)
 for(const result of [undefined,{}, {enabled:false,runnerSucceeded:true,usableObservation:true},{enabled:true,runnerSucceeded:false,usableObservation:true},{enabled:true,runnerSucceeded:true,usableObservation:false}])assert.equal(captureCommandExit(result),1)
})
