// Read-only projections from actual committed storage or the reviewed synchronous
// store-replacement clone. No model construction, storage write, or field repair.
export function gestureProjection(record, id) {
  const w = record?.world, u = w?.units.find(unit => unit.id === id), p = u?.native
  if (!w || !u || !p) throw Error('Real saved/loaded Preacher is missing')
  const q = p.immediateCommand || p.commands[p.commandCursor]
  return { version: record.version, level: w.outcome.level, turn: w.turn, time: w.time,
    paused: w.paused, speed: w.speed, simulationRng: w.randomState, cosmeticRng: w.cosmeticRandom.randomState,
    actor: Object.fromEntries(['id', 'kind', 'team', 'hp', 'x', 'z', 'inside'].map(key => [key, u[key]])),
    native: structuredClone(p), order: q ? { id: q, ...structuredClone(w.buildingOrders.records[q]) } : null,
    registeredOwner: w.objectCells.objects.get(id) === p }
}

export function requireSavedGesture(projection) {
  const p = projection.native
  if (projection.level !== 3 || !projection.paused || projection.speed !== 1 ||
    projection.actor.kind !== 'preacher' || projection.actor.team !== 'blue' || projection.actor.hp <= 0 ||
    projection.actor.inside !== null || p.vehicle || p.class !== 1 || p.model !== 4 || p.state !== 10 ||
    p.commandStatus !== 17 || p.substate !== 3 || projection.order?.model !== 17 ||
    ![176, 184].includes(p.object) || p.draw !== 14 || !(p.statusFlags & 1) || !projection.registeredOwner)
    throw Error('Checkpoint is not the genuinely paused active on-foot gesture')
}

export function requireSameGestureCheckpoint(saved, loaded) {
  requireSavedGesture(saved); requireSavedGesture(loaded)
  if (JSON.stringify(loaded) !== JSON.stringify(saved)) throw Error('Saved gesture/RNG/queue differs at the exact load boundary')
}

export async function readStoredGesture(id) {
  if (!(await indexedDB.databases()).some(db => db.name === 'populous-new-dawn')) return null
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('populous-new-dawn')
    request.onupgradeneeded = () => { request.transaction.abort(); reject(Error('No committed checkpoint database')) }
    request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error)
  })
  let record
  try {
    record = await new Promise((resolve, reject) => {
      const tx = db.transaction('checkpoints', 'readonly'), request = tx.objectStore('checkpoints').get('latest')
      tx.oncomplete = () => resolve(request.result)
      tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error ?? Error('Read aborted'))
    })
  } finally { db.close() }
  if (!record) return null
  window.preacherCommittedRecord = record
  const { checkpointObservation } = await import('/scripts/local-render/checkpoint-observer.mjs')
  return { digest: await checkpointObservation({ observationName: 'preacherCommittedRecord' }),
    gesture: gestureProjection(record, id) }
}

export async function readLoadGesture(id) {
  if (window.campaignReplacement?.pending || window.campaignReplacement?.error || !window.campaignLoadBoundary)
    throw Error('No clean synchronous Load boundary')
  const { checkpointObservation } = await import('/scripts/local-render/checkpoint-observer.mjs')
  return { digest: await checkpointObservation({ observationName: 'campaignLoadBoundary' }),
    gesture: gestureProjection(window.campaignLoadBoundary, id) }
}
