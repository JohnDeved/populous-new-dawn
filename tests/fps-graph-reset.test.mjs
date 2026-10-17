import assert from 'node:assert/strict'
import test from 'node:test'
import { FpsGraph } from '../app/fps-graph.ts'
import { FramePerformance } from '../app/frame-performance.ts'

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
    cleared: false, previous: null, samples: new FramePerformance(),
    fields: Object.fromEntries(['state', 'fps', 'frame', 'peak', 'callback', 'simulation',
      'render', 'calls', 'heap', 'scale'].map(name => [name, sink(name)])),
    line: sink('line'), budget: sink('budget'),
  })
  const update = now => graph.update(now, 1, 2, 3, 'Live', 4)
  return { graph, writes, update }
}

test('actual graph repeated cleared resets avoid writes but preserve changed visibility labels', () => {
  const { graph, writes, update } = fixture(), history = graph.samples.history
  update(0); update(1020)
  assert.equal(graph.samples.count, 1)
  graph.reset('Hidden tab · sampling stopped')
  assert.equal(graph.previous, null)
  assert.equal(graph.samples.history, history)
  for (const key of ['count', 'cursor', 'elapsed', 'frames', 'fps', 'frameMs',
    'simulation', 'callback', 'render', 'calls', 'simulationMs', 'callbackMs', 'renderMs', 'drawCalls'])
    assert.equal(graph.samples[key], 0, key)
  assert.equal(graph.line.attributes.get('points'), '')
  assert.equal(graph.budget.attributes.get('d'), '')
  for (const key of ['fps', 'frame', 'peak', 'simulation', 'render', 'calls', 'callback'])
    assert.equal(graph.fields[key].textContent, '--', key)
  writes.length = 0
  for (let i = 0; i < 10; i++) graph.reset('Hidden tab · sampling stopped')
  assert.deepEqual(writes, [])
  graph.reset('Warming up')
  assert.deepEqual(writes, [['state', 'text', 'Warming up']])
  assert.equal(graph.samples.count, 0)
})

test('actual graph resets warmup and unpublished samples and excludes hidden time after resume', () => {
  const { graph, update } = fixture()
  update(0); update(1020)
  graph.reset('Hidden tab · sampling stopped')
  graph.reset('Warming up')
  update(100000)
  assert.equal(graph.samples.count, 0)
  assert.equal(graph.fields.state.textContent, 'Live · warming up')
  graph.reset('Hidden tab · sampling stopped')
  assert.equal(graph.previous, null, 'a warmup-only update invalidates the cleared guard')
  update(200000); update(200010)
  assert.equal(graph.samples.count, 1)
  graph.reset('Hidden tab · sampling stopped')
  assert.equal(graph.samples.count, 0, 'unpublished samples must also be cleared')
  update(300000)
  for (let i = 1; i <= 25; i++) update(300000 + i * 10)
  assert.equal(graph.samples.count, 25)
  assert.equal(graph.samples.frameMs, 10)
  assert.equal(graph.samples.fps, 100)
  assert.equal(graph.fields.peak.textContent, '10.0 ms')
  assert.equal(graph.fields.scale.textContent, '0–40 ms')
})
