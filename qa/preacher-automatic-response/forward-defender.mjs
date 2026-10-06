import assert from 'node:assert/strict'

const wrap = n => ((n + 128) % 256 + 256) % 256 - 128
export const forwardPost = Object.freeze({ x: -1, z: -115 })
export function postDistance(a, b = forwardPost) { return Math.hypot(wrap(a.x - b.x), wrap(a.z - b.z)) }
export function chooseForwardDefender(units) {
  const candidates = units.filter(u => u.kind === 'preacher' && u.team === 'yellow' && u.hp > 0 &&
    u.inside === null && postDistance(u) <= 12)
  assert.equal(candidates.length, 1, 'Require one actual forward Yellow Preacher, not an assumed clear route')
  return candidates[0]
}

export function requireDefenderRemoval(row, before, id) {
  assert.ok(row.sameWorld && row.originalShaman && row.originalPreacher)
  assert.equal(row.status, 'playing'); assert.equal(row.paused, false); assert.equal(row.speed, 1)
  assert.equal(row.visibility, 'visible'); assert.equal(row.inputMask, 0)
  const shaman = row.blue.find(u => u.id === before.shamanId), preacher = row.blue.find(u => u.id === before.preacherId)
  assert.ok(shaman?.kind === 'shaman' && shaman.team === 'blue' && shaman.hp > 0, 'Original Shaman must survive; no reincarnation retry')
  assert.ok(preacher?.kind === 'preacher' && preacher.team === 'blue' && preacher.hp === before.preacherHp && postDistance(preacher, before.preacherPoint) <= 2,
    'The acquired Blue Preacher must remain healthy at the safe base point')
  const target = row.yellow.find(u => u.id === id)
  if (target && target.hp > 0) return false
  assert.ok(postDistance(shaman, before.defender) <= 8, 'Shaman must actually arrive at the removed forward defender')
  assert.equal(row.yellow.some(u => u.kind === 'preacher' && u.hp > 0 && postDistance(u) <= 12), false,
    'Another live forward specialist still covers departure')
  return true
}

// One tactical prerequisite, using the already reviewed selection, minimap,
// entity-hit, exact recipient and trusted pointer-handler controls unchanged.
export async function clearForwardDefender({ page, acquisition, check }) {
  const started = performance.now(), original = await page.evaluate(({ shamanId, preacherId }) => {
    const scene = window.testSceneRef.current, world = scene.world
    const shaman = world.units.find(u => u.id === shamanId), preacher = world.units.find(u => u.id === preacherId)
    if (!shaman || !preacher) throw Error('Missing original acquired actors')
    window.preacherForwardOwners = { scene, world, shaman, preacher }
    return { shamanId, preacherId, preacherHp: preacher.hp, preacherPoint: { x: preacher.x, z: preacher.z } }
  }, { shamanId: acquisition.shamanId, preacherId: acquisition.preacherId })
  const read = () => page.evaluate(() => {
    const o = window.preacherForwardOwners, scene = window.testSceneRef.current, w = scene.world
    const fields = u => ({ id: u.id, kind: u.kind, team: u.team, hp: u.hp, x: u.x, z: u.z, inside: u.inside,
      target: u.target, fight: !!u.fight, native: u.native && { state: u.native.state, model: u.native.model,
        life: u.native.life, workFlags: u.native.workFlags, immediateCommand: u.native.immediateCommand,
        commands: [...u.native.commands], commandCursor: u.native.commandCursor } })
    return { turn: w.turn, time: w.time, status: w.status, paused: w.paused, speed: w.speed,
      visibility: document.visibilityState, inputMask: w.inputMask,
      sameWorld: scene === o.scene && w === o.world && w === window.testStore.getWorld(),
      originalShaman: w.units.find(u => u.id === o.shaman.id) === o.shaman,
      originalPreacher: w.units.find(u => u.id === o.preacher.id) === o.preacher,
      blue: w.units.filter(u => u.id === o.shaman.id || u.id === o.preacher.id).map(fields),
      yellow: w.units.filter(u => u.team === 'yellow' && u.kind === 'preacher').map(fields) }
  })
  const health = async () => { check(); assert.ok(performance.now() - started < 90000, '90-second forward-defender ceiling')
    acquisition.health(await acquisition.read()) }
  let failure
  try {
    await health()
    const initial = await read(), defender = chooseForwardDefender(initial.yellow)
    const before = { ...original, defender }
    assert.equal(requireDefenderRemoval(initial, before, defender.id), false)
    acquisition.log({ action: 'forward-defender-locked', before, initial,
      evidence: 'Run13 ordinary Shaman attack precedent, pinned older runtime; current IDs/outcome must be observed anew' })
    assert.deepEqual(await acquisition.select('shaman'), [original.shamanId])
    await acquisition.ordinary.map(defender)
    await health()
    const hit = await acquisition.ordinary.entityHit('units', defender.id)
    assert.ok(hit, 'The observed forward defender lacks a real owned entity hit')
    const attack = await acquisition.dispatch.clickOrder(hit)
    const accepted = attack.inputAfter.units.find(u => u.id === original.shamanId)
    assert.ok(accepted && (accepted.target === defender.id || accepted.order?.a === defender.id),
      'Actual Shaman input must address the observed defender')
    let final
    for (;;) {
      await health(); final = await read()
      if (requireDefenderRemoval(final, before, defender.id)) break
      await page.waitForTimeout(100)
    }
    const result = { before, initial, attack, final, elapsedMs: performance.now() - started,
      scope: 'One ordinary direct Shaman attack and observed removal/arrival; no spell, replacement actor or campaign victory' }
    acquisition.log({ action: 'forward-defender-cleared', ...result }); return result
  } catch (error) { failure = error; throw error }
  finally {
    try { await page.evaluate(() => { delete window.preacherForwardOwners }) }
    catch (error) { throw failure ? new AggregateError([failure, error], 'Defender tactic and observation cleanup failed') : error }
  }
}
