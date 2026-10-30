import test from 'node:test'
import assert from 'node:assert/strict'
import { assertNativeLockedMissionRejected } from '../scripts/check-browser-world-scene.mjs'

function fixture(change={}) {
  let clicked=false
  const calls=[]
  const locked={
    count:async()=>change.count??1,
    isDisabled:async()=>change.disabled??true,
    getAttribute:async()=>clicked && change.selectsLocked ? 'true' : 'false',
    evaluate:async()=>({x:20,y:30,width:12,height:14,viewportWidth:640,viewportHeight:480,hit:true,...change.target}),
  }
  const available={getAttribute:async()=>clicked && change.deselectsAvailable ? 'false' : 'true'}
  const page={
    mouse:{click:async(x,y)=>{calls.push([x,y]);clicked=true}},
    getByRole(role,{name}) {
      if(role==='button' && name instanceof RegExp) return name.test('Panel Mission 2') ? locked : available
      if(role==='button' && name==='Start Mission 1') return {isEnabled:async()=>!change.startDisabled}
      if(role==='dialog' && name==='Start game') return {isVisible:async()=>!change.closesSelector}
      if(role==='heading' && name==='Loading failed') return {count:async()=>change.loadingFailure?1:0}
      throw new Error(`Unexpected public control: ${role} ${name}`)
    },
    locator(selector) {assert.equal(selector,'.world-viewport canvas');return {count:async()=>change.launches?1:0}},
  }
  return {page,calls}
}

test('native locked-world recovery probe uses one verified real pointer input',async()=>{
  const f=fixture();await assertNativeLockedMissionRejected(f.page);assert.deepEqual(f.calls,[[20,30]])
})
for(const [name,change] of [
  ['ambiguous control',{count:2}],['unlocked control',{disabled:false}],
  ['covered control',{target:{hit:false}}],['empty box',{target:{width:0}}],
  ['nonfinite point',{target:{x:NaN}}],['offscreen point',{target:{x:640}}],
]) test(`native locked-world probe rejects ${name} before input`,async()=>{
  const f=fixture(change);await assert.rejects(assertNativeLockedMissionRejected(f.page));assert.deepEqual(f.calls,[])
})
for(const [name,change] of [
  ['locked selection',{selectsLocked:true}],['lost original selection',{deselectsAvailable:true}],
  ['closed selector',{closesSelector:true}],['gameplay launch',{launches:true}],
  ['loading failure',{loadingFailure:true}],['unavailable original mission',{startDisabled:true}],
]) test(`native locked-world probe rejects ${name} after input`,async()=>{
  const f=fixture(change);await assert.rejects(assertNativeLockedMissionRejected(f.page));assert.deepEqual(f.calls,[[20,30]])
})

// Optional render/lifecycle route regressions. These are synthetic boundaries,
// not execution of IndexedDB, React effects, WebGL or browser default input.
import { readFileSync } from 'node:fs'
import {
  selectorInspectionProfile,
  installSelectorInspectionProfile,
  assertSelectorSceneGeometry,
} from '../scripts/check-browser-world-scene.mjs'

test('selector inspection fixture declares selectable worlds separately from earned completion', () => {
  const initial = selectorInspectionProfile()
  assert.deepEqual(initial, { version: 1, completed: [], nativeCampaign: {
    version: 1, history: 'legacy-completed-only', flags: [4, 4, 4, ...Array(22).fill(0)],
  } })
  assert.deepEqual(selectorInspectionProfile(true), { version: 1, completed: [1, 2], nativeCampaign: {
    version: 1, history: 'legacy-completed-only', flags: [5, 5, 4, ...Array(22).fill(0)],
  } })
  initial.nativeCampaign.flags[0] = 255
  assert.equal(selectorInspectionProfile().nativeCampaign.flags[0], 4, 'callers do not share mutable fixture state')
  for (const invalid of [null, 0, 'complete', []]) assert.throws(() => selectorInspectionProfile(invalid))
})

async function profileBoundary(initial, run, { failWrite = false, wrongReadback = false } = {}) {
  const previous = globalThis.indexedDB
  let stored = structuredClone(initial), reads = 0, reloads = 0, closes = 0
  const writes = [], modes = []
  const database = {
    close() { closes++ },
    transaction(name, mode) {
      assert.equal(name, 'checkpoints'); modes.push(mode)
      let aborted = false, staged, hasWrite = false
      const transaction = {
        error: null,
        abort() { aborted = true; queueMicrotask(() => transaction.onabort?.()) },
        objectStore(storeName) {
          assert.equal(storeName, 'checkpoints')
          return {
            get(key) {
              assert.equal(key, 'profile')
              const request = {}
              queueMicrotask(() => {
                reads++
                request.result = wrongReadback && mode === 'readonly' ? { wrong: true } : structuredClone(stored)
                request.onsuccess()
                queueMicrotask(() => {
                  if (aborted) return
                  if (failWrite && hasWrite) {
                    transaction.error = new Error('supplied transaction abort')
                    transaction.abort(); return
                  }
                  if (hasWrite) { stored = structuredClone(staged); writes.push(structuredClone(stored)) }
                  transaction.oncomplete?.()
                })
              })
              return request
            },
            put(value, key) {
              assert.equal(mode, 'readwrite'); assert.equal(key, 'profile')
              staged = structuredClone(value); hasWrite = true
            },
          }
        },
      }
      return transaction
    },
  }
  globalThis.indexedDB = { open(name, version) {
    assert.equal(name, 'populous-new-dawn'); assert.equal(version, 1)
    const request = {}
    queueMicrotask(() => { request.result = database; request.onsuccess() })
    return request
  } }
  const visible = { or() { return this }, filter() { return this }, first() { return this },
    async waitFor() {}, async isVisible() { return false } }
  const page = {
    getByRole(role, { name }) { assert.equal(role, 'dialog'); assert.ok(['Main menu', 'Opening logo'].includes(name)); return visible },
    async evaluate(callback, argument) { return callback(argument) },
    async reload(options) {
      assert.deepEqual(options, { waitUntil: 'domcontentloaded' })
      assert.ok(reads >= 2, 'committed readback precedes reload')
      assert.ok(closes > reloads, 'database closes before reload')
      reloads++
    },
  }
  try {
    await run({ page, writes, modes, get stored() { return stored }, get reloads() { return reloads }, get closes() { return closes } })
  } finally {
    if (previous === undefined) delete globalThis.indexedDB
    else globalThis.indexedDB = previous
  }
}

test('scene fixture commits and reads back before reload, then advances only its own initial profile', async () => {
  await profileBoundary(undefined, async f => {
    const initial = await installSelectorInspectionProfile(f.page)
    assert.deepEqual(f.stored, selectorInspectionProfile())
    assert.equal(initial.naturallyEarned, false)
    assert.equal(initial.priorProfile, null)
    assert.deepEqual(f.modes, ['readwrite', 'readonly'])
    assert.equal(f.reloads, 1)
    const completed = await installSelectorInspectionProfile(f.page, true)
    assert.deepEqual(completed.priorProfile, selectorInspectionProfile())
    assert.deepEqual(completed.profile, selectorInspectionProfile(true))
    assert.equal(f.writes.length, 2)
    assert.equal(f.reloads, 2)
    assert.equal(f.closes, 2)
  })
})

for (const initial of [{ version: 1, completed: [9] }, selectorInspectionProfile(), null]) {
  test(`initial fixture refuses an existing profile without writing or reload (${JSON.stringify(initial)})`, async () => {
    await profileBoundary(initial, async f => {
      await assert.rejects(installSelectorInspectionProfile(f.page), /refuses unexpected/)
      assert.deepEqual(f.stored, initial); assert.deepEqual(f.writes, [])
      assert.equal(f.reloads, 0); assert.equal(f.closes, 1)
    })
  })
}
for (const initial of [undefined, selectorInspectionProfile(true), { ...selectorInspectionProfile(), retained: 'unrelated' }]) {
  test(`completion fixture refuses missing, changed or extended ownership (${JSON.stringify(initial)})`, async () => {
    await profileBoundary(initial, async f => {
      await assert.rejects(installSelectorInspectionProfile(f.page, true), /refuses unexpected/)
      assert.deepEqual(f.stored, initial); assert.deepEqual(f.writes, [])
      assert.equal(f.reloads, 0); assert.equal(f.closes, 1)
    })
  })
}

test('profile ownership comparison is semantic across object key order', async () => {
  const initial = selectorInspectionProfile()
  const reordered = { nativeCampaign: { flags: initial.nativeCampaign.flags, history: initial.nativeCampaign.history, version: 1 }, completed: [], version: 1 }
  await profileBoundary(reordered, async f => {
    await installSelectorInspectionProfile(f.page, true)
    assert.deepEqual(f.stored, selectorInspectionProfile(true)); assert.equal(f.reloads, 1)
  })
})
test('fixture transaction abort and wrong committed readback stop before reload', async () => {
  for (const option of ['failWrite', 'wrongReadback']) await profileBoundary(undefined, async f => {
    await assert.rejects(installSelectorInspectionProfile(f.page), option === 'failWrite' ? /abort/ : /readback differs/)
    assert.equal(f.reloads, 0); assert.equal(f.closes, 1)
    assert.equal(f.writes.length, option === 'failWrite' ? 0 : 1, 'a failed readback is not silently rolled back or retried')
  }, { [option]: true })
})

function sceneGeometry(width, height) {
  const scale = Math.min(width / 640, height / 480)
  return { cssWidth: width, cssHeight: 480 * scale, panel: {
    x: (width - 638 * scale) / 2, y: height - 61 * scale, width: 638 * scale, height: 61 * scale,
  } }
}
test('widescreen checker accepts full-width canvas with uniformly scaled native panel', () => {
  for (const [width, height] of [[640, 480], [1920, 1080], [3440, 1440], [390, 844]]) {
    const sample = sceneGeometry(width, height)
    assertSelectorSceneGeometry(sample, { width, height })
    if (width / height > 4 / 3) assert.notEqual(sample.cssWidth / sample.cssHeight, 4 / 3)
  }
})
for (const bad of ['narrow-canvas', 'stretched-canvas', 'panel-width', 'panel-height', 'panel-x', 'panel-y', 'nonfinite']) {
  test(`widescreen geometry rejects ${bad}`, () => {
    const sample = sceneGeometry(1920, 1080)
    if (bad === 'narrow-canvas') sample.cssWidth = 1440
    else if (bad === 'stretched-canvas') sample.cssHeight = 1440
    else if (bad === 'nonfinite') sample.panel.x = NaN
    else sample.panel[bad.slice(6)] += 5
    assert.throws(() => assertSelectorSceneGeometry(sample, { width: 1920, height: 1080 }))
  })
}

test('optional renderer/lifecycle routes retain native entry, explicit fixtures and all ownership observations', () => {
  const source = readFileSync(new URL('../scripts/check-browser-world-scene.mjs', import.meta.url), 'utf8')
  const render = source.slice(source.indexOf('export default async function renderEpisode'), source.indexOf('export async function lifecycleEpisode'))
  const lifecycle = source.slice(source.indexOf('export async function lifecycleEpisode'), source.indexOf('// The shipped native selector rejects locked worlds'))
  for (const body of [render, lifecycle]) {
    assert.match(body, /assert\.equal\(receipt\.profile,undefined/)
    assert.match(body, /installSelectorInspectionProfile\(page\)/)
    assert.match(body, /await open\(page\)/)
    assert.doesNotMatch(body, /click\(page,'(?:Back|All missions|Campaign worlds)'\)/)
    assert.doesNotMatch(body, /\.click\(\{\s*force\s*:/)
  }
  assert.match(render, /assertSelectorSceneGeometry\(sample,\{width,height\}\)/)
  assert.match(render, /installSelectorInspectionProfile\(page,true\)/)
  assert.match(render, /await selected\(page,24,22\)/, 'replay selection remains independent from restored progression anchor')
  assert.match(render, /const locked=select\(page,4\)/)
  assert.match(render, /locked\.isDisabled\(\),true/)
  assert.match(render, /page\.mouse\.click\(hit\.x,hit\.y\)/)
  assert.match(render, /assert\.equal\(hit\.owned,true\)/)
  assert.match(render, /ribbonPixels\.some/, 'visible ribbon proof retained')
  assert.match(render, /Math\.max\(sample\.width,sample\.height\)<=4096/, 'backing cap retained')
  assert.match(lifecycle, /page\.keyboard\.press\('F8'\)/)
  assert.match(lifecycle, /name:'Debug missions'/)
  assert.match(lifecycle, /\.count\(\),23/)
  assert.match(lifecycle, /for\(const exit of \['Back','Escape'\]\)/)
  assert.match(lifecycle, /c===document\.querySelector\('canvas\[data-world-scene\]'\)/)
  assert.match(lifecycle, /for \(const replace of \[false,true\]\)/)
  assert.match(lifecycle, /c\.isConnected\),!replace/)
  assert.match(lifecycle, /r\.detachedDraws===0/)
  assert.match(lifecycle, /dataset\.ready\),undefined/)
  assert.match(lifecycle, /button\(page,'Tutorial'\)\.evaluate/)
  assert.match(lifecycle, /page\.locator\('\.world-viewport canvas'\)\.count\(\),0/)
})
