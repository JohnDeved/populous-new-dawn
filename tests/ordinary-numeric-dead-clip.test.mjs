import test from 'node:test'
import assert from 'node:assert/strict'
import { OrdinaryNumericProjection } from '../app/ordinary-numeric-projection.ts'
import { projectPoint, cameraMatrix } from '../app/projection.ts'
const identity=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]
const base={matrix:[16384,0,0,0,16384,0,0,0,16384],curvature:0,depth:8192,perspective:0,scale:16384,width:640,height:480,centerX:320,centerY:240,fractionX:0,fractionY:0,pixelScaleX:1,pixelScaleY:1}
function oracle(x,y,z,m,cx,cy,p,depth){
 const w=1/(m[3]*x+m[7]*y+m[11]*z+m[15])
 const wx=(m[0]*x+m[4]*y+m[8]*z+m[12])*w,wy=(m[1]*x+m[5]*y+m[9]*z+m[13])*w,wz=(m[2]*x+m[6]*y+m[10]*z+m[14])*w
 const q=projectPoint({x:(Math.round((wx+8)*256)-cx)>>1,y:Math.round(((wy*128)/45)*45),z:(Math.round((-wz-8)*256)-cy)>>1},p,true)
 return [wx,wy,wz,(q.screenX*2)/p.width-1,1-(q.screenY*2)/p.height,(q.z+depth)/16384-1]
}
test('owned numeric values preserve the flagged oracle across rounding, clipping and nonfinite boundaries',()=>{
 const n=new OrdinaryNumericProjection();let seed=0x12345678
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return (seed/2**32-.5)*512}
 const points=[[0,0,0],[-0,-0,-0],[128,1,-128],[-128,-1,128],[NaN,0,0],[0,Infinity,0],[0,0,-Infinity]]
 for(let i=0;i<256;i++)points.push([random(),random()/10,random()])
 const matrices=[identity,[1,0,0,.01,0,1,0,-.001,0,0,1,.02,256,-.125,-256,1]]
 const projections=[base,{...base,matrix:cameraMatrix(700,64),curvature:71,depth:0,scale:65536,width:1440,height:1000,centerX:720,centerY:500},{...base,depth:-8192,perspective:3,pixelScaleX:1.5,pixelScaleY:.75}]
 let cases=0
 for(const p of projections)for(const m of matrices){n.reset();for(const [x,y,z] of points){
  const slot=n.append(x,y,z,m,65535,1,p,8192),expected=oracle(x,y,z,m,65535,1,p,8192)
  for(let j=0;j<6;j++)assert.ok(Object.is(n.values[slot*6+j],expected[j]),`case ${cases} component ${j}`)
  cases++
 }}assert.equal(cases,1578)
})
test('unused private clip flags are not computed for an offscreen owned numeric point',()=>{
 const n=new OrdinaryNumericProjection(),p={...base,centerX:-5000,centerY:-5000}
 const q=projectPoint({x:1024,y:0,z:-1024},p,true);assert.notEqual(q.flags,0)
 n.append(0,0,0,identity,0,0,p,8192)
 // TypeScript private working result is visible only to this focused implementation
 // control. No production consumer reads these flags or exports this object.
 assert.equal(n.projected.flags,0)
 assert.deepEqual(Array.from(n.values.subarray(0,6)),oracle(0,0,0,identity,0,0,p,8192))
})
test('reset and storage growth retain detached numeric outputs and generic clipping stays enabled',()=>{
 const n=new OrdinaryNumericProjection();for(let i=0;i<300;i++)n.append(i,0,0,identity,0,0,base,8192)
 const values=n.values,old=Array.from(values.subarray(0,6));n.reset();assert.equal(n.length,0)
 n.append(1,2,3,identity,0,0,base,8192);assert.equal(n.values,values);assert.deepEqual(old,oracle(0,0,0,identity,0,0,base,8192))
 const p={...base,centerX:-1000};assert.notEqual(projectPoint({x:0,y:0,z:0},p).flags,0)
})
