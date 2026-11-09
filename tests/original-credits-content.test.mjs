import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'

const source = readFileSync(new URL('../app/original-credits-content.ts', import.meta.url), 'utf8')
const javascript = stripTypeScriptTypes(source)
const { parseOriginalCredits } = await import(`data:text/javascript;base64,${Buffer.from(javascript).toString('base64')}`)
const parse = (text) => parseOriginalCredits(Buffer.from(text, 'latin1'))
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex')

test('empty input and ignored controls retain one empty record', () => {
  assert.deepEqual(parse(''), [{ headingId: 0, text: null }])
  assert.deepEqual(parse('\0\t\n\r\r'), [{ headingId: 0, text: null }])
})

test('source heading zero is language ID 1071, not a missing heading', () => {
  assert.deepEqual(parse('0\r\nName'), [{ headingId: 1071, text: 'Name' }])
})

test('carriage returns divide text records while line feeds do not', () => {
  assert.deepEqual(parse('A\nB\r\nC'), [{ headingId: 0, text: 'AB' }, { headingId: 0, text: 'C' }])
})

test('space-only records and trailing spaces are preserved', () => {
  assert.deepEqual(parse('  \r\nName  \r\r\n'), [
    { headingId: 0, text: '  ' },
    { headingId: 0, text: 'Name  ' },
    { headingId: 0, text: null },
  ])
})

test('heading-only lines update the same record until text arrives', () => {
  assert.deepEqual(parse('1\r\n\r\n2\r\nName'), [{ headingId: 1073, text: 'Name' }])
})

test('decimal runs anywhere set the heading without copying digits into text', () => {
  assert.deepEqual(parse('A12B3C'), [{ headingId: 1074, text: 'ABC' }])
})

test('a final decimal run is consumed once without requiring a terminator', () => {
  assert.deepEqual(parse('Name12'), [{ headingId: 1083, text: 'Name' }])
})

test('heading arithmetic keeps the original low 16 bits after 32-bit accumulation', () => {
  assert.deepEqual(parse('4294967296'), [{ headingId: 1071, text: null }])
  assert.deepEqual(parse('4294967295'), [{ headingId: 1070, text: null }])
  assert.deepEqual(parse('64465'), [{ headingId: 0, text: null }])
})

test('non-ASCII bytes are widened directly rather than decoded or normalized', () => {
  const input = Uint8Array.of(0xe9, 0x80, 0xff)
  const result = parseOriginalCredits(input)
  assert.deepEqual([...result[0].text].map((character) => character.charCodeAt(0)), [...input])
})

test('parsing does not mutate a sliced input or its backing bytes', () => {
  const input = Uint8Array.of(255, 49, 13, 65, 255)
  const before = input.slice()
  assert.deepEqual(parseOriginalCredits(input.subarray(1, 4)), [{ headingId: 1072, text: 'A' }])
  assert.deepEqual(input, before)
})

test('the pinned original corpus retains all records, headings and spacing', () => {
  const inventoryBytes = readFileSync(new URL('../decomp/research/original-credits/source-data.json', import.meta.url))
  assert.equal(sha(inventoryBytes), 'f8dd148fce572c2e424e9e48442e08a0470cbc8856c95dd6f09ff14834717a63')
  const inventory = JSON.parse(inventoryBytes)
  const bytes = Buffer.from(inventory.byteLinesLatin1.join('\r\n'), 'latin1')
  assert.equal(bytes.length, 5308)
  assert.equal(sha(bytes), '7c821672c19e46bdf19b01f2fe94434f6de5ad18dbb36ea577c8188b96463ef6')
  const records = parseOriginalCredits(bytes)
  assert.equal(records.length, 280)
  assert.equal(records.filter((record) => record.headingId !== 0).length, 101)
  assert.equal(records.filter((record) => record.text !== null && /^ +$/.test(record.text)).length, 50)
  assert.deepEqual(records.filter((record) => record.headingId !== 0).map((record) => record.headingId), inventory.headings.map((heading) => heading.languageId))
  assert.deepEqual(records.at(-1), { headingId: 0, text: null })
  assert.equal(sha(JSON.stringify(records)), '54e25be4fa450ac76fcd3fe24fc0576f86dd3aecc246949dac6042c6ca111bb7')
})
