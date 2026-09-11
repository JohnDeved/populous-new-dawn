import { orderedTimberCells, looseTimberInCell, blockHasTimber, timberNeededByNeighbors, chooseCachedTimber, updateTimberAvailability, queryTimberSearch, createTimberSearches, refreshTimberSearch, invalidateTimberSearch, expandTimberSearch, checkTimberRoutes, stepTimberSearches, findTimber } from '../app/timber-search.ts'

import { createIndexedSearch } from '../app/indexed-search.ts'

function world(c) {
  const flags = new Uint32Array(16384), buildingIds = new Uint16Array(16384), objects = new Map(c.objects.map(o => [o.id, o])), cells = new Map()
  for (const cell of c.cells) {
    const index = ((cell.cell >>> 9) & 127) * 128 + ((cell.cell >>> 1) & 127)
    flags[index] = cell.flags; buildingIds[index] = cell.building; cells.set(index, cell.objects)
  }
  const w = { landFlags: c.landFlags, levelFlags: c.levelFlags, playerTribe: c.playerTribe, land: { flags, buildingIds }, objects: index => (cells.get(index) ?? []).map(id => objects.get(id)), building: id => c.buildings.find(b => b.id === id) }
  return w
}

export function timberSearchCase(input) {
  const c = structuredClone(input), w = world(c)
  let result, unchecked = c.search.candidates.filter(n => !(n.flags & 2)).length
  const nodes = [...c.search.candidates]
  if (c.mode === 'ordered') result = orderedTimberCells(c.center, c.block)
  if (c.mode === 'loose') result = looseTimberInCell(w, c.block, c.search.tribe)
  if (c.mode === 'block') result = blockHasTimber(w, c.block, c.search.tribe)
  if (c.mode === 'protect') result = timberNeededByNeighbors(w, c.block, c.search.tribe)
  if (c.mode === 'pick') result = chooseCachedTimber(w, c.search, { cell: c.block }, c.exclude, c.protect)
  if (c.mode === 'availability') updateTimberAvailability(w, c.search)
  if (c.mode === 'query') result = queryTimberSearch(w, c.missing ? undefined : c.search, 1, c.wait, c.exclude, n => { if (!(n.flags & 2)) unchecked-- })
  return { result: result ?? null, search: c.search, nodes, unchecked }
}

export function timberPoolCase(input) {
  const c = structuredClone(input), w = world(c), pool = createTimberSearches(), indexed = createIndexedSearch(), owners = c.owners.map(searchIndex => ({ searchIndex })), events = []
  Object.assign(pool, c.globals)
  for (const { index, ...record } of c.records) pool.records[index] = record
  const empty = JSON.stringify(createTimberSearches().records[0])
  const route = (search, candidate) => {
    const step = c.routes[events.length % c.routes.length]
    events.push([search.center, candidate.cell, search.person, search.tribe, candidate.cost])
    return { result: step.result, cost: step.cost ?? candidate.cost }
  }
  return c.ops.map(op => {
    let result = null
    if (op.action === 'refresh') result = refreshTimberSearch(pool, owners[op.owner], op.center, op.angle, op.person)
    if (op.action === 'invalidate') invalidateTimberSearch(pool, owners[op.owner], op.center)
    if (op.action === 'expand') expandTimberSearch(pool, w, indexed, pool.records[op.index])
    if (op.action === 'routes') result = checkTimberRoutes(pool, w, op.start, op.budget, route)
    if (op.action === 'step') stepTimberSearches(pool, w, indexed, route, id => !c.dead.includes(id))
    if (op.action === 'query') result = findTimber(pool, w, op.index, op.person, op.wait, op.exclude)
    if (op.action === 'keep') { if (op.index !== -1) pool.records[op.index].idle = 0 }
    const { records, ...globals } = pool
    return structuredClone({ result, globals, records: records.flatMap((r, index) => JSON.stringify(r) === empty ? [] : [{ index, ...r }]), owners: owners.map(o => o.searchIndex), indexed: [...indexed], events })
  })
}
