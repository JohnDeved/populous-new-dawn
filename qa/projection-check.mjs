import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];
page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
try{
 await page.goto('http://localhost:3000/',{waitUntil:'networkidle'});
 const result=await page.evaluate(async()=>{
  const {nativeVertexShader,RenderView}=await import('/app/render-view.ts'),f=await import('/app/projection.ts');
  const canvas=document.createElement('canvas'),gl=canvas.getContext('webgl2');if(!gl)throw new Error('WebGL2 unavailable');
  const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(shader));return shader;};
  const makeProgram=body=>{
  const program=gl.createProgram();
  gl.attachShader(program,compile(gl.VERTEX_SHADER,`#version 300 es
   precision highp float;precision highp int;
   #define varying out
   uniform mat4 modelMatrix,projectionMatrix,viewMatrix;
   ${nativeVertexShader}
   out vec3 result;${body}`));
  gl.attachShader(program,compile(gl.FRAGMENT_SHADER,'#version 300 es\nprecision highp float;out vec4 color;void main(){color=vec4(1.);}'));
  gl.transformFeedbackVaryings(program,['result'],gl.INTERLEAVED_ATTRIBS);gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));gl.useProgram(program);
  return program;
  };
  let program=makeProgram('in ivec3 samplePoint;void main(){result=nativeScreenPoint(samplePoint);gl_Position=vec4(0.,0.,0.,1.);}');
  const points=[];let seed=1;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed;};
  for(let i=0;i<1024;i++)points.push((random()%65536)-32768,(random()%4096)-1024,(random()%65536)-32768);
  const input=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,input);gl.bufferData(gl.ARRAY_BUFFER,new Int32Array(points),gl.STATIC_DRAW);
  const location=gl.getAttribLocation(program,'samplePoint');gl.enableVertexAttribArray(location);gl.vertexAttribIPointer(location,3,gl.INT,0,0);
  const output=gl.createBuffer();gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER,output);gl.bufferData(gl.TRANSFORM_FEEDBACK_BUFFER,points.length*4,gl.STREAM_READ);gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER,0,output);
  const actual=new Float32Array(points.length),view=new RenderView();let count=0;
  gl.enable(gl.RASTERIZER_DISCARD);
  for(const [width,height] of [[440,480],[1240,960]])for(const angle of [0,127,512,1337])for(const zoom of [-16384,0,16384]){
   view.update(width,height,{x:9,z:33},angle*Math.PI/1024,zoom,false);
   for(const key of ['nativeBasis','nativeSettings','nativeScreen']){
    const value=view.uniforms[key].value,location=gl.getUniformLocation(program,key);
    if(key==='nativeBasis')gl.uniform3iv(location,value);else gl.uniform4iv(location,value);
   }
   gl.beginTransformFeedback(gl.POINTS);gl.drawArrays(gl.POINTS,0,points.length/3);gl.endTransformFeedback();gl.getBufferSubData(gl.TRANSFORM_FEEDBACK_BUFFER,0,actual);
   for(let i=0;i<points.length;i+=3){
    const expected=f.projectPoint({x:points[i],y:points[i+1],z:points[i+2]},view.projection,false);
    if(actual[i]!==expected.screenX||actual[i+1]!==expected.screenY||actual[i+2]!==expected.z+view.config.depth)
     throw new Error(JSON.stringify({width,height,angle,zoom,point:points.slice(i,i+3),actual:[...actual.slice(i,i+3)],expected}));
    count++;
   }
  }
  program=makeProgram('in vec3 samplePosition;void main(){result=nativePosition(samplePosition).xyz;gl_Position=vec4(0.,0.,0.,1.);}');
  const modelLocation=gl.getAttribLocation(program,'samplePosition');gl.enableVertexAttribArray(modelLocation);gl.vertexAttribPointer(modelLocation,3,gl.FLOAT,false,0,0);
  gl.uniform1f(gl.getUniformLocation(program,'nativeMode'),1);
  const modelTransform=new Float32Array([2,0,0,0,0,2,0,0,0,0,2,0,13.5,219/128,36.75,1]);
  gl.uniformMatrix4fv(gl.getUniformLocation(program,'modelMatrix'),false,modelTransform);
  const models=(await import('/app/original-models.json')).default;let modelCount=0,maxError=0;
  for(const model of Object.values(models))for(const angle of [0,333,1024]){
   view.update(1240,960,{x:8.5,z:32.75},angle*Math.PI/1024,0,false,1440);
   for(const key of ['nativeBasis','nativeSettings','nativeScreen','nativeCenter']){
    const value=view.uniforms[key].value,location=gl.getUniformLocation(program,key);
    if(key==='nativeBasis')gl.uniform3iv(location,value);else if(key==='nativeCenter')gl.uniform2iv(location,value);else gl.uniform4iv(location,value);
   }
   const basis=f.modelMatrix(angle);gl.uniform3iv(gl.getUniformLocation(program,'nativeObjectBasis'),new Int32Array(basis));gl.uniform1f(gl.getUniformLocation(program,'nativeModelScale'),model.scale);gl.uniform1f(gl.getUniformLocation(program,'nativeObjectScale'),model.scale);
   gl.bindBuffer(gl.ARRAY_BUFFER,input);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(model.p),gl.STATIC_DRAW);
   gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER,output);gl.bufferData(gl.TRANSFORM_FEEDBACK_BUFFER,model.p.length*4,gl.STREAM_READ);
   const actual=new Float32Array(model.p.length);
   gl.beginTransformFeedback(gl.POINTS);gl.drawArrays(gl.POINTS,0,model.p.length/3);gl.endTransformFeedback();gl.getBufferSubData(gl.TRANSFORM_FEEDBACK_BUFFER,0,actual);
   for(let i=0;i<model.p.length;i+=3){
    const raw=model.p.slice(i,i+3).map(n=>Math.round(n*model.scale*3));raw[2]=-raw[2];
    const p=f.modelPoint(raw,model.scale,basis,{x:640,y:219,z:-512}),screen=f.projectPoint(p,view.projection,false);
    const expected=[screen.screenX*2/1240-1,1-screen.screenY*2/960,(screen.z+view.config.depth)/16384-1];
    for(let j=0;j<3;j++){const error=Math.abs(actual[i+j]-expected[j]);maxError=Math.max(maxError,error);if(error>1e-6)throw new Error(JSON.stringify({raw,angle,actual:[...actual.slice(i,i+3)],expected,error}));}
    modelCount++;
   }
  }
  view.dispose();return {count,modelCount,maxError,error:gl.getError()};
 });
 assert.equal(result.error,0);assert.deepEqual(errors,[]);console.log(`PASS: ${result.count} WebGL2 projected points exactly match the CPU-compared native projection`);
 console.log(`PASS: ${result.modelCount} WebGL model vertices match native transforms; maximum clip-space error ${result.maxError}`);
 const picking=await page.evaluate(async()=>{
  const {GameScene}=await import('/app/scene.ts'),m=await import('/app/model.ts'),w=m.createWorld();w.paused=true;w.inputMask=0;
  const host=document.createElement('div');Object.assign(host.style,{position:'fixed',inset:'0 0 0 200px'});document.body.append(host);
  const scene=new GameScene(host,document.createElement('canvas'),document.createElement('canvas'),w,()=>{},()=>{}),geometry=scene.terrain.geometry,positions=geometry.getAttribute('position'),indices=geometry.index;
  const triangles=[];
  for(let i=0;i<indices.count;i+=3){const p=[0,1,2].map(j=>{const id=indices.getX(i+j);return {x:positions.getX(id),y:positions.getY(id),z:positions.getZ(id)};});if(p.every(p=>p.x>=8&&p.x<=10&&p.z>=32&&p.z<=34))triangles.push(p);}
  let checked=0;
  for(const angle of [0,.6,1.2])for(const p of triangles){
   scene.focus(m.HOME);scene.cameraBearing=angle;scene.updateView();
   const projected=p.map(p=>scene.view.screen(p,scene.camera));scene.mouse.set(projected.reduce((n,p)=>n+p.x/3,0),projected.reduce((n,p)=>n+p.y/3,0));
   const hit=scene.view.pick(scene.mouse,[scene.terrain],scene.camera),expected={x:p.reduce((n,p)=>n+p.x/3,0),z:p.reduce((n,p)=>n+p.z/3,0)};
   if(!hit||Math.hypot(hit.point.x-expected.x,hit.point.z-expected.z)>1e-6)throw new Error(JSON.stringify({angle,hit:hit?.point,expected}));checked++;
  }

  // Exercise unwrapped render centers directly: focus commands normalize their targets.
  // Periodic copies must pick the same map point without folding seam triangles.
  for(const [x,z] of [[256,0],[-256,0],[0,256],[0,-256],[256,256]]){
   scene.viewPoint={x:m.HOME.x+x,z:m.HOME.z+z};scene.updateView();
   const p=triangles[0],projected=p.map(p=>scene.view.screen({x:p.x+x,y:p.y,z:p.z+z},scene.camera,true));
   scene.mouse.set(projected.reduce((n,p)=>n+p.x/3,0),projected.reduce((n,p)=>n+p.y/3,0));
   const hit=scene.view.pick(scene.mouse,[scene.terrain],scene.camera),expected={x:p.reduce((n,p)=>n+p.x/3,0),z:p.reduce((n,p)=>n+p.z/3,0)};
   if(!hit||Math.hypot(hit.point.x-expected.x,hit.point.z-expected.z)>1e-6)throw new Error(JSON.stringify({tile:[x,z],hit:hit?.point,expected}));checked++;
  }

  scene.focus(m.HOME);scene.focus({x:m.HOME.x+256,z:m.HOME.z});const wrapped=Math.hypot(scene.viewPoint.x-m.HOME.x,scene.viewPoint.z-m.HOME.z)<1e-9;
  scene.dispose();host.remove();return {checked,wrapped};
 });
 assert.ok(picking.checked>0&&picking.wrapped);assert.deepEqual(errors,[]);console.log(`PASS: ${picking.checked} visible triangle picks invert the rendered projection; camera wraps at 256 map units`);
}finally{await browser.close();}
