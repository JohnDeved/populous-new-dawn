// Isolated synthetic WebGL reference. Served only from a loopback test origin.
import * as THREE from './three.module.js';
const results=[];
const renderer=new THREE.WebGLRenderer({antialias:false,alpha:false,preserveDrawingBuffer:true});
renderer.setSize(16,16);renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.NoToneMapping;
document.body.appendChild(renderer.domElement);
const gl=renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');
const device=ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);
for(const kind of ['normal','additive','premultiplied','fog-off','fog-on']){
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera();camera.position.z=2;camera.updateMatrixWorld();
 const plane=(value,alpha,blend,order,premultiplied=false,fog=false)=>{
  const material=new THREE.ShaderMaterial({vertexShader:'varying float fixtureDepth;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);fixtureDepth=-mv.z;gl_Position=projectionMatrix*mv;}',fragmentShader:`varying float fixtureDepth;void main(){vec3 c=vec3(${value.toFixed(4)});${fog?'c=mix(c,vec3(230.0/255.0),1.0-exp(-.3*.3*fixtureDepth*fixtureDepth));':''}gl_FragColor=vec4(c,${alpha.toFixed(4)});}`,transparent:alpha<1,depthTest:false,depthWrite:false,blending:blend,premultipliedAlpha:premultiplied});
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(2,2),material);mesh.renderOrder=order;scene.add(mesh);
 };
 plane(.4,1,THREE.NoBlending,0);
 if(kind==='normal')plane(.8,.5,THREE.NormalBlending,1);
 if(kind==='additive')plane(.4,.5,THREE.AdditiveBlending,1);
 if(kind==='premultiplied')plane(.2,.5,THREE.NormalBlending,1,true);
 if(kind.startsWith('fog-'))plane(.4,1,THREE.NoBlending,1,false,kind==='fog-on');
 renderer.render(scene,camera);
 const pixels=new Uint8Array(16*16*4);gl.readPixels(0,0,16,16,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
 results.push({kind,pixels:Array.from(pixels),image:renderer.domElement.toDataURL('image/png')});
 scene.traverse(o=>{o.geometry?.dispose();o.material?.dispose()});
}
window.fixtureResult={revision:THREE.REVISION,device,results,limits:['Synthetic opaque target, one sample, no textures/effects. Fog equation supplied explicitly in output encoding, not automatic Three material fog. Not a game scene or hardware performance.']};
renderer.dispose();
