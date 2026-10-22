import assert from 'node:assert/strict'

// Observation only: never move focus, click through an overlay or mutate layout.
// Callers retain the returned geometry before asserting it, including failures.
export async function observeFullscreenClearance(page, owner, occupied) {
  return page.evaluate(({ owner, occupied }) => {
    const bounds = node => {
      const r = node.getBoundingClientRect(), style = getComputedStyle(node)
      const ring = style.outlineStyle === 'none' ? 0 : Math.max(0, parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset))
      return { x:r.x-ring, y:r.y-ring, right:r.right+ring, bottom:r.bottom+ring }
    }
    const host = document.querySelector('[data-fullscreen-control]'), button = host?.querySelector('button')
    if (!button) return null
    const rect = button.getBoundingClientRect()
    return { viewport:{width:innerWidth,height:innerHeight}, owner:host.parentElement.matches(owner),
      count:document.querySelectorAll('[data-fullscreen-control]').length,
      button:{x:rect.x,y:rect.y,width:rect.width,height:rect.height}, focus:bounds(button),
      hit:button.contains(document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2)),
      focused:document.activeElement === button, focusVisible:button.matches(':focus-visible'),
      activeLabel:document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.textContent,
      occupied:[...document.querySelectorAll(occupied)].map(node => ({label:node.getAttribute('aria-label') ?? node.className, ...bounds(node)})) }
  }, { owner, occupied })
}
export function assertFullscreenClearance(sample) {
  assert.ok(sample, 'Fullscreen remains present')
  assert.equal(sample.owner, true, 'Fullscreen retains the expected modal/body owner')
  assert.equal(sample.count, 1)
  assert.equal(sample.hit, true, 'Fullscreen remains the actual physical hit target')
  assert.deepEqual([sample.button.width,sample.button.height],[17,14])
  const validBox = box => box && ['x','y','right','bottom'].every(key => Number.isFinite(box[key]))
    && box.right > box.x && box.bottom > box.y
  const box = sample.focus
  assert.ok(validBox(box), 'Fullscreen focus geometry must be finite and positive-area')
  assert.ok(Array.isArray(sample.occupied) && sample.occupied.length > 0, 'Occupied geometry must be present')
  assert.ok(box.x >= 0 && box.y >= 0 && box.right <= sample.viewport.width && box.bottom <= sample.viewport.height,
    'Fullscreen and its visible focus ring remain unclipped')
  for (const target of sample.occupied) {
    assert.ok(validBox(target), `Occupied geometry must be finite and positive-area: ${target.label}`)
    assert.equal(box.x < target.right && box.right > target.x && box.y < target.bottom && box.bottom > target.y, false,
      `Fullscreen must clear ${target.label}: ${JSON.stringify({box,target})}`)
  }
}
