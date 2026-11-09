import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const CREDITS_SOURCE = Object.freeze({
  inventory: 'decomp/research/original-credits/source-data.json',
  inventorySha256: 'f8dd148fce572c2e424e9e48442e08a0470cbc8856c95dd6f09ff14834717a63',
  parser: 'app/original-credits-content.ts',
  parserSha256: 'cedb0c7652e7f774d96cf507a1d520a506986ffb64def44569168f01942e6614',
  parserCommit: 'a0631ff3fd28f653931c981d842d34fdb8c51b2f',
  resource: 'data/credits.txt',
  resourceSha256: '7c821672c19e46bdf19b01f2fe94434f6de5ad18dbb36ea577c8188b96463ef6',
  recordsSha256: '54e25be4fa450ac76fcd3fe24fc0576f86dd3aecc246949dac6042c6ca111bb7',
  method: 'Inventory-derived Latin-1 bytes; not a fresh original-file read or native execution',
})
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')

export function resolveCreditsHeadings(records, headings) {
  assert.ok(
    Array.isArray(records) && Array.isArray(headings),
    'Records and heading inventory required'
  )
  const labels = new Map()
  for (const heading of headings) {
    assert.ok(
      Number.isInteger(heading.languageId) && heading.languageId > 0 && heading.languageId <= 65535,
      'Invalid heading ID'
    )
    assert.ok(typeof heading.text === 'string' && heading.text.length > 0, 'Missing heading label')
    if (labels.has(heading.languageId))
      assert.equal(
        labels.get(heading.languageId),
        heading.text,
        `Conflicting heading ${heading.languageId}`
      )
    else labels.set(heading.languageId, heading.text)
  }
  for (const record of records) {
    assert.ok(
      Number.isInteger(record.headingId) && record.headingId >= 0 && record.headingId <= 65535,
      'Invalid record heading ID'
    )
    assert.ok(record.text === null || typeof record.text === 'string', 'Invalid record text')
    if (record.headingId)
      assert.ok(labels.has(record.headingId), `Missing heading ${record.headingId}`)
  }
  // Keep raw records separate from labels: null and literal-space rows matter.
  return { headings: Object.fromEntries(labels), records: records.map(record => ({ ...record })) }
}

export async function buildOriginalCredits(root = fileURLToPath(new URL('../', import.meta.url))) {
  const inventoryBytes = readFileSync(resolve(root, CREDITS_SOURCE.inventory))
  assert.equal(sha256(inventoryBytes), CREDITS_SOURCE.inventorySha256, 'Inventory identity changed')
  const parserPath = resolve(root, CREDITS_SOURCE.parser)
  assert.equal(
    sha256(readFileSync(parserPath)),
    CREDITS_SOURCE.parserSha256,
    'Parser identity changed'
  )
  const inventory = JSON.parse(inventoryBytes)
  assert.ok(Array.isArray(inventory.byteLinesLatin1), 'Byte-line inventory missing')
  for (const line of inventory.byteLinesLatin1)
    assert.ok(
      typeof line === 'string' && [...line].every(char => char.charCodeAt(0) <= 255),
      'Invalid direct-byte line'
    )
  const bytes = Buffer.from(inventory.byteLinesLatin1.join('\r\n'), 'latin1')
  assert.equal(bytes.length, 5308)
  assert.equal(sha256(bytes), CREDITS_SOURCE.resourceSha256, 'Credits bytes changed')
  const { parseOriginalCredits } = await import(pathToFileURL(parserPath).href)
  const records = parseOriginalCredits(bytes)
  assert.equal(
    sha256(JSON.stringify(records)),
    CREDITS_SOURCE.recordsSha256,
    'Parsed record identity changed'
  )
  assert.equal(records.length, 280)
  assert.equal(records.filter(record => record.headingId !== 0).length, 101)
  assert.equal(
    records.filter(record => record.text !== null && /^ +$/.test(record.text)).length,
    50
  )
  assert.deepEqual(records.at(-1), { headingId: 0, text: null })
  const catalog = resolveCreditsHeadings(records, inventory.headings)
  assert.equal(Object.keys(catalog.headings).length, 100)
  return { version: 1, source: CREDITS_SOURCE, ...catalog }
}

export const serializeCreditsCatalog = catalog => JSON.stringify(catalog, null, 2) + '\n'

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  assert.ok(
    process.argv.length === 2 || (process.argv.length === 3 && process.argv[2] === '--check'),
    'Usage: node scripts/build-original-credits.mjs [--check]'
  )
  const output = new URL('../app/original-credits.json', import.meta.url)
  const bytes = serializeCreditsCatalog(await buildOriginalCredits())
  if (process.argv[2] === '--check')
    assert.equal(
      readFileSync(output, 'utf8'),
      bytes,
      'Credits catalogue differs; rebuild explicitly'
    )
  else writeFileSync(output, bytes)
  console.log(
    `${process.argv[2] === '--check' ? 'Verified' : 'Built'} inactive Credits catalogue: sha256 ${sha256(bytes)}`
  )
}
