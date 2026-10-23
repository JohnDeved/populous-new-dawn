import assert from 'node:assert/strict'
import { createWorld } from '../../app/model.ts'

// These campaign witnesses pin the original allocation sequence, not its address
// range. Translate only general handles beyond the authored startup boundary.
// This is deliberately NOT an observed-ID lookup: later sequence changes (for
// example a new building allocation) still fail the exact recipient assertions.
// Explicit building exclusions must be independently pinned at their creation
// boundary, never inferred from the later follower IDs being asserted.
// Historical fixtures must never use this adapter or rewrite their stored IDs.
export function scalableReferenceIds(mission, separateBuildingAllocations = []) {
  const authoredNextId = createWorld(mission, 'classic').nextId,
    offset = Math.max(1024, authoredNextId) - authoredNextId
  return id => {
    assert.ok(Number.isSafeInteger(id) && id > 0)
    assert.ok(!separateBuildingAllocations.includes(id), 'packed buildings need their own identity')
    return id < authoredNextId ? id : id + offset - separateBuildingAllocations.filter(b => b < id).length
  }
}
