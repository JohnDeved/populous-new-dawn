// Adapted from accepted gesture checkpoint observations: only the command-domain
// assertion changes. Reads committed storage or a synchronous Load clone only.
export function responseProjection(record, id) {
  const w = record?.world, u = w?.units.find(v => v.id === id), p = u?.native
  if (!p) throw Error('Checkpoint lacks the acquired native Preacher')
  const ids = [...new Set([p.immediateCommand, ...p.commands].filter(Boolean))]
  return { version: record.version, level: w.outcome.level, turn: w.turn, time: w.time,
    paused: w.paused, speed: w.speed, rng: [w.randomState, w.cosmeticRandom.randomState],
    actor: Object.fromEntries(['id', 'kind', 'team', 'hp', 'x', 'z', 'inside'].map(key => [key, u[key]])),
    native: structuredClone(p), orders: ids.map(q => ({ id: q, ...structuredClone(w.buildingOrders.records[q]) })),
    listeners: w.units.filter(v => v.hp > 0 && v.native?.state === 23 && v.native.workTarget === id)
      .map(v => ({ id: v.id, team: v.team, hp: v.hp, native: structuredClone(v.native) })),
    registeredOwner: w.objectCells.objects.get(id) === p }
}

export function requireResponseCheckpoint(value) {
  const p = value.native, active = value.orders.find(q => q.id === p.immediateCommand)
  const queued = value.orders.find(q => q.id === p.commands[p.commandCursor])
  if (!value.paused || value.level !== 3 || value.speed !== 1 || !value.registeredOwner ||
    value.actor.kind !== 'preacher' || value.actor.team !== 'blue' || value.actor.hp <= 0 ||
    value.actor.inside !== null || p.vehicle || p.state !== 10 || p.commandStatus !== 32 ||
    active?.model !== 32 || active.flags !== 32 || active.references !== 1 || queued?.model !== 3)
    throw Error('Save did not retain actual immediate32 and queued3 on the living native owner')
}

export function requireSameCheckpoint(saved, loaded) {
  requireResponseCheckpoint(saved); requireResponseCheckpoint(loaded)
  if (JSON.stringify(saved) !== JSON.stringify(loaded)) throw Error('Exact saved/loaded actor, queue, listeners or RNG differ')
}

export async function readStoredResponse(id) {
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
  window.preacherResponseCommitted = record
  const { checkpointObservation } = await import('/scripts/local-render/checkpoint-observer.mjs')
  return { digest: await checkpointObservation({ observationName: 'preacherResponseCommitted' }), response: responseProjection(record, id) }
}

export async function readLoadedResponse(id) {
  if (window.campaignReplacement?.pending || window.campaignReplacement?.error || !window.campaignLoadBoundary)
    throw Error('No clean synchronous Load replacement')
  const { checkpointObservation } = await import('/scripts/local-render/checkpoint-observer.mjs')
  return { digest: await checkpointObservation({ observationName: 'campaignLoadBoundary' }),
    response: responseProjection(window.campaignLoadBoundary, id) }
}
