export const fixtureKinds=['colored-normal','colored-additive','overflow-then-normal','texture-nearest','texture-linear'];
// Exact shared fixture builder consumed by CPU and GPU, no game scene substitution.
export function buildFixture(THREE,kind){
 if(!fixtureKinds.includes(kind))throw new Error('Unknown fixture');
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,10);camera.position.z=2;camera.updateMatrixWorld();
 function plane(rgb,alpha,blending,order,map=null){
  const uniforms=map?{fixtureMap:{value:map}}:{};
  const material=new THREE.ShaderMaterial({uniforms,defines:{CPU_OUTPUT_SRGB_FIXTURE:1},vertexShader:'varying vec2 fixtureUv;void main(){fixtureUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:map?'varying vec2 fixtureUv;uniform sampler2D fixtureMap;void main(){gl_FragColor=texture2D(fixtureMap,fixtureUv);}':`void main(){gl_FragColor=vec4(${rgb.map(x=>x.toFixed(6)).join(',')},${alpha.toFixed(6)});}`,transparent:alpha<1,depthTest:false,depthWrite:false,blending});
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(2,2),material);mesh.renderOrder=order;scene.add(mesh);
 }
 if(kind.startsWith('texture')){
  // Distinct rows expose row orientation; pixels sample both sides of texel boundaries.
  const texture=new THREE.DataTexture(new Uint8Array([255,0,0,255,0,255,0,255,0,0,255,255,255,255,255,255]),2,2);
  texture.magFilter=texture.minFilter=kind.endsWith('nearest')?THREE.NearestFilter:THREE.LinearFilter;
  texture.wrapS=texture.wrapT=THREE.ClampToEdgeWrapping;texture.generateMipmaps=false;texture.colorSpace=THREE.NoColorSpace;texture.needsUpdate=true;
  plane([0,0,0],1,THREE.NoBlending,0,texture);
 }else if(kind==='overflow-then-normal'){
  plane([.8,.2,.9],1,THREE.NoBlending,0);plane([.8,.9,.8],.5,THREE.AdditiveBlending,1);plane([0,.1,.2],.5,THREE.NormalBlending,2);
 }else{
  plane([.2,.4,.6],1,THREE.NoBlending,0);plane([.8,.2,.4],.5,kind==='colored-normal'?THREE.NormalBlending:THREE.AdditiveBlending,1);
 }
 return{scene,camera,dispose(){scene.traverse(o=>{o.geometry?.dispose();if(o.material){for(const u of Object.values(o.material.uniforms??{}))u.value?.dispose?.();o.material.dispose()}})}};
}
