import type { OriginalCreditsRecord } from './original-credits-content'

export interface OriginalCreditsFontMetrics {
  /** Widths of byte characters 32 through 255, in order. */
  widths: readonly number[]
  aHeight: number
}

export interface OriginalCreditsTextSubmission {
  recordIndex: number
  font: 'heading' | 'name'
  text: string
  x: number
  y: number
}

export interface OriginalCreditsLayout {
  submissions: OriginalCreditsTextSubmission[]
  origin: number
  visitedRecords: number
  completedPasses: number
}

function integer(value: number, minimum: number, maximum: number, name: string) {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new RangeError(`Invalid Credits ${name}`)
  }
}

function fontMetrics(font: OriginalCreditsFontMetrics) {
  if (font.widths.length !== 224) throw new RangeError('Credits requires 224 glyph widths')
  for (const width of font.widths) integer(width, 0, 65535, 'glyph width')
  integer(font.aHeight, 1, 65535, 'A height')
}

function workBudget(limit: number) {
  integer(limit, 1, 1_000_000, 'work limit')
  let remaining = limit
  return () => {
    if (remaining === 0) throw new RangeError('Credits layout work limit exceeded')
    remaining -= 1
  }
}

function glyphWidth(character: number, font: OriginalCreditsFontMetrics) {
  integer(character, 32, 255, 'Western character')
  return font.widths[character - 32]
}

function wrappedLines(
  text: string,
  width: number,
  font: OriginalCreditsFontMetrics,
  spend: () => void
) {
  if (typeof text !== 'string') throw new TypeError('Invalid Credits text')
  const lines: string[] = []
  let start: number | null = 0
  while (start !== null) {
    spend()
    let end: number = start
    let pixels = 0
    let lastBreak: number | null = null
    while (pixels < width && end < text.length && end - start < 127) {
      spend()
      const character = text.charCodeAt(end)
      if (' -.,:;'.includes(text[end])) lastBreak = end + 1
      pixels += glyphWidth(character, font)
      end += 1
    }
    if (end === text.length) {
      lines.push(text.slice(start, end))
      start = null
    } else {
      let resume: number = end
      if (lastBreak !== null) {
        end = lastBreak
        resume = lastBreak
        if (text[end - 1] === ' ') end -= 1
      }
      while (resume < text.length && text[resume] === ' ') {
        spend()
        resume += 1
      }
      lines.push(text.slice(start, end))
      // A non-null pointer to the final NUL causes one more empty row.
      start = resume
    }
  }
  return lines
}

/** Western font-type-0 wrapping from 0x0045ec10, with modern input/work guards. */
export function wrapOriginalCreditsText(
  text: string,
  width: number,
  font: OriginalCreditsFontMetrics,
  maxWork = 100_000
) {
  integer(width, 1, 32767, 'screen width')
  fontMetrics(font)
  return wrappedLines(text, width, font, workBudget(maxWork))
}

/**
 * Plan ordinary Western font-type-0 text calls from 0x004a96f0, not final pixels.
 * The caller supplies active font metrics and resolved labels. Renderer state,
 * palette, tint and clipping are outside this planner.
 */
export function layoutOriginalCredits(
  records: readonly OriginalCreditsRecord[],
  headings: Readonly<Record<number, string>>,
  fonts: { heading: OriginalCreditsFontMetrics; name: OriginalCreditsFontMetrics },
  screen: { width: number; height: number },
  origin: number,
  maxWork = 100_000
): OriginalCreditsLayout {
  integer(screen.width, 1, 32767, 'screen width')
  integer(screen.height, 1, 32767, 'screen height')
  integer(origin, -2147483648, 2147483647, 'origin')
  fontMetrics(fonts.heading)
  fontMetrics(fonts.name)
  const spend = workBudget(maxWork)
  const result: OriginalCreditsLayout = {
    submissions: [],
    origin,
    visitedRecords: 0,
    completedPasses: 0,
  }
  if (records.length === 0) return result
  let y = origin
  let recordIndex = 0
  let submitted = false
  const advance = (amount: number) => {
    y += amount
    integer(y, -2147483648, 2147483647, 'row position')
  }
  const submitText = (text: string, kind: 'heading' | 'name') => {
    const font = fonts[kind]
    for (const line of wrappedLines(text, screen.width, font, spend)) {
      if (y >= -20) {
        let measured = 0
        for (let at = 0; at < line.length; at += 1) {
          spend()
          measured += glyphWidth(line.charCodeAt(at), font)
        }
        result.submissions.push({
          recordIndex,
          font: kind,
          text: line,
          x: Math.floor((screen.width - measured) / 2),
          y,
        })
        // Even an empty text call marks the original traversal as submitted.
        submitted = true
      }
      advance(font.aHeight)
    }
  }
  while (y < screen.height) {
    spend()
    const record = records[recordIndex]
    integer(record.headingId, 0, 65535, 'heading ID')
    result.visitedRecords += 1
    if (record.headingId !== 0) {
      if (!Object.hasOwn(headings, record.headingId)) {
        throw new RangeError('Missing Credits heading label')
      }
      advance(30)
      submitText(headings[record.headingId], 'heading')
    }
    if (record.text !== null) submitText(record.text, 'name')
    recordIndex += 1
    if (recordIndex === records.length) {
      recordIndex = 0
      result.completedPasses += 1
      advance(screen.height + 20)
      if (!submitted) result.origin = screen.height + 1
    }
  }
  return result
}
