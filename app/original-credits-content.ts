export interface OriginalCreditsRecord {
  headingId: number
  text: string | null
}

/**
 * Decode the byte-oriented record format read by original loader 0x004a99d0.
 * Read a stable input buffer; do not reproduce its unsafe in-place aliasing.
 */
export function parseOriginalCredits(bytes: Uint8Array): OriginalCreditsRecord[] {
  const records: OriginalCreditsRecord[] = [{ headingId: 0, text: null }]
  let [current] = records
  let cursor = 0

  while (cursor < bytes.length) {
    const code = bytes[cursor]
    if (code >= 48 && code <= 57) {
      let value = 0
      do {
        value = (Math.imul(value, 10) + bytes[cursor] - 48) >>> 0
        cursor += 1
      } while (cursor < bytes.length && bytes[cursor] >= 48 && bytes[cursor] <= 57)
      current.headingId = (value + 1071) & 0xffff
      continue
    }

    if (code === 13) {
      // Empty lines do not allocate records; even one literal space does.
      if (current.text !== null) {
        current = { headingId: 0, text: null }
        records.push(current)
      }
    } else if (code >= 32) {
      // The original widens bytes directly, without UTF-8 or Windows-1252 decoding.
      current.text = (current.text ?? '') + String.fromCharCode(code)
    }
    cursor += 1
  }

  return records
}
