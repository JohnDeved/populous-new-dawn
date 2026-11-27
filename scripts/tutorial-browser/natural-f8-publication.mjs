import assert from 'node:assert/strict'

// Read only at an actual publication boundary, never infer a publication from
// arbitrary last exported history. Caller executes this synchronously with DOM
// readback and verifies current Scene/World identity in the same evaluation task.
export function readNaturalF8Publication(graph, labels, { currentGraph, recording, afterTimestamp }) {
  assert.ok(Number.isFinite(afterTimestamp), 'stage/input timestamp boundary required')
  assert.ok(recording && typeof recording === 'object', 'captured recording epoch required')
  if (graph !== currentGraph || graph?.interactionRecording !== recording) return null
  if (!graph || graph.disposed || graph.samples.elapsed !== 0 || graph.samples.frames !== 0 ||
      graph.samples.count === 0) return null
  const frames = graph.samples.recentFrames()
  assert.ok(frames.length > 0 && frames.length <= 1200)
  const last = frames.at(-1)
  if (last.timestampMs <= afterTimestamp || last.timestampMs !== graph.previous) return null // rejected latest RAF is not publication
  const context = last.pointerBreakdown?.interaction
  assert.ok(context, 'published frame must retain actual pointer context')
  const expected = {
    route: ({ world: 'World', hud: 'HUD', outside: 'Outside', unknown: 'Unknown' })[context.route],
    pointer: context.pointerMoved === true ? 'Yes' : context.pointerMoved === false ? 'No' : 'Unknown',
    view: context.viewChanged === true ? 'Yes' : context.viewChanged === false ? 'No' : 'Unknown',
  }
  assert.ok(expected.route)
  assert.deepEqual(labels, expected, 'visible context must match exact accepted publication')
  return { timestampMs: last.timestampMs, context: { ...context }, labels: { ...labels },
    scope: 'Same-task published sample/context match, not screenshot identity or performance proof' }
}
