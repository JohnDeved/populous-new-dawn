import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { inflateSync } from 'node:zlib'
import { createNativeTerrain } from '../app/native-terrain.ts'
import { createTornado, stepTornado } from '../app/tornado.ts'
import { tornadoAppearance, tornadoPalette, tornadoColor, validTornadoAppearance } from '../app/tornado-appearance.ts'
import { scaledEffectSize } from '../app/projection.ts'
const fixture = JSON.parse(readFileSync(new URL('./fixtures/tornado-original.json', import.meta.url))),
  art = JSON.parse(readFileSync(new URL('../app/original-tornado.json', import.meta.url))),
  sha = bytes => createHash('sha256').update(bytes).digest('hex'),
  callbacks = { people: () => [], buildings: () => [], scenery: () => [], capture() {}, damage() {}, damageScenery() {}, sound() {} }

test('independent retained PSFB bytes reconstruct every shipped column pixel', () => {
  const png = readFileSync(new URL('../public/original/tornado.png', import.meta.url)), chunks = []
  assert.equal(sha(png), art.pngSHA256)
  for (let at = 8; at < png.length;) {
    const length = png.readUInt32BE(at), type = png.toString('ascii', at + 4, at + 8)
    if (type === 'IDAT') chunks.push(png.subarray(at + 8, at + 8 + length))
    at += 12 + length
  }
  const rows = inflateSync(Buffer.concat(chunks)), lookup = Buffer.from(fixture.rgbaLookup, 'base64')
  assert.equal(art.frames.length, 16)
  assert.deepEqual(art.descriptor34, fixture.descriptor34)
  for (const [index, source] of fixture.frames.entries()) {
    const raw = Buffer.from(source.rawPSFB, 'base64'), rgba = Buffer.alloc(source.w * source.h * 4)
    let cursor = 0
    for (let y = 0; y < source.h; y++) {
      let x = 0
      for (;;) {
        const n = raw.readInt8(cursor++)
        if (!n) break
        if (n < 0) x -= n
        else for (let i = 0; i < n; i++, x++) lookup.copy(rgba, (y * source.w + x) * 4, raw[cursor] * 4, raw[cursor++] * 4 + 4)
        assert.ok(x <= source.w)
      }
    }
    assert.equal(sha(rgba), source.rgbaSHA256)
    const frame = art.frames[index]
    assert.equal(frame.source, source.source)
    for (let y = 0; y < frame.h; y++) {
      const offset = (frame.y + y) * (art.width * 4 + 1)
      assert.equal(rows[offset], 0, 'original importer PNG uses unfiltered rows')
      assert.deepEqual(rows.subarray(offset + 1 + frame.x * 4, offset + 1 + (frame.x + frame.w) * 4), rgba.subarray(y * frame.w * 4, (y + 1) * frame.w * 4))
    }
  }
})

test('instruction-derived fixed variants, horizontal widths and native palette boundaries', () => {
  const widths = [160,80,53,40,31,26,22,20,17,15,14,13,12,11,10,10]
  for (let birth = 0; birth < 16; birth++) for (let ordinal = 0; ordinal < 16; ordinal++) {
    const p = tornadoAppearance(ordinal, birth, false)
    assert.equal(p.frame, (birth + 16 - ordinal) % 16)
    assert.ok(validTornadoAppearance(p))
    assert.deepEqual(scaledEffectSize({ w: 80, h: 50 }, { scaleX: p.scaleX, scaleY: 256 }, 0, 0, {}), { width: widths[ordinal], height: 50 })
  }
  for (const [cliff, expected] of [[127,4],[128,-2],[200,-2],[201,3],[212,3],[213,-1]]) {
    assert.equal(tornadoPalette(false, cliff), expected)
    assert.equal(tornadoPalette(true, cliff), 5)
  }
  for (const [palette, rgb] of Object.entries(fixture.paletteTints)) assert.deepEqual(tornadoColor(+palette), rgb)
  assert.equal(validTornadoAppearance({ x: 0, y: 0, h: 0 }), false)
})

test('palette propagation and head removal preserve original variants and widths', () => {
  const land = createNativeTerrain(new Int16Array(16384).fill(512)), w = { land, randomState: 42 },
    tornado = createTornado(land, {x:16384,y:16384,h:512}, {x:0,y:0}, 0, w, 7)
  tornado.step = 0
  tornado.particles.forEach((p, i) => p.palette = i % 2 ? 3 : 4)
  const initial = tornado.particles.map(p => ({ ordinal:p.ordinal, frame:p.frame, scaleX:p.scaleX })), prior = tornado.particles.map(p => p.palette)
  stepTornado(w, tornado, callbacks)
  assert.deepEqual(tornado.particles.slice(0,-1).map(p=>p.palette), prior.slice(1))
  assert.equal(tornado.particles.at(-1).palette, 4)
  tornado.phase = 1; tornado.remaining = 24
  for (let n = 1; n <= 16; n++) {
    stepTornado(w, tornado, callbacks)
    assert.deepEqual(tornado.particles.map(({ordinal,frame,scaleX})=>({ordinal,frame,scaleX})), initial.slice(n))
  }
  const copy = structuredClone(tornado), other = {land, randomState:w.randomState}
  while (tornado.phase !== 2) {
    assert.equal(stepTornado(w,tornado,callbacks), stepTornado(other,copy,callbacks))
    assert.deepEqual(tornado,copy); assert.equal(w.randomState,other.randomState)
  }
})

test('elevated initial child heights change no controller outcome or RNG', () => {
  const land=createNativeTerrain(new Int16Array(16384).fill(512)), a={land,randomState:123}, b={land,randomState:123},
    low=createTornado(land,{x:16384,y:16384,h:512},{x:0,y:0},0,a,3),
    high=createTornado(land,{x:16384,y:16384,h:1536},{x:0,y:0},0,b,3)
  assert.equal(a.randomState,b.randomState)
  assert.equal(high.particles[0].h-low.particles[0].h,1024)
  for(let i=0;i<224;i++) {
    assert.equal(stepTornado(a,low,callbacks),stepTornado(b,high,callbacks))
    assert.deepEqual(low,high);assert.equal(a.randomState,b.randomState)
  }
})

test('current checkpoint retains active column identity; missing old fields are rejected', async () => {
  const { createGameStore } = await import('../app/game-store.ts'), store = createGameStore(), world = store.getWorld(),
    tornado = createTornado(world.land, {x:16384,y:16384,h:512}, {x:0,y:0}, 0, world, 9)
  world.effects.push({ id:world.nextId++, kind:'tornado', x:56,z:-72,age:0,duration:Infinity,tornado })
  await store.saveCheckpoint()
  const before = structuredClone(tornado)
  tornado.particles.shift()
  assert.equal(store.loadCheckpoint(), true)
  assert.deepEqual(store.getWorld().effects.find(f=>f.tornado).tornado, before)
  delete store.getWorld().effects.find(f=>f.tornado).tornado.particles[0].ordinal
  await assert.rejects(store.saveCheckpoint(), /incompatible/)
  assert.equal(store.loadCheckpoint(), true, 'failed save must not overwrite previous checkpoint')
  assert.deepEqual(store.getWorld().effects.find(f=>f.tornado).tornado, before)
  store.restart()
  assert.ok(!store.getWorld().effects.some(f=>f.tornado))
})

test('real cast arrival keeps birth variants across presentation schedules and pause', async () => {
  const { createWorld, cast } = await import('../app/model.ts'), { advanceGame } = await import('../app/game-clock.ts')
  const run = schedule => {
    const w=createWorld(), clock={animationTime:0,animationFrame:0}, shaman=w.units.find(u=>u.team==='blue'&&u.kind==='shaman')
    Object.assign(shaman,{x:0,z:20,path:[],casting:null})
    w.units=[shaman];w.buildings=[];w.trees=[];w.selected=[shaman.id];w.shots.tornado=1
    assert.ok(cast(w,'tornado',{x:0,z:8}))
    let n=0
    const turn=()=>{
      const target=w.turn+1
      while(w.turn<target) advanceGame(w,clock,Math.min(schedule[n++%schedule.length],(target-w.turn)/12-w.pendingTime))
    }
    for(let i=0;!w.effects.some(f=>f.tornado)&&i<64;i++)turn()
    const fx=w.effects.find(f=>f.tornado), appearance=()=>fx.tornado.particles.map(({ordinal,frame,scaleX})=>({ordinal,frame,scaleX})), born=appearance()
    assert.equal(born.length,16)
    for(let i=0;i<20;i++)turn()
    assert.deepEqual(appearance(),born,'column frames do not cycle with global animation')
    w.paused=true
    const frozen=structuredClone(fx.tornado)
    for(let i=0;i<10;i++)advanceGame(w,clock,1)
    assert.deepEqual(fx.tornado,frozen)
    return {born,turn:w.turn,randomState:w.randomState,particles:fx.tornado.particles}
  }
  const expected=run([1/60])
  for(const schedule of [[1/30],[1/120],[1/144],[.002,.04,.17]])assert.deepEqual(run(schedule),expected)
})
