import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createFootprints, stampFootprints } from '../app/footprints.ts'
import { createWorld, command, nativePosition } from '../app/model.ts'
import { advanceGame } from '../app/game-clock.ts'
import { readTerrainTextures, terrainAtlas, updateFootprintTiles } from '../app/terrain-texture.ts'
import fixture from './fixtures/footprints.json' with { type: 'json' }

const hash = b => createHash('sha256').update(b).digest('hex')
test('footprint history matches native ring replacement and its per-cell pixel counts', () => {
  const f = createFootprints(), points = [...fixture.points]
  for (let i=0;i<1100;i++) points.push([1024+i%32*16,2048+Math.floor(i/32)%32*16])
  for (let i=0;i<800;i++) points.push([1234,2345])
  for (let i=0;i<17000;i++) points.push([i*157&65535,i*359&65535])
  for (let i=0;i<points.length;i++) {
    stampFootprints(f, ...points[i])
    const expected=fixture.checkpoints.find(c=>c.at===i)
    if (!expected) continue
    const marks=Buffer.alloc(65536*8),cells=Buffer.alloc(16384*10)
    for(let n=0;n<65536;n++){marks.writeUInt32LE(f.positions[n],n*8);marks.writeInt32LE(f.next[n],n*8+4)}
    for(let n=0;n<16384;n++){
      cells.writeInt32LE(f.tails[n],n*10);cells.writeInt32LE(f.heads[n],n*10+4);cells.writeUInt16LE(f.totals[n],n*10+8)
      const pixels=new Uint16Array(1024)
      for(let j=f.heads[n];j>=0;j=f.next[j]){const p=f.positions[j];pixels[((p>>>16&496)>>4)*32+((p&496)>>4)]++}
      assert.deepEqual(f.pixels.get(n)??new Uint16Array(1024),pixels)
    }
    assert.deepEqual({at:i,cursor:f.cursor,marks:hash(marks),cells:hash(cells)},expected)
  }
  f.dirty.clear()
  for(let i=0;i<400;i++)stampFootprints(f, 1234,2345)
  f.dirty.clear();stampFootprints(f, 1234,2345)
  assert.equal(f.dirty.size,0,'saturated pixels do not upload unchanged colors')
})

test('partial footprint shading equals a complete native-palette atlas rebuild', () => {
  const w=createWorld(),raw=readFileSync('public/original/landscape.bin'),t=readTerrainTextures(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength))
  const atlas=terrainAtlas(w.land,t),before=hash(atlas.pixels)
  for(const u of w.units.slice(0,8)){const p=nativePosition(w,u);stampFootprints(w.footprints, p.x,p.y)}
  // Exercise actual land and all atlas seams, plus overlapping footprints.
  for(const p of [[0,0],[65535,65535],[34816,30208],[34832,30224]])stampFootprints(w.footprints, ...p)
  const ranges=[]
  updateFootprintTiles(atlas,w.land,t,w.footprints,(x,y)=>ranges.push({x,y}))
  assert.notEqual(hash(atlas.pixels),before)
  assert.equal(hash(atlas.pixels),hash(terrainAtlas(w.land,t,undefined,32,w.footprints.pixels).pixels))
  assert.ok(ranges.every(r=>r.x>=0&&r.y>=0&&r.x+32<=4096&&r.y+32<=4096))
  assert.equal(ranges.length,w.footprints.dirty.size)
  assert.ok(ranges.length*4096<atlas.pixels.length/100)
})

test('live walking footprints use the elapsed animation clock, including pause and disabled trails', () => {
  const run=hz=>{
    const w=createWorld();w.inputMask=0;w.flyby.flags=0;w.buildings=[];w.shrines=[];w.terrain.fill(3);w.land.heights.fill(135);w.land.flags.fill(0);w.land.categories.fill(0);w.land.buildingIds.fill(0)
    const u=w.units.find(u=>u.kind==='brave'&&u.team==='blue');Object.assign(u,{x:10,z:10,inside:null,work:null,native:undefined,flight:undefined,path:[]});w.units=[u];w.selected=[u.id]
    command(w,{x:22,z:10});assert.ok(u.path.length)
    const clock={animationTime:0,animationFrame:0}
    for(let i=0;i<hz*2;i++)advanceGame(w,clock,1/hz)
    assert.ok(w.footprints.cursor>0)
    const cursor=w.footprints.cursor
    w.paused=true;advanceGame(w,clock,2);assert.equal(w.footprints.cursor,cursor)
    w.paused=false;w.levelFlags2|=0x10000;advanceGame(w,clock,0.1);assert.equal(w.footprints.cursor,cursor)
    return [cursor,hash(new Uint8Array(w.footprints.positions.buffer))]
  }
  const expected=run(5)
  for(const hz of [30,60,120,144,240])assert.deepEqual(run(hz),expected)
})
