import assert from 'node:assert/strict'
import { audioOptionsControl } from '../browser-options-audio.mjs'

// These are read-only layout/hit-test observations of one retained public control.
// Sampled hit tests do not claim that every painted pixel is unobscured.
export function observeAudioFrame(element, owner) {
  const rect = element.getBoundingClientRect()
  const bounds = { x: rect.x, y: rect.y, width: rect.width, height: rect.height,
    top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left }
  const controls = document.querySelectorAll('dialog[data-original-pause-menu][open] [data-original-options][data-skin="ingame"] .audio-settings button[data-option-key="audio"]')
  const scene = window.testSceneRef.current, world = window.testStore.getWorld()
  const viewport = { width: innerWidth, height: innerHeight, dpr: devicePixelRatio }
  let visibleStyle = true, geometrySupported = true, clipped = false, node = element, depth = 0
  const scroll = []
  for (; node && depth < 32; node = node.parentElement, depth++) {
    const style = getComputedStyle(node)
    visibleStyle &&= style.display !== 'none' && !['hidden', 'collapse'].includes(style.visibility) && Number(style.opacity) > 0
    if (style.transform !== 'none') {
      const matrix = new DOMMatrixReadOnly(style.transform)
      geometrySupported &&= matrix.is2D && matrix.b === 0 && matrix.c === 0 && matrix.a > 0 && matrix.d > 0
    }
    geometrySupported &&= style.perspective === 'none' && style.clipPath === 'none'
    if (node === element) continue
    const parent = node.getBoundingClientRect()
    const clipX = ['auto', 'scroll', 'hidden', 'clip'].includes(style.overflowX)
    const clipY = ['auto', 'scroll', 'hidden', 'clip'].includes(style.overflowY)
    if (clipX || clipY) {
      // The real menu is scaled. DOM rects are rendered CSS pixels whereas
      // client/offset dimensions precede that scale; compare in one space.
      const scaleX = parent.width / node.offsetWidth, scaleY = parent.height / node.offsetHeight
      geometrySupported &&= [scaleX, scaleY].every(value => Number.isFinite(value) && value > 0)
      const left = parent.left + node.clientLeft * scaleX, top = parent.top + node.clientTop * scaleY
      if (clipX) clipped ||= rect.left < left || rect.right > left + node.clientWidth * scaleX
      if (clipY) clipped ||= rect.top < top || rect.bottom > top + node.clientHeight * scaleY
    }
    if (node.scrollWidth > node.clientWidth || node.scrollHeight > node.clientHeight)
      scroll.push({ depth, left: node.scrollLeft, top: node.scrollTop })
  }
  const samples = [[0.5, 0.5], [0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]]
    .map(([x, y]) => {
      const hit = document.elementFromPoint(rect.left + x * rect.width, rect.top + y * rect.height)
      return hit === element || element.contains(hit)
    })
  return { connected: element.isConnected, exactControl: controls.length === 1 && controls[0] === element,
    label: element.getAttribute('aria-label'), busy: element.getAttribute('aria-busy'), disabled: element.disabled,
    sameWorldScene: world === owner.world && scene === owner.scene && scene.world === world,
    ownedCanvas: scene.renderer.domElement === document.querySelector('.world-viewport canvas.battlefield'),
    paused: world.paused, bounds, viewport, scroll, visibleStyle, geometrySupported, clipped, ancestryBounded: node === null, samples }
}

export function assertAudioFrame(frame, label) {
  assert.ok(['♪ Sound on', '♫ Enable sound'].includes(label))
  for (const key of ['connected', 'exactControl', 'sameWorldScene', 'ownedCanvas', 'paused', 'visibleStyle', 'geometrySupported', 'ancestryBounded'])
    assert.equal(frame[key], true, `Audio frame requires ${key}`)
  assert.equal(frame.label, label)
  assert.equal(frame.busy, 'false')
  assert.equal(frame.disabled, false)
  assert.equal(frame.clipped, false, 'Audio control must fit its clipping ancestors')
  assert.equal(frame.samples.length, 5)
  assert.ok(frame.samples.every(value => value === true), 'Audio hit-test samples must resolve to the retained control')
  assert.ok(Object.values(frame.bounds).every(Number.isFinite))
  assert.ok(Object.values(frame.viewport).every(value => Number.isFinite(value) && value > 0))
  assert.ok(frame.bounds.width > 0 && frame.bounds.height > 0)
  assert.ok(frame.bounds.left >= 0 && frame.bounds.top >= 0 && frame.bounds.right <= frame.viewport.width && frame.bounds.bottom <= frame.viewport.height,
    'Audio control must fit the captured viewport')
  assert.ok(frame.scroll.length <= 31)
  assert.ok(frame.scroll.every(value => Object.values(value).every(Number.isFinite)))
}

export async function captureAudioFrame({ page, owner, label, name, captures, budget, capture, metadata }) {
  assert.ok(['♪ Sound on', '♫ Enable sound'].includes(label))
  assert.equal(name, label === '♪ Sound on' ? 'options-sound-enabled.png' : 'options-sound-muted.png')
  assert.ok(captures.length < 8, 'Options episode PNG limit')
  assert.ok(metadata.length < 2 && !metadata.some(frame => frame.name === name), 'Each sound screenshot slot is admitted once')
  let control, failed = false, primary
  const frame = { status: 'running', name, expectedLabel: label }
  metadata.push(frame)
  try {
    const locator = audioOptionsControl(page)
    assert.equal(await budget.step(() => locator.count()), 1, 'Exactly one public audio control required')
    await budget.step(async () => { control = await locator.elementHandle() })
    assert.ok(control, 'Retain the actual audio control before scrolling')
    await budget.step(timeout => control.scrollIntoViewIfNeeded({ timeout }))
    frame.before = await budget.step(() => control.evaluate(observeAudioFrame, owner))
    assertAudioFrame(frame.before, label)
    await capture()
    frame.after = await budget.step(() => control.evaluate(observeAudioFrame, owner))
    assertAudioFrame(frame.after, label)
    assert.deepEqual(frame.after, frame.before, 'Audio state, ownership, bounds and scroll must remain stable during capture')
  } catch (error) { failed = true; primary = error; frame.failure = String(error) }
  finally {
    try { await control?.dispose() }
    catch (error) { frame.cleanupError = String(error); if (!failed) { failed = true; primary = error } }
    try { budget.check() }
    catch (error) { if (!failed) { failed = true; primary = error } }
    frame.status = failed ? 'failed' : 'passed'
  }
  if (failed) throw primary
}
