#!/usr/bin/env node
// Read-only animation cadence audit for issue #214. For every animated family the
// browser renders, compare the browser's frame-advance rule with the original's
// rule and report matched / mismatched / unknown rows. Nothing is written unless
// --output is given; app/ sources, native tables and the EXE are only read.
//
// Inputs:
//   app/original-rules.json    imported native descriptor/person/object tables
//   app/original-units.json    legacy elapsed-time unit tables (fps + sources)
//   app/original-effects.json  effect sprite sequences (source objects)
//   decomp/research/animation-cadence/native-setters.json
//                              static EXE read (scripts/native-animation-setters.py)
//   scripts/animation-cadence-families.json
//                              curated families with source anchors + evidence
//   app/game-clock.ts          stepped live (Node) to measure visit rates
//   app/animation.ts           fallbackFramesPerSecond, the shipped legacy rule
//
// Usage:
//   node scripts/animation-cadence-audit.mjs                  # markdown table
//   node scripts/animation-cadence-audit.mjs --json           # JSON report
//   node scripts/animation-cadence-audit.mjs --status mismatched --group people
//   node scripts/animation-cadence-audit.mjs --visibility     # + sampled exposure
//   node scripts/animation-cadence-audit.mjs --check          # exit 1 on stale anchors
//
// Rates are frames per second at 1x speed using the browser adapters measured from
// the live clock: native "presentation visits" map to the 24 Hz presentation
// adapter (the original draw rate is NOT established; see decomp/research/
// animation-cadence.md) and logical visits map to 12 Hz world turns.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = fileURLToPath(new URL('../', import.meta.url))
const read = path => readFileSync(new URL(path, pathToFileURL(ROOT)), 'utf8')
const json = path => JSON.parse(read(path))

export const STATUSES = ['mismatched', 'unknown', 'matched', 'not-applicable']
const TEAMS = ['blue', 'red', 'yellow', 'green']
// Native person models (unit-kinds.ts); wild people are model 1.
const KIND_MODELS = { brave: 2, warrior: 3, preacher: 4, spy: 5, firewarrior: 6, shaman: 7 }
// 004d23ed ORs flags3 0x40100 for every person before the model switch, so
// mode 1/2/4 people animations advance only on logical (stamped) visits.
// Models 2..7 are proved by #217; model 1 is a static read (see the note).
export const GATED_PERSON_MODELS = new Set([1, 2, 3, 4, 5, 6, 7])

// Frames advanced per visit for one draw descriptor (0x4ee7b0 semantics).
export function descriptorRule(descriptor) {
  if (!descriptor) return null
  switch (descriptor.mode) {
    case 1:
      return { framesPerVisit: descriptor.step / 4, loop: descriptor.hold || null }
    case 2:
      return { framesPerVisit: 1 / (descriptor.step + 1), loop: null }
    case 3:
      return { framesPerVisit: descriptor.step / 4, loop: null }
    case 4:
      return { framesPerVisit: descriptor.step / 4, loop: null, morph: true }
    default:
      return { framesPerVisit: 0, loop: null }
  }
}

// Frames per second for a native rule under the measured browser adapters.
export function nativeFps(rule, gated, rates) {
  if (!rule) return null
  return rule.framesPerVisit * (gated ? rates.logical : rates.presentation)
}

export function classify(browserFps, nativeFpsValue, tolerance = 0.02) {
  if (browserFps == null || nativeFpsValue == null) return { status: 'unknown', ratio: null }
  if (nativeFpsValue === 0 && browserFps === 0) return { status: 'matched', ratio: 1 }
  if (nativeFpsValue === 0) return { status: 'mismatched', ratio: Infinity, direction: 'too-fast' }
  const ratio = browserFps / nativeFpsValue
  if (Math.abs(ratio - 1) <= tolerance) return { status: 'matched', ratio }
  return { status: 'mismatched', ratio, direction: ratio > 1 ? 'too-fast' : 'too-slow' }
}

// Native draw descriptor for a person model showing `source`. Prefer the
// model's own column of the person animation map, then any object that starts
// at that source.
export function personSourceDraw(rules, model, source) {
  const objects = rules.animationObjects,
    map = rules.personAnimationObjects,
    columns = map.length / 9
  for (let state = 0; state < columns; state++) {
    const id = map[state * 9 + model]
    if (id >= 0 && objects[id]?.[0] === source) return { draw: objects[id][1], via: `person map state ${state}` }
  }
  const any = objects.findIndex(entry => entry[0] === source)
  return any < 0 ? null : { draw: objects[any][1], via: `animation object ${any} (not in model column)` }
}

// Legacy state names unitAnimation() (selection-runtime.ts) can select; other
// table entries are reached only through native catalogs (frame-number path).
export const LEGACY_STATES = new Set([
  'airborne', 'cast', 'walk', 'idle', 'selected', 'work', 'attack', 'strike', 'special',
  'recoil', 'pray', 'carry', 'carryIdle', 'dance', 'stagger',
])

// Legacy elapsed-time rows: Scene.animatePerson without a native frame number.
export function legacyUnitRows({ rules, units, rates, legacyFps, reachable = LEGACY_STATES }) {
  const rows = []
  for (const [signature, states] of Object.entries(units.animations)) {
    const [team, kind] = signature.split('-'),
      model = team === 'wild' ? 1 : KIND_MODELS[kind],
      teamOffset = kind === 'shaman' ? 8 * Math.max(0, TEAMS.indexOf(team)) : 0
    for (const [state, directions] of Object.entries(states)) {
      const source = directions[0].source,
        frames = directions[0].frames.length,
        native = personSourceDraw(rules, model, source - teamOffset),
        descriptor = native && rules.animationDescriptors[native.draw],
        rule = descriptorRule(descriptor),
        gated = GATED_PERSON_MODELS.has(model) && [1, 2, 4].includes(descriptor?.mode),
        browser = legacyFps(kind),
        expected = frames > 1 ? nativeFps(rule, gated, rates) : null,
        verdict =
          frames <= 1 || !reachable.has(state)
            ? { status: 'not-applicable', ratio: null }
            : classify(browser, expected)
      rows.push({
        id: `legacy-unit/${signature}/${state}`,
        group: 'people',
        family: `legacy ${signature} ${state}`,
        browser: {
          fps: browser,
          rule: 'elapsed game time x fallback rate (scene-entities animatePerson)',
        },
        native: {
          fps: expected,
          rule: native
            ? `source ${source} draw ${native.draw} mode ${descriptor?.mode} step ${descriptor?.step}` +
              ` on ${gated ? 'logical' : 'presentation'} visits (${native.via})`
            : `source ${source}: no native animation object`,
          evidence: 'app/original-rules.json animationDescriptors/personAnimationObjects; decomp/research/sprite-logical-visits.md',
        },
        frames,
        ...verdict,
        note: reachable.has(state) ? undefined : 'not selected by unitAnimation; native catalog only',
      })
    }
  }
  return rows
}

// Native visit class for a sprite source from the static setter read: a body
// that ORs flags3 0x40000 means logical visits (Splash); bodies read without it
// mean presentation visits. Allocator/callee flags are not followed.
export function sourceGate(setters, source) {
  const records = (setters?.records ?? []).filter(r => r.kind === 'constant' && r.object === source)
  if (!records.length) return { gate: null, why: 'no constant 004ee700 assignment' }
  if (records.some(r => r.gateWrites?.length))
    return { gate: 'logical', why: `flags3 0x40000 at ${records.flatMap(r => r.gateWrites ?? []).join('/')}` }
  if (records.every(r => r.function && Array.isArray(r.gateWrites)))
    return { gate: 'presentation', why: `no gate write in ${[...new Set(records.map(r => r.function))].join('/')}` }
  return { gate: null, why: 'initializer body not bounded' }
}

function resolveAnchors(anchors = [], readSource) {
  return anchors.map(a => {
    let text
    try {
      text = readSource(a.file)
    } catch {
      return { ...a, line: null, stale: true }
    }
    const index = text.search(new RegExp(a.pattern))
    return { ...a, line: index < 0 ? null : text.slice(0, index).split('\n').length, stale: index < 0 }
  })
}

function browserRate(entry, rates) {
  if (entry.browserFps !== undefined) return entry.browserFps
  if (entry.browserPerVisit != null) return entry.browserPerVisit * rates[entry.browserVisits]
  return null
}

// Effect sprite sequences (original-effects.json). The native side comes from
// the static setter read; each recorded browser consumer gets its own row.
export function effectSequenceRows({ rules, effects, setters, rates, families, readSource }) {
  const rows = []
  const consumers = new Map()
  for (const f of families.filter(f => f.sequence))
    consumers.set(f.sequence, [...(consumers.get(f.sequence) ?? []), f])
  for (const [sequence, frames] of Object.entries(effects.animations)) {
    if (frames.length <= 1) continue
    const source = frames[0].source,
      draws = setters?.drawsByObject?.[String(source)] ?? [],
      { gate, why } = sourceGate(setters, source)
    for (const owner of consumers.get(sequence) ?? [{ id: 'unrecorded' }]) {
      const draw = owner.nativeDraw ?? (draws.length === 1 ? draws[0] : null),
        descriptor = draw == null ? null : rules.animationDescriptors[draw],
        rule = descriptorRule(descriptor),
        expected = gate == null || !rule ? null : nativeFps(rule, gate === 'logical', rates),
        browser = owner.id === 'unrecorded' ? null : browserRate(owner, rates),
        anchors = resolveAnchors(owner.anchors, readSource)
      rows.push({
        id: `effect-sequence/${sequence}/${owner.id}`,
        group: 'effects',
        family: owner.family ?? `effect sprite ${sequence}`,
        browser: { fps: browser, rule: owner.browserRule ?? 'no recorded browser consumer' },
        native: {
          fps: expected,
          rule: draws.length
            ? `source ${source} draw ${draw ?? draws.join('/')}` +
              (descriptor ? ` mode ${descriptor.mode} step ${descriptor.step} hold ${descriptor.hold}` : '') +
              ` on ${gate ?? 'unknown'} visits (${why})`
            : `source ${source}: ${why}`,
          evidence: owner.nativeEvidence ?? 'decomp/research/animation-cadence/native-setters.json',
        },
        frames: frames.length,
        anchors,
        stale: anchors.some(a => a.stale),
        ...(owner.status ? { status: owner.status, ratio: null } : classify(browser, expected)),
        note: owner.note,
      })
    }
  }
  return rows
}

// Curated families: rules that are not table-driven. Each anchor must still
// match its source file, so a moved/rewritten owner is reported as stale.
export function curatedRows({ families, rates, readSource }) {
  return families
    .filter(f => !f.sequence)
    .map(f => {
      const anchors = resolveAnchors(f.anchors, readSource)
      const browser = browserRate(f, rates)
      const expected = f.nativeFps ?? (f.nativePerVisit != null ? f.nativePerVisit * rates[f.nativeVisits] : null)
      const verdict = f.status ? { status: f.status, ratio: null } : classify(browser, expected)
      return {
        id: f.id,
        group: f.group,
        family: f.family,
        browser: { fps: browser, rule: f.browserRule },
        native: { fps: expected, rule: f.nativeRule, evidence: f.nativeEvidence },
        anchors,
        stale: anchors.some(a => a.stale),
        ...verdict,
        note: f.note,
      }
    })
}

// Step the actual advanceGame clock in Node: presentation visits and logical
// turns per second at the given speed. No rendering, network or app writes.
export async function measureRates(speeds = [1, 2]) {
  const { createWorld } = await import('../app/model.ts')
  const { advanceGame } = await import('../app/game-clock.ts')
  const result = {}
  for (const speed of speeds) {
    const w = createWorld(1),
      clock = { animationTime: 0, animationFrame: 0 },
      turn = w.turn
    w.speed = speed
    for (let i = 0; i < 600; i++) advanceGame(w, clock, 1 / 60)
    result[speed] = { presentation: clock.animationFrame / 10, logical: (w.turn - turn) / 10 }
  }
  return result
}

// Optional exposure sample: actual authored missions stepped by tick(), counting
// people rendered through the legacy elapsed-time fallback per kind/state.
export async function sampleLegacyExposure(missions = [1, 2, 3, 5, 7, 10, 13, 16, 18, 22], turns = 1200) {
  const { createWorld, tick } = await import('../app/model.ts')
  const { unitRenderAnimationSource } = await import('../app/unit-animation-source.ts')
  const { unitAnimation } = await import('../app/selection-runtime.ts')
  const { animationTeam } = await import('../app/world-types.ts')
  const counts = {}
  for (const mission of missions) {
    const w = createWorld(mission)
    for (let i = 0; i < turns; i++) {
      tick(w, 1 / 12)
      if (i % 24) continue
      for (const u of w.units) {
        if (u.inside !== null && !u.entry) continue
        if (unitRenderAnimationSource(u)) continue
        // Same table signature as Scene.updateUnitsFrame (Shamans keep their tribe).
        const team = u.kind === 'shaman' ? u.team : animationTeam(u.team),
          key = `legacy-unit/${team}-${u.kind}/${unitAnimation(w, u)}`
        counts[key] = (counts[key] ?? 0) + 1
      }
    }
  }
  return { missions, turns, sampleEvery: 24, counts }
}

// The browser's legacy fallback rate, from the same function Scene.animatePerson
// uses (scene-entities), at the legacy table's turn rate.
export async function liveLegacyFps(units) {
  const { fallbackFramesPerSecond } = await import('../app/animation.ts')
  const { nativeUnitDraw } = await import('../app/unit-kinds.ts')
  // Without a native source the Scene supplies the kind's draw (updateUnitsFrame).
  return kind => fallbackFramesPerSecond(nativeUnitDraw(kind), units.fps)
}

export async function buildAudit({ visibility = false } = {}) {
  const rules = json('app/original-rules.json'),
    units = json('app/original-units.json'),
    effects = json('app/original-effects.json'),
    families = json('scripts/animation-cadence-families.json').families,
    setters = json('decomp/research/animation-cadence/native-setters.json')
  const measured = await measureRates(),
    rates = measured[1],
    legacyFps = await liveLegacyFps(units)
  const rows = [
    ...legacyUnitRows({ rules, units, rates, legacyFps }),
    ...effectSequenceRows({ rules, effects, setters, rates, families, readSource: read }),
    ...curatedRows({ families, rates, readSource: read }),
  ]
  let exposure = null
  if (visibility) {
    exposure = await sampleLegacyExposure()
    for (const row of rows) row.exposure = exposure.counts[row.id] ?? 0
  }
  return { rates: measured, setters: setters && { exeSha256: setters.exeSha256, constant: setters.constant, calls: setters.calls }, rows, exposure }
}

export function summarize(rows) {
  const summary = Object.fromEntries(STATUSES.map(s => [s, 0]))
  for (const row of rows) summary[row.status] = (summary[row.status] ?? 0) + 1
  return summary
}

const fmt = n => (n == null ? '?' : Number.isFinite(n) ? String(Math.round(n * 100) / 100) : 'inf')

export function markdown(report) {
  const lines = [
    `Rates: presentation ${fmt(report.rates[1].presentation)}/s, logical ${fmt(report.rates[1].logical)}/s at 1x; ` +
      `presentation ${fmt(report.rates[2].presentation)}/s, logical ${fmt(report.rates[2].logical)}/s at 2x.`,
    `Summary (all rows): ${Object.entries(report.summary ?? summarize(report.rows)).map(([k, v]) => `${k} ${v}`).join(', ')}`,
    '',
    '| status | group | family | browser fps | native fps | ratio | browser rule | native rule | exposure |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ]
  for (const row of report.rows)
    lines.push(
      `| ${row.status}${row.direction ? ` (${row.direction})` : ''}${row.stale ? ' STALE' : ''} | ${row.group} | ${row.family} | ` +
        `${fmt(row.browser.fps)} | ${fmt(row.native.fps)} | ${fmt(row.ratio)} | ${row.browser.rule} | ` +
        `${row.native.rule} | ${row.exposure ?? ''} |`
    )
  return lines.join('\n') + '\n'
}

function order(rows) {
  const rank = Object.fromEntries(STATUSES.map((s, i) => [s, i]))
  return rows.sort(
    (a, b) =>
      rank[a.status] - rank[b.status] ||
      (b.exposure ?? 0) - (a.exposure ?? 0) ||
      a.id.localeCompare(b.id)
  )
}

async function main(argv) {
  const has = flag => argv.includes(flag),
    value = flag => (argv.includes(flag) ? argv[argv.indexOf(flag) + 1] : undefined)
  const report = await buildAudit({ visibility: has('--visibility') })
  let rows = order(report.rows)
  if (value('--status')) rows = rows.filter(r => r.status === value('--status'))
  if (value('--group')) rows = rows.filter(r => r.group === value('--group'))
  const summary = summarize(report.rows)
  const output = has('--json')
    ? JSON.stringify({ ...report, summary, rows }, null, 1) + '\n'
    : markdown({ ...report, summary, rows })
  if (value('--output')) writeFileSync(value('--output'), output)
  else process.stdout.write(output)
  if (has('--check') && report.rows.some(r => r.stale)) {
    console.error('Stale cadence anchors:', report.rows.filter(r => r.stale).map(r => r.id).join(', '))
    process.exitCode = 1
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main(process.argv.slice(2))
