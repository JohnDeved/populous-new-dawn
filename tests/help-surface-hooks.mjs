// Explicit hook boundary for the production surface's layout-effect callback.
// Does NOT claim a mounted React DOM tree, effects ordering or browser evidence.
export const hookBoundary = { refs: [], effects: [] }
export const useCallback = callback => callback
export const useSyncExternalStore = (_subscribe, getSnapshot) => getSnapshot()
export const useRef = value => {
  const ref = { current: value }
  hookBoundary.refs.push(ref)
  return ref
}
export const useLayoutEffect = effect => { hookBoundary.effects.push(effect) }
