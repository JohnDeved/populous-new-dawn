// Page-serializable, read-only observer shared by committed IDB and an already
// captured store-replacement snapshot. No database creation or storage export.
export async function checkpointObservation({ observationName, trainingTargetId } = {}) {
  const canonical = value => {
    const seen = new Map()
    let nodes = 0
    const encode = (value, depth = 0) => {
      if (++nodes > 2_000_000 || depth > 128) throw Error('Checkpoint exceeds observation bounds')
      if (value === null) return ['null']
      const type = typeof value
      if (type === 'undefined') return ['undefined']
      if (type === 'number') return ['number', Number.isFinite(value) && !Object.is(value, -0) ? value : String(value) === '0' ? '-0' : String(value)]
      if (type === 'string' || type === 'boolean') return [type, value]
      if (type === 'bigint') return [type, value.toString()]
      if (type !== 'object') throw Error(`Unsupported checkpoint value: ${type}`)
      if (seen.has(value)) return ['reference', seen.get(value)]
      const id = seen.size
      seen.set(value, id)
      const child = entry => encode(entry, depth + 1)
      if (Array.isArray(value)) return ['array', id, Array.from({ length: value.length }, (_, index) => index in value ? child(value[index]) : ['hole'])]
      if (value instanceof Map) return ['map', id, [...value].map(([key, entry]) => [child(key), child(entry)])]
      if (value instanceof Set) return ['set', id, [...value].map(child)]
      if (value instanceof ArrayBuffer) return ['buffer', id, Array.from(new Uint8Array(value))]
      if (ArrayBuffer.isView(value)) return ['view', id, value.constructor.name, value.byteOffset, value.byteLength, child(value.buffer)]
      if (value instanceof Date) return ['date', id, child(value.getTime())]
      const prototype = Object.getPrototypeOf(value)
      if (prototype !== Object.prototype && prototype !== null) throw Error('Unsupported checkpoint object prototype')
      if (Reflect.ownKeys(value).length !== Object.keys(value).length) throw Error('Unsupported checkpoint object properties')
      return ['object', id, prototype === null ? 'null-prototype' : 'plain', Object.keys(value).map(key => [key, child(value[key])])]
    }
    const text = JSON.stringify(encode(value))
    if (text.length > 64 * 1024 * 1024) throw Error('Checkpoint encoding exceeds observation bounds')
    return text
  }
  const digest = async value => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical(value)))), byte => byte.toString(16).padStart(2, '0')).join('')
  let record, db
  if (observationName) {
    // The scenario installs this read-only clone synchronously in a subscription.
    // Never read or replace a live model reference through this path.
    record = globalThis[observationName]
    if (!record) throw Error('Store replacement observation is missing')
  } else {
    if (!(await indexedDB.databases()).some(db => db.name === 'populous-new-dawn')) return null
    db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('populous-new-dawn')
      request.onupgradeneeded = () => { request.transaction.abort(); reject(Error('Checkpoint database unexpectedly missing')) }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }
  try {
    if (db) {
      if (!db.objectStoreNames.contains('checkpoints')) return null
      record = await new Promise((resolve, reject) => {
        const transaction = db.transaction('checkpoints', 'readonly')
        const request = transaction.objectStore('checkpoints').get('latest')
        transaction.oncomplete = () => resolve(request.result)
        transaction.onerror = () => reject(transaction.error)
        transaction.onabort = () => reject(transaction.error ?? Error('Checkpoint read aborted'))
      })
    }
    if (!record) return null
    const w = record.world
    if (!w || !Number.isInteger(w.turn) || !Number.isInteger(w.outcome?.level)) throw Error('Malformed committed checkpoint')
    return {
      version: record.version, level: w.outcome.level, turn: w.turn, time: w.time,
      checkpointSha256: await digest(record),
      ...(trainingTargetId === undefined ? {} : { trainingSha256: await digest({
        camp: w.buildings.find(b => b.id === trainingTargetId), units: w.units,
        orders: w.buildingOrders, manaTribes: w.manaTribes, stats: w.stats,
      }) }),
      actorsSha256: await digest(w.units.map(u => [u.id, u.team, u.kind, u.hp, u.x, u.z])),
      terrainSha256: await digest(w.terrain),
      stockSha256: await digest({ mana: w.mana, wood: w.wood, shots: w.shots, giftCounts: w.giftCounts }),
    }
  } finally { db?.close() }
}

export async function readCommittedCheckpoint(page, options) {
  return page.evaluate(checkpointObservation, options)
}
