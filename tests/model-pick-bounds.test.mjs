import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { registerHooks, stripTypeScriptTypes } from 'node:module'
const app = new URL('../app/', import.meta.url)
registerHooks({ load(url, context, next) {
  if (url.startsWith(app.href) && url.endsWith('.ts')) return { format: 'module', shortCircuit: true, source: stripTypeScriptTypes(readFileSync(new URL(url), 'utf8'), { mode: 'transform' }) }
  return next(url, context)
} })
const { ModelPickBounds } = await import('../app/model-pick-bounds.ts')
const { ownedStaticModelAsset } = await import('../app/owned-static-model.ts')
const { nativeModelResource } = await import('../app/model-resources.ts')
const { modelStage, modelFaceVisible } = await import('../app/model-faces.ts')
const { modelPoint, projectPoint, modelMatrix, cameraMatrix, cameraPreset } = await import('../app/projection.ts')
const { inHitBounds, inHitTriangle, modelHitBounds } = await import('../app/world-picking.ts')
const identity = [16384,0,0,0,16384,0,0,0,16384], zero = {x:0,y:0,z:0}
const projection = (index = 0, yaw = 0) => { const config = cameraPreset(index); return { ...config, matrix: cameraMatrix(yaw, config.pitch), centerX: 400, centerY: 300, width: 800, height: 600, fractionX: 4, fractionY: 4, pixelScaleX: 1/16, pixelScaleY: 1/16 } }
function containsBounds(outer, inner) {
  assert.ok(inHitBounds({ x: inner.x, y: inner.y }, outer), JSON.stringify({outer,inner}))
  assert.ok(inHitBounds({ x: inner.x + inner.width, y: inner.y + inner.height }, outer), JSON.stringify({outer,inner}))
}

test('actual immutable source and Float32 stage positions are enclosed for every native asset', () => {
  const bank2 = JSON.parse(readFileSync(new URL('original-models.json', app))), bank6 = JSON.parse(readFileSync(new URL('original-models-bank6.json', app))).models
  const cases = [...Object.keys(bank2).map(Number).map(id => [id,2]), ...Object.keys(bank6).map(Number).map(id => [id,6])]
  const workspace = new ModelPickBounds(); let vertices = 0, admitted = 0
  for (const [id, bank] of cases) {
    const asset = ownedStaticModelAsset(nativeModelResource(id, bank)); assert.ok(asset)
    const { data } = asset.resource
    for (let stage = 0; stage < 5; stage++) for (let variant = 0; variant < 4; variant++) {
      const p = new Float32Array(modelStage(data, stage).p), camera = projection(variant * 3, variant * 497)
      const basis = modelMatrix(variant * 471, variant * 87, -variant * 73), origin = { x: variant * 320 - 500, y: variant * 12, z: variant * 74 - 400 }, size = variant ? variant * 137 : data.scale
      assert.equal(workspace.enclose(asset.bounds, size, basis, origin, camera), true, `${bank}:${id}:${stage}:${variant}`); admitted++
      const points = []; let rendered = 0, vertex = 0
      for (let face = 0; face < data.tiles.length; face++) {
        const count = data.faces[face * 2] === 3 ? 3 : 6, visible = modelFaceVisible(data, face, stage)
        for (let i = 0; i < count; i++) {
          const values = visible ? [...p.slice((rendered+i)*3, (rendered+i+1)*3)] : data.p.slice((vertex+i)*3, (vertex+i+1)*3)
          const raw = values.map((value, axis) => Math.round((axis === 2 ? -value : value) * data.scale * 3))
          const bounds = asset.bounds
          assert.ok(raw[0] >= bounds.minX && raw[0] <= bounds.maxX && raw[1] >= bounds.minY && raw[1] <= bounds.maxY && raw[2] >= bounds.minZ && raw[2] <= bounds.maxZ)
          points.push(projectPoint(modelPoint(raw, size, basis, origin), camera)); vertices++
        }
        if (visible) rendered += count
        vertex += count
      }
      containsBounds(workspace.bounds, modelHitBounds(points).bounds)
    }
  }
  assert.equal(cases.length, 88); assert.equal(admitted, 1760); assert.equal(vertices, 711960)
})

// Independently spell the actual signed native arithmetic in BigInt. There are no
// floating products before final screen conversion in this oracle.
const signed = value => BigInt.asIntN(32, value), mul = (a,b) => signed(BigInt(a)*BigInt(b))
const row = (m, p, start) => signed(mul(m[start],p[0])+mul(m[start+1],p[1])+mul(m[start+2],p[2])) >> 14n
function exact(raw, size, basis, origin, v) {
  const local = raw.map(n => mul(n,size) >> 8n), native = [0,3,6].map((offset,i) => Number(row(basis,local,offset))+[origin.x,origin.y,origin.z][i])
  const x = signed(mul(native[0],v.matrix[0])+mul(native[2],v.matrix[2])) >> 14n, z = row(v.matrix,native,6)
  let y = row(v.matrix,native,3)
  const radius = signed(mul(signed(x*2n),signed(x*2n))+mul(signed(z*2n),signed(z*2n)))
  y = signed(y - (signed((radius*BigInt(v.curvature)) >> 16n) >> 16n))
  const depth = signed(z+BigInt(v.depth)); assert.ok(depth > 0n)
  const perspective = signed(1n << BigInt((v.perspective+16)&31)) / depth
  const sx = signed(((mul(v.scale,x) >> BigInt((16-v.fractionX)&31))*perspective) >> 16n)
  const sy = signed(((mul(v.scale,y) >> BigInt((16-v.fractionY)&31))*perspective) >> 16n)
  return { screenX: Math.fround(v.pixelScaleX*Number(sx)+v.centerX), screenY: Math.fround(v.centerY-v.pixelScaleY*Number(sy)), z:Number(z) }
}

test('signed wrap, negative scale, curvature interior and perspective endpoints match BigInt samples', () => {
  const workspace = new ModelPickBounds(), v = { ...projection(), matrix: identity, depth: 1000000 }
  let seed = 0xa917c3, accepted = 0, fallback = 0
  const next = () => seed = (Math.imul(seed,1664525)+1013904223) >>> 0
  for (let n = 0; n < 900; n++) {
    const pairs = Array.from({ length:3 }, () => { const low = (next()%400000)-200000; return [low,low+next()%30000] })
    const raw = { minX:pairs[0][0],maxX:pairs[0][1],minY:pairs[1][0],maxY:pairs[1][1],minZ:pairs[2][0],maxZ:pairs[2][1] }
    const size = n%7 ? (next()%2048)-1024 : next()|0, basis = n%5 ? modelMatrix(next()&2047,next()&2047,next()&2047) : Array.from({length:9},()=>next()|0), origin = {x:(next()%65536)-32768,y:next()%5000,z:(next()%65536)-32768}
    v.curvature = n%3 ? 1000 : -1000; v.pixelScaleX = n%4 ? 1/16 : -1/16; v.fractionX = n%8 ? 4 : 40
    if (!workspace.enclose(raw,size,basis,origin,v)) { fallback++; continue }
    accepted++
    for (let sample = 0; sample < 16; sample++) {
      const input = pairs.map(([lo,hi],axis) => sample < 8 ? (sample & (1<<axis) ? hi : lo) : lo+next()%(hi-lo+1))
      const expected = exact(input,size,basis,origin,v), actual = projectPoint(modelPoint(input,size,basis,origin),v)
      assert.deepEqual([actual.screenX,actual.screenY,actual.z],[expected.screenX,expected.screenY,expected.z])
      containsBounds(workspace.bounds,modelHitBounds([expected]).bounds)
    }
  }
  assert.ok(accepted > 600); assert.ok(fallback > 0)
})

test('inclusive sentinels, ties, nonpositive depth and unsafe inputs preserve fallback rules', () => {
  const workspace = new ModelPickBounds(), raw = {minX:-100,maxX:100,minY:0,maxY:0,minZ:0,maxZ:0}
  const v = { ...projection(), matrix: identity, depth: 1000, centerX: -100.5, centerY: 2**29 }
  assert.equal(workspace.enclose(raw,256,identity,zero,v),true)
  for (let x = -100; x <= 100; x++) containsBounds(workspace.bounds,modelHitBounds([projectPoint(modelPoint([x,0,0],256,identity,zero),v)]).bounds)
  assert.ok(workspace.bounds.x+workspace.bounds.width >= -1, 'legacy negative-screen right sentinel')
  assert.ok(workspace.bounds.y <= 0xfffffff, 'legacy huge-screen top sentinel')
  for (const [r,size,basis,origin,camera] of [
    [raw,1.5,identity,zero,v], [raw,256,[...identity,0],zero,v], [{...raw,minX:101},256,identity,zero,v],
    [raw,256,identity,{...zero,x:Infinity},v], [raw,256,identity,zero,{...v,depth:0}],
    [raw,256,identity,zero,{...v,centerX:Infinity}], [raw,256,identity,zero,{...v,centerX:2**31}],
    [{...raw,minX:-2147483648,maxX:2147483647},2147483647,identity,zero,v],
  ]) assert.equal(workspace.enclose(r,size,basis,origin,camera),false)
  const degenerate = [{x:1,y:1},{x:1,y:1},{x:1,y:1}], far = {x:1e6,y:-1e6}
  assert.equal(inHitTriangle(far,degenerate),true)
  assert.equal(inHitBounds(far,modelHitBounds(degenerate.map(p=>({screenX:p.x,screenY:p.y,z:0}))).bounds),false, 'the mandatory model bounds gate, not triangle AABB assumptions, licenses rejection')
})
