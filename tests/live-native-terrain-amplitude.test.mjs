import assert from 'node:assert/strict'
import test from 'node:test'
import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {loadSceneFixture} from './support/bloodlust-scene.mjs'

test('004bd700 table ranges are consumed by the actual authored Mission 1 CPU globe atlas', async () => {
  const {createWorld}=await loadSceneFixture()
  const {worldEnvironment}=await import('../app/world-environment.ts')
  const {readTerrainTextures,terrainAtlas}=await import('../app/terrain-texture.ts')
  const w=createWorld(1)
  assert.equal(worldEnvironment(w).landscape.terrain,'landscape.bin')
  const bytes=readFileSync(new URL('../public/original/landscape.bin',import.meta.url))
  assert.equal(createHash('sha256').update(bytes).digest('hex'),'8b23328932f2aeac33a0ce65e64cc0ab9bc110fe35a812b1d53ab81f9e68f68f')
  const atlas=terrainAtlas(w.land,readTerrainTextures(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.length)),undefined,8)
  assert.equal(atlas.updated,16384)
  const samples=(x,z)=>{
    const at=((z*8+7)*1024+x*8)*4
    return Array.from(atlas.pixels.subarray(at,at+32))
  }
  assert.deepEqual(samples(0,0),[22,36,46,255,25,52,64,255,25,52,64,255,25,52,64,255,33,66,83,255,25,52,64,255,25,52,64,255,33,66,83,255],'low control (cell 7620)')
  assert.deepEqual(samples(60,43),[83,67,55,255,48,59,60,255,99,69,53,255,83,70,31,255,140,116,87,255,83,70,31,255,79,71,15,255,79,71,15,255],'linear control (cell 2048)')
  assert.deepEqual(samples(63,44),[55,66,14,255,55,66,14,255,55,66,14,255,55,66,14,255,55,66,14,255,55,66,14,255,64,70,14,255,64,70,14,255],'upper clamp (cell 1923)')
})
