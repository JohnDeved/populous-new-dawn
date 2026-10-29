// Browser-side read-only screenshot gate. The whole function is serialized by
// Playwright evaluateAll; keep it standalone (no imported closure dependencies).
// No scrolling: offscreen controls must fail the caller's viewport check.
export function observeStablePauseControls(nodes) {
  return new Promise((resolve, reject) => {
    const dialog = nodes[0]?.closest('dialog, [role="dialog"]')
    if (!dialog || !nodes.length) return reject(Error('No modal controls'))
    let frame, previous, changed = false, finished = false
    const mutations = new MutationObserver(() => { changed = true })
    mutations.observe(dialog, { childList: true, subtree: true, attributes: true })
    const finish = (error, value) => {
      if (finished) return
      finished = true
      clearTimeout(timer)
      cancelAnimationFrame(frame)
      mutations.disconnect()
      if (error) reject(error)
      else resolve(value)
    }
    // One aggregate stability barrier, bounded inside the unchanged180s cap.
    const timer = setTimeout(() => finish(Error('Modal geometry did not stabilize within5000ms')), 5000)
    const sample = () => {
      try {
        if (changed || nodes.some(node => !node.isConnected || !dialog.contains(node)))
          throw Error('Modal control identity/count changed during capture')
        const boxes = nodes.map(node => {
          const box = node.getBoundingClientRect(), style = getComputedStyle(node)
          if (!node.getClientRects().length || style.visibility === 'hidden' || style.visibility === 'collapse' || box.width <= 0 || box.height <= 0)
            throw Error('Modal control became hidden during capture')
          return { label: node.getAttribute('aria-label') || node.textContent,
            x: box.x, y: box.y, width: box.width, height: box.height }
        })
        const geometry = JSON.stringify(boxes.map(({ x, y, width, height }) => [x, y, width, height]))
        if (previous === geometry) return finish(null, boxes.map((box, i) => ({ ...box,
          hit: nodes[i].contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)),
        })))
        previous = geometry
        frame = requestAnimationFrame(sample)
      } catch (error) { finish(error) }
    }
    frame = requestAnimationFrame(sample)
  })
}
