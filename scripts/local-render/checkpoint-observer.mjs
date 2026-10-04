// Read-only observation. This never creates a database or writes/exports storage.
export async function readCommittedCheckpoint(page) {
  return page.evaluate(async () => {
    if (!(await indexedDB.databases()).some(db => db.name === 'populous-new-dawn')) return null
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('populous-new-dawn')
      request.onupgradeneeded = () => { request.transaction.abort(); reject(Error('Checkpoint database unexpectedly missing')) }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    try {
      if (!db.objectStoreNames.contains('checkpoints')) return null
      const record = await new Promise((resolve, reject) => {
        const transaction = db.transaction('checkpoints', 'readonly')
        const request = transaction.objectStore('checkpoints').get('latest')
        transaction.oncomplete = () => resolve(request.result)
        transaction.onerror = () => reject(transaction.error)
        transaction.onabort = () => reject(transaction.error ?? Error('Checkpoint read aborted'))
      })
      if (!record) return null
      const stringify = value => JSON.stringify(value, (_, value) => value instanceof Map ? { map: [...value] } : value instanceof Set ? { set: [...value] } : ArrayBuffer.isView(value) ? { type: value.constructor.name, values: Array.from(value) } : value)
      const digest = async value => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(stringify(value)))), byte => byte.toString(16).padStart(2, '0')).join('')
      const w = record.world
      if (!w || !Number.isInteger(w.turn) || !Number.isInteger(w.outcome?.level)) throw Error('Malformed committed checkpoint')
      return {
        version: record.version, level: w.outcome.level, turn: w.turn, time: w.time,
        checkpointSha256: await digest(record),
        actorsSha256: await digest(w.units.map(u => [u.id, u.team, u.kind, u.hp, u.x, u.z])),
        terrainSha256: await digest(w.terrain),
        stockSha256: await digest({ mana: w.mana, wood: w.wood, shots: w.shots, giftCounts: w.giftCounts }),
      }
    } finally { db.close() }
  })
}
