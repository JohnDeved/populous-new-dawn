import test from 'node:test'
import {readFileSync} from 'node:fs'
import hud from '../app/original-hud.json' with {type:'json'}
import assert from 'node:assert/strict'
import {healthBarPixels} from '../app/hud-health.ts'
import fixture from './fixtures/hud-health.json' with {type:'json'}
import manifest from '../decomp/exports.json' with {type:'json'}

test('shaman health fill follows native integer bounds and absent/overfull cases',()=>{
  assert.equal(fixture.executableSha256,manifest.executableSha256)
  assert.equal(fixture.cases.length,fixture.pixels.length)
  assert.deepEqual(fixture.cases.map(([maximum,health])=>healthBarPixels(health??0,maximum)),fixture.pixels)
})


test('HUD atlas metadata matches the PNG and contains every imported sprite',()=>{
  const png=readFileSync(new URL('../public/original/hud.png',import.meta.url))
  assert.deepEqual([hud.width,hud.height],[png.readUInt32BE(16),png.readUInt32BE(20)])
  for(const [id,r] of Object.entries(hud.rects))
    assert.ok(r.x>=0&&r.y>=0&&r.x+r.w<=hud.width&&r.y+r.h<=hud.height,id)
})
