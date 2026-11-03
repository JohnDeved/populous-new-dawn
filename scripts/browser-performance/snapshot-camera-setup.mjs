// Test-only public-input preparation. No camera, world or clock writes.
import assert from 'node:assert/strict'
import { checkpointCodec } from '../tutorial-browser/checkpoint-codec.mjs'

export function snapshotCameraOwner(fixture) {
  const world = checkpointCodec(fixture.expected, true)
  const owner = world.cameras?.tribes?.[world.manaWorld?.playerTribe]
  assert.ok(owner && typeof owner === 'object', 'Missing persisted tribe camera')
  assert.deepEqual(Object.keys(owner).sort(), ['angle', 'h', 'initialized', 'x', 'y'])
  for (const field of ['x', 'y', 'angle']) assert.ok(Number.isInteger(owner[field]), `Invalid camera ${field}`)
  assert.ok(owner.x >= 0 && owner.x <= 65535 && owner.y >= 0 && owner.y <= 65535)
  assert.ok(owner.angle >= 0 && owner.angle < 2048)
  assert.ok(Number.isFinite(owner.h)); assert.equal(owner.initialized, true)
  return { ...owner }
}

export function snapshotFinalCamera(fixture) {
  return { ...snapshotCameraOwner(fixture),
    x: Math.round((fixture.receipt.focus.x + 8) * 256) & 65535,
    y: Math.round((-fixture.receipt.focus.z - 8) * 256) & 65535, angle: 0 }
}

export async function prepareSnapshotCamera(page, fixture) {
  const owner = snapshotCameraOwner(fixture)
  // Public focus settles the position; it deliberately retains persisted heading.
  await page.locator('canvas.battlefield').focus()
  await page.keyboard.press('f')
  await page.waitForFunction(() => !window.testSceneRef.current.cameraMotion.active)
  const point = await page.evaluate(() => {
    const scene = window.testSceneRef.current, c = scene.renderer.domElement, r = c.getBoundingClientRect()
    const x = Math.floor(r.left + r.width / 2), y = Math.floor(r.top + r.height / 2)
    if ([x - 32, x, x + 32].some(px => document.elementFromPoint(px, y) !== c))
      throw Error('Public camera drag path is not owned by battlefield')
    return { x, y, angle: scene.cameraPosition.angle }
  })
  assert.equal(point.angle, owner.angle, 'Public focus must preserve the authored heading')
  const drag = async dx => {
    await page.mouse.move(point.x, point.y); await page.mouse.down({ button: 'right' })
    try { await page.mouse.move(point.x + dx, point.y) }
    finally { await page.mouse.up({ button: 'right' }) }
  }
  // At most 32 bounded public drags; shortest signed turn, never a direct pose write.
  let remaining = ((-owner.angle + 1024) & 2047) - 1024
  while (remaining) {
    const dx = Math.sign(remaining) * Math.min(32, Math.abs(remaining))
    await drag(dx); remaining -= dx
  }
  // Preserve the original symmetrical warmup and public interaction cleanup.
  await drag(32); await drag(-32)
  await page.mouse.click(point.x, point.y, { button: 'right' })
}
