// Narrow structured-clone/IDB reads supplement maintained checkpoint hashes.
// No read path opens an upgrade, writes a transaction, or changes the live world.
export async function checkpointGuardState({ observationName = null, unitIds = [], live = false } = {}) {
  const fields = (value, names) => Object.fromEntries(names.map(name => [name, value?.[name] ?? null]))
  let record, db
  if (live) record = { world: window.testStore.getWorld() }
  else if (observationName) record = window[observationName]
  else {
    if (!(await indexedDB.databases()).some(db => db.name === 'populous-new-dawn')) return null
    db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('populous-new-dawn')
      request.onupgradeneeded = () => { request.transaction.abort(); reject(Error('Checkpoint database missing')) }
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
    if (!record?.world) return null
    const w = record.world
    const people = w.units.filter(u => unitIds.includes(u.id)).map(u => {
      const slots = [['native', u.native], ['flight', u.flight], ['fight.motion', u.fight?.motion], ['entry.person', u.entry?.person], ['builder.person', u.builder?.person]]
      const owners = [...new Set(slots.map(([,p]) => p).filter(Boolean))]
      return { ...fields(u, ['id','team','kind','hp','x','z','inside','work','guard']),
        owners: owners.map(p => {
          const commands = [...p.commands], ids = [...new Set([p.immediateCommand, ...commands].filter(Boolean))]
          return { aliases: slots.filter(([,q]) => q === p).map(([name]) => name),
            ...fields(p, ['id','class','model','state','previousState','substate','commandStatus','commandCursor','immediateCommand','guardInputPending','flags2','flags3','flags4','selectionFlags','renderFlags','object','draw','f1','f2','stamp','counter','assignment','speed','goalX','goalY','x','y','vehicle']),
            commands, orders: ids.map(id => ({ id, ...w.buildingOrders.records[id] })) }
        }) }
    })
    return { level: w.outcome.level, turn: w.turn, time: w.time, speed: w.speed, paused: w.paused,
      selected: [...w.selected], people,
      tribe: fields(w.manaTribes[0], ['shamanGuards','shamanGuardChanged']),
      pool: { cursor: w.buildingOrders.cursor, active: w.buildingOrders.active } }
  } finally { db?.close() }
}
