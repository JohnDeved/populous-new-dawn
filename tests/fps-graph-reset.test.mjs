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
      'render', 'calls', 'heap', 'scale', 'pointer', 'other', 'window', 'raf-tail', 'cpu-tail', 'cpu-peak'].map(name => [name, sink(name)])),
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
    'simulation', 'callback', 'render', 'calls', 'simulationMs', 'callbackMs', 'renderMs', 'drawCalls', 'pointer', 'pointerMs', 'otherMs'])
    assert.equal(graph.samples[key], 0, key)
  assert.equal(graph.line.attributes.get('points'), '')
  assert.equal(graph.budget.attributes.get('d'), '')
  for (const key of ['fps', 'frame', 'peak', 'simulation', 'render', 'calls', 'callback', 'pointer', 'other', 'raf-tail', 'cpu-tail', 'cpu-peak'])
    assert.equal(graph.fields[key].textContent, '--', key)
  assert.equal(graph.fields.window.textContent, '0 samples')
  assert.equal(graph.samples.callbackPercentiles.max, 0)
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


test('rounded remainder suppresses negative zero but exposes meaningful ownership errors', () => {
  const { graph } = fixture()
  graph.update(0, 0.1, 0.2, 1, 'Live', 0.3)
  graph.update(250, 0.1, 0.2, 1, 'Live', 0.3)
  assert.ok(graph.samples.otherMs < 0, 'raw floating subtraction stays signed')
  assert.equal(graph.fields.other.textContent, '0.00 ms')
  graph.update(500, 2, 3, 1, 'Live', 1)
  assert.equal(graph.fields.other.textContent, '-4.00 ms !')
})


test('short landscape layout preserves noninteractive diagnostics without changing desktop flow', async () => {
  const { readFileSync } = await import('node:fs')
  const graph = readFileSync(new URL('../app/fps-graph.ts', import.meta.url), 'utf8')
  const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8')
  assert.match(graph, /class="fps-primary"/)
  assert.match(graph, /class="fps-secondary"/)
  assert.match(css, /\.fps-primary,\.fps-secondary\{display:contents\}/)
  const compact = css.slice(css.indexOf('@media (max-height:700px) and (min-width:560px)'), css.indexOf('.native-hud{'))
  assert.match(compact, /grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)/)
  assert.match(compact, /max-width:calc\(100% - 16px\)/)
  assert.doesNotMatch(compact, /display:none|overflow:|transform:|font-size:|pointer-events:/)
  assert.match(css, /\.fps-graph\{[^}]*pointer-events:none/)
  for (const metric of ['callback', 'pointer', 'other', 'raf-tail', 'cpu-tail', 'cpu-peak', 'renderer', 'cores', 'memory', 'heap'])
    assert.match(graph, new RegExp(`data-metric="${metric}"`))
  assert.match(graph, /GPU not measured/)
  assert.match(graph, /not presented FPS/)
})
