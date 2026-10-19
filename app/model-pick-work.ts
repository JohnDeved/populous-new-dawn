// Compact optional F8 work counts: [completed cache builds, tested faces, accepted faces].
// Rejected faces = tested - accepted. Bounds-rejected models do not test faces.
export type ModelPickWork = [number, number, number]
export function validModelPickWork(value: unknown): value is ModelPickWork {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    [0, 1, 2].every(index => Number.isSafeInteger(value[index]) && value[index] >= 0) &&
    value[2] <= value[1]
  )
}
