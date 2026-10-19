import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { prepareFrontendAssets, FRONTEND_ASSET_TIMEOUT_MS } from '../app/frontend-assets.ts'
import art from '../app/original-frontend.json' with { type: 'json' }
import { pageEffect, evaluatePage } from './support/follower-nearby-page.mjs'

const flush = () => new Promise(resolve => setImmediate(resolve))
function fixture(t) {
  const requests = [], timers = []
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'Image')
  Object.defineProperty(globalThis, 'Image', { configurable: true, value: class {
    decode() { return new Promise((resolve, reject) => requests.push({ url: this.src, resolve, reject })) }
  } })
  t.after(() => previous ? Object.defineProperty(globalThis, 'Image', previous) : delete globalThis.Image)
  t.mock.method(globalThis, 'setTimeout', (run, delay) => { const timer = { run, delay }; timers.push(timer); return timer })
  t.mock.method(globalThis, 'clearTimeout', timer => { timer.cleared = true })
  t.mock.method(globalThis, 'fetch', (url, options) => new Promise((resolve, reject) => requests.push({ url, options, resolve, reject })))
  const pending = prepareFrontendAssets()
  const complete = (request, invalid = false) => request.resolve(request.url.endsWith('.bin')
    ? { ok: true, arrayBuffer: async () => new ArrayBuffer(invalid ? 1 : art.binaryBytes) } : undefined)
  return { requests, timers, pending, complete }
}

test('frontend prepares all groups concurrently and retains decoded images in a frozen snapshot', async t => {
  const f = fixture(t)
  assert.equal(f.requests.length, 15)
  assert.equal(new Set(f.requests.map(r => r.url)).size, 15)
  assert.equal(f.timers[0].delay, FRONTEND_ASSET_TIMEOUT_MS)
  f.requests.forEach(r => f.complete(r))
  const result = await f.pending
  for (const group of ['fonts', 'lowFont', 'logo', 'background', 'cursor', 'sliders', 'tooltip']) assert.equal(result[group], true)
  assert.equal(result.composition.byteLength, art.binaryBytes)
  assert.equal(result.images.length, 10)
  assert.equal(result.ingame.images.length, 5)
  assert.equal(result.ingame.fonts, true);assert.equal(result.ingame.sliders, true)
  assert.ok(Object.isFrozen(result.ingame) && Object.isFrozen(result.ingame.images))
  assert.equal(f.timers.length, 1)
  assert.ok(Object.isFrozen(result) && Object.isFrozen(result.images))
  assert.equal(f.timers[0].cleared, true)
})

for (const [part, failed] of [['feft33we', 'fonts'], ['felo33we', 'lowFont'], ['felgspen', 'logo'],
  ['background', 'background'], ['pointer', 'cursor'], ['frontend-1', 'sliders'], ['composition', 'composition'], ['tooltip-font-c', 'tooltip']]) {
  test(`${failed} failure preserves every independent healthy group`, async t => {
    const f = fixture(t)
    f.requests.forEach(r => r.url.includes(part) ? r.reject(Error('asset failure')) : f.complete(r))
    const result = await f.pending
    for (const group of ['fonts', 'lowFont', 'logo', 'background', 'cursor', 'sliders', 'tooltip']) assert.equal(result[group], group !== failed)
    assert.equal(result.composition === null, failed === 'composition')
    assert.equal(result.ingame.tooltip, failed !== 'tooltip')
  })
}
test('invalid composition bytes select fallback without discarding good artwork', async t => {
  const f = fixture(t);f.requests.forEach(r => f.complete(r, r.url.endsWith('.bin')))
  const result = await f.pending
  assert.equal(result.composition, null);assert.equal(result.fonts, true);assert.equal(result.logo, true)
})
test('deadline preserves settled groups and late success cannot mutate the returned session', async t => {
  const f = fixture(t), held = f.requests.filter(r => r.url.includes('/options/') || r.url.endsWith('.bin'))
  f.requests.filter(r => !held.includes(r)).forEach(r => f.complete(r))
  await flush()
  f.timers[0].run()
  const result = await f.pending
  assert.equal(result.fonts, true);assert.equal(result.sliders, false);assert.equal(result.composition, null)
  assert.equal(held.find(r => r.options)?.options.signal.aborted, true)
  const before = { ...result, images: [...result.images] }
  held.forEach(r => f.complete(r));await flush()
  assert.deepEqual(result, before)
})

function startup(restore, prepared, world) {
  const calls = [], reference = { current: null }
  const store = { getWorld: () => world.current, restoreCheckpoint: restore }
  const scope = {
    store, frontendPreparation: reference, prepareFrontendAssets: prepared,
    readAudioPreferences: () => ({ volume: .5, musicVolume: .5 }), readGamePreferences: () => ({}),
    setAudioPreferences() {}, audio: { current: null }, gamePreferencesRef: { current: null }, setGamePreferences() {},
    setFrontendAssets: assets => calls.push(['assets', assets]), setStartup: state => calls.push(['startup', state]),
  }
  return { calls, run: () => pageEffect('store.restoreCheckpoint()', scope)() }
}
for (const first of ['restore', 'assets']) test(`Home keeps loading when only ${first} has settled`, async () => {
  let finishRestore, finishAssets
  const world = { current: {} }, assets = {}
  const restore = new Promise(resolve => { finishRestore = resolve }), prepared = new Promise(resolve => { finishAssets = resolve })
  const home = startup(() => restore, () => prepared, world)
  home.run();(first === 'restore' ? finishRestore : finishAssets)(assets);await flush()
  assert.deepEqual(home.calls, [])
  ;(first === 'restore' ? finishAssets : finishRestore)(assets);await flush()
  assert.deepEqual(home.calls, [['assets', assets], ['startup', 'choice']])
})
for (const cancellation of ['unmount', 'world replacement']) test(`Home ignores prepared assets after ${cancellation}`, async () => {
  let finish
  const world = { current: {} }, home = startup(async () => {}, () => new Promise(resolve => { finish = resolve }), world)
  const cleanup = home.run()
  if (cancellation === 'unmount') cleanup();else world.current = {}
  finish({});await flush();assert.deepEqual(home.calls, [])
})
test('Home effect replay shares its one preparation and only the live owner reveals', async () => {
  let finish, preparations = 0
  const world = { current: {} }, assets = {}, pending = new Promise(resolve => { finish = resolve })
  const home = startup(async () => {}, () => { preparations++;return pending }, world)
  home.run()();home.run();finish(assets);await flush()
  assert.equal(preparations, 1)
  assert.deepEqual(home.calls, [['assets', assets], ['startup', 'choice']])
})

for (const first of ['pause-font', 'ingame-', 'frontend/']) test(`Home menu preparation waits for every group when ${first} finishes first`, async t => {
  const f = fixture(t)
  let settled = false
  void f.pending.then(() => { settled = true })
  const early = f.requests.filter(r => r.url.includes(first))
  early.forEach(r => f.complete(r));await flush()
  assert.equal(settled, false)
  f.requests.filter(r => !early.includes(r)).reverse().forEach(r => f.complete(r))
  const result = await f.pending
  assert.equal(result.ingame.fonts, true);assert.equal(result.ingame.sliders, true)
  assert.equal(result.fonts, true);assert.equal(result.sliders, true)
})
for (const failed of ['pause-font', 'ingame-0', 'ingame-1', 'ingame-2']) test(`${failed} failure preserves healthy frontend and independent in-game groups`, async t => {
  const f = fixture(t)
  f.requests.forEach(r => r.url.includes(failed) ? r.reject(Error('in-game asset failure')) : f.complete(r))
  const result = await f.pending
  for (const group of ['fonts', 'lowFont', 'logo', 'background', 'cursor', 'sliders', 'tooltip']) assert.equal(result[group], true)
  assert.equal(result.composition.byteLength, art.binaryBytes)
  assert.equal(result.ingame.fonts, failed !== 'pause-font')
  assert.equal(result.ingame.sliders, failed === 'pause-font')
  assert.equal(result.ingame.images.length, failed === 'pause-font' ? 4 : 2)
})
for (const heldPart of ['pause-font', 'ingame-']) test(`${heldPart} shares one startup deadline and late success cannot update retained state`, async t => {
  const f = fixture(t), held = f.requests.filter(r => r.url.includes(heldPart))
  f.requests.filter(r => !held.includes(r)).forEach(r => f.complete(r));await flush()
  assert.equal(f.timers.length, 1);assert.equal(f.timers[0].delay, 10000)
  f.timers[0].run()
  const result = await f.pending, before = { ...result.ingame, images: [...result.ingame.images] }
  assert.equal(result.ingame.fonts, heldPart !== 'pause-font')
  assert.equal(result.ingame.sliders, heldPart !== 'ingame-')
  assert.equal(result.fonts, true);assert.equal(result.sliders, true)
  held.forEach(r => f.complete(r));await flush()
  assert.deepEqual(result.ingame, before)
})

test('one startup tooltip decode is retained and shared by frontend and in-game snapshots', async t => {
  const f=fixture(t)
  const tooltips=f.requests.filter(r=>r.url.endsWith('/tooltip-font-c.png'))
  assert.equal(tooltips.length,1)
  f.requests.forEach(r=>f.complete(r))
  const prepared=await f.pending
  assert.equal(prepared.tooltip,true);assert.equal(prepared.ingame.tooltip,true)
  const frontend=prepared.images.find(image=>image.src.endsWith('/tooltip-font-c.png'))
  const ingame=prepared.ingame.images.find(image=>image.src.endsWith('/tooltip-font-c.png'))
  assert.ok(frontend);assert.equal(frontend,ingame)
})

for (const completion of ['success','failure']) test(`tooltip deadline keeps both skins usable and ignores late ${completion}`, async t => {
  const f=fixture(t), held=f.requests.find(r=>r.url.endsWith('/tooltip-font-c.png'))
  let settled=false
  void f.pending.then(()=>{settled=true})
  f.requests.filter(r=>r!==held).forEach(r=>f.complete(r));await flush()
  assert.equal(settled,false,'loading screen also waits for the tooltip atlas')
  assert.equal(f.timers.length,1,'tooltip uses the existing bounded startup deadline')
  f.timers[0].run()
  const prepared=await f.pending
  assert.equal(prepared.tooltip,false);assert.equal(prepared.ingame.tooltip,false)
  assert.equal(prepared.fonts,true);assert.equal(prepared.ingame.fonts,true)
  assert.equal(prepared.sliders,true);assert.equal(prepared.ingame.sliders,true)
  assert.ok(prepared.composition)
  assert.equal(prepared.images.some(image=>image.src.endsWith('/tooltip-font-c.png')),false)
  if(completion==='success')f.complete(held);else held.reject(Error('late optional tooltip failure'))
  await flush()
  assert.equal(prepared.tooltip,false);assert.equal(prepared.ingame.tooltip,false)
  assert.equal(f.requests.filter(r=>r.url.endsWith('/tooltip-font-c.png')).length,1)
})

test('actual main menu and both Options skins consume settled startup tooltip readiness', () => {
  const main=readFileSync(new URL('../app/original-main-menu.tsx',import.meta.url),'utf8')
  const options=readFileSync(new URL('../app/original-options.tsx',import.meta.url),'utf8')
  function tooltip(source, bindings) {
    const parsed=ts.createSourceFile('component.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX)
    let node
    function visit(child) { if(ts.isJsxSelfClosingElement(child)&&child.tagName.getText(parsed)==='MenuTooltip')node=child;ts.forEachChild(child,visit) }
    visit(parsed);assert.ok(node)
    return evaluatePage(node.getText(parsed),{MenuTooltip:'MenuTooltip',...bindings})
  }
  for(const ready of [true,false]) {
    assert.equal(tooltip(main,{prepared:{tooltip:ready},frame:{},hasCheckpoint:false,checkpointReadStatus:'read'}).props.ready,ready)
    for(const skin of ['frontend','ingame']) {
      const preparedFrontend={tooltip:skin==='frontend'?ready:!ready},preparedIngame={tooltip:skin==='ingame'?ready:!ready}
      const parsed=ts.createSourceFile('options.tsx',options,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX)
      let declaration
      function visit(node) {if(ts.isVariableDeclaration(node)&&node.name.getText(parsed)==='prepared')declaration=node.initializer;ts.forEachChild(node,visit)}
      visit(parsed)
      const prepared=evaluatePage(declaration.getText(parsed),{skin,preparedFrontend,preparedIngame})
      assert.equal(tooltip(options,{prepared,category:'Game',root:{}}).props.ready,ready)
    }
  }
  assert.equal(tooltip(options,{prepared:undefined,category:'Game',root:{}}).props.ready,false)
})

test('ingame prepared probe binds strict cold/warm decode and request counts to its five-asset inventory', () => {
  const probe = readFileSync(new URL('../scripts/local-render/ingame-prepared-assets.mjs', import.meta.url), 'utf8')
  assert.match(probe, /const paths = \['\/original\/pause-font\.png', \.\.\.\[0, 1, 2\]\.map\(n => `\/original\/options\/ingame-\$\{n\}\.png`\), '\/original\/world-selector\/text\/tooltip-font-c\.png'\]/)
  assert.equal([...probe.matchAll(/assert\.equal\(await decodeCount\(\),paths\.length/g)].length, 2)
  assert.match(probe, /assert\.equal\(report\.requests\.filter\(r=>r\.event==='request'\)\.length,paths\.length,'each menu asset is requested once'\)/)
  assert.match(probe, /paths\.slice\(1, 4\)/)
})

test('prepared probes keep distinct exact request and decoded-image inventories', () => {
  const inventory = (source, name) => {
    const parsed = ts.createSourceFile('probe.mjs', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS)
    let initializer
    function visit(node) {
      if (ts.isVariableDeclaration(node) && node.name.getText(parsed) === name) initializer = node.initializer
      ts.forEachChild(node, visit)
    }
    visit(parsed)
    assert.ok(initializer, `missing ${name} inventory`)
    return Function(`return (${initializer.getText(parsed)})`)()
  }
  const frontend = readFileSync(new URL('../scripts/local-render/frontend-prepared-assets.mjs', import.meta.url), 'utf8')
  const ingame = readFileSync(new URL('../scripts/local-render/ingame-prepared-assets.mjs', import.meta.url), 'utf8')
  const frontendPaths = inventory(frontend, 'assetPaths'), ingamePaths = inventory(ingame, 'paths')
  assert.equal(frontendPaths.length, 11)
  assert.equal(new Set(frontendPaths).size, 11)
  assert.equal(frontendPaths.filter(path => path.endsWith('.png')).length, 10)
  assert.equal(frontendPaths.filter(path => path.endsWith('.bin')).length, 1)
  assert.equal(ingamePaths.length, 5)
  assert.equal(new Set(ingamePaths).size, 5)
  assert.ok(ingamePaths.every(path => path.endsWith('.png')))
  for (const paths of [frontendPaths, ingamePaths]) assert.ok(paths.includes('/original/world-selector/text/tooltip-font-c.png'))
  assert.match(frontend, /assert\.equal\(report\.requests\.filter\(entry => entry\.event === 'request' && assetPaths\.includes\(entry\.path\)\)\.length, assetPaths\.length\)/)
  assert.match(frontend, /assert\.equal\(await page\.evaluate\(\(\) => window\.uiPrepared\.decodes\.length\), decodesBeforeReopen\)/)
  assert.match(frontend, /assert\.equal\(report\.requests\.filter\(entry => entry\.event === 'request' && assetPaths\.includes\(entry\.path\)\)\.length, requestsBeforeReopen\)/)
  assert.match(frontend, /tooltip-font-c\/\.test\(entry\.src\)\)\.length === 10/)
  assert.match(ingame, /tooltip-font-c\/\.test\(d\.src\)\)\.length === 5/)
  assert.equal([...ingame.matchAll(/assert\.equal\(await decodeCount\(\),paths\.length/g)].length, 2)
  assert.match(ingame, /assert\.equal\(report\.requests\.filter\(r=>r\.event==='request'\)\.length,paths\.length,'each menu asset is requested once'\)/)
})
