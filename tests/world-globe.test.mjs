import assert from 'node:assert/strict'
import test from 'node:test'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import {createGlobeMesh,globeShade} from '../app/world-globe-mesh.ts'
import {rasterGlobe,globeBackingSize} from '../app/world-globe-raster.ts'

const hash = bytes => createHash('sha256').update(bytes).digest('hex')
test('reference subdivision, native angular stitch and seams retain source recipe',()=>{
 const {vertices,triangles,ringCounts}=createGlobeMesh(128)
 assert.deepEqual(ringCounts,[1,6,13,21,34,60])
 assert.equal(vertices.length,135)
 assert.equal(triangles.length/3,209)
 assert.deepEqual(triangles.slice(0,21),[0,2,1,0,3,2,0,4,3,0,5,4,0,6,5,0,6,0,6,0,1])
 assert.deepEqual(triangles.slice(-6),[74,134,41,134,41,75])
 const edges=new Map()
 for(let i=0;i<triangles.length;i+=3){
  const ids=triangles.slice(i,i+3)
  assert.ok(ids.every(id=>id>=0&&id<vertices.length))
  if(new Set(ids).size<3)continue
  const [a,b,c]=ids.map(id=>vertices[id])
  // The source's first closing seam has reversed winding; native culling is disabled.
  const reversed=[24,58,113,207].includes(i/3)
  const area=(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)
  assert.ok(reversed ? area<0 : area>0)
  for(let j=0;j<3;j++){
   const pair=[ids[j],ids[(j+1)%3]].sort((a,b)=>a-b).join(',')
   edges.set(pair,(edges.get(pair)||0)+1)
  }
 }
 assert.equal([...edges.values()].filter(n=>n===1).length,60)
 assert.ok([...edges.values()].every(n=>n===1||n===2))
 assert.ok(vertices.every(v=>Math.hypot(v.x,v.y)<1&&v.diffuse>=112&&v.diffuse<=255&&v.specular>=0&&v.specular<=84))
 assert.ok(Math.abs(Math.hypot(vertices[75].x,vertices[75].y)-Math.sin(Math.fround(Math.fround(Math.fround(Math.PI)*.5)/6)*5))<1e-6)
})
test('radial UVs are unwrapped, with light toward screen upper-right',()=>{
 const mesh=createGlobeMesh(128,.1,.2)
 assert.deepEqual(mesh.vertices[0],{x:0,y:-0,u:Math.fround(.1),v:Math.fround(.2),diffuse:255,specular:22})
 assert.ok(mesh.vertices.some(v=>v.u<0)&&mesh.vertices.some(v=>v.v<0))
 assert.ok(globeShade(.5,-.5)>globeShade(-.5,.5))
 const theta=Math.fround(Math.fround(Math.PI)*.5/6)
 assert.equal(mesh.vertices[1].u,Math.fround(.1-.25*theta))
 assert.equal(mesh.vertices[1].v,Math.fround(.2))
 for(const radius of [1,2,8,20,64,128,255]){
  const m=createGlobeMesh(radius)
  assert.ok(m.vertices.length<=2048&&m.triangles.length/3<=4096)
 }
 for(const radius of [0,-1,256,Infinity,NaN])assert.throws(()=>createGlobeMesh(radius),RangeError)
})
test('reference mesh does not disappear at large CSS sizes or high DPR',()=>{
 assert.equal(globeBackingSize(345.6,2),691)
 assert.equal(globeBackingSize(691.2,2),1382)
 assert.equal(globeBackingSize(3000,4),2048)
 assert.equal(globeBackingSize(0,2),0)
 assert.equal(globeBackingSize(100,NaN),100)
 const texture=new Uint8ClampedArray(128*128*4).fill(128)
 for(const size of [1,64,512]){
  const pixels=rasterGlobe(texture,size)
  assert.equal(pixels.length,size*size*4)
  assert.ok(pixels.some((v,i)=>i%4===3&&v===255))
  if(size>1)assert.equal(pixels[3],0)
 }
 assert.throws(()=>rasterGlobe(new Uint8ClampedArray(4),32),RangeError)
 assert.throws(()=>rasterGlobe(texture,2049),RangeError)
})
test('triangle raster interpolates vertex light, rather than recomputing fragment light',()=>{
 const texture=new Uint8ClampedArray(128*128*4).fill(100)
 const pixels=rasterGlobe(texture,128)
 const mesh=createGlobeMesh(128)
 let tested=0
 for(let i=0;i<mesh.triangles.length;i+=3){
  const [a,b,c]=mesh.triangles.slice(i,i+3).map(id=>mesh.vertices[id]).map(v=>({...v,x:(v.x+1)*64,y:(v.y+1)*64}))
  const edge=(a,b,x,y)=>(b.x-a.x)*(y-a.y)-(b.y-a.y)*(x-a.x)
  const area=edge(a,b,c.x,c.y)
  if(area<5)continue
  const x=Math.floor((a.x+b.x+c.x)/3),y=Math.floor((a.y+b.y+c.y)/3)
  const wa=edge(b,c,x+.5,y+.5)/area,wb=edge(c,a,x+.5,y+.5)/area,wc=1-wa-wb
  if(Math.min(wa,wb,wc)<.05)continue
  const value=100*(wa*a.diffuse+wb*b.diffuse+wc*c.diffuse)/255+wa*a.specular+wb*b.specular+wc*c.specular
  assert.ok(Math.abs(pixels[(y*128+x)*4]-value)<=.5)
  tested++
 }
 assert.ok(tested>100)
})
test('globe importer keeps tile order and averages decoded RGB, with opaque index zero',()=>{
 const script=`import importlib.util
s=importlib.util.spec_from_file_location('g','scripts/import-world-selector-globes.py')
g=importlib.util.module_from_spec(s);s.loader.exec_module(g)
p=bytearray(1024)
for i,c in enumerate([(20,30,40),(60,70,80),(100,110,120),(140,150,160)]): p[i*4:i*4+3]=bytes(c)
t=bytes([0])*65536+bytes([1])*65536+bytes([2])*65536+bytes([3])*65536
out=g.decode_globe(t,p)
for (x,y),c in zip([(0,0),(64,0),(0,64),(64,64)],[(20,30,40),(60,70,80),(100,110,120),(140,150,160)]): assert out[(y*128+x)*3:(y*128+x)*3+3]==bytes(c)
t=bytearray(t);t[0]=3
assert g.decode_globe(t,p)[:3]==bytes([27,37,47])
for t,p in [(b'',p),(t,b'')]:
 try: g.decode_globe(t,p);raise AssertionError('accepted malformed input')
 except ValueError: pass
`
 const run=spawnSync('python3',['-c',script],{encoding:'utf8'})
 assert.equal(run.status,0,run.stderr)
})
test('mission-specific globe assets have independent source and output provenance',()=>{
 const root='public/original/world-selector/globes/'
 const provenance=JSON.parse(readFileSync(root+'provenance.json'))
 assert.equal(provenance.assets.length,3)
 assert.deepEqual(provenance.assets.map(a=>a.bank),[12,28,25])
 for(const asset of provenance.assets){
  assert.equal(hash(readFileSync(root+asset.output)),asset.outputSha256)
  assert.equal(asset.width,128);assert.equal(asset.height,128)
  assert.equal(Object.keys(asset.sources).length,3)
  assert.ok(asset.sources['data/plstx00'+asset.mission+'.dat'])
 }
 assert.equal(new Set(provenance.assets.map(a=>a.rgbSha256)).size,3)
})
