import assert from 'node:assert/strict';
import {advanceGame} from '../../app/game-clock.ts';
import {visitWorshipAcquisition} from '../../app/worship-acquisition-runtime.ts';
import {loadSceneFixture} from '../../tests/support/bloodlust-scene.mjs';
await loadSceneFixture();
const {createCameraMotion,createResultCamera}=await import('../../app/camera-motion.ts');
const {updateFlyby,updateCameraMotion,captureCamera,previewCamera}=await import('../../app/scene-camera-runtime.ts');
// Visible CPU driver, no WebGL/browser-persistence claim. Mirrors scene.ts RAF
// order: advanceGame, then actual camera motion and conditional Flyby. Motion interpolation observers are
// renderer-owned; they do not mutate World. This initial M11 route deliberately avoids
// ordinary worship HUD acquisition; fail rather than silently skip a handoff.
const drivers=new WeakMap();
export function driver(world){
 let d=drivers.get(world);if(d)return d;
 const scene={world,flybyCamera:{x:17*256,y:-41*256,angle:0,zoom:0},wasFlying:false,viewPoint:{x:29,z:-5},cameraBearing:0,flybyTime:0,keys:new Set(),camera:{up:{set(){}}},cancelOverview(){},updateTooltipController(){},commitSky(){},updateView(){},acquireForcedTooltip(){}};
 Object.assign(scene,{viewTransition:null,overviewStage:null,overviewActive:false,resultCamera:createResultCamera(),cameraMotion:createCameraMotion(),cameraVelocity:{turn:0,forward:0,side:0},cameraPosition:{x:0,y:0,angle:0},cameraPreviewButtons:null,resultRequest:0,resultTurn:0,cameraTime:0,skyRemainder:0,tooltip:{draw:0},navigationButtons:()=>0,stepViewChange(){},captureCamera(){captureCamera(scene)},previewCamera(buttons){return previewCamera(scene,buttons)}});
 const clock={animationTime:0,animationFrame:0,afterTurn(){assert.equal(world.worshipAcquisition.requests.length,0,'M11 route must not omit a requested HUD acquisition');},worshipVisit(){visitWorshipAcquisition(world,()=>assert.fail('Unexpected ordinary worship HUD arrival'));},presentationHidden:()=>false};
 d={clock,scene};drivers.set(world,d);return d;
}
export function frame(world,seconds=1/12){assert.deepEqual(world.secondaryEffects.reservations,[],'No omitted panel or cursor reservations');const d=driver(world);advanceGame(world,d.clock,seconds);const previousDocument=globalThis.document;try{globalThis.document={querySelector:()=>null};if(!updateCameraMotion(d.scene,seconds))updateFlyby(d.scene,seconds);}finally{if(previousDocument===undefined)delete globalThis.document;else globalThis.document=previousDocument;}}
