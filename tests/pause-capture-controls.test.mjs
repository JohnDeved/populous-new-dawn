import assert from 'node:assert/strict'
import test from 'node:test'
import { observeStablePauseControls } from '../scripts/local-render/pause-capture-controls.mjs'

// Actual serialized callback with supplied DOM/scheduler boundaries. These are
// failure/cleanup regressions, not rendered-browser or performance evidence.
function setup(t, count = 2) {
  let next = 1, mutation, observerActive = false, hitQueries = 0
  const frames = new Map(), timers = new Map(), nodes = []
  const dialog = { contains: node => nodes.includes(node) && node.inDialog }
  for (let i = 0; i < count; i++) nodes.push({
    isConnected: true, inDialog: true, visibility: 'visible', hasRects: true,
    box: { x: 10 + i * 30, y: 10, width: 20, height: 10 }, textContent: `Button ${i}`,
    closest: () => dialog, getAttribute: () => null,
    getBoundingClientRect() { return { ...this.box } },
    getClientRects() { return this.hasRects ? [this.box] : [] },
    contains(node) { return node === this },
  })
  const api = {
    MutationObserver: class {
      constructor(callback) { mutation = callback }
      observe(root, options) { assert.equal(root, dialog); assert.deepEqual(options, { childList: true, subtree: true, attributes: true }); observerActive = true }
      disconnect() { observerActive = false }
    },
    requestAnimationFrame: fn => { const id = next++; frames.set(id, fn); return id },
    cancelAnimationFrame: id => frames.delete(id),
    setTimeout: (fn, delay) => { assert.equal(delay, 5000); const id = next++; timers.set(id, fn); return id },
    clearTimeout: id => timers.delete(id),
    getComputedStyle: node => ({ visibility: node.visibility }),
    document: { elementFromPoint(x, y) { hitQueries++; return nodes.find(n => x >= n.box.x && x <= n.box.x+n.box.width && y >= n.box.y && y <= n.box.y+n.box.height) ?? null } },
  }
  for (const [key, value] of Object.entries(api)) {
    const old = Object.getOwnPropertyDescriptor(globalThis, key)
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value })
    t.after(() => old ? Object.defineProperty(globalThis, key, old) : delete globalThis[key])
  }
  return {
    nodes, api,
    frame() { const queued = [...frames.values()]; frames.clear(); for (const fn of queued) fn() },
    expire() { for (const fn of [...timers.values()]) fn() },
    mutate() { mutation() },
    hitQueries: () => hitQueries,
    clean() { assert.equal(frames.size, 0); assert.equal(timers.size, 0); assert.equal(observerActive, false) },
  }
}

test('same controls require two consecutive animation frames and final center hits', async t => {
  const f=setup(t), pending=observeStablePauseControls(f.nodes)
  f.frame(); assert.equal(f.hitQueries(), 0)
  f.frame(); const result=await pending
  assert.deepEqual(result, f.nodes.map(n=>({label:n.textContent,...n.box,hit:true})))
  assert.equal(f.hitQueries(),2);f.clean()
})
test('moving geometry waits for a new pair, without scrolling or mutation', async t => {
  const f=setup(t), pending=observeStablePauseControls(f.nodes)
  f.frame();f.nodes[0].box.x+=2;f.frame();assert.equal(f.hitQueries(),0)
  f.frame();const result=await pending;assert.equal(result[0].x,12);f.clean()
})
test('stable offscreen geometry is retained for the caller viewport assertion, not repaired', async t => {
  const f=setup(t);f.nodes[0].box.x=-100
  const pending=observeStablePauseControls(f.nodes);f.frame();f.frame()
  assert.equal((await pending)[0].x,-100);f.clean()
})
test('occlusion is retained as a failed hit result rather than forced input', async t => {
  const f=setup(t);f.api.document.elementFromPoint=()=>null
  const pending=observeStablePauseControls(f.nodes);f.frame();f.frame()
  assert.ok((await pending).every(box=>box.hit===false));f.clean()
})
for(const mode of ['mutation','disconnected','reparented','hidden','collapsed','zero-width','zero-height','no-rects'])test(`rejects ${mode} controls and releases observers/timers/frames`,async t=>{
  const f=setup(t),pending=observeStablePauseControls(f.nodes)
  const rejected=assert.rejects(pending,/identity\/count changed|became hidden/)
  f.frame()
  if(mode==='mutation')f.mutate()
  if(mode==='disconnected')f.nodes[0].isConnected=false
  if(mode==='reparented')f.nodes[0].inDialog=false
  if(mode==='hidden')f.nodes[0].visibility='hidden'
  if(mode==='collapsed')f.nodes[0].visibility='collapse'
  if(mode==='zero-width')f.nodes[0].box.width=0
  if(mode==='zero-height')f.nodes[0].box.height=0
  if(mode==='no-rects')f.nodes[0].hasRects=false
  f.frame();await rejected;f.clean()
})
test('missing animation delivery times out and releases all resources',async t=>{
  const f=setup(t),pending=observeStablePauseControls(f.nodes)
  const rejected=assert.rejects(pending,/within5000ms/)
  f.expire();await rejected;f.clean()
})
test('measurement exception preserves the primary error and cleans up',async t=>{
  const f=setup(t),error=new Error('measurement failed');f.nodes[0].getBoundingClientRect=()=>{throw error}
  const pending=observeStablePauseControls(f.nodes),rejected=assert.rejects(pending,e=>e===error)
  f.frame();await rejected;f.clean()
})
test('empty inventory fails without allocating a scheduler or observer',async t=>{
  const f=setup(t,0);await assert.rejects(observeStablePauseControls(f.nodes),/No modal controls/);f.clean()
})
