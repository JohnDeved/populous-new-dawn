// Optional presentation data may come from a current-format checkpoint. Unlike
// native arithmetic, an untrusted packed destination must not wrap into a cell.
export function routeNoticeCell(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= 65535
    ? value
    : undefined
}
