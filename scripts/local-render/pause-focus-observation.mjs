// Keep the original locator and focus predicate. A unique current match can be
// observed atomically without allocating an ElementHandle. Ambiguous or absent
// matches still take the original strict, attachment-waiting evaluate path.
export async function observePauseKeyboardFocus(target) {
  const sample = await target.evaluateAll(nodes => nodes.length === 1
    ? { unique: true, focused: nodes[0] === document.activeElement && nodes[0].matches(':focus-visible') }
    : { unique: false })
  if (sample.unique) return sample.focused
  return target.evaluate(node => node === document.activeElement && node.matches(':focus-visible'))
}
