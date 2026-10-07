#!/usr/bin/env node
// Read-only reduction of the accepted native receipts. No app imports, native
// execution, fixture recording, dependencies, or writes are used by this audit.
// Usage: node scripts/check-worship-acquisition-fixture.mjs HANDOFF PRESENTATION REPLACEMENT
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

const sha256 = value => createHash('sha256').update(value).digest('hex')
const pins = {
  handoff: {
    resultSha256: 'c88d8b83d7ed08c9f6aceda1cad9cda18f431ed49db8c3cd261ba55f854a9802',
    probeSha256: '23eea61d2b1060260083d54557108d13f737e9cc807e7313ba18cefa6667f50e',
    caseCount: 17,
  },
  presentation: {
    resultSha256: '5b74c5df88dcdc81b71b343b3eb7a06c6637454be48482ef4fec5e9ca9d0b97d',
    probeSha256: 'a9caf4219317b76a4a13009101b0f353e27f179de34a145de198c9ee19dd98b7',
    caseCount: 10,
  },
  replacement: {
    resultSha256: '1436642482fb5e5297fceff03374822ca73a68875239182e082f656e4bb7d343',
    probeSha256: '3b21c881745c7c04cf0fd7ba2fa241f83558ca7302def7d3225c6d0b7d9c0444',
    caseCount: 3,
  },
}
const executable = {
  sha256: '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f',
  bytes: 2275840,
  debugDirectoryRva: 0,
  debugDirectorySize: 0,
}
const assetHashes = {
  'data/hfx0-0.dat': '681eb1734fd73f86a6a52a8540415ec69a241a378161b60e9c9da1263d4ee0bf',
  'data/pal0-c.dat': '6c61cd586fc96ef5f777c71966a9ac1875491a4a521342ba06d108df5e92bf53',
  'data/al0-c.dat': 'afc46e78b56f901f1331ceb0b02052eeaba2b6446b8747a03d0f12639ae17310',
}
const readonlyRegions = [
  ['00401000', 1592320, 'd920f4a9258f74b084600993baed8e61ceb4c7f80c461034a2fa322947304aa4'],
  ['00586000', 34816, '258c22ccfe30ead96c8d45312f615ad7e246548132f2ea157043555e65f3a5de'],
  ['0058f000', 34304, '6f74c652727585ce4e55f720c3326326169fc6119de7eb77e3e521213f9d2e49'],
  ['00d25000', 12288, '029a7dceabe616cfc20c84b170f4ea543eec546c0576d1601af363fe3353b7d9'],
  ['00d28000', 146944, '7bf1d46494475590e68b70c87a7e7b643457466f7c3631aa5e82f9d02706275e'],
]
const stateFields = [
  'companionActive', 'companionStep', 'companionVisits', 'companionNext',
  'activeParticles', 'particlesSha256', 'cosmeticRng', 'spellActive',
  'spellStep', 'spellVisits', 'spellPosition', 'spellRotation', 'spellScale',
  'pulseActive', 'pulseFrame', 'pulseRemaining', 'limiter',
]
const handoffFields = [
  'active', 'step', 'stepVisits', 'nextStep', 'position', 'speed', 'angle',
  'rotation', 'rotationSpeed', 'scale',
]

function pick(source, fields) {
  return Object.fromEntries(fields.map(field => {
    assert(Object.hasOwn(source, field), `missing native field: ${field}`)
    return [field, source[field]]
  }))
}

function readReceipt(name, path) {
  const bytes = readFileSync(path), pin = pins[name]
  assert.equal(sha256(bytes), pin.resultSha256, `${name}: accepted result bytes`)
  const receipt = JSON.parse(bytes)
  assert.equal(receipt.status, 'passed', `${name}: native status`)
  assert.equal(receipt.cases.length, pin.caseCount, `${name}: native case count`)
  assert.equal(receipt.probeSha256, pin.probeSha256, `${name}: recorded probe hash`)
  // Check the retained probe source as data; importing it would execute native code.
  const probe = new URL(`./probe-native-worship-grant-${name}.py`, import.meta.url)
  assert.equal(sha256(readFileSync(probe)), pin.probeSha256, `${name}: retained probe bytes`)
  assert.deepEqual(receipt.executable, executable, `${name}: executable identity`)
  if (name !== 'handoff') assert.deepEqual(receipt.assetHashes, assetHashes, `${name}: assets`)
  assert.equal(receipt.searchSha256, '0c39b12d160658863c2df89aa34484dff459e48ea0b5634658b7473ca940fae0')
  assert.equal(receipt.constantsGuarded, 244, `${name}: guarded constants`)
  const regions = receipt.readonlyRegions ?? receipt.readonlyRegionsGuarded
  assert.deepEqual(regions.map(r => [r.address, r.length ?? r.bytes, r.sha256]), readonlyRegions)
  return receipt
}

function commands(events) {
  return events.flatMap(event => {
    if (event[0] === 'sprite') {
      assert.equal(event.length, 7)
      return [event] // Every recorded sprite argument, including palette/RGB/flags.
    }
    if (event[0] !== 'spell-raster') return []
    assert.equal(event.length, 10)
    const [kind, x, y, bank, frame, flags, angle, scale, context, rawHex] = event
    assert.equal(bank, 0x9910e8)
    assert.equal(context, 0)
    // Verify the redundant original 28-byte argument block before omitting it.
    const raw = Buffer.from(rawHex, 'hex')
    assert.equal(raw.length, 28)
    assert.deepEqual([
      raw.readFloatLE(0), raw.readFloatLE(4), raw.readUInt32LE(8),
      raw.readUInt32LE(12) & 65535, raw.readUInt32LE(16),
      raw.readFloatLE(20), raw.readFloatLE(24),
    ], [x, y, bank, frame, flags, angle, scale])
    return [[kind, x, y, frame, flags, angle, scale]]
  })
}

function commandDigest(events) {
  const reduced = commands(events)
  // JSON.parse + JSON.stringify uses the same ECMAScript numeric serialization
  // as the portable test, preserving float32 values without Python float spelling.
  return { commandCount: reduced.length, commandsSha256: sha256(JSON.stringify(reduced)) }
}

function reduceFixture(handoff, presentation, replacement) {
  assert.deepEqual(handoff.panelRects, presentation.panelRects, 'native panel agreement')
  const provenance = Object.fromEntries(['presentation', 'replacement', 'handoff'].map(name => [
    name, pick(pins[name], ['resultSha256', 'probeSha256']),
  ]))
  return {
    provenance: {
      ...provenance,
      executable: presentation.executable,
      assetHashes: presentation.assetHashes,
      // Authored scope annotation, not an additional native observation. The
      // receipts' own limits are retained unchanged and bound by their hashes.
      limits: 'Controller state and ordered draw-command arguments from the frozen native probes. No native raster pixels, browser integration, wall-clock or payout proof is claimed by this portable test.',
    },
    panelRects: presentation.panelRects,
    presentation: presentation.cases.map(c => ({
      ...pick(c, ['name', 'seed', 'model', 'visible', 'combined']),
      rows: c.rows.map(row => ({
        paused: row.paused,
        // particlesSha256 is copied from the native receipt, which hashes all
        // 200 packed 18-byte records. Raw particle bytes were not retained in
        // these JSONs; this audit never substitutes a digest from the TS port.
        state: pick(row.state, stateFields),
        arrival: row.events.some(event => event[0] === 'arrival-ui'),
        ...commandDigest(row.events),
      })),
    })),
    replacement: replacement.cases.map(c => ({
      ...pick(c, ['name', 'replacementVisit']),
      beforeRows: c.beforeRows.map(row => pick(row.ui, stateFields)),
      immediatelyAfter: pick(c.immediatelyAfter.ui, stateFields),
      secondUiRows: c.secondUiRows.map(row => pick(row.ui, stateFields)),
      ...commandDigest(c.events),
    })),
    // The portable fixture selects exactly the first three visible model cases
    // and offscreen-bit. The other 13 handoff cases belong to the native audit.
    handoff: ['model-3-visible', 'model-4-visible', 'model-12-visible', 'offscreen-bit'].map(name => {
      const c = handoff.cases.find(item => item.name === name)
      assert(c, `missing handoff case: ${name}`)
      // reset() in the pinned handoff probe defaults model to 12. The offscreen
      // case records only explicit options, so its model is absent from options.
      return { name, model: c.options.model ?? 12, rows: c.uiRows.map(row => pick(row, handoffFields)) }
    }),
  }
}

const paths = process.argv.slice(2)
assert.equal(paths.length, 3, 'Usage: node scripts/check-worship-acquisition-fixture.mjs HANDOFF PRESENTATION REPLACEMENT')
const receipts = Object.fromEntries(Object.keys(pins).map((name, index) => [name, readReceipt(name, paths[index])]))
const actual = reduceFixture(receipts.handoff, receipts.presentation, receipts.replacement)
const fixtureBytes = readFileSync(new URL('../tests/fixtures/worship-acquisition-controller.json', import.meta.url))
assert.equal(sha256(fixtureBytes), 'ac4df02f1bdb2ab258cdc669048ba007bf419d4257265ce83a9070686e016b5d', 'unchanged accepted fixture bytes')
assert.deepEqual(actual, JSON.parse(fixtureBytes), 'complete receipt-to-fixture reduction')
console.log(JSON.stringify({
  status: 'passed',
  fixtureSha256: sha256(fixtureBytes),
  inputs: Object.fromEntries(Object.entries(pins).map(([name, pin], index) => [name, { path: paths[index], ...pin }])),
  presentation: {
    cases: actual.presentation.length,
    rows: actual.presentation.reduce((n, c) => n + c.rows.length, 0),
    commands: actual.presentation.flatMap(c => c.rows).reduce((n, row) => n + row.commandCount, 0),
  },
  replacement: {
    cases: actual.replacement.length,
    rows: actual.replacement.reduce((n, c) => n + c.beforeRows.length + c.secondUiRows.length, 0),
    immediateStates: actual.replacement.length,
    commands: actual.replacement.reduce((n, c) => n + c.commandCount, 0),
  },
  handoff: { cases: actual.handoff.length, rows: actual.handoff.reduce((n, c) => n + c.rows.length, 0) },
}, null, 2))
