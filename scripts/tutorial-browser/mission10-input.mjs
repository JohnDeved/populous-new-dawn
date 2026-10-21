import { prepareWorldInput } from '../browser-world-input.mjs'
import { BuilderTask } from '../../app/building-workers.ts'
import { builderActivity, unitAnimationSource } from '../../app/unit-animation-source.ts'
import { hudPersonSource } from '../../app/hud-person-source.ts'
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

export function readMission10Ground(target, reportFailure = false) {
  const s = window.testSceneRef.current, rect = s.renderer.domElement.getBoundingClientRect()
  const projected = s.screen(target), center = { x: rect.left + (projected.x + 1) * rect.width / 2,
    y: rect.top + (1 - projected.y) * rect.height / 2 }, offsets = []
  for (let dy = -180; dy <= 180; dy += 4) for (let dx = -180; dx <= 180; dx += 4) offsets.push({ dx, dy })
  offsets.sort((a, b) => a.dx * a.dx + a.dy * a.dy - b.dx * b.dx - b.dy * b.dy)
  let inspected = 0, nearestAimError = null
  const rejected = { owner: 0, unit: 0, person: 0, object: 0, terrain: 0, aim: 0 }
  for (const { dx, dy } of offsets) {
    inspected++
    const hit = { x: Math.round(center.x + dx), y: Math.round(center.y + dy) }
    if (document.elementFromPoint(hit.x, hit.y) !== s.renderer.domElement) { rejected.owner++; continue }
    const event = { clientX: hit.x, clientY: hit.y }
    if (s.pickUnit(event)) { rejected.unit++; continue }
    if (s.picking.pickPerson(event)) { rejected.person++; continue }
    if (s.pickWorldObject(event)) { rejected.object++; continue }
    const point = s.pick(event)
    if (!point) { rejected.terrain++; continue }
    const error = Math.hypot(point.x - target.x, point.z - target.z)
    nearestAimError = nearestAimError === null ? error : Math.min(nearestAimError, error)
    if (error <= 0.35)
      return { ...hit, point: { x: point.x, z: point.z }, target, inspected, turn: s.world.turn }
    rejected.aim++
  }
  const owner = document.elementFromPoint(Math.round(center.x), Math.round(center.y))
  const failure = { message: 'No unoccluded ground point within the retained 0.35 aim precision',
    target, projected, center, inspected, rejected, nearestAimError, turn: s.world.turn,
    camera: { position: { ...s.cameraPosition }, viewPoint: { ...s.viewPoint }, bearing: s.cameraBearing,
      motionActive: s.cameraMotion?.active, viewTransition: !!s.viewTransition },
    centerOwner: owner && { tag: owner.tagName, id: owner.id, className: owner.className,
      popupSerial: owner.closest?.('.campaign-messages details')?.getAttribute('data-message-serial') ?? null },
    popups: [...document.querySelectorAll('.campaign-messages details')].map(detail => {
      const panel = detail.querySelector('[data-native-campaign-panel]'), r = panel?.getBoundingClientRect()
      return { serial: detail.getAttribute('data-message-serial'), open: detail.open,
        panel: r && { left: r.left, top: r.top, width: r.width, height: r.height } }
    }) }
  if (reportFailure) return { failure }
  throw Error(failure.message, { cause: failure })
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
  const { page, signal, report, save, deadlineAt } = options, input = createMission1VaultInput(options)
  const prepare = async phase => {
    signal.throwIfAborted()
    const timeout = deadlineAt == null ? 2500 : Math.min(2500, deadlineAt - Date.now())
    const popups = await prepareWorldInput(page, { timeout, keyboardFocus: false })
    signal.throwIfAborted()
    report.actions.push({ label: 'native-popup-input', phase, popups }); save()
  }
  return { ...input,
    async view(target) {
      await input.settle()
      await prepare('minimap')
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
      await prepare('ground')
      // One browser task captures geometry and World at the same simulation
      // boundary. No RAF visit can intervene between the two observations.
      // Pass a function: Playwright evaluates a string without invoking it.
      // Only source-owned helpers are embedded; target remains a normal argument.
      const { hit, transfer, failure } = await page.evaluate(new Function('target', `
        const hit = (${readMission10Ground.toString()})(target, true)
        if (hit.failure) return hit
        return { hit, transfer: (${checkpointCodec.toString()})(window.testSceneRef.current.world) }
      `), target)
      if (failure) {
        report.actions.push({ label: 'rally-ground-rejection', ...failure }); save()
        throw Error(failure.message)
      }
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

// Read-only, synchronous pre/post-input capture. Serialize the existing controller
// readers into the real function body; no production-page module imports or World
// adoption. The fallback records only native XY, never calls terrain sync.
export const readMission10Selection = new Function(`
  const BuilderTask = ${JSON.stringify(BuilderTask)};
  const builderActivity = ${builderActivity.toString()};
  const unitAnimationSource = ${unitAnimationSource.toString()};
  const hudPersonSource = ${hudPersonSource.toString()};
  const scene = window.testSceneRef.current, w = scene.world;
  const model = { brave: 2, warrior: 3, preacher: 4, spy: 5, firewarrior: 6, shaman: 7 };
  const fields = p => p && Object.fromEntries(['x','y','vehicle','state','assignment','flags2','flags3','flags4','selectionFlags','commands','commandStatus'].map(k => [k, p[k]]));
  return { turn: w.turn, paused: w.paused, mode: w.mode, orderCursor: w.orderCursor, point: { ...scene.cameraPosition },
    nearby: !!(w.castingTribes[0].flags & 128), selected: [...w.selected],
    people: w.units.map(u => {
      const snapshot = hudPersonSource(w, u), active = snapshot.active ?? u.native ?? u.entry?.person;
      const source = snapshot.source?.vehicle ? snapshot.source : (active ?? u.builder?.person);
      const point = source?.vehicle ? source : active;
      const owners = { native: u.native, flight: u.flight, fight: u.fight?.motion,
        entry: u.entry?.person, builder: u.builder?.person, route: w.pathfinding.people.get(u.id) };
      return { id: u.id, team: u.team, kind: u.kind, hp: u.hp,
        model: u.team === 'wild' ? 1 : model[u.kind],
        x: point ? point.x : (Math.round((u.x + 8) * 256) << 16) >> 16,
        y: point ? point.y : (Math.round((-u.z - 8) * 256) << 16) >> 16,
        assignment: source?.assignment ?? 0, flags4: source?.flags4 ?? 0,
        vehicle: source?.vehicle ?? 0,
        owner: Object.keys(owners).find(key => owners[key] && owners[key] === source) ?? null,
        // Role aliases are observed by object identity, never inferred from equal fields.
        ownerAliases: Object.fromEntries(Object.entries(owners).map(([key, value]) =>
          [key, value ? Object.keys(owners).find(role => owners[role] === value) : null])),
        owners: Object.fromEntries(Object.entries(owners).map(([key, value]) => [key, fields(value) ?? null])) };
    }),
    vehicles: w.vehicles.map(v => ({ id: v.id, team: v.team, model: v.model, active: v.active,
      passengerCount: v.passengerCount, passengers: [...v.passengers] })) };
`)

// Both views of a strip observation share one synchronous browser task. Never
// remove fields or skip owner aliases to save time: transport the complete row.
function mission10ObservationState({ label, party, boatId }, readSelection) {
  const s = window.testSceneRef.current, w = s.world, boat = w.vehicles.find(v => v.id === boatId)
  const gl = s.renderer.getContext(), debug = gl.getExtension('WEBGL_debug_renderer_info')
  const row = { label, wallTime: Date.now(), turn: w.turn, time: w.time, level: w.outcome.level,
    renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), contextLost: gl.isContextLost(),
    counts: { units: w.units.length, vehicles: w.vehicles.length, buildings: w.buildings.length, secondary: w.secondaryEffects.slots.length },
    paused: w.paused, inputMask: w.inputMask, selected: [...w.selected], status: w.status,
    orders: structuredClone(w.buildingOrders), randomState: w.randomState,
    boat: boat && { id: boat.id, x: boat.x, y: boat.y, active: boat.active, passengers: [...boat.passengers] },
    party: party.map(id => { const u = w.units.find(u => u.id === id); return u && { id, kind: u.kind, hp: u.hp, x: u.x, z: u.z, vehicle: u.native?.vehicle, state: u.native?.state, flags2: u.native?.flags2, flags4: u.native?.flags4, path: u.path, work: u.work, commands: u.native?.commands, commandStatus: u.native?.commandStatus } }),
    panels: [...document.querySelectorAll('.vehicle-panel')].map(e => ({ text: e.textContent, visible: !!e.getClientRects().length })) }
  if (label.endsWith('-strip-paused') || label.endsWith(' cleared') || label.endsWith(' selected'))
    row.selectionState = readSelection()
  return row
}
// Compile only source-owned helpers in Node. Playwright receives a function, not
// an arrow-string or artifact-supplied code, and performs one evaluate invocation.
const mission10ObservationCallback = new Function('args',
  `return (${mission10ObservationState.toString()})(args, (${readMission10Selection.toString()}))`)

export async function readMission10Observation(page, args) {
  const row = await page.evaluate(mission10ObservationCallback, args)
  if (args.label.endsWith('-strip-paused') || args.label.endsWith(' cleared') || args.label.endsWith(' selected')) {
    assert.equal(row.selectionState.turn, row.turn)
    assert.equal(row.selectionState.paused, true)
    assert.deepEqual(row.selectionState.selected, row.selected)
  }
  return row
}
