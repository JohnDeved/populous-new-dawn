// Shared only by controlled-elapsed browser checks. This never calls tick,
// advanceGame, a presentation visit, or a renderer leaf directly.
export const CONTROLLED_FRAME_MS = 1000 / 24

export async function runSceneFrames({
  scene, currentScene, currentWorld, until, onFrame = () => {}, validate = () => {},
  frameMs = CONTROLLED_FRAME_MS, maxFrames, maxTurns, batchFrames = 8,
  allowPaused = false, requireGoal = true, deadline,
  now = () => performance.now(), yieldTask = () => new Promise(resolve => setTimeout(resolve, 0)),
  aborted = () => false,
}) {
  for (const [key, value] of Object.entries({ frameMs, maxFrames, maxTurns, batchFrames, deadline }))
    if (!Number.isFinite(value) || value <= 0) throw new RangeError(`Invalid controlled-frame ${key}`)
  if (![maxFrames, maxTurns, batchFrames].every(Number.isSafeInteger) || batchFrames > 8)
    throw new RangeError('Frame/turn budgets must be integers; at most eight frames per batch')
  const world = scene.world, startTurn = world.turn
  let frames = 0, primed = false, lastTurn = startTurn
  const synchronous = (value, label) => {
    if (value && typeof value.then === 'function') throw Error(`${label} must be synchronous`)
    return value
  }
  const check = () => {
    if (aborted()) throw Error('Controlled-frame execution aborted')
    if (!Number.isFinite(now()) || now() >= deadline) throw Error('Controlled-frame wall deadline exceeded')
    if (currentScene() !== scene || currentWorld() !== world || scene.world !== world)
      throw Error('Controlled-frame Scene/World ownership changed')
    if (world.speed !== 1) throw Error('Controlled frames require normal game speed=1')
    if (!allowPaused && world.paused) throw Error('Controlled gameplay unexpectedly paused')
    if (!Number.isSafeInteger(world.turn) || world.turn < lastTurn) throw Error('Invalid or reversed object turn')
    synchronous(validate(), 'Frame validation')
  }
  const ready = () => {
    const value = synchronous(until(), 'Frame predicate')
    if (typeof value !== 'boolean') throw Error('Frame predicate must return a boolean')
    return value
  }
  check()
  if (scene.previous === null) {
    const timestamp = now()
    scene.animate(timestamp) // Original first frame establishes previous, with zero elapsed time.
    primed = true
    if (scene.previous !== timestamp || world.turn !== startTurn)
      throw Error('Original priming frame advanced time or changed timestamp ownership')
    check()
  }
  if (!Number.isFinite(scene.previous)) throw Error('Scene previous timestamp is not finite')
  let reached = ready()
  while (!reached && frames < maxFrames && world.turn - startTurn < maxTurns) {
    check()
    const previous = scene.previous, timestamp = previous + frameMs, beforeTurn = world.turn
    if (!(timestamp > previous) || !Number.isFinite(timestamp)) throw Error('Invalid monotonic frame timestamp')
    scene.animate(timestamp) // The complete original Scene path owns every elapsed clock and draw.
    frames++
    if (scene.previous !== timestamp) throw Error('Scene did not retain the supplied frame timestamp')
    check()
    if (world.turn - startTurn > maxTurns) throw Error('Frame overshot the object-turn budget')
    synchronous(onFrame({ frame: frames, turn: world.turn, beforeTurn, timestamp }), 'Frame observation')
    lastTurn = world.turn
    reached = ready() // Observe each full frame, including transitions inside a batch.
    if (!reached && frames % batchFrames === 0) {
      const beforeYield = scene.previous
      await yieldTask() // Never await RAF when this check deliberately holds RAF callbacks.
      check()
      if (scene.previous !== beforeYield) throw Error('Unowned elapsed frame ran during the browser-task yield')
    }
  }
  const beforeYield = scene.previous
  await yieldTask() // Allow actual asset/React tasks to settle before the next public command.
  check()
  if (scene.previous !== beforeYield) throw Error('Unowned elapsed frame ran before the next public command')
  if (requireGoal && !reached) throw Error(`Controlled-frame goal missed its bound (${frames} frames, ${world.turn - startTurn} turns)`)
  return { reached, frames, primed, turns: world.turn - startTurn, startTurn, turn: world.turn,
    frameMs, suppliedElapsedMilliseconds: frames * frameMs }
}
