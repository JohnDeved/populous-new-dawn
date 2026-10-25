import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { SourceMap } from 'node:module'

export const projectionFunctions = [
  'computerSpellPerson',
  'computerSpellWorld',
  'stepComputerSpells',
]
export const sha256 = value => createHash('sha256').update(value).digest('hex')

// V8 names are minified. Match each function's own declaration, not an executed
// nested callback/body segment, to the exact original source through its map.
export function projectionCoverage({ code, map, original, functions }) {
  assert.equal(map.version, 3)
  const sources = map.sources
    .map((source, index) => ({ source, index }))
    .filter(({ source }) => source.replaceAll('\\', '/').endsWith('/app/computer-runtime.ts'))
  assert.equal(sources.length, 1, 'Exactly one original computer runtime source is required')
  assert.equal(
    map.sourcesContent?.[sources[0].index],
    original,
    'Map must embed the exact original source'
  )
  const sourceMap = new SourceMap(map)
  const originalLines = original.split('\n')
  const declarations = projectionFunctions.map(name => {
    const matches = originalLines.flatMap((line, i) =>
      new RegExp(`^(?:export )?function ${name}\\(`).test(line) ? [{ line: i, text: line }] : []
    )
    assert.equal(matches.length, 1, `Unique original declaration: ${name}`)
    return { name, ...matches[0] }
  })
  const matches = new Map(declarations.map(({ name }) => [name, []]))
  const lineStarts = [0]
  for (let i = 0; i < code.length; i++) if (code[i] === '\n') lineStarts.push(i + 1)
  for (const fn of functions) {
    const range = fn.ranges?.[0]
    if (!range || !fn.functionName) continue
    assert.ok(
      Number.isInteger(range.startOffset) &&
        range.startOffset >= 0 &&
        Number.isInteger(range.endOffset) &&
        range.endOffset <= code.length &&
        range.endOffset > range.startOffset
    )
    const header = /^(?:async\s+)?function\s+([\w$]+)\s*\(/.exec(
      code.slice(range.startOffset, Math.min(range.endOffset, range.startOffset + 256))
    )
    if (!header) continue // Script roots, arrows and callbacks cannot stand in for a declaration.
    const at = range.startOffset + header[0].indexOf(header[1], header[0].indexOf('function') + 8)
    let low = 0,
      high = lineStarts.length
    while (low + 1 < high) {
      const middle = (low + high) >>> 1
      if (lineStarts[middle] <= at) low = middle
      else high = middle
    }
    const line = low,
      column = at - lineStarts[low]
    const mapped = sourceMap.findEntry(line, column)
    if (mapped.originalSource !== sources[0].source) continue
    const declaration = declarations.find(
      d =>
        d.line === mapped.originalLine &&
        mapped.originalColumn >= d.text.indexOf('function') &&
        mapped.originalColumn < d.text.indexOf(d.name) + d.name.length
    )
    if (declaration) matches.get(declaration.name).push({ functionName: fn.functionName, ...range })
  }
  return declarations.map(({ name, line }) => {
    const ranges = matches.get(name)
    assert.equal(ranges.length, 1, `Missing or ambiguous own-function coverage: ${name}`)
    assert.ok(
      Number.isSafeInteger(ranges[0].count) && ranges[0].count > 0,
      `Function was not called: ${name}`
    )
    return { name, originalLine: line + 1, ...ranges[0] }
  })
}
