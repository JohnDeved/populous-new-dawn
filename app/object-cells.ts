export interface CellObject {
  id: number
  x: number
  y: number
  h: number
  flags2: number
  flags3: number
  cellNext: number
  cellPrevious: number
  displacement: { x: number; y: number; h: number }
}
export interface ObjectCells {
  heads: Uint16Array
  objects: Map<number, CellObject>
}
const index = (p: { x: number; y: number }) => ((p.y & 65535) >> 9) * 128 + ((p.x & 65535) >> 9)
const short = (n: number) => (n << 16) >> 16

// 0x4ee470: attach an unlinked object at the head; position is not changed.
export function insertObjectIntoCell(w: ObjectCells, p: CellObject, to: { x: number; y: number }) {
  const i = index(to)
  p.cellPrevious = 0
  p.cellNext = w.heads[i]
  const next = w.objects.get(p.cellNext)
  if (next) next.cellPrevious = p.id
  else p.cellNext = 0
  w.heads[i] = p.id
  p.flags2 = (p.flags2 | 0x20000) >>> 0
}

// 0x4ee4f0: detach; the object's own next/previous fields remain unchanged.
export function removeObjectFromCell(w: ObjectCells, p: CellObject) {
  if (p.cellPrevious) w.objects.get(p.cellPrevious)!.cellNext = p.cellNext
  else w.heads[index(p)] = p.cellNext
  if (p.cellNext) w.objects.get(p.cellNext)!.cellPrevious = p.cellPrevious
  p.flags2 = (p.flags2 & ~0x20000) >>> 0
}

// Complete 0x4ee580. Crossing a 512-unit cell splices both lists and returns
// true. Same-cell moves retain ordering. Displacement uses signed word wraps.
export function moveObjectInCells(
  w: ObjectCells,
  p: CellObject,
  to: { x: number; y: number; h: number }
) {
  const old = { x: p.x, y: p.y, h: p.h },
    moved = index(p) !== index(to)
  if (moved) {
    removeObjectFromCell(w, p)
    insertObjectIntoCell(w, p, to)
  }
  p.x = to.x & 65535
  p.y = to.y & 65535
  p.h = short(to.h)
  if (p.flags3 & 0x100 && !(p.flags3 & 0x200)) {
    p.displacement.x = short(p.x - old.x)
    p.displacement.y = short(p.y - old.y)
    p.displacement.h = short(p.h - old.h)
  }
  return moved
}

export function* objectsInCell(w: ObjectCells, cell: number) {
  let id = w.heads[((cell >>> 9) & 127) * 128 + ((cell & 254) >> 1)]
  while (id) {
    const p = w.objects.get(id)
    if (!p) break
    yield p
    id = p.cellNext
  }
}

// 0x46ec80 walks the retained head/next chain in each render pass.
export function cellObjectOrder(w: ObjectCells) {
  const order = new Map<number, number>()
  for (let id of w.heads)
    for (let rank = 0; id; rank++) {
      const object = w.objects.get(id)
      if (!object) break
      order.set(id, rank)
      id = object.cellNext
    }
  return order
}
