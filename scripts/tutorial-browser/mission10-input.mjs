// Production-preview input geometry: source-owned pure helpers run in Node.
// Browser callbacks read only live state/pickers; only real input commands change it.
import assert from 'node:assert/strict'
import { minimapPick } from '../../app/minimap.ts'
import { browserPosition } from '../../app/world-coordinates.ts'
import { minimapInput } from '../../qa/erosion-ordinary/minimap-input.mjs'
import { createMoveContextProbe } from '../../qa/erosion-ordinary/input.mjs'
import { checkpointCodec } from './checkpoint-codec.mjs'
import { createMission1VaultInput } from '../local-render/mission1-vault-input.mjs'

export function readMission10Minimap(target) {
  const s = window.testSceneRef.current, rect = s.mini.getBoundingClientRect()
  return { width: s.mini.width, height: s.mini.height,
    rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
    center: { x: Math.round((s.viewPoint.x + 8) * 256), y: Math.round((-s.viewPoint.z - 8) * 256) },
    heading: Math.round(s.cameraBearing * 1024 / Math.PI),
    target: { x: Math.round((target.x + 8) * 256), y: Math.round((-target.z - 8) * 256) },
    maxDistance: 8 * 256 }
}

export function readMission10Ground(target) {
  const s = window.testSceneRef.current, rect = s.renderer.domElement.getBoundingClientRect()
  const projected = s.screen(target), center = { x: rect.left + (projected.x + 1) * rect.width / 2,
    y: rect.top + (1 - projected.y) * rect.height / 2 }, offsets = []
  for (let dy = -180; dy <= 180; dy += 4) for (let dx = -180; dx <= 180; dx += 4) offsets.push({ dx, dy })
  offsets.sort((a, b) => a.dx * a.dx + a.dy * a.dy - b.dx * b.dx - b.dy * b.dy)
  let inspected = 0
  for (const { dx, dy } of offsets) {
    inspected++
    const hit = { x: Math.round(center.x + dx), y: Math.round(center.y + dy) }
    if (document.elementFromPoint(hit.x, hit.y) !== s.renderer.domElement) continue
    const event = { clientX: hit.x, clientY: hit.y }
    if (s.pickUnit(event) || s.picking.pickPerson(event) || s.pickWorldObject(event)) continue
    const point = s.pick(event)
    if (point && Math.hypot(point.x - target.x, point.z - target.z) <= 0.35)
      return { ...hit, point: { x: point.x, z: point.z }, target, inspected, turn: s.world.turn }
  }
  throw Error('No unoccluded ground point within the retained 0.35 aim precision')
}

export async function mission10BoatPoint(page, id) {
  const native = await page.evaluate(id => {
    const boat = window.testSceneRef.current.world.vehicles.find(v => v.id === id)
    if (!boat) throw Error('Authored Boat disappeared')
    return { x: boat.x, y: boat.y }
  }, id)
  const target = browserPosition(native)
  return page.evaluate(({ id, target }) => {
    const s = window.testSceneRef.current, p = s.screen(target), r = s.renderer.domElement.getBoundingClientRect()
    const center = { x: r.left + (p.x + 1) * r.width / 2, y: r.top + (1 - p.y) * r.height / 2 }
    for (let radius = 0; radius <= 40; radius += 4) for (let i = 0; i < 16; i++) {
      const x = center.x + radius * Math.cos(i * Math.PI / 8), y = center.y + radius * Math.sin(i * Math.PI / 8)
      if (document.elementFromPoint(x, y) !== s.renderer.domElement) continue
      const event = { clientX: x, clientY: y }
      if (!s.pickUnit(event) && s.pickWorldObject(event)?.id === id) return { x, y, target }
    }
    throw Error('No exposed authored Boat interior')
  }, { id, target })
}

export function createMission10Input(options) {
  const { page, signal, report, save } = options, input = createMission1VaultInput(options)
  return { ...input,
    async view(target) {
      await input.settle()
      const geometry = await page.evaluate(readMission10Minimap, target)
      const hit = minimapInput(geometry, minimapPick, () => true)
      assert.ok(hit, 'No minimap point near the authored target')
      assert.equal(await page.evaluate(point => document.elementFromPoint(point.x, point.y) === window.testSceneRef.current.mini, hit), true,
        'Actual minimap canvas must own the computed point')
      report.actions.push({ label: 'minimap-probe', geometry, hit }); save()
      await input.action('minimap-view', () => page.mouse.click(hit.x, hit.y))
      await input.settle()
    },
    async fixedGround(target) {
      signal.throwIfAborted()
      // One browser task captures geometry and World at the same simulation
      // boundary. No RAF visit can intervene between the two observations.
      const { hit, transfer } = await page.evaluate(`target => {
        const hit = (${readMission10Ground.toString()})(target)
        return { hit, transfer: (${checkpointCodec.toString()})(window.testSceneRef.current.world) }
      }`, target)
      // Decode and synchronizing command validation occur in Node on a detached
      // World, never in the live browser. Maps and typed arrays are preserved.
      signal.throwIfAborted()
      const snapshot = checkpointCodec(transfer, true)
      assert.equal(snapshot.turn, hit.turn)
      const context = createMoveContextProbe(snapshot)(hit.point)
      assert.equal(context.model, 3, 'Rally must resolve the ordinary ground command')
      assert.equal(context.enabled, true, 'Rally command must be enabled')
      return { ...hit, context, rejection: null }
    },
  }
}
