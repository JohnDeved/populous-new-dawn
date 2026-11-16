import test from 'node:test'
import assert from 'node:assert/strict'
import { readNaturalF8Publication as read } from '../scripts/tutorial-browser/natural-f8-publication.mjs'
const readNaturalF8Publication = (graph, labels) => read(graph, labels, { currentGraph: graph, recording: graph.interactionRecording, afterTimestamp: 0 })
const make = () => ({ previous: 100, disposed: false, interactionRecording: {}, samples: { elapsed: 0, frames: 0, count: 1,
  recentFrames: () => [{ timestampMs: 100, pointerBreakdown: { interaction: {
    route: 'world', pointerMoved: true, viewChanged: null } } }] } })
const labels = { route: 'World', pointer: 'Yes', view: 'Unknown' }
test('exact publication returns copied context without mutating source', () => {
  const graph = make(), before = JSON.stringify(graph)
  const result = readNaturalF8Publication(graph, labels)
  assert.equal(result.timestampMs, 100)
  result.labels.pointer = 'No'
  assert.equal(labels.pointer, 'Yes')
  assert.equal(JSON.stringify(graph), before)
})
for (const [name, change] of [
  ['mid-window', g => { g.samples.elapsed = 16 }],
  ['new recording', g => { g.samples.count = 0 }],
  ['rejected last frame', g => { g.previous = 101 }],
  ['disposed', g => { g.disposed = true }],
]) test(`${name} cannot manufacture a publication`, () => {
  const graph = make(); change(graph)
  assert.equal(readNaturalF8Publication(graph, labels), null)
})
test('mismatched visible labels fail rather than claiming correlation', () => {
  assert.throws(() => readNaturalF8Publication(make(), { ...labels, pointer: 'No' }), /visible context/)
})

test('stale stage timestamp and replaced graph/recording refuse prior publication', () => {
  const graph = make()
  for (const options of [
    { currentGraph: graph, recording: graph.interactionRecording, afterTimestamp: 100 },
    { currentGraph: make(), recording: graph.interactionRecording, afterTimestamp: 0 },
    { currentGraph: graph, recording: {}, afterTimestamp: 0 },
  ]) assert.equal(read(graph, labels, options), null)
})

import { FpsGraph } from '../app/fps-graph.ts'
import { FramePerformance } from '../app/frame-performance.ts'
import { createPointerFrameMetrics } from '../app/pointer-frame-metrics.ts'
import { createPointerInteractionContext } from '../app/pointer-interaction-context.ts'
function fixture() {
  const writes = []
  const sink = name => {
    let text = ''
    return {
      attributes: new Map(),
      get textContent() { return text },
      set textContent(value) { text = value; writes.push([name, 'text', value]) },
      setAttribute(key, value) { this.attributes.set(key, value); writes.push([name, key, value]) },
    }
  }
  const graph = Object.create(FpsGraph.prototype)
  Object.assign(graph, {
    cleared: false, interactionEpoch: {}, previous: null, samples: new FramePerformance(),
    fields: Object.fromEntries(['state', 'fps', 'frame', 'peak', 'callback', 'simulation',
      'render', 'calls', 'heap', 'export-status', 'renderer', 'cores', 'memory', 'scale', 'pointer', 'pointer-tail', 'other', 'window', 'raf-tail', 'cpu-tail', 'cpu-peak',
      'picking-window', 'pick-numeric', 'pick-packed', 'pick-sparse', 'pick-representation',
      'pick-route', 'pick-pointer-change', 'pick-view-change'].map(name => [name, sink(name)])),
    line: sink('line'), budget: sink('budget'),
  })
  const update = now => graph.update(now, 1, 2, 3, 'Live', 4)
  return { graph, writes, update }
}


test('actual production update/sample publish, midwindow, reject and reset chain', () => {
  const { graph } = fixture(), metrics = createPointerFrameMetrics()
  metrics.interaction = createPointerInteractionContext()
  metrics.interaction.route = 'world'
  metrics.interaction.pointerMoved = true
  metrics.interaction.viewChanged = null
  const update = (time, callback = 4) => graph.update(time, 1, 2, 3, 'Live', callback, 0, metrics)
  const visible = () => ({ route: graph.fields['pick-route'].textContent,
    pointer: graph.fields['pick-pointer-change'].textContent, view: graph.fields['pick-view-change'].textContent })
  const readAt = afterTimestamp => read(graph, visible(), { currentGraph: graph,
    recording: graph.interactionRecording, afterTimestamp })
  update(0); update(260)
  assert.equal(readAt(0).timestampMs, 260)
  assert.equal(readAt(260), null)
  update(261, NaN) // rejected latest frame cannot claim previous publication
  assert.equal(readAt(0), null)
  update(277)
  assert.equal(readAt(0), null, 'midwindow')
  update(540)
  assert.equal(readAt(260).timestampMs, 540)
  const recording = graph.interactionRecording
  graph.reset('Hidden tab')
  assert.equal(readAt(0), null)
  update(600); update(860)
  assert.equal(read(graph, visible(), { currentGraph: graph, recording, afterTimestamp: 600 }), null)
  assert.equal(readAt(600).timestampMs, 860)
})
