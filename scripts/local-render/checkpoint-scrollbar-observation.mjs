import assert from 'node:assert/strict'

// Serialized into the current locator's evaluation. No cached nodes, mutation,
// application imports, extra browser requests or fabricated scroll/focus state.
export function observeCheckpointLayout(target) {
  const dialog = target.matches('dialog') ? target : target.closest('dialog[data-original-pause-menu]')
  const panels = dialog.querySelectorAll('section'), panel = panels[0]
  const wrappers = dialog.querySelectorAll('[data-pause-checkpoint-body]'), body = wrappers[0]
  const scrollers = dialog.querySelectorAll('[data-pause-checkpoint-scroll]'), scroller = scrollers[0]
  const frame = dialog.firstElementChild
  const box = node => {
    if (!node) return null
    const r = node.getBoundingClientRect()
    return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom }
  }
  const visible = node => {
    if (!node) return false
    for (let current = node; current; current = current.parentElement) {
      const style = getComputedStyle(current)
      if (style.display === 'none' || style.visibility !== 'visible' || Number(style.opacity) <= 0) return false
    }
    return true
  }
  const hit = node => {
    if (!node) return false
    const r = node.getBoundingClientRect()
    return node.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2))
  }
  const text = node => {
    const glyphs = node.querySelectorAll('i').length
    const shown = node.matches('p') ? node.lastElementChild : node.firstElementChild
    const style = getComputedStyle(shown), range = document.createRange()
    range.selectNodeContents(shown)
    return { glyphs,
      lines: glyphs ? [...node.querySelectorAll(':scope > [aria-hidden="true"] > span')].map(box)
        : [...range.getClientRects()].map(r => ({ x: r.x, y: r.y, right: r.right, bottom: r.bottom })),
      images: [...new Set([...node.querySelectorAll('i')].map(glyph => getComputedStyle(glyph).backgroundImage))],
      fallback: glyphs ? null : { text: shown.textContent, box: box(shown), display: style.display,
        visibility: style.visibility, opacity: Number(style.opacity) },
    }
  }
  const allButtons = [...dialog.querySelectorAll(':scope > :not([data-fullscreen-control]) button')]
  const area = scroller?.parentElement, track = area?.children[1], thumb = track?.firstElementChild
  const drag = thumb?.querySelector('[aria-hidden="true"]')
  const caps = [...dialog.querySelectorAll('[data-pause-checkpoint-cap]')]
  const background = drag && getComputedStyle(drag).backgroundImage
  const imageUrl = /^url\("([^"]+)"\)$/.exec(background ?? '')?.[1]
  const dragUrl = imageUrl ? new URL(imageUrl, location.href) : null
  return {
    panel: dialog.dataset.panel, dpr: devicePixelRatio,
    viewport: { width: innerWidth, height: innerHeight }, hud: box(document.querySelector('.native-hud')),
    frame: box(frame), background: panel && getComputedStyle(panel).backgroundColor,
    border: panel && getComputedStyle(panel).borderTopWidth,
    titleTop: panel?.querySelector('h2')?.offsetTop,
    title: panel?.querySelector('h2') && { copy: panel.querySelector('h2').getAttribute('aria-label'), ...text(panel.querySelector('h2')) },
    structure: { panels: panels.length, wrappers: wrappers.length, scrollers: scrollers.length,
      namedRegions: dialog.querySelectorAll('[aria-label="Checkpoint details"]').length,
      owned: !!body && !!scroller && body !== scroller && body.parentElement === panel &&
        body.contains(scroller) && scroller.closest('dialog') === dialog && area.parentElement === body,
      targetIsScroller: target === scroller },
    body: body && { left: body.offsetLeft, top: body.offsetTop, height: body.offsetHeight, width: body.offsetWidth,
      overflow: scroller?.scrollHeight > scroller?.clientHeight,
      horizontalOverflow: scroller?.scrollWidth > scroller?.clientWidth,
      box: box(body), paragraphs: [...(scroller?.querySelectorAll('p') ?? [])].map(node => ({
        copy: node.firstElementChild.textContent, ...text(node),
        pitches: [...node.querySelectorAll(':scope > [aria-hidden="true"]')].filter(line => line.querySelector('i')).map(line => line.offsetHeight),
      })) },
    scroller: scroller && { box: box(scroller), id: scroller.id,
      idCount: [...document.querySelectorAll('[id]')].filter(node => node.id === scroller.id).length,
      label: scroller.getAttribute('aria-label'), role: scroller.getAttribute('role'), tabIndex: scroller.tabIndex,
      visible: visible(scroller), focused: scroller === document.activeElement, focusVisible: scroller.matches(':focus-visible'),
      scrollTop: scroller.scrollTop, scrollHeight: scroller.scrollHeight, clientHeight: scroller.clientHeight,
      scrollWidth: scroller.scrollWidth, clientWidth: scroller.clientWidth,
      overflowY: getComputedStyle(scroller).overflowY, scrollbarWidth: getComputedStyle(scroller).scrollbarWidth,
      contentWidth: scroller.firstElementChild?.offsetWidth, contentBox: box(scroller.firstElementChild) },
    buttons: [...dialog.querySelectorAll('button[data-pause-action]')].map(node => ({
      label: node.getAttribute('aria-label'), marker: node.getAttribute('data-pause-action'),
      owner: node.closest('dialog') === dialog && allButtons.includes(node),
      cap: node.getAttribute('data-pause-checkpoint-cap'), top: node.offsetTop, box: box(node), ...text(node),
      visible: visible(node), disabled: node.disabled, reachable: hit(node),
    })),
    buttonKinds: allButtons.map(node => ({ action: node.getAttribute('data-pause-action'),
      cap: node.getAttribute('data-pause-checkpoint-cap'), label: node.getAttribute('aria-label') })),
    art: { enabled: area?.getAttribute('data-scroll-art'), forcedColors: matchMedia('(forced-colors: active)').matches,
      track: box(track), thumb: box(thumb), drag: box(drag),
      visible: visible(track), sibling: !!track && track.parentElement === area && !scroller.contains(track),
      background, dragVisible: visible(drag), dragHit: hit(drag),
      dragImage: dragUrl && { path: dragUrl.pathname, sameOrigin: dragUrl.origin === location.origin },
      repeat: drag && getComputedStyle(drag).backgroundRepeat,
      caps: caps.map(node => {
        const images = node.querySelectorAll('img'), image = images[0]
        return { direction: node.getAttribute('data-pause-checkpoint-cap'), tag: node.tagName,
          label: node.getAttribute('aria-label'), action: node.getAttribute('data-pause-action'),
          controls: node.getAttribute('aria-controls'), controlsOwner: !!scroller &&
            node.getAttribute('aria-controls') === scroller.id && document.getElementById(scroller.id) === scroller,
          owner: !!body && !!thumb && node.parentElement === thumb && node.closest('dialog') === dialog &&
            body.contains(node) && !scroller.contains(node),
          disabled: node.disabled, tabIndex: node.tabIndex, visible: visible(node), hit: hit(node), box: box(node),
          highlighted: node.matches(':hover') || node === document.activeElement,
          image: image && { count: images.length, src: image.getAttribute('src'),
            currentSrc: new URL(image.currentSrc || image.src, location.href).pathname,
            sameOrigin: new URL(image.currentSrc || image.src, location.href).origin === location.origin,
            complete: image.complete, width: image.naturalWidth, height: image.naturalHeight,
            alt: image.getAttribute('alt'), draggable: image.draggable, visible: visible(image), box: box(image) },
        }
      }) },
  }
}

const finiteBox = box => box && ['x', 'y', 'right', 'bottom', 'width', 'height'].every(key => Number.isFinite(box[key])) &&
  box.width > 0 && box.height > 0 && box.right > box.x && box.bottom > box.y
const near = (actual, expected, message) => assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) < .15, message)
function at(box, x, y, width, height, message) {
  assert.ok(finiteBox(box), `${message}: finite positive geometry`)
  for (const [key, value] of Object.entries({ x, y, width, height, right: x + width, bottom: y + height }))
    near(box[key], value, `${message}: ${key}`)
}

// This normal-art series intentionally has no implicit missing-art/high-contrast
// exception. Those are separately admitted interactions, not a hidden pass here.
export function assertCheckpointScrollbar(layout, panel) {
  assert.ok(['save', 'load'].includes(panel), 'This oracle covers the settled save/load series')
  assert.equal(layout.panel, panel)
  const { structure, body, scroller, frame, art, buttons, buttonKinds } = layout
  assert.deepEqual([structure.panels, structure.wrappers, structure.scrollers, structure.namedRegions], [1, 1, 1, 1],
    'Exactly one checkpoint panel, wrapper and actual named scroller are required')
  assert.equal(structure.owned, true, 'Checkpoint wrapper/scroller retain their exact owners')
  assert.ok(finiteBox(frame), 'Actual pause frame geometry is required')
  const scale = frame.width / 640
  near(frame.height, 480 * scale, 'Pause frame retains uniform scale')
  assert.deepEqual([body.left, body.top, body.width, body.height], [104, 81, 432, 270])
  at(body.box, frame.x + 104 * scale, frame.y + 81 * scale, 432 * scale, 270 * scale, 'Fixed checkpoint wrapper')
  at(scroller.box, body.box.x, body.box.y, body.box.width, body.box.height, 'Actual checkpoint scroller')
  assert.ok(typeof scroller.id === 'string' && scroller.id.length > 0, 'Scroller has a nonempty ID')
  assert.equal(scroller.idCount, 1, 'Scroller ID resolves uniquely')
  assert.deepEqual([scroller.label, scroller.role, scroller.tabIndex], ['Checkpoint details', 'region', 0])
  assert.equal(scroller.visible, true, 'Actual scroller is visible')
  assert.equal(scroller.overflowY, 'auto')
  for (const key of ['scrollHeight', 'clientHeight', 'scrollWidth', 'clientWidth'])
    assert.ok(Number.isFinite(scroller[key]) && scroller[key] > 0, `Positive actual scroller ${key}`)
  const maximum = Math.max(0, scroller.scrollHeight - scroller.clientHeight)
  assert.ok(Number.isFinite(scroller.scrollTop) && scroller.scrollTop >= 0 && scroller.scrollTop <= maximum + 1,
    'Actual scroller position is finite and bounded')
  assert.equal(body.overflow, maximum > 0)
  assert.equal(body.horizontalOverflow, false)
  assert.equal(scroller.scrollWidth, scroller.clientWidth, 'Checkpoint copy has no horizontal scrolling')
  assert.equal(scroller.contentWidth, 368)
  assert.ok(finiteBox(scroller.contentBox), 'Checkpoint copy has positive geometry')
  near(scroller.contentBox.width, 368 * scale, 'Native-size checkpoint copy width')
  near(scroller.contentBox.x + scroller.contentBox.width / 2,
    scroller.box.x + scroller.clientWidth * scale / 2, 'Checkpoint copy centers in the actual client width')
  assert.equal(art.forcedColors, false, 'Ordinary art evidence cannot silently become a forced-colors experiment')
  assert.equal(art.enabled, String(maximum > 0), 'Normal overflow must use decoded original scrollbar artwork')
  const actions = ['Back', panel === 'save' ? 'Save checkpoint' : 'Load checkpoint']
  assert.deepEqual(buttons.map(button => button.label).sort(), [...actions].sort(), 'Exact settled native actions remain complete')
  for (const button of buttons) {
    assert.equal(button.marker, button.label, 'Action marker agrees exactly with its accessible label')
    assert.equal(button.owner, true, 'Action remains in the native modal control scope')
    assert.equal(button.cap, null, 'Scrollbar caps are not native text actions')
    assert.equal(button.visible, true); assert.equal(button.disabled, false)
    assert.ok(finiteBox(button.box), 'Native action geometry is finite and positive')
    assert.equal(button.reachable, true, 'Native action is the actual physical hit target')
  }
  const directions = maximum > 0 ? ['down', 'up'] : []
  assert.deepEqual(art.caps.map(cap => cap.direction).sort(), directions, 'Exactly the expected scrollbar caps are present')
  assert.equal(buttonKinds.length, buttons.length + directions.length, 'Every native button is an action or expected cap')
  assert.deepEqual(buttonKinds.filter(item => item.action !== null).map(item => item.action).sort(), [...actions].sort())
  assert.deepEqual(buttonKinds.filter(item => item.cap !== null).map(item => item.cap).sort(), directions)
  for (const item of buttonKinds) assert.notEqual(item.action !== null, item.cap !== null, 'No unclassified or dual-marked native button')
  if (!maximum) {
    assert.deepEqual([art.track, art.thumb, art.drag], [null, null, null], 'No art track without actual overflow')
    return
  }
  assert.equal(scroller.scrollbarWidth, 'none', 'Original art replaces the ordinary system scrollbar')
  assert.equal(art.visible, true); assert.equal(art.sibling, true, 'Art remains outside scrolling copy')
  const thumb = Math.min(scroller.clientHeight, Math.max(34, Math.floor(scroller.clientHeight ** 2 / scroller.scrollHeight)))
  const travel = scroller.clientHeight - thumb
  const offset = Math.round(Math.max(0, Math.min(maximum, scroller.scrollTop)) * travel / maximum)
  const x = body.box.right - 24 * scale, y = body.box.y + offset * scale
  at(art.track, x, body.box.y, 24 * scale, scroller.clientHeight * scale, 'Original-art track')
  at(art.thumb, x, y, 24 * scale, thumb * scale, 'Moving original-art thumb')
  at(art.drag, x, y + 10 * scale, 24 * scale, (thumb - 22) * scale, 'Original-art drag body')
  assert.equal(art.dragVisible, true); assert.equal(art.dragHit, true, 'Tiled drag body remains visible and hittable')
  assert.deepEqual(art.dragImage, { path: '/original/help/hfx-455.png', sameOrigin: true }, 'Drag body uses the same-origin original tiled image')
  assert.ok(art.background.endsWith('/original/help/hfx-455.png")'), 'Observed tiled background agrees with its image identity')
  assert.equal(art.repeat, 'repeat-y')
  for (const cap of art.caps) {
    const up = cap.direction === 'up', height = up ? 10 : 12
    const src = `/original/help/hfx-${(up ? 451 : 452) + (cap.highlighted ? 2 : 0)}.png`
    assert.deepEqual([cap.tag, cap.label, cap.action, cap.disabled, cap.tabIndex],
      ['BUTTON', `Scroll checkpoint details ${cap.direction}`, null, false, 0])
    assert.equal(cap.owner, true, 'Cap belongs to this non-scrolling art thumb')
    assert.equal(cap.controls, scroller.id); assert.equal(cap.controlsOwner, true)
    assert.equal(cap.visible, true); assert.equal(cap.hit, true, 'Cap is the actual physical hit target')
    at(cap.box, x, y + (up ? 0 : thumb - 12) * scale, 24 * scale, height * scale, 'Original-art cap')
    assert.ok(cap.box.x >= art.track.x - .15 && cap.box.right <= art.track.right + .15 &&
      cap.box.y >= art.track.y - .15 && cap.box.bottom <= art.track.bottom + .15, 'Cap is unclipped in its track')
    assert.ok(cap.image, 'Cap image remains present')
    assert.deepEqual([cap.image.count, cap.image.src, cap.image.currentSrc, cap.image.sameOrigin, cap.image.complete,
      cap.image.width, cap.image.height, cap.image.alt, cap.image.draggable, cap.image.visible],
      [1, src, src, true, true, 24, height, '', false, true], 'Cap uses the decoded original image and current focus/hover state')
    at(cap.image.box, cap.box.x, cap.box.y, cap.box.width, cap.box.height, 'Original-art cap image')
  }
}

export function assertCheckpointCapsOccupied(expected, sample) {
  assert.ok(Array.isArray(expected), 'Independent native-control cap witness is required')
  assert.deepEqual(expected.slice().sort(), expected.length ? ['down', 'up'] : [], 'Cap witness has exact direction multiplicity')
  assert.deepEqual(sample.occupied.filter(item => item.checkpointCap !== undefined).map(item => item.checkpointCap).sort(),
    expected.slice().sort(), 'Every resolved cap remains in fullscreen occupied geometry')
}
