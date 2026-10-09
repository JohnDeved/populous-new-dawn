import assert from 'node:assert/strict'

// Read the live converted roster, never the authored Wildman IDs or a guessed
// future building ID. canOrder is the same eligibility used by placeBuilding.
export async function campStartup({ scene = window.testSceneRef.current, canOrder } = {}) {
  canOrder ??= (await import('/app/selection-runtime.ts')).canOrder
  const world = scene.world
  return { level: world.outcome.level, status: world.status, speed: world.speed, paused: world.paused,
    unlockedCamp: world.unlockedCamp, mode: world.mode, selected: [...world.selected],
    shaman: world.units.filter(u => u.team === 'blue' && u.kind === 'shaman' && canOrder(u)).map(u => ({ id: u.id, x: u.x, z: u.z })),
    braves: world.units.filter(u => u.team === 'blue' && u.kind === 'brave' && canOrder(u)).map(u => ({ id: u.id, work: u.work, inside: u.inside })),
    camps: world.buildings.filter(b => b.team === 'blue' && b.kind === 'camp').map(b => b.id),
    turn: world.turn }
}

export function assertCampStartup(value) {
  assert.equal(value.level, 2); assert.equal(value.status, 'playing'); assert.equal(value.speed, 1)
  assert.equal(value.paused, false); assert.equal(value.unlockedCamp, true); assert.equal(value.mode, null)
  assert.equal(value.shaman.length, 1); assert.ok(value.braves.length >= 8)
  assert.deepEqual(value.camps, [])
}

// Carry the old checker's bounded placement geometry only. All source-owned
// terrain synchronizers receive a detached World; current camera/pixels remain
// owned by the shipped minimap input and RAF. There is one placement attempt.
export async function campGround({ preferred, deadlineAt, scene = window.testSceneRef.current,
  doc = document, placementError, buildingPlanPose } = {}) {
  if (!placementError || !buildingPlanPose) ({ placementError, buildingPlanPose } = await import('/app/construction-runtime.ts'))
  const world = structuredClone(scene.world), canvas = scene.renderer.domElement, rect = canvas.getBoundingClientRect()
  let tested = 0
  for (let radius = 0; radius <= 24; radius += 2) for (let step = 0; step < 24; step++) {
    if (Date.now() >= deadlineAt) throw Error('Camp ground preparation deadline exhausted')
    const angle = step * Math.PI / 12, candidate = { x: preferred.x + Math.cos(angle) * radius, z: preferred.z + Math.sin(angle) * radius }
    if (placementError(world, 'camp', candidate)) continue
    const projected = scene.screen(candidate), x = Math.round(rect.left + (projected.x + 1) * rect.width / 2),
      y = Math.round(rect.top + (1 - projected.y) * rect.height / 2)
    tested++
    if (doc.elementFromPoint(x, y) !== canvas) continue
    const event = { clientX: x, clientY: y }, point = scene.pick(event)
    if (!point || scene.picking.pick(event) !== null || Math.hypot(point.x - candidate.x, point.z - candidate.z) >= 2 ||
      placementError(world, 'camp', point)) continue
    const plan = buildingPlanPose(world, 'camp', point)
    return { x, y, point: { x: point.x, z: point.z }, preferred, tested,
      anchor: { x: plan.anchorX, y: plan.anchorY }, angle: plan.angle,
      sceneFrame: scene.frame, rendererFrame: scene.renderer.info.render.frame, turn: scene.world.turn }
  }
  throw Error(`No owned rendered camp placement within 312 candidates (${tested} projected)`)
}

// All camera inputs and preparation precede this public command prefix. Selecting
// the Buildings tab clears mode, so do not refocus or change tabs after choosing it.
export async function selectCampPlan({ page, action, remaining }) {
  await action('Shift-select eligible Braves', () => page.getByLabel('Select brave', { exact: true }).click({ modifiers: ['Shift'], timeout: remaining() }))
  await action('Buildings tab', () => page.getByLabel('buildings B', { exact: true }).click({ timeout: remaining() }))
  await action('Warrior Training Hut plan', () => page.getByRole('button', { name: 'Warrior Training Hut, 8 wood', exact: true }).click({ timeout: remaining() }))
  const selected = await page.evaluate(campStartup)
  assert.equal(selected.mode, 'camp'); assert.equal(selected.unlockedCamp, true)
  assert.equal(selected.speed, 1); assert.equal(selected.paused, false)
  assert.ok(selected.braves.some(u => selected.selected.includes(u.id)), 'Actual eligible Brave selection is required')
  return selected
}

// Same-dispatch before/after snapshots come from the existing passive observer,
// after the real pointerup handler has assigned construction work.
export function assertCampPlacement(records, ground) {
  const events = records.filter(row => row.phase === 'place-camp' && row.kind === 'input' && row.canvasTarget &&
    (row.type === 'pointerdown' || row.type === 'pointerup'))
  assert.deepEqual(events.map(row => [row.type, row.trusted, row.canvasOwned, row.button, row.x, row.y]),
    ['pointerdown', 'pointerup'].map(type => [type, true, true, 0, ground.x, ground.y]))
  assert.ok(events.every(row => row.modifiers.every(value => !value)))
  const { before, after } = events[1]
  assert.equal(before.mode, 'camp'); assert.equal(after.mode, null); assert.equal(after.turn, before.turn)
  assert.deepEqual(after.selected, before.selected)
  const camps = after.construction.camps.filter(b => !before.construction.camps.some(old => old.id === b.id))
  assert.equal(camps.length, 1, 'One actual new Blue camp required')
  const camp = camps[0]
  assert.deepEqual(camp.anchor, ground.anchor); assert.equal(camp.kind, 'camp'); assert.equal(camp.team, 'blue')
  assert.ok(camp.hp > 0 && camp.progress < 1)
  const recipients = after.construction.workers.filter(u => u.work === camp.id && u.builder)
  assert.ok(recipients.length > 0, 'A created plan alone does not prove worker admission')
  for (const worker of recipients) {
    assert.ok(before.selected.includes(worker.id)); assert.equal(worker.kind, 'brave'); assert.equal(worker.team, 'blue'); assert.ok(worker.hp > 0)
    assert.ok(camp.builders.includes(worker.id))
    // The active movement command can be inserted ahead of construction model6.
    // Retain the complete actual queue and require its original camp request.
    const orders = worker.commands.map(id => after.orders.records[id]).filter(Boolean)
    assert.ok(orders.some(order => order.model === 6 && order.a === camp.id && !(order.flags & 1)))
  }
  return { camp, recipients: recipients.map(u => u.id), inputOrdinal: events[1].ordinal }
}

export function campCompletion(state, target) {
  const camp = state?.construction?.camps.find(b => b.id === target.id)
  if (!camp || camp.identity !== target.identity || camp.hp <= 0) throw Error('Actual constructed camp disappeared or was replaced')
  if (state.level !== 2 || state.status !== 'playing' || state.speed !== 1 || state.paused) throw Error('Ordinary construction clock interrupted')
  const admission = camp.admission
  return camp.progress === 1 && !camp.preparation && !camp.builders?.some(Boolean) &&
    !state.construction.workers.some(u => u.work === camp.id || u.inside === camp.id) &&
    !!admission && admission.inside === 0 && admission.occupants.every(id => id === 0) &&
    admission.queueHead === 0 && admission.queueFrom === 0 && admission.entering === 0 &&
    !(admission.activity & (128 | 0x8000))
}

export function assertEmptyCampPanel(frame, targetId) {
  assert.equal(frame.panel.id, targetId); assert.equal(frame.panel.hidden, false)
  assert.equal(frame.panel.label, 'Warrior training: 0 of 5 occupants; 0% charged')
  assert.ok(frame.panel.png, 'Actual empty camp panel pixels required')
}
