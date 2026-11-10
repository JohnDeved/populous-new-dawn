import * as THREE from './three.module.js';
import {buildFixture,fixtureKinds} from './extended-fixture-scene.mjs';
const results=[];
const renderer=new THREE.WebGLRenderer({antialias:false,alpha:false,preserveDrawingBuffer:true});
renderer.setSize(16,16);renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.NoToneMapping;
document.body.appendChild(renderer.domElement);
const gl=renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');
const device=ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);
for(const kind of fixtureKinds){
 const fixture=buildFixture(THREE,kind);renderer.render(fixture.scene,fixture.camera);
 const bottomUp=new Uint8Array(1024);gl.readPixels(0,0,16,16,gl.RGBA,gl.UNSIGNED_BYTE,bottomUp);
 const topDown=new Uint8Array(1024);for(let y=0;y<16;y++)topDown.set(bottomUp.subarray((15-y)*64,(16-y)*64),y*64);
 results.push({kind,pixels:Array.from(topDown),image:renderer.domElement.toDataURL('image/png')});fixture.dispose();
}
window.fixtureResult={revision:THREE.REVISION,device,results,limits:['Synthetic opaque target, one sample, colored overlap, output clipping, synthetic 2x2 texture filtering. Not a game scene or hardware performance. GPU rows flipped to top-down for CPU/PNG comparison.']};
renderer.dispose();
