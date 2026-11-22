import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

// Each arm's binding.json is produced by its external guarded preflight, not by
// the world script. The candidate tree pin identifies the arm inputs, not the
// checker doing the comparison (which may be newer). This checks internal
// consistency of trusted captures, not their external origin.
const script = 'scripts/check-mission21-earned-flatten.mjs'
const pins = {
  baseOid: 40,
  candidateTreeOid: 40,
  inputManifestSha256: 64,
  sourceSha256: 64,
  nodeSha256: 64,
  guardSha256: 64,
}
const expectedEvents = ['before route', 'after command', 'movement/range', 'opening']
const select = (log, prefix) => log.split(/\r?\n/).filter(line => line.startsWith(prefix))
const payload = line => JSON.parse(line.slice(line.indexOf(' ') + 1))
const json = path => JSON.parse(readFileSync(path, 'utf8'))
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const intIn = (value, min, max, name) => {
  assert.ok(Number.isSafeInteger(value) && value >= min && value <= max, name)
}

function verifyWatch(receipt, rawBytes) {
  assert.equal(receipt.outerExit, 0, 'outer watchdog exit')
  assert.equal(receipt.watchSha256, sha256(rawBytes), 'raw watchdog receipt SHA-256')
  const raw = JSON.parse(rawBytes)
  assert.equal(raw.exit, receipt.exit)
  assert.equal(raw.reason, receipt.stopReason)
  assert.equal(raw.parentSubreaper, true)
  assert.deepEqual(raw.signalledIdentities, [])
  assert.deepEqual(raw.remaining, receipt.survivingOwned)
  assert.equal(raw.rssLimitKiB, 747520)
  intIn(raw.peakSampledRssKiB, 1, raw.rssLimitKiB, 'sampled aggregate RSS')
  intIn(raw.minimumDiskBytes, 4_000_000_000, Number.MAX_SAFE_INTEGER, 'absolute disk floor')
  intIn(raw.watchdogSamples, 1, Number.MAX_SAFE_INTEGER, 'watchdog sample count')
  assert.ok(typeof raw.wallSeconds === 'number' && raw.wallSeconds > 0 && raw.wallSeconds <= 39,
    'watchdog wall time')
  assert.ok(Array.isArray(raw.observedIdentities) && raw.observedIdentities.length > 0,
    'owned processes observed')
}

function verifyOutcomes(mode, arm, opening, deadlines) {
  const [early, final] = deadlines
  assert.deepEqual([early.turn, final.turn], [8127, 8128])
  for (const entry of deadlines)
    assert.ok(Number.isSafeInteger(entry.marker), 'integer terrain marker')
  if (mode === 'cast') {
    assert.deepEqual(arm.point, { x: 82, z: 54 })
    assert.deepEqual(arm.target, { x: 83, z: 53 })
    assert.deepEqual(opening.selection, [arm.caster])
    intIn(arm.caster, 1, Number.MAX_SAFE_INTEGER, 'real caster ID')
    for (const entry of deadlines) {
      assert.notEqual(entry.marker, opening.marker, 'marker departed after Flatten')
      assert.deepEqual([entry.fault, entry.sawFlatten, entry.sawThirdVolcano, entry.sawWarning],
        [2, true, false, false])
    }
    // Cast stock consumption is a successful in-arm assertion, not a logged field.
    return
  }
  for (const entry of deadlines)
    assert.deepEqual([entry.stock, entry.casts, entry.sawFlatten], [1, 0, false])
  assert.deepEqual([early.marker, early.fault], [opening.marker, 0])
  assert.deepEqual([early.firstMarkerDeparture, early.firstLatch, early.firstVolcano, early.firstWarning],
    [null, null, null, null])
  assert.equal(final.fault, 1)
  assert.deepEqual(final.firstLatch, { turn: 8128, state: 1, height: final.marker })
  assert.deepEqual(final.firstVolcano, { turn: 8128, count: 1, x: 85, z: 53 })
  assert.deepEqual(final.firstWarning, {
    turn: 8128, view: { cell: 49754, payload: 16668 }, lifetime: 256,
  })
  assert.deepEqual(final.firstMarkerDeparture,
    final.marker === opening.marker ? null : { turn: 8128, height: final.marker })
}

function verify(mode, binding, receipt, rawBytes, bytes) {
  assert.deepEqual(Object.keys(binding).sort(), Object.keys(pins).sort())
  for (const [key, length] of Object.entries(pins))
    assert.match(binding[key], new RegExp(`^[0-9a-f]{${length}}$`), key)
  assert.deepEqual(receipt.argv, ['node', '--max-old-space-size=512', script, mode])
  assert.equal(receipt.exit, 0)
  assert.equal(receipt.stopReason, null)
  assert.deepEqual(receipt.survivingOwned, [])
  assert.equal(receipt.logSha256, sha256(bytes), 'raw arm log SHA-256')
  verifyWatch(receipt, rawBytes)

  const log = bytes.toString('utf8')
  const route = select(log, 'M21_ROUTE ')
  assert.deepEqual(route.map(line => payload(line).event), expectedEvents)
  const opening = payload(route.at(-1))
  assert.deepEqual([opening.turn, opening.stock, opening.fault, opening.marker], [7520, 1, 0, 238])

  const arm = select(log, mode === 'cast' ? 'M21_CAST ' : 'M21_NO_CAST ')
  assert.equal(arm.length, 1)
  assert.equal(select(log, mode === 'cast' ? 'M21_NO_CAST ' : 'M21_CAST ').length, 0)
  const action = payload(arm[0])
  assert.deepEqual(action.baseline, {
    turn: opening.turn, pos: opening.pos, stock: opening.stock, fault: opening.fault, marker: opening.marker,
  })
  const deadlines = select(log, 'M21_DEADLINE ').map(payload)
  assert.equal(deadlines.length, 2)
  verifyOutcomes(mode, action, opening, deadlines)
  return route
}

const args = process.argv.slice(2)
assert.equal(args.length, 8,
  'Usage: node scripts/check-mission21-earned-flatten-pair.mjs <cast-binding> <cast-result> <cast-watch> <cast-log> <no-cast-binding> <no-cast-result> <no-cast-watch> <no-cast-log>')
const [castBinding, castReceipt, castWatch, castLog, controlBinding, controlReceipt, controlWatch, controlLog] = args
const castPins = json(castBinding)
const controlPins = json(controlBinding)
const castRoute = verify('cast', castPins, json(castReceipt), readFileSync(castWatch), readFileSync(castLog))
const controlRoute = verify('no-cast', controlPins, json(controlReceipt), readFileSync(controlWatch), readFileSync(controlLog))
assert.deepEqual(castPins, controlPins, 'source, inputs, executable or guard differ across arms')
assert.deepEqual(castRoute, controlRoute, 'four route/opening records must match byte-for-byte')
console.log(`M21 paired captures match for recorded arm tree ${castPins.candidateTreeOid}; guarded outcomes verified`)
