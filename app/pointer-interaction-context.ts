// Optional diagnostic context, not gameplay state. No positions or identities are exported.
export const INTERACTION_ROUTES = ['unknown', 'world', 'hud', 'outside'] as const
export const INTERACTION_BOOLEAN_FIELDS = ['dragQuery', 'placementQuery', 'sharedTerrain'] as const
export const INTERACTION_CHANGE_FIELDS = ['pointerMoved', 'viewChanged'] as const
export interface PointerInteractionContext {
  version: 1
  route: (typeof INTERACTION_ROUTES)[number]
  pointerMoved: boolean | null
  viewChanged: boolean | null
  dragQuery: boolean
  placementQuery: boolean
  sharedTerrain: boolean
}
export function createPointerInteractionContext(): PointerInteractionContext {
  return {
    version: 1,
    route: 'unknown',
    pointerMoved: null,
    viewChanged: null,
    dragQuery: false,
    placementQuery: false,
    sharedTerrain: false,
  }
}
export function resetPointerInteractionContext(context: PointerInteractionContext) {
  context.route = 'unknown'
  context.pointerMoved = null
  context.viewChanged = null
  for (const key of INTERACTION_BOOLEAN_FIELDS) context[key] = false
}
export function validPointerInteractionContext(value: unknown): value is PointerInteractionContext {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const context = value as PointerInteractionContext
  return (
    context.version === 1 &&
    INTERACTION_ROUTES.includes(context.route) &&
    INTERACTION_BOOLEAN_FIELDS.every(key => typeof context[key] === 'boolean') &&
    INTERACTION_CHANGE_FIELDS.every(
      key => context[key] === null || typeof context[key] === 'boolean'
    )
  )
}

// One bounded scratch record per diagnostic context. It is not part of exports.
const previous = new WeakMap<
  PointerInteractionContext,
  {
    recording: object | null | undefined
    values: Float64Array
  }
>()

// Called only with F8 diagnostics enabled. Compare to the last recorded pointer
// sample, not input-event counts; each recording epoch starts an unknown baseline.
// Pass only the lightweight epoch identity, not a graph or scene reference.
export function capturePointerInteraction(
  context: PointerInteractionContext,
  recording: object | null | undefined,
  pointer: { clientX: number; clientY: number } | null,
  viewInputs: readonly unknown[],
  route: string | undefined
) {
  let state = previous.get(context)
  const known =
    !!state && state.recording === recording && state.values.length === viewInputs.length + 2
  if (!known) {
    state = { recording, values: new Float64Array(viewInputs.length + 2) }
    previous.set(context, state)
  }
  const values = state!.values,
    x = pointer?.clientX ?? NaN,
    y = pointer?.clientY ?? NaN
  context.pointerMoved =
    known && pointer && Number.isFinite(values[0]) && Number.isFinite(values[1])
      ? x !== values[0] || y !== values[1]
      : null
  values[0] = x
  values[1] = y
  let changed = false
  // The caller reuses its existing invalidation-input array. Slots 8 onward
  // are view point/bearing/zoom/preset/transition/overview/camera/viewport only.
  for (let i = 8; i < viewInputs.length; i++) {
    const value = viewInputs[i] === undefined ? NaN : Number(viewInputs[i])
    if (!Object.is(values[i + 2], value)) changed = true
    values[i + 2] = value
  }
  context.viewChanged = known ? changed : null
  context.route =
    route === 'world' || route === 'unmapped-cell' || route === 'unmapped-object'
      ? 'world'
      : route === 'hud' ||
          route === 'unmapped-hud' ||
          route === 'unmapped-panel' ||
          route === 'message'
        ? 'hud'
        : route === 'outside'
          ? 'outside'
          : 'unknown'
}
