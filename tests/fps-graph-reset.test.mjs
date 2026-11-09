import assert from 'node:assert/strict'
import test from 'node:test'
import { FpsGraph } from '../app/fps-graph.ts'
import { FramePerformance } from '../app/frame-performance.ts'
import { createPointerFrameMetrics } from '../app/pointer-frame-metrics.ts'
import { capturePointerInteraction } from '../app/pointer-interaction-context.ts'

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
      'render', 'calls', 'heap', 'export-status', 'renderer', 'cores', 'memory', 'scale', 'pointer', 'pointer-tail', 'other', 'window', 'raf-tail', 'cpu-tail', 'cpu-peak',
      'picking-window', 'pick-numeric', 'pick-packed', 'pick-sparse', 'pick-representation',
      'pick-route', 'pick-pointer-change', 'pick-view-change'].map(name => [name, sink(name)])),
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
  for (const key of ['fps', 'frame', 'peak', 'simulation', 'render', 'calls', 'callback', 'pointer', 'pointer-tail', 'other', 'raf-tail', 'cpu-tail', 'cpu-peak'])
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
  assert.match(graph, /Pointer p95 \/ peak · ≤240f/)
  assert.ok(graph.indexOf('data-metric="pointer-tail"') < graph.indexOf('class="fps-secondary"'), 'Tail row uses primary column, not the already taller export column')
  assert.match(graph, /class="fps-secondary"/)
  assert.match(css, /\.fps-primary,\.fps-secondary\{display:contents\}/)
  const compact = css.slice(css.indexOf('@media (max-height:800px) and (min-width:560px)'), css.indexOf('.native-hud{'))
  assert.match(compact, /grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)/)
  assert.match(compact, /max-width:calc\(100% - 16px\)/)
  assert.match(compact, /\.fps-graph svg\{height:28px;margin:3px 0\}/)
  const recoveredHeight = (52 + 2 * 5) - (28 + 2 * 3)
  const addedRowHeight = 12 * 1.4 + 2
  assert.ok(recoveredHeight > addedRowHeight, 'New row must not consume 640px campaign clearance or 900px viewport clearance')
  assert.doesNotMatch(compact, /display:none|overflow:|transform:|font-size:|pointer-events:/)
  assert.match(css, /\.fps-graph\{[^}]*pointer-events:none/)
  for (const metric of ['callback', 'pointer', 'pointer-tail', 'other', 'raf-tail', 'cpu-tail', 'cpu-peak', 'renderer', 'cores', 'memory', 'heap'])
    assert.match(graph, new RegExp(`data-metric="${metric}"`))
  assert.match(graph, /CPU excludes overlay\/GPU\. Async GPU: export only/)
  assert.match(graph, /not presented FPS/)
  assert.doesNotMatch(graph, /<dt>GPU render timing<\/dt>/, 'export-only GPU explanation must not add an overlay row')
})


test('pointer tails expose spikes separately from the mean and clear on reset', () => {
  const { graph } = fixture()
  graph.update(0, 0, 0, 1, 'Live', 40, 0)
  for (let i = 1; i <= 25; i++) graph.update(i * 10, 0, 0, 1, 'Live', 40, i === 25 ? 30.3 : 5)
  assert.equal(graph.fields.pointer.textContent, '6.01 ms')
  assert.equal(graph.fields['pointer-tail'].textContent, '5.0 / 30.3 ms')
  graph.reset('Hidden tab · sampling stopped')
  assert.equal(graph.fields['pointer-tail'].textContent, '--')
  assert.equal(graph.samples.pointerPercentiles.max, 0)
})


test('capture reset clears stale heap and export feedback without clearing hardware identity', t => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'performance')
  Object.defineProperty(globalThis, 'performance', {
    configurable: true, value: { memory: { usedJSHeapSize: 64 * 1048576 } },
  })
  t.after(() => Object.defineProperty(globalThis, 'performance', original))
  const { graph, writes, update } = fixture()
  for (const [name, value] of [['renderer', 'Test renderer'], ['cores', '8'], ['memory', '~8 GiB']])
    graph.fields[name].textContent = value
  graph.exportRecentFrames()
  assert.match(graph.fields['export-status'].textContent, /No frames yet/)
  update(0); update(250)
  assert.equal(graph.fields.heap.textContent, '~64 MiB')
  graph.reset('Hidden tab · sampling stopped')
  assert.equal(graph.fields.heap.textContent, '--', 'the old estimate is not a current sample')
  assert.equal(graph.fields['export-status'].textContent, '', 'feedback from the old capture is cleared')
  assert.deepEqual(['renderer', 'cores', 'memory'].map(name => graph.fields[name].textContent),
    ['Test renderer', '8', '~8 GiB'])
  writes.length = 0
  graph.reset('Hidden tab · sampling stopped')
  assert.deepEqual(writes, [], 'repeated stopped frames do not rewrite readouts')
  update(10000)
  assert.equal(graph.fields.heap.textContent, '--', 'warmup does not revive the old estimate')
  update(10250)
  assert.equal(graph.fields.heap.textContent, '~64 MiB', 'the next publication samples heap again')
  graph.reset()
  update(20000)
  graph.exportRecentFrames()
  assert.match(graph.fields['export-status'].textContent, /No frames yet/)
  graph.reset()
  assert.equal(graph.fields['export-status'].textContent, '', 'warmup-only capture also invalidates reset guard')
})

test('picking readouts publish per-frame means at the existing cadence and distinguish zero, unknown and reset', () => {
  const { graph, writes } = fixture(), metrics = createPointerFrameMetrics(true)
  const update = (now, detail = metrics) => graph.update(now, 0, 0, 0, 'Live', 0, 0, detail)
  graph.reset()
  update(0)
  metrics.ordinaryTerrain.paths.numeric = 2
  for (let i = 1; i <= 24; i++) update(i * 10)
  assert.equal(graph.fields['pick-numeric'].textContent, '--', 'no early DOM publication')
  metrics.ordinaryTerrain.paths.numeric = 27
  metrics.nativeOcclusion.cacheRepresentationChanged = 1
  update(250)
  assert.equal(graph.fields['picking-window'].textContent, 'Means/frame · 25 frames / 250 ms')
  assert.equal(graph.fields['pick-numeric'].textContent, '3.00', 'not just the latest frame')
  assert.equal(graph.fields['pick-packed'].textContent, '0.00')
  assert.equal(graph.fields['pick-sparse'].textContent, '0.00')
  assert.equal(graph.fields['pick-representation'].textContent, '0.04')
  writes.length = 0
  update(260)
  assert.deepEqual(writes, [], 'unpublished samples do not render the details')
  update(500, createPointerFrameMetrics())
  for (const name of ['pick-numeric', 'pick-packed', 'pick-sparse', 'pick-representation'])
    assert.equal(graph.fields[name].textContent, 'Unknown', name)
  graph.reset('Hidden tab · sampling stopped')
  for (const name of ['pick-numeric', 'pick-packed', 'pick-sparse', 'pick-representation'])
    assert.equal(graph.fields[name].textContent, '--', name)
  assert.equal(graph.fields['picking-window'].textContent, 'No samples yet')
  update(10000)
  assert.equal(graph.fields['pick-numeric'].textContent, '--', 'warmup cannot revive old counts')
})

test('picking details use an initially collapsed header control without relabeling paths as query or vertex counts', async () => {
  const { readFileSync } = await import('node:fs')
  const source = readFileSync(new URL('../app/fps-graph.ts', import.meta.url), 'utf8')
  const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8')
  assert.match(source, /<header>[^\n]*class="fps-picking-toggle" aria-expanded="false"/)
  assert.match(source, /<section class="fps-picking" aria-label="Picking path details" hidden>/)
  for (const label of ['Numeric instances', 'Packed-vector instances', 'Sparse-vector instances', 'Native repr.-only misses'])
    assert.ok(source.includes(`<dt>${label}</dt>`), label)
  assert.match(source, /Ordinary terrain instance paths after culling, not query or vertex counts/)
  assert.match(source, /Unknown = incomplete sampling/)
  assert.match(css, /\.fps-picking-toggle\{pointer-events:auto/)
  assert.match(css, /\.fps-picking\[hidden\]\{display:none\}/)
  assert.match(css, /\.fps-graph:has\(\.fps-picking-toggle\[aria-expanded=true\]\)\{max-height:calc\(100dvh - 24px\);overflow:auto;pointer-events:auto;overscroll-behavior:contain\}/)
})

test('actual picking toggle preserves native activation, isolates game input and lets F8 through', t => {
  class Element extends EventTarget {
    hidden = true
    attributes = new Map()
    setAttribute(key, value) { this.attributes.set(key, value) }
  }
  const fields = new Map(), controls = new Map(['.fps-export', '.fps-picking-toggle', '.fps-picking', 'polyline', '.fps-budget'].map(name => [name, new Element()]))
  const aside = Object.assign(new Element(), {
    querySelector: selector => controls.get(selector),
    querySelectorAll() {
      for (const match of this.innerHTML.matchAll(/data-metric="([^"]+)"/g))
        fields.set(match[1], Object.assign(new Element(), { dataset: { metric: match[1] }, textContent: '' }))
      return fields.values()
    },
  })
  for (const [name, value] of [['document', { createElement: () => aside }], ['KeyboardEvent', class extends Event {
    constructor(type, init) { super(type, init); this.key = init.key }
  }]]) {
    const original = Object.getOwnPropertyDescriptor(globalThis, name)
    Object.defineProperty(globalThis, name, { configurable: true, value })
    t.after(() => original ? Object.defineProperty(globalThis, name, original) : delete globalThis[name])
  }
  new FpsGraph({ getExtension: () => null, getParameter: () => null })
  const toggle = controls.get('.fps-picking-toggle'), details = controls.get('.fps-picking')
  for (const expected of [true, false, true]) {
    toggle.dispatchEvent(new Event('click'))
    assert.equal(toggle.attributes.get('aria-expanded'), String(expected))
    assert.equal(details.hidden, !expected)
    assert.equal(aside.tabIndex, expected ? 0 : -1, 'only expanded readouts enter the keyboard scroll order')
    assert.equal(aside.scrollTop, 0, 'opening and closing restore the header')
    aside.scrollTop = 100
  }
  for (const button of [toggle, controls.get('.fps-export')])
    for (const [type, key] of [['click'], ['pointerdown'], ['pointermove'], ['pointerup'], ['wheel'], ['keydown', 'Enter'], ['keyup', ' '], ['keydown', 'F8']]) {
      const event = key === undefined ? new Event(type, { cancelable: true }) : new KeyboardEvent(type, { key, cancelable: true })
      let stopped = false
      event.stopPropagation = () => { stopped = true }
      button.dispatchEvent(event)
      assert.equal(stopped, key !== 'F8', `${type} ${key ?? ''}`)
      assert.equal(event.defaultPrevented, false, 'do not prevent native button activation')
    }
  for (const expanded of [true, false]) {
    if (details.hidden === expanded) toggle.dispatchEvent(new Event('click'))
    for (const [type, key] of [['click'], ['pointerdown'], ['pointermove'], ['wheel'], ['keydown', 'End'], ['keyup', 'Home'], ['keydown', 'F8']]) {
      const event = key === undefined ? new Event(type, { cancelable: true }) : new KeyboardEvent(type, { key, cancelable: true })
      let stopped = false
      event.stopPropagation = () => { stopped = true }
      aside.dispatchEvent(event)
      assert.equal(stopped, expanded && key !== 'F8', `${expanded ? 'expanded' : 'collapsed'} ${type} ${key ?? ''}`)
      assert.equal(event.defaultPrevented, false, 'wheel/Home/End scrolling remains native')
    }
  }
})

test('live context preserves every recorded route and distinguishes false, null and absent context', () => {
  const { graph } = fixture(), metrics = createPointerFrameMetrics(true)
  const update = (now, detail = metrics) => graph.update(now, 0, 0, 0, 'Live', 0, 0, detail)
  const values = () => ['pick-route', 'pick-pointer-change', 'pick-view-change'].map(name => graph.fields[name].textContent)
  graph.reset()
  update(0)
  let now = 0
  for (const [route, moved, changed, expected] of [
    ['world', true, false, ['World', 'Yes', 'No']],
    ['hud', false, true, ['HUD', 'No', 'Yes']],
    ['outside', null, false, ['Outside', 'Unknown', 'No']],
    ['unknown', false, null, ['Unknown', 'No', 'Unknown']],
  ]) {
    Object.assign(metrics.interaction, { route, pointerMoved: moved, viewChanged: changed })
    update(now += 250)
    assert.deepEqual(values(), expected)
  }
  update(now += 250, createPointerFrameMetrics())
  assert.deepEqual(values(), ['Unknown', 'Unknown', 'Unknown'], 'absent optional context is not a known negative')
})

test('live context uses the latest accepted publication sample without early or rejected-sample writes', () => {
  const { graph, writes } = fixture(), metrics = createPointerFrameMetrics(true)
  const update = now => graph.update(now, 0, 0, 0, 'Live', 0, 0, metrics)
  graph.reset()
  update(0)
  Object.assign(metrics.interaction, { route: 'world', pointerMoved: false, viewChanged: true })
  for (let i = 1; i <= 24; i++) update(i * 10)
  for (const name of ['pick-route', 'pick-pointer-change', 'pick-view-change'])
    assert.equal(graph.fields[name].textContent, '--', 'no early context publication')
  Object.assign(metrics.interaction, { route: 'hud', pointerMoved: true, viewChanged: false })
  update(250)
  assert.equal(graph.fields['pick-route'].textContent, 'HUD', 'latest sample, not the route occupying most of the window')
  assert.equal(graph.fields['pick-pointer-change'].textContent, 'Yes')
  assert.equal(graph.fields['pick-view-change'].textContent, 'No')
  writes.length = 0
  Object.assign(metrics.interaction, { route: 'world', pointerMoved: false, viewChanged: true })
  update(260)
  assert.deepEqual(writes, [], 'unpublished context does not touch the DOM')
  const count = graph.samples.count
  metrics.interaction.pointerMoved = 'invalid'
  update(500)
  assert.equal(graph.samples.count, count, 'invalid context rejects the entire sample')
  assert.deepEqual(writes, [], 'rejected context cannot publish')
  metrics.interaction.pointerMoved = false
  update(750)
  assert.equal(graph.fields['pick-route'].textContent, 'World')
  assert.equal(graph.fields['pick-pointer-change'].textContent, 'No')
  assert.equal(graph.fields['pick-view-change'].textContent, 'Yes')
})

test('captured context resets its baseline with the graph epoch and never revives stale readouts', () => {
  const { graph } = fixture(), metrics = createPointerFrameMetrics(true)
  const viewInputs = Array(12).fill(0)
  const capture = x => capturePointerInteraction(metrics.interaction, graph.interactionRecording,
    { clientX: x, clientY: 20 }, viewInputs, 'world')
  const update = now => graph.update(now, 0, 0, 0, 'Live', 0, 0, metrics)
  graph.reset()
  const firstEpoch = graph.interactionRecording
  update(0)
  capture(10); update(250)
  assert.equal(graph.fields['pick-route'].textContent, 'World')
  assert.equal(graph.fields['pick-pointer-change'].textContent, 'Unknown')
  assert.equal(graph.fields['pick-view-change'].textContent, 'Unknown')
  viewInputs[8] = 1
  capture(11); update(500)
  assert.equal(graph.fields['pick-pointer-change'].textContent, 'Yes')
  assert.equal(graph.fields['pick-view-change'].textContent, 'Yes')
  graph.reset('Hidden tab · sampling stopped')
  assert.notEqual(graph.interactionRecording, firstEpoch)
  for (const name of ['pick-route', 'pick-pointer-change', 'pick-view-change'])
    assert.equal(graph.fields[name].textContent, '--')
  capture(11); update(10000)
  assert.equal(graph.fields['pick-route'].textContent, '--', 'warmup cannot revive old context')
  update(10250)
  assert.equal(graph.fields['pick-route'].textContent, 'World')
  assert.equal(graph.fields['pick-pointer-change'].textContent, 'Unknown', 'new recording does not inherit the previous pointer baseline')
  assert.equal(graph.fields['pick-view-change'].textContent, 'Unknown')
})

test('live context remains optional and explicitly covered by the existing rendered metric inventory', async () => {
  const { readFileSync } = await import('node:fs')
  const { pickingPathMetricIds, pickingPathViewports } = await import('../scripts/tutorial-browser/picking-path-readout.mjs')
  const source = readFileSync(new URL('../app/fps-graph.ts', import.meta.url), 'utf8')
  const shared = readFileSync(new URL('../scripts/tutorial-browser/picking-path-readout.mjs', import.meta.url), 'utf8')
  const optional = source.match(/<section class="fps-picking"[^>]*hidden>[\s\S]*?<\/section>/)?.[0]
  assert.ok(optional)
  assert.deepEqual([...optional.matchAll(/data-metric="([^"]+)"/g)].map(match => match[1]), pickingPathMetricIds)
  for (const name of ['pick-route', 'pick-pointer-change', 'pick-view-change']) {
    assert.ok(pickingPathMetricIds.includes(name))
    assert.ok(optional.includes(`data-metric="${name}">--`))
    assert.ok(!source.replace(optional, '').includes(`data-metric="${name}"`), 'collapsed layout has no extra context rows')
  }
  assert.match(optional, /Latest accepted sample at publication/)
  assert.match(optional, /prior recorded pointer sample, which need not have been accepted/)
  assert.match(optional, /not camera motion alone/)
  assert.match(shared, /for \(const name of pickingPathCounterIds\)/, 'all prior numeric assertions remain')
  assert.match(shared, /pickingContextMetricIds\.map\(name =>/, 'all context rows participate in existing reachability checks')
  assert.deepEqual(pickingPathViewports, [[640, 480], [1280, 799], [1280, 800], [1280, 801], [1280, 820]])
})
