// Pure assertions over passive snapshots. No game, browser, storage or clock writes.
import assert from 'node:assert/strict'
const unit = (state, id) => state.units.find(u => u.id === id)
const positive = value => Number.isInteger(value) && value > 0

export function pinIdentityEpoch(state, ids) {
  assert.ok(Number.isInteger(state.epoch) && state.epoch >= 0)
  assert.ok(positive(state.sceneIdentity) && positive(state.worldIdentity))
  assert.ok(ids.length > 0 && new Set(ids).size === ids.length)
  const units = ids.map(id => {
    const u = unit(state, id)
    assert.ok(u && positive(u.identity) && positive(u.nativeIdentity), `Observed Unit/native identity for ${id}`)
    assert.equal(u.native?.identity, u.nativeIdentity)
    assert.equal(u.native?.id, id)
    return Object.freeze({ id, unitIdentity: u.identity, nativeIdentity: u.nativeIdentity })
  })
  return Object.freeze({ epoch: state.epoch, sceneIdentity: state.sceneIdentity, worldIdentity: state.worldIdentity, units: Object.freeze(units) })
}

export function requireIdentityEpoch(state, pin) {
  assert.equal(state.epoch, pin.epoch, 'Observation epoch changed without verified UI Load')
  assert.equal(state.sceneIdentity, pin.sceneIdentity, 'Scene identity changed within the pinned epoch')
  assert.equal(state.worldIdentity, pin.worldIdentity, 'World identity changed within the pinned epoch')
  for (const expected of pin.units) {
    const u = unit(state, expected.id)
    assert.ok(u, `Pinned Unit ${expected.id} remains observed`)
    assert.equal(u.identity, expected.unitIdentity, `Unit object replaced for ${expected.id}`)
    assert.equal(u.nativeIdentity, expected.nativeIdentity, `Native owner replaced for ${expected.id}`)
    assert.equal(u.native?.identity, expected.nativeIdentity, `Native owner snapshot differs for ${expected.id}`)
    assert.equal(u.native?.id, expected.id)
    const ownsOrdinaryAnimation = u.native.guardInputPending || [17,19].includes(u.native.state) ||
      u.native.state === 10 && [3,30].includes(u.native.commandStatus)
    if(ownsOrdinaryAnimation)assert.equal(u.sourceIdentity,expected.nativeIdentity,'Ordinary native animation retains its pinned owner')
  }
}

export function rebindIdentityEpoch(previous, state, correspondence) {
  assert.equal(correspondence?.sameStore, true)
  assert.equal(correspondence?.newWorld, true)
  assert.equal(correspondence?.newScene, true)
  assert.equal(correspondence?.currentCorrespondence, true)
  assert.equal(correspondence?.error, null)
  assert.equal(state.epoch, previous.epoch + 1, 'Only the next verified Load epoch may rebind')
  assert.notEqual(state.worldIdentity, previous.worldIdentity)
  assert.notEqual(state.sceneIdentity, previous.sceneIdentity)
  const next = pinIdentityEpoch(state, previous.units.map(u => u.id))
  for (let i = 0; i < next.units.length; i++) {
    assert.notEqual(next.units[i].unitIdentity, previous.units[i].unitIdentity, 'UI Load cloned the Unit')
    assert.notEqual(next.units[i].nativeIdentity, previous.units[i].nativeIdentity, 'UI Load cloned the native owner')
  }
  requireIdentityEpoch(state,next) // Validate the explicit raw Load snapshot before committing its pin.
  return next
}

export function currentNativeOrder(state, id) {
  const p = unit(state, id)?.native
  if (!p) return null
  const activeId = p.immediateCommand || p.commands[p.commandCursor] || 0
  assert.equal(p.activeId, activeId, 'Observed current-order cursor agrees with the owner queue')
  return activeId ? p.orders.find(order => order.id === activeId)?.record ?? null : null
}

export function hasCurrentGuard(state, id, shamanId) {
  const current = currentNativeOrder(state, id)
  return current?.model === 30 && current.a === shamanId
}

export function requireAdoptedGuard(state, id, shamanId) {
  const u = unit(state, id)
  assert.equal(u.native?.class, 1); assert.equal(u.native?.model, 6)
  assert.equal(u.native?.state, 10); assert.equal(u.native?.commandStatus, 30)
  assert.equal(u.native?.guardInputPending, null); assert.equal(u.guard, false)
  assert.equal(u.native?.target, shamanId, 'Adoption configured the actual native target')
  assert.equal(hasCurrentGuard(state, id, shamanId), true, 'CURRENT active command30 targets the actual Shaman')
  assert.equal(state.tribeMana.shamanGuards, 1)
  assert.equal(u.sourceIdentity, u.nativeIdentity)
}

// Compare the explicitly labelled first post-Load snapshot with the captured
// checkpoint's identities/aliases and Guard target/queue, while allowing phase,
// pending marker and status to have advanced under ordinary auto-resume.
export function requireLoadedIdentityBinding(state, loaded, guardId, shamanId) {
  assert.equal(state.level,loaded.level)
  assert.ok(state.turn >= loaded.turn)
  for(const id of [guardId,shamanId]) {
    const saved=loaded.people.find(u=>u.id===id), current=unit(state,id)
    assert.ok(saved && current)
    assert.equal(current.team,saved.team);assert.equal(current.kind,saved.kind)
    const savedNative=saved.owners.find(p=>p.aliases.includes('native'))
    const currentNative=current.owners.find(p=>p.aliases.includes('native'))
    assert.ok(savedNative && currentNative)
    assert.deepEqual(currentNative.aliases,savedNative.aliases)
    for(const key of ['id','class','model'])assert.equal(currentNative[key],savedNative[key])
    if(id===guardId) {
      assert.equal(savedNative.target,shamanId)
      assert.equal(currentNative.target,savedNative.target,'Post-Load native target agrees with the captured checkpoint')
      for(const key of ['commands','commandCursor','immediateCommand'])assert.deepEqual(currentNative[key],savedNative[key])
      const records=currentNative.orders.map(({id,record})=>({id,...Object.fromEntries(['model','flags','references','object','a','b'].map(key=>[key,record?.[key]]))}))
      assert.deepEqual(records,savedNative.orders,'Post-Load Guard queue agrees with the captured checkpoint')
    }
  }
}
